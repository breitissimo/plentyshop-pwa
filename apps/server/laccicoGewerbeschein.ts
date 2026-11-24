/**
 * LACCICO (N 24.11.2026): Gewerbeschein nach der Firmenregistrierung als Mail-Anhang an info@.
 *
 * Weg: Kontaktformular-Funktion des Plugins IO (dieselbe wie im Ceres-Kontaktformular):
 *   1. POST /rest/io/customer/contact/mail/file  (fileData[], recaptchaToken) → { data: { fileKeys: [...] } }
 *   2. POST /rest/io/customer/contact/mail       (subject, data, fileKeys, recaptchaToken)
 *      → Mail an Ceres › contact.shop_mail (info@laccico.com) mit der Datei als Anhang
 * IO prüft Google reCAPTCHA v3 mit dem Schlüssel aus den Ceres-Einstellungen; beide Tokens holt der Browser.
 * Getestet 24.11.2026 auf laccico.com: Testdatei kam als Anhang bei info@ an.
 * Der Empfänger ist fest (Ceres-Einstellung), der Besucher kann ihn nicht ändern.
 * `context.client` schickt Shop-Token und die Cookies des Besuchers mit (Plenty-Doku „Custom API endpoints“).
 */
export interface LaccicoGewerbescheinParams {
  base64: string;
  type: string;
  kundennr: number | string;
  name: string;
  email: string;
  token1: string;
  token2: string;
}

const MAX_BYTES = 8 * 1024 * 1024;
const ENDUNG: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const kurz = (wert: unknown, max = 200) =>
  String(wert ?? '')
    .trim()
    .slice(0, max);

export const laccicoGewerbeschein = async (context: any, params: LaccicoGewerbescheinParams) => {
  const endung = ENDUNG[String(params?.type)];
  const inhalt = Buffer.from(String(params?.base64 ?? ''), 'base64');
  if (!endung || inhalt.length === 0 || inhalt.length > MAX_BYTES || !params?.token1 || !params?.token2) {
    return { data: { ok: false, grund: 'datei' } };
  }
  const kundennr = kurz(params.kundennr, 20).replace(/\D/g, '');
  const name = kurz(params.name);
  const email = kurz(params.email);
  const dateiname = `Gewerbeschein_Kunde_${kundennr || 'unbekannt'}.${endung}`;

  // 1. Datei hochladen
  const formular = new FormData();
  formular.append('fileData[]', new File([new Uint8Array(inhalt)], dateiname, { type: params.type }));
  formular.append('recaptchaToken', kurz(params.token1, 4000));
  const hoch = await context.client.post(
    new URL('/rest/io/customer/contact/mail/file', context.config.api.url).href,
    formular,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const fileKeys: string[] = hoch?.data?.data?.fileKeys ?? [];
  if (!fileKeys.length) {
    return { data: { ok: false, grund: 'upload' } };
  }

  // 2. Mail an info@ mit Anhang
  const mail = await context.client.post(new URL('/rest/io/customer/contact/mail', context.config.api.url).href, {
    subject: `Gewerbeschein Händler – Kundennr. ${kundennr || 'unbekannt'}`,
    recipient: '',
    cc: [],
    bcc: [],
    ...(email ? { replyTo: { mail: email, name } } : {}),
    recaptchaToken: kurz(params.token2, 4000),
    fileKeys,
    data: {
      kundennr: { label: 'Kundennummer', value: kundennr },
      name: { label: 'Name', value: name },
      email: { label: 'E-Mail', value: email },
      message: {
        label: 'Nachricht',
        value:
          'Gewerbeschein über die Händlerseite hochgeladen (Anhang). Bitte prüfen und den Kunden auf Klasse 7 „Händler B2B“ stellen.',
      },
      username: { label: '', value: '' },
    },
  });
  return { data: { ok: mail?.data?.data === true, grund: mail?.data?.data === true ? '' : 'mail' } };
};

import type { LaccicoGewerbescheinAntwort, LaccicoGrecaptcha } from './types';

/**
 * Gewerbeschein-Upload auf der Händlerseite (N 24.11.2026).
 * Die Datei geht über die Middleware-Funktion `laccicoGewerbeschein` an Plentys Kontaktformular (Plugin IO)
 * und kommt als Mail-Anhang bei info@ an. IO verlangt Google reCAPTCHA v3 mit dem Schlüssel aus den
 * Ceres-Einstellungen (Plugin 26, global.google_recaptcha_api_key, öffentlicher Schlüssel).
 * reCAPTCHA wird erst geladen, wenn der Kunde auf „senden“ klickt.
 */
export const LACCICO_RECAPTCHA_SCHLUESSEL = '6LfQNrQUAAAAANrUgRRH0RskNhTqbobnLKC6f0md';
export const LACCICO_GEWERBESCHEIN_MAX_BYTES = 8 * 1024 * 1024;
export const LACCICO_GEWERBESCHEIN_TYPEN = ['application/pdf', 'image/jpeg', 'image/png'];

const holeGrecaptcha = () => (window as unknown as { grecaptcha?: LaccicoGrecaptcha }).grecaptcha;

/** Lädt reCAPTCHA v3 einmal und wartet, bis es bereit ist */
const ladeRecaptcha = async () => {
  if (!holeGrecaptcha()?.execute) {
    await new Promise<void>((fertig, fehler) => {
      const skript = document.createElement('script');
      skript.src = `https://www.google.com/recaptcha/api.js?render=${LACCICO_RECAPTCHA_SCHLUESSEL}`;
      skript.async = true;
      skript.onload = () => fertig();
      skript.onerror = () => fehler(new Error('recaptcha'));
      document.head.appendChild(skript);
    });
  }
  const grecaptcha = holeGrecaptcha();
  if (!grecaptcha) {
    throw new Error('recaptcha');
  }
  await new Promise<void>((fertig) => grecaptcha.ready(fertig));
  return grecaptcha;
};

/** Datei als Base64 ohne Präfix */
const alsBase64 = (datei: File) =>
  new Promise<string>((fertig, fehler) => {
    const leser = new FileReader();
    leser.onload = () => fertig(String(leser.result).split(',')[1] ?? '');
    leser.onerror = () => fehler(leser.error);
    leser.readAsDataURL(datei);
  });

/** Prüft Typ und Größe der gewählten Datei */
export const laccicoGewerbescheinPasst = (datei: File | null | undefined) =>
  !!datei &&
  LACCICO_GEWERBESCHEIN_TYPEN.includes(datei.type) &&
  datei.size > 0 &&
  datei.size <= LACCICO_GEWERBESCHEIN_MAX_BYTES;

/** Sendet den Gewerbeschein; true = Mail mit Anhang ging an info@ */
export const laccicoGewerbescheinSenden = async (
  datei: File,
  kunde: { kundennr: number | string; name: string; email: string },
) => {
  const grecaptcha = await ladeRecaptcha();
  // zwei Tokens: eins für den Upload, eins für die Mail (jedes gilt nur einmal)
  const token1 = await grecaptcha.execute(LACCICO_RECAPTCHA_SCHLUESSEL, { action: 'contactFormFile' });
  const token2 = await grecaptcha.execute(LACCICO_RECAPTCHA_SCHLUESSEL, { action: 'contactForm' });
  const sdk = useSdk().plentysystems as unknown as {
    laccicoGewerbeschein: (params: Record<string, unknown>) => Promise<{ data: LaccicoGewerbescheinAntwort }>;
  };
  const { data } = await sdk.laccicoGewerbeschein({
    base64: await alsBase64(datei),
    type: datei.type,
    ...kunde,
    token1,
    token2,
  });
  return data?.ok === true;
};

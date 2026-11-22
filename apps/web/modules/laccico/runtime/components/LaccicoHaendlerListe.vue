<template>
  <section v-if="istHaendler" id="laccico-haendlerliste" class="laccico-haendlerliste" data-testid="laccico-haendlerliste">
    <div class="laccico-haendlerliste-innen">
      <h2 class="laccico-haendlerliste-titel">
        {{ text.titel }}
        <span v-if="zeilen.length" class="laccico-haendlerliste-zahl">({{ paare }} {{ text.paareGesamt }})</span>
      </h2>
      <p class="laccico-haendlerliste-hinweis">{{ text.hinweis }}</p>

      <p v-if="!zeilen.length" class="laccico-haendlerliste-leer">{{ text.leer }}</p>

      <template v-else>
        <table class="laccico-haendlerliste-tabelle">
          <thead>
            <tr>
              <th>{{ text.artikel }}</th>
              <th>{{ text.laenge }}</th>
              <th class="rechts">{{ text.menge }}</th>
              <th class="rechts">{{ text.preis }}</th>
              <th class="rechts">{{ text.summe }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="z in zeilen"
              :key="z.variationId"
              :class="{ 'ist-neu': z.variationId === zuletzt }"
              data-testid="laccico-haendlerliste-zeile"
            >
              <td>
                {{ z.name }}<br />
                <small>{{ z.nummer }}</small>
              </td>
              <td>{{ z.laenge }}</td>
              <td class="rechts">
                <input
                  :value="z.menge"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  class="laccico-haendlerliste-menge"
                  :aria-label="text.menge"
                  @change="mengeAendern(z.variationId, $event)"
                />
              </td>
              <td class="rechts">{{ preisText(z) }}</td>
              <td class="rechts">{{ zeilenSumme(z) }}</td>
              <td class="rechts">
                <button type="button" class="laccico-haendlerliste-weg" :aria-label="text.entfernen" @click="entfernen(z.variationId)">
                  ×
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="rechts">
                <b>{{ text.summe }}</b>
              </td>
              <td class="rechts">
                <b>{{ format(summe) }}</b>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>

        <label class="laccico-haendlerliste-notiz">
          {{ text.notiz }}
          <textarea v-model="notiz" rows="2" maxlength="1000" />
        </label>

        <NuxtTurnstile
          v-if="turnstileSchluessel"
          ref="turnstileElement"
          v-model="turnstile"
          :site-key="turnstileSchluessel"
          :options="{ theme: 'light' }"
          class="mt-3"
        />

        <div class="laccico-haendlerliste-knoepfe">
          <UiButton :disabled="sendet" data-testid="laccico-haendlerliste-senden" @click="absenden">
            <SfLoaderCircular v-if="sendet" size="sm" />
            <span v-else>{{ text.absenden }}</span>
          </UiButton>
          <UiButton variant="secondary" @click="drucken">{{ text.drucken }}</UiButton>
          <UiButton variant="tertiary" @click="leeren">{{ text.leeren }}</UiButton>
        </div>
        <p class="laccico-haendlerliste-datenschutz">
          {{ text.datenschutz }}
          <NuxtLink :to="localePath(paths.privacyPolicy)">{{ text.datenschutzLink }}</NuxtLink>.
        </p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import { userGetters } from '@plentymarkets/shop-api';
import type { CustomerContactEmailParams } from '@plentymarkets/shop-api';
import type { LaccicoListenZeile } from '../utils/types';
import { laccicoListenPreis, useLaccicoHaendler, useLaccicoHaendlerListe } from '../utils/laccicoHaendlerListe';
import { useLaccicoHaendlerTexte } from '../utils/laccicoHaendlerTexte';

/**
 * Händler-Bestellliste unten auf jeder Seite (N 23.11.2026), nur für Kundenklasse 7.
 * Absenden über das Kontaktformular des Shops an info@ (Turnstile wie Kontaktseite).
 */
const { istHaendler } = useLaccicoHaendler();
const { zeilen, zuletzt, laden, mengeSetzen, entfernen, leeren, summe, paare } = useLaccicoHaendlerListe();
const text = useLaccicoHaendlerTexte();
const { format } = usePriceFormatter();
const { locale } = useI18n();
const { user } = useCustomer();
const { send } = useNotification();
const { doCustomerContactMail } = useCustomerContact();
const localePath = useLocalizedPath();
const { getSetting } = useSiteSettings('cloudflareTurnstileApiSiteKey');

const turnstileSchluessel = getSetting() ?? '';
const turnstile = ref('');
const turnstileElement = ref();
const notiz = ref('');
const sendet = ref(false);

onMounted(laden);

const preisText = (z: LaccicoListenZeile) => {
  const preis = laccicoListenPreis(z);
  return preis === null ? text.value.offen : format(preis);
};

const zeilenSumme = (z: LaccicoListenZeile) => {
  const preis = laccicoListenPreis(z);
  return preis === null ? '–' : format(preis * z.menge);
};

const mengeAendern = (variationId: number, ereignis: Event) => {
  mengeSetzen(variationId, Number((ereignis.target as HTMLInputElement).value));
};

/** Klartext der Liste für Mail und Druck */
const listeAlsText = () => {
  const kopf = [
    `${text.value.betreff}`,
    `Kunde: ${userGetters.getFullName(user.value!) || ''} (Kundennr. ${user.value?.id ?? '?'})`,
    `E-Mail: ${userGetters.getEmailAddress(user.value!) || ''}`,
    '',
  ];
  const positionen = zeilen.value.map(
    (z) =>
      `${z.menge} Paar | ${z.nummer} | ${z.name} | ${z.laenge} | Variante ${z.variationId} | ${preisText(z)} je Paar | ${zeilenSumme(z)}`,
  );
  const fuss = ['', `${text.value.summe}: ${format(summe.value)} (${paare.value} Paar)`];
  if (notiz.value.trim()) {
    fuss.push('', `Anmerkung: ${notiz.value.trim()}`);
  }
  return [...kopf, ...positionen, ...fuss].join('\n');
};

const absenden = async () => {
  if (!zeilen.value.length || !user.value) {
    return;
  }
  // Spamschutz noch nicht bestanden: erklären statt grauem Knopf (N 23.11.2026)
  if (turnstileSchluessel && !turnstile.value) {
    send({ type: 'warning', message: text.value.pruefung });
    return;
  }
  sendet.value = true;
  try {
    const params: CustomerContactEmailParams = {
      subject: `${text.value.betreff} – Kundennr. ${user.value.id}`,
      email: userGetters.getEmailAddress(user.value) || '',
      name: userGetters.getFullName(user.value) || '',
      message: listeAlsText(),
      'cf-turnstile-response': turnstile.value,
    };
    if (await doCustomerContactMail(params)) {
      send({ type: 'positive', message: text.value.gesendet });
      leeren();
      notiz.value = '';
    } else {
      send({ type: 'negative', message: text.value.fehler });
    }
  } catch {
    send({ type: 'negative', message: text.value.fehler });
  } finally {
    sendet.value = false;
    turnstile.value = '';
    turnstileElement.value?.reset();
  }
};

/** Text für HTML unschädlich machen (Namen, Anmerkung kommen vom Kunden) */
const html = (wert: string | number | null | undefined) =>
  String(wert ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z] ?? z);

/** Druckansicht: Kopf mit Datum und Kunde, Tabelle, Summe, Anmerkung, Lieferhinweis (N 23.11.2026) */
const druckSeite = () => {
  const t = text.value;
  const datum = new Date().toLocaleDateString(locale.value, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const kunde = user.value ? userGetters.getFullName(user.value) : '';
  const zeilenHtml = zeilen.value
    .map(
      (z) => `<tr>
        <td>${html(z.name)}<div class="nr">${html(z.nummer)}</div></td>
        <td>${html(z.laenge)}</td>
        <td class="r">${html(z.menge)}</td>
        <td class="r">${html(preisText(z))}</td>
        <td class="r">${html(zeilenSumme(z))}</td>
      </tr>`,
    )
    .join('');
  const anmerkung = notiz.value.trim()
    ? `<h2>${html(t.notiz.split(" (")[0])}</h2><p class="notiz">${html(notiz.value.trim())}</p>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${html(t.betreff)} ${html(datum)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 11pt/1.45 Helvetica, Arial, sans-serif; color: #222; margin: 0; }
  .kopf { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #4c595d; padding-bottom: 8px; margin-bottom: 18px; }
  .marke { font-size: 20pt; letter-spacing: 2px; color: #4c595d; }
  .meta { text-align: right; font-size: 10pt; color: #555; }
  h1 { font-size: 15pt; font-weight: 600; margin: 0 0 12px; }
  h2 { font-size: 11pt; font-weight: 600; margin: 18px 0 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9.5pt; text-transform: uppercase; letter-spacing: .5px; color: #555; border-bottom: 1.5px solid #4c595d; padding: 6px 8px; }
  td { padding: 7px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f6f6f4; }
  .r { text-align: right; white-space: nowrap; }
  .nr { font-size: 8.5pt; color: #777; }
  tfoot td { border-bottom: none; border-top: 1.5px solid #4c595d; font-weight: 600; }
  .hinweis { margin-top: 18px; padding: 10px 12px; background: #f6f6f4; font-size: 10pt; }
  .notiz { white-space: pre-wrap; margin: 0; }
  .fuss { margin-top: 24px; font-size: 9pt; color: #777; }
  tr { page-break-inside: avoid; }
  @media screen { body { max-width: 180mm; margin: 28px auto; padding: 0 16px; } }
</style></head><body>
<div class="kopf"><div class="marke">LACCICO</div><div class="meta">${html(datum)}<br>${html(kunde)}${
    user.value?.id ? `<br>Kd.-Nr. ${html(user.value.id)}` : ''
  }</div></div>
<h1>${html(t.titel)}</h1>
<table>
  <thead><tr><th>${html(t.artikel)}</th><th>${html(t.laenge)}</th><th class="r">${html(t.menge)}</th><th class="r">${html(t.preis)}</th><th class="r">${html(t.summe)}</th></tr></thead>
  <tbody>${zeilenHtml}</tbody>
  <tfoot><tr><td colspan="2">${html(paare.value)} ${html(t.paareGesamt)}</td><td></td><td class="r">${html(t.summe)}</td><td class="r">${html(format(summe.value))}</td></tr></tfoot>
</table>
${anmerkung}
<div class="hinweis">${html(t.hinweis)}</div>
<div class="fuss">LACCICO · info@laccico.com · laccico.com</div>
</body></html>`;
};

/** Liste in einem eigenen Fenster zum Drucken oder Speichern als PDF */
const drucken = () => {
  const fenster = window.open('', '_blank');
  if (!fenster) {
    return;
  }
  fenster.document.open();
  fenster.document.write(druckSeite());
  fenster.document.close();
  fenster.focus();
  setTimeout(() => fenster.print(), 300);
};
</script>

<style scoped>
.laccico-haendlerliste {
  border-top: 1px solid #ddd;
  background: #f7f6f3;
  padding: 2rem 1rem;
}
.laccico-haendlerliste-innen {
  max-width: 1264px;
  margin: 0 auto;
}
.laccico-haendlerliste-titel {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.laccico-haendlerliste-zahl {
  font-size: 1rem;
  font-weight: 400;
}
.laccico-haendlerliste-hinweis,
.laccico-haendlerliste-leer {
  margin-bottom: 1rem;
}
.laccico-haendlerliste-tabelle {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}
.laccico-haendlerliste-tabelle th,
.laccico-haendlerliste-tabelle td {
  padding: 0.5rem;
  border-bottom: 1px solid #e5e5e5;
  text-align: left;
  vertical-align: top;
}
.laccico-haendlerliste-tabelle .rechts {
  text-align: right;
}
.laccico-haendlerliste-tabelle tr.ist-neu td {
  background: #fff7e0;
  transition: background 1s;
}
.laccico-haendlerliste-menge {
  width: 5rem;
  text-align: right;
  border: 1px solid #ccc;
  padding: 0.25rem;
}
.laccico-haendlerliste-weg {
  font-size: 1.25rem;
  line-height: 1;
  padding: 0 0.5rem;
}
.laccico-haendlerliste-notiz {
  display: block;
  margin-top: 1rem;
}
.laccico-haendlerliste-notiz textarea {
  display: block;
  width: 100%;
  border: 1px solid #ccc;
  padding: 0.5rem;
  margin-top: 0.25rem;
}
.laccico-haendlerliste-knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
.laccico-haendlerliste-datenschutz {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.75rem;
}
@media (max-width: 640px) {
  .laccico-haendlerliste-tabelle th:nth-child(4),
  .laccico-haendlerliste-tabelle td:nth-child(4) {
    display: none;
  }
}
</style>

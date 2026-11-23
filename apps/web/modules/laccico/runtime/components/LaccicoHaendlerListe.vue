<template>
  <div v-if="istHaendler" class="laccico-haendlerliste-platz" aria-hidden="true" />
  <section
    v-if="istHaendler"
    id="laccico-haendlerliste"
    class="laccico-haendlerliste z-sticky"
    :class="{ 'ist-offen': offen, 'ist-neu': neuHinzu }"
    :style="{ bottom: `${abstandUnten}px` }"
    data-testid="laccico-haendlerliste"
  >
    <!-- Leiste: zu = nur diese Zeile, Klick oder Wischen nach oben öffnet nach oben (N 23.11.2026) -->
    <button
      type="button"
      class="laccico-haendlerliste-leiste"
      :aria-expanded="offen"
      aria-controls="laccico-haendlerliste-inhalt"
      data-testid="laccico-haendlerliste-leiste"
      @click="umschalten"
      @touchstart.passive="wischStart"
      @touchend="wischEnde"
    >
      <!-- Skizze N 23.11.: Reiter links über der Leiste mit der Paarzahl, Leiste mit Titel links und Summe rechts -->
      <span class="laccico-haendlerliste-reiter" data-testid="laccico-haendlerliste-reiter">{{ paare }} {{ text.menge }}</span>
      <span class="laccico-haendlerliste-titel">
        {{ text.titel }}
        <span class="laccico-haendlerliste-pfeil" aria-hidden="true">{{ offen ? '▾' : '▴' }}</span>
      </span>
      <span class="laccico-haendlerliste-zahl">{{ zeilen.length ? format(summe) : '–' }}</span>
    </button>

    <div id="laccico-haendlerliste-inhalt" class="laccico-haendlerliste-innen" :inert="!offen">
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
                <!-- Bestand je Zeile: sofort lieferbar / mit Nachlieferung (Zettel N 23.11.2026) -->
                <div v-if="aufteilung(z)" class="laccico-haendlerliste-bestand" data-testid="laccico-haendlerliste-bestand">
                  <template v-if="aufteilung(z)!.spaeter === 0">{{ text.vorraetig }}</template>
                  <template v-else>
                    {{ aufteilung(z)!.sofort }} {{ text.sofort }} · {{ aufteilung(z)!.spaeter }} {{ text.spaeter }}
                  </template>
                </div>
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

// Leiste am unteren Rand: auf/zu per Klick oder Wischen; auf dem Handy über der unteren Navigationsleiste
const offen = ref(false);
const neuHinzu = ref(false);
const abstandUnten = ref(0);
let wischY: number | null = null;
let neuZeit: ReturnType<typeof setTimeout> | undefined;

const umschalten = () => {
  offen.value = !offen.value;
};

const wischStart = (ereignis: TouchEvent) => {
  wischY = ereignis.touches[0]?.clientY ?? null;
};

const wischEnde = (ereignis: TouchEvent) => {
  const ende = ereignis.changedTouches[0]?.clientY;
  if (wischY === null || ende === undefined) {
    return;
  }
  const weg = ende - wischY;
  wischY = null;
  if (Math.abs(weg) < 30) {
    return;
  }
  ereignis.preventDefault();
  offen.value = weg < 0;
};

const abstandMessen = () => {
  const leiste = document.querySelector<HTMLElement>('[data-testid="navbar-bottom"]');
  abstandUnten.value = leiste && leiste.offsetParent !== null ? leiste.offsetHeight : 0;
};

// Neu hinzugefügt: Leiste kurz hervorheben, nicht aufklappen
watch(zuletzt, () => {
  neuHinzu.value = false;
  clearTimeout(neuZeit);
  requestAnimationFrame(() => {
    neuHinzu.value = true;
    neuZeit = setTimeout(() => (neuHinzu.value = false), 1200);
  });
});

onMounted(() => {
  laden();
  abstandMessen();
  setTimeout(abstandMessen, 1500);
  window.addEventListener('resize', abstandMessen);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', abstandMessen);
  clearTimeout(neuZeit);
  clearTimeout(bestandZeit);
});

const preisText = (z: LaccicoListenZeile) => {
  const preis = laccicoListenPreis(z);
  return preis === null ? text.value.offen : format(preis);
};

const zeilenSumme = (z: LaccicoListenZeile) => {
  const preis = laccicoListenPreis(z);
  return preis === null ? '–' : format(preis * z.menge);
};

/** Lagerbestand je Variante, vom PWA-Server (server/routes/laccico-bestand.get.ts); null = unbekannt */
const bestand = ref<Record<string, number | null>>({});
let bestandZeit: ReturnType<typeof setTimeout> | undefined;

const bestandLaden = async () => {
  const fehlend = zeilen.value.map((z) => z.variationId).filter((id) => !(String(id) in bestand.value));
  if (!fehlend.length) {
    return;
  }
  try {
    const antwort = await $fetch<Record<string, number | null>>('/laccico-bestand', { query: { ids: fehlend.join(',') } });
    bestand.value = { ...bestand.value, ...antwort };
  } catch {
    // ohne Bestand bleibt die Zeile wie bisher
  }
};

// beim Öffnen und bei neuen Zeilen nachladen (kurz gebündelt)
watch(
  [offen, () => zeilen.value.length],
  () => {
    clearTimeout(bestandZeit);
    if (offen.value) {
      bestandZeit = setTimeout(bestandLaden, 300);
    }
  },
);

/** Aufteilung der Menge: was sofort geht, was mit der Nachlieferung kommt */
const aufteilung = (z: LaccicoListenZeile) => {
  const lager = bestand.value[String(z.variationId)];
  if (lager === null || lager === undefined) {
    return null;
  }
  const sofort = Math.min(z.menge, lager);
  return { sofort, spaeter: z.menge - sofort };
};

const aufteilungText = (z: LaccicoListenZeile) => {
  const a = aufteilung(z);
  if (!a) {
    return '';
  }
  return a.spaeter === 0 ? text.value.vorraetig : `${a.sofort} ${text.value.sofort} · ${a.spaeter} ${text.value.spaeter}`;
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
      `${z.menge} Paar | ${z.nummer} | ${z.name} | ${z.laenge} | Variante ${z.variationId} | ${preisText(z)} je Paar | ${zeilenSumme(z)}` +
      (aufteilungText(z) ? ` | ${aufteilungText(z)}` : ''),
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
        <td class="r">${html(z.menge)}${aufteilungText(z) ? `<div class="nr">${html(aufteilungText(z))}</div>` : ''}</td>
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
.laccico-haendlerliste-platz {
  height: 92px; /* Leiste 56 px + Reiter 32 px + Luft */
}
.laccico-haendlerliste {
  position: fixed;
  left: 0;
  right: 0;
  background: #f7f6f3;
  border-top: 1px solid #d5d3cc;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
}
.laccico-haendlerliste-leiste {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 1264px;
  height: 56px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: left;
  touch-action: none;
}
.laccico-haendlerliste-reiter {
  position: absolute;
  bottom: 100%;
  left: 1rem;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 0.9rem;
  background: #f7f6f3;
  border: 1px solid #d5d3cc;
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
  box-shadow: 0 -3px 8px rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}
.laccico-haendlerliste-titel {
  font-size: 1.05rem;
  font-weight: 600;
}
.laccico-haendlerliste-titel {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.laccico-haendlerliste-zahl {
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.laccico-haendlerliste-pfeil {
  font-size: 1.2rem;
}
.laccico-haendlerliste.ist-neu {
  animation: laccico-liste-neu 1.2s ease-out;
}
@keyframes laccico-liste-neu {
  0% {
    background: #ffe9a8;
  }
  100% {
    background: #f7f6f3;
  }
}
.laccico-haendlerliste-innen {
  max-width: 1264px;
  max-height: 0;
  margin: 0 auto;
  padding: 0 1rem;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}
.laccico-haendlerliste.ist-offen .laccico-haendlerliste-innen {
  max-height: 70vh;
  padding: 0.5rem 1rem 1.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
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
.laccico-haendlerliste-bestand {
  margin-top: 2px;
  font-size: 0.72rem;
  line-height: 1.2;
  color: #555;
  white-space: nowrap;
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

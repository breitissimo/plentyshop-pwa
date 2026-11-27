<template>
  <!-- Händler-Startseite /haendler (Zettel N 23.11.2026): links Infotext, rechts Anmelden/Registrieren bzw. Gruß -->
  <!-- Vor dem Login nur Titel und erster Absatz, darunter das Anmeldefeld (N 24.11.2026); alles Weitere nach dem Login -->
  <div class="laccico-haendlerseite" :class="{ 'ist-kurz': kurz }" data-testid="laccico-haendlerseite">
    <div class="laccico-haendlerseite-info">
      <h1>{{ text.titel }}</h1>
      <p class="laccico-haendlerseite-unterzeile">{{ text.unterzeile }}</p>
      <p>{{ text.einleitung }}</p>

      <template v-if="!kurz">
        <h2>{{ text.staffelTitel }}</h2>
        <table class="laccico-haendlerseite-staffel">
          <tbody>
            <tr v-for="[menge, preis] in text.staffel" :key="menge">
              <th>{{ menge }}</th>
              <td>{{ preis }}</td>
            </tr>
          </tbody>
        </table>
        <p class="laccico-haendlerseite-fuss">{{ text.staffelFuss }}</p>

        <template v-for="abschnitt in text.abschnitte" :key="abschnitt.titel">
          <h2>{{ abschnitt.titel }}</h2>
          <p>{{ abschnitt.text }}</p>
        </template>
      </template>
    </div>

    <aside class="laccico-haendlerseite-zugang">
      <template v-if="isAuthorized && istHaendler">
        <p class="laccico-haendlerseite-gruss" data-testid="laccico-haendlerseite-gruss">{{ text.willkommen }}</p>
        <p>{{ text.willkommenText }}</p>
        <div class="laccico-haendlerseite-knoepfe">
          <UiButton v-if="linkForm" :tag="NuxtLink" :to="linkForm">{{ text.zuForm }}</UiButton>
          <UiButton v-if="linkFarben" :tag="NuxtLink" :to="linkFarben" variant="secondary">{{
            text.zuFarben
          }}</UiButton>
        </div>
      </template>
      <!-- Endkundenkonto (nicht Klasse 3/7): Hinweis statt Anwärter-Seite (Zettel N 25.11. (7)) -->
      <template v-else-if="isAuthorized && !istAnwaerter">
        <p class="laccico-haendlerseite-gruss" data-testid="laccico-haendlerseite-endkunde">{{ text.endkunde }}</p>
        <p>{{ text.endkundeText }}</p>
        <div class="laccico-haendlerseite-knoepfe">
          <UiButton data-testid="laccico-haendlerseite-endkunde-knopf" @click="abmeldenUndRegistrieren">{{
            text.endkundeKnopf
          }}</UiButton>
        </div>
      </template>
      <template v-else-if="isAuthorized">
        <p class="laccico-haendlerseite-gruss" data-testid="laccico-haendlerseite-wartet">{{ text.wartet }}</p>
        <p>{{ text.wartetText }}</p>
        <LaccicoGewerbeschein />
      </template>
      <template v-else>
        <div class="laccico-haendlerseite-reiter" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="ansicht === 'login'"
            :class="{ aktiv: ansicht === 'login' }"
            @click="ansicht = 'login'"
          >
            {{ text.anmelden }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="ansicht === 'register'"
            :class="{ aktiv: ansicht === 'register' }"
            data-testid="laccico-haendlerseite-registrieren"
            @click="zurFirmenRegistrierung"
          >
            {{ text.registrieren }}
          </button>
        </div>
        <LoginComponent @change-view="zurFirmenRegistrierung" @logged-in="nachAnmeldung" />
      </template>
    </aside>

    <section v-if="!kurz" class="laccico-haendlerseite-faq">
      <h2>{{ text.faqTitel }}</h2>
      <!-- Versandfrage mit Anker: Ziel des Menüpunkts „Versandkosten“ für Händler, dort gleich aufgeklappt (N 24.11.2026) -->
      <details
        v-for="([frage, antwort], i) in text.faq"
        :id="i === VERSAND_FRAGE ? LACCICO_HAENDLER_VERSAND_ANKER : undefined"
        :key="frage"
        :open="i === VERSAND_FRAGE && route.hash === `#${LACCICO_HAENDLER_VERSAND_ANKER}`"
      >
        <summary>{{ frage }}</summary>
        <p>{{ antwort }}</p>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CategoryTreeItem } from '@plentymarkets/shop-api';
import LaccicoGewerbeschein from './LaccicoGewerbeschein.vue';
import { LACCICO_HAENDLER_SEITE } from '../utils/laccicoHaendlerSeiteTexte';
import {
  LACCICO_FIRMEN_KLASSE,
  LACCICO_HAENDLER_VERSAND_ANKER,
  useLaccicoHaendler,
} from '../utils/laccicoHaendlerListe';

const ID_FORM = 727;
const ID_FARBEN = 731;
/** Stelle der Frage „Was kostet der Versand?“ in `faq` (in allen Sprachen dieselbe) */
const VERSAND_FRAGE = 4;
const route = useRoute();

const { locale } = useI18n();
const { isAuthorized, user, logout } = useCustomer();
const { istHaendler } = useLaccicoHaendler();
const { data: kategorien } = useCategoryTree();
const localePath = useLocalizedPath();
const { buildCategoryMenuLink } = useLocalization();
const NuxtLink = resolveComponent('NuxtLink');

const text = computed(
  () =>
    LACCICO_HAENDLER_SEITE[
      (locale.value as keyof typeof LACCICO_HAENDLER_SEITE) in LACCICO_HAENDLER_SEITE
        ? (locale.value as keyof typeof LACCICO_HAENDLER_SEITE)
        : 'de'
    ],
);
const ansicht = ref<'login' | 'register'>('login');
/** Händler-Anwärter = Kundenklasse 3 (Firmenregistrierung); alle anderen angemeldeten Nicht-Händler sind Endkunden. */
const istAnwaerter = computed(
  () => (user.value as { classId?: number } | null)?.classId === LACCICO_FIRMEN_KLASSE,
);
/**
 * Kurze Fassung (Titel, erster Absatz) für Gäste und für angemeldete Endkunden (Zettel N 27.11.2026: Endkunden sahen
 * links die ganze Händler-Willkommensseite mit Staffel); die volle Fassung nur für Händler und Händler-Anwärter.
 */
const kurz = computed(() => !isAuthorized.value || (!istHaendler.value && !istAnwaerter.value));

const linkZu = (id: number) => {
  const baum = (kategorien.value ?? []) as CategoryTreeItem[];
  const knoten = baum.find((k) => k.id === id);
  return knoten ? localePath(buildCategoryMenuLink(knoten, baum)) : '';
};
const linkForm = computed(() => linkZu(ID_FORM));
const linkFarben = computed(() => linkZu(ID_FARBEN));

/**
 * Registrieren als Firma auf eigener Seite (Zettel N 24.11.2026): Formular mit Firmenfeldern links, Erklärung rechts.
 * Das kurze Registrierfeld hier hatte keine Firmenfelder (Firma, USt-IdNr.); nach der Registrierung zurück hierher.
 */
const zurFirmenRegistrierung = () => navigateTo({ path: localePath('/register'), query: { firma: '1', redirect: '/haendler' } });
/** Endkunde: abmelden und zur Firmen-Registrierung (mit angemeldetem Konto leitet /register sonst weiter). */
const abmeldenUndRegistrieren = async () => {
  await logout();
  await zurFirmenRegistrierung();
};

/** Nach Anmeldung/Registrierung auf dieser Seite bleiben und neu laden, damit Kundenklasse und Preise gelten */
const nachAnmeldung = () => {
  window.location.href = localePath('/haendler');
};

useHead(() => ({
  title: text.value.metaTitel,
  meta: [{ name: 'description', content: text.value.metaBeschreibung }],
}));
</script>

<style scoped>
.laccico-haendlerseite {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24rem;
  gap: 2rem 3rem;
  max-width: 1264px;
  margin: 1.5rem auto 4rem;
  padding: 0 1rem;
}
/* Vor dem Login: linksbündig, Text und darunter ein breites, flaches Anmeldefeld, ohne Scrollen (N 24.11.2026) */
.laccico-haendlerseite.ist-kurz {
  grid-template-columns: minmax(0, 52rem);
}
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;
  width: 100%;
  padding: 0.5rem 0 0;
}
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form > .text-end) {
  align-self: center;
  text-align: left;
}
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form > button) {
  margin-top: 0;
}
/* „Sie haben noch kein Konto?“ doppelt den Reiter „Als Firma registrieren“ */
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form > .text-center) {
  display: none;
}
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form ~ *),
.laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(.text-lg) {
  text-align: left;
}
.laccico-haendlerseite-info h1 {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.laccico-haendlerseite-info h2,
.laccico-haendlerseite-faq h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}
.laccico-haendlerseite-info p {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}
.laccico-haendlerseite-unterzeile {
  color: #555;
  font-size: 1.05rem;
}
.laccico-haendlerseite-staffel {
  border-collapse: collapse;
  width: 100%;
  max-width: 32rem;
}
.laccico-haendlerseite-staffel th,
.laccico-haendlerseite-staffel td {
  text-align: left;
  padding: 0.45rem 0.75rem;
  border-bottom: 1px solid #e5e5e5;
}
.laccico-haendlerseite-staffel th {
  font-weight: 600;
  white-space: nowrap;
  width: 9rem;
}
.laccico-haendlerseite-fuss {
  font-size: 0.85rem;
  color: #555;
  margin-top: 0.5rem;
}
.laccico-haendlerseite-zugang {
  align-self: start;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 1.25rem;
  background: #fff;
}
.laccico-haendlerseite-reiter {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e5e5;
}
.laccico-haendlerseite-reiter button {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  color: #555;
}
.laccico-haendlerseite-reiter button.aktiv {
  border-bottom-color: #4c595d;
  color: #222;
  font-weight: 600;
}
.laccico-haendlerseite-hinweis {
  font-size: 0.85rem;
  background: #f3f4f4;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}
.laccico-haendlerseite-gruss {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.laccico-haendlerseite-knoepfe {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}
.laccico-haendlerseite-faq {
  grid-column: 1 / -1;
  max-width: 52rem;
}
.laccico-haendlerseite-faq details {
  border-bottom: 1px solid #e5e5e5;
  padding: 0.6rem 0;
}
.laccico-haendlerseite-faq summary {
  cursor: pointer;
  font-weight: 500;
}
.laccico-haendlerseite-faq details p {
  margin-top: 0.5rem;
  line-height: 1.6;
}
@media (max-width: 1039px) {
  .laccico-haendlerseite,
  .laccico-haendlerseite.ist-kurz {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .laccico-haendlerseite.ist-kurz .laccico-haendlerseite-zugang :deep(form) {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

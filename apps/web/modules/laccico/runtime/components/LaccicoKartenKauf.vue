<template>
  <div class="laccico-kartenkauf" data-testid="laccico-kartenkauf">
    <!-- Länge und Menge nebeneinander, Knopf darunter über die volle Breite (N 22.11.2026) -->
    <div class="laccico-kartenkauf-wahl">
      <select
        v-model="auswahl"
        class="laccico-kartenkauf-laenge"
        :aria-label="text.laenge"
        data-testid="laccico-karte-laenge"
        @focus="laden"
        @pointerdown="laden"
      >
        <option value="">{{ geladen ? text.waehlen : laedt ? '…' : text.waehlen }}</option>
        <option v-for="o in optionen" :key="o.variationId" :value="String(o.variationId)" :disabled="!o.verkaeuflich && !istHaendler">
          {{ o.laenge }}{{ o.verkaeuflich || istHaendler ? '' : ' – ' + text.ausverkauft }}
        </option>
      </select>
      <!-- Menge per Auswahl, ohne Tastatur (N 22.11.2026); 25/50/100 = Händlerstaffeln -->
      <select v-model.number="menge" class="laccico-kartenkauf-menge" :aria-label="text.menge" data-testid="laccico-karte-menge">
        <option v-for="m in MENGEN" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>
    <div class="laccico-kartenkauf-zeile">
      <UiButton size="sm" class="w-full" :disabled="!auswahl || sendet" data-testid="laccico-karte-warenkorb" @click="inWarenkorb">
        <SfLoaderCircular v-if="sendet" size="sm" />
        <span v-else>{{ istHaendler ? haendlerText.aufListe : text.kaufen }}</span>
      </UiButton>
    </div>
    <NuxtLink v-if="fehler" :to="weiter" class="laccico-kartenkauf-fehler">{{ text.optionen }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import type { Product } from '@plentymarkets/shop-api';
import { laccicoLaengenAus } from '../utils/laccicoLaenge';
import { productGetters } from '@plentymarkets/shop-api';
import {
  laccicoListenPreis,
  laccicoStaffelAus,
  laccicoZeileAusProdukt,
  useLaccicoHaendler,
  useLaccicoHaendlerListe,
} from '../utils/laccicoHaendlerListe';
import { useLaccicoHaendlerTexte } from '../utils/laccicoHaendlerTexte';
import { laccicoKartenPreis } from '../utils/laccicoKarte';
import type { LaccicoLaengenOption } from '../utils/laccicoLaenge';
import type { LaccicoKartenWahl, LaccicoListenStaffel, LaccicoShopStaffel } from '../utils/types';

/** Länge, Menge und Warenkorb direkt auf der Kategoriekachel (N 19.11.2026). */
const props = defineProps<{ itemId: number | string; weiter: string }>();
/** Händler: gewählte Menge und Preis je Paar der gewählten Länge an die Kachel melden (N 23.11.2026) */
const emit = defineEmits<{ wahl: [LaccicoKartenWahl] }>();
const { addToCart } = useCart();
const { send } = useNotification();
const { locale } = useI18n();
const localePath = useLocalePath();
const { gewaehlt } = useLaccicoLaenge();
const { istHaendler } = useLaccicoHaendler();
const { hinzufuegen: aufHaendlerListe } = useLaccicoHaendlerListe();
const haendlerText = useLaccicoHaendlerTexte();

const TEXTE = {
  de: { laenge: 'Länge', waehlen: 'Länge', ausverkauft: 'nicht lieferbar', menge: 'Menge', kaufen: 'In den Warenkorb', optionen: 'Optionen anzeigen', danke: 'In den Warenkorb gelegt', nurVorrat: 'Davon sind nur {n} Paar vorrätig. Firmenkunden können größere Mengen über die Händler-Bestellliste bestellen, der Rest wird nachgeliefert.', zuHaendler: 'Für Händler' },
  en: { laenge: 'Length', waehlen: 'Length', ausverkauft: 'unavailable', menge: 'Quantity', kaufen: 'Add to cart', optionen: 'Show options', danke: 'Added to cart', nurVorrat: 'Only {n} pairs are in stock. Business customers can order larger quantities via the trade order list; the rest will be delivered later.', zuHaendler: 'For retailers' },
  fr: { laenge: 'Longueur', waehlen: 'Longueur', ausverkauft: 'indisponible', menge: 'Quantité', kaufen: 'Ajouter au panier', optionen: 'Voir les options', danke: 'Ajouté au panier', nurVorrat: 'Seulement {n} paires en stock. Les clients professionnels peuvent commander de plus grandes quantités via la liste de commande revendeurs ; le reste sera livré ultérieurement.', zuHaendler: 'Revendeurs' },
} as const;
const text = computed(() => TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de']);

/** Wählbare Mengen auf der Kachel (N 22.11.2026: Auswahl statt Tastatureingabe; Zettel N 27.11.2026: jede Menge 1–100) */
const MENGEN = Array.from({ length: 100 }, (_, i) => i + 1);

const optionen = ref<LaccicoLaengenOption[]>([]);
const geladen = ref(false);
const laedt = ref(false);
const fehler = ref(false);
const auswahl = ref('');
const menge = ref(1);
const sendet = ref(false);

const laden = async () => {
  if (geladen.value || laedt.value) return;
  laedt.value = true;
  try {
    const antwort = await useSdk().plentysystems.getProduct({ id: String(props.itemId) });
    const liste = laccicoLaengenAus((antwort?.data as { variationAttributeMap?: never })?.variationAttributeMap);
    if (liste === null) fehler.value = true;
    else optionen.value = liste;
    geladen.value = true;
  } catch {
    fehler.value = true;
  } finally {
    laedt.value = false;
  }
};

/** Globale Länge: alle Kacheln laden ihre Längen und stellen die Länge ein (einzeln danach änderbar). */
watch(
  gewaehlt,
  async (laenge) => {
    if (!laenge) return;
    await laden();
    const treffer = optionen.value.find((o) => o.laenge === laenge && (o.verkaeuflich || istHaendler.value));
    auswahl.value = treffer ? String(treffer.variationId) : '';
  },
  { immediate: import.meta.client },
);

/**
 * Preis der gewählten Länge (je Variante einmal geladen): Händler bekommen den Staffelpreis für die Menge,
 * Endkunden den Preis für 1 Paar mit Streichpreis; den Mengenrabatt rechnet die Kachel (N 24.11.2026).
 */
const preiseJeVariante = new Map<string, { basis: number; durchgestrichen: number; staffel: LaccicoListenStaffel[] }>();
const variantenPreise = async (variationId: string) => {
  const vorhanden = preiseJeVariante.get(variationId);
  if (vorhanden) {
    return vorhanden;
  }
  const antwort = await useSdk().plentysystems.getProduct({ id: String(props.itemId), variationId });
  const produkt = antwort?.data as Product | undefined;
  if (!produkt) {
    return null;
  }
  const karte = laccicoKartenPreis(produkt);
  const preise = {
    basis: karte.preis,
    durchgestrichen: karte.durchgestrichen,
    staffel: laccicoStaffelAus(productGetters.getGraduatedList(produkt) as LaccicoShopStaffel[]),
  };
  preiseJeVariante.set(variationId, preise);
  return preise;
};

watch(
  [auswahl, menge, istHaendler],
  async ([variante, anzahl, haendler]) => {
    const wahl: LaccicoKartenWahl = { menge: Number(anzahl) || 1, preis: null };
    if (variante) {
      try {
        const preise = await variantenPreise(variante);
        if (preise && variante === auswahl.value) {
          if (haendler) {
            wahl.preis = laccicoListenPreis({ staffel: preise.staffel, menge: wahl.menge }) ?? preise.basis;
          } else {
            wahl.preis = preise.basis;
            wahl.durchgestrichen = preise.durchgestrichen;
          }
        }
      } catch {
        wahl.preis = null;
      }
    }
    emit('wahl', wahl);
  },
);

/** Händler (Klasse 7): Variante mit Händlerstaffel laden und auf die Bestellliste setzen (N 23.11.2026). */
const aufListe = async () => {
  const antwort = await useSdk().plentysystems.getProduct({ id: String(props.itemId), variationId: auswahl.value });
  const produkt = antwort?.data as Product | undefined;
  if (!produkt) {
    fehler.value = true;
    return;
  }
  aufHaendlerListe(laccicoZeileAusProdukt(produkt, Number(menge.value)));
  send({ message: haendlerText.value.aufListeOk, type: 'positive' });
};

/**
 * Zettel N 27.11.2026: Reicht der Bestand für die gewählte Menge nicht (Plenty lehnt ab und meldet den Bestand selbst),
 * zusätzlich auf die Händler-Bestellliste hinweisen, über die Firmenkunden auch mehr als den Vorrat bestellen können.
 */
const hinweisZuWenigBestand = async (anzahl: number) => {
  try {
    const antwort = await $fetch<Record<string, number | null>>('/laccico-bestand', { query: { ids: auswahl.value } });
    const vorrat = antwort?.[auswahl.value];
    if (typeof vorrat !== 'number' || vorrat >= anzahl) {
      return;
    }
    send({
      message: text.value.nurVorrat.replace('{n}', String(vorrat)),
      type: 'secondary',
      action: { text: text.value.zuHaendler, onClick: () => navigateTo(localePath('/haendler')) },
    });
  } catch {
    // ohne Bestand kein Zusatzhinweis, Plentys eigene Meldung steht schon da
  }
};

const inWarenkorb = async () => {
  if (!auswahl.value) return;
  sendet.value = true;
  try {
    if (istHaendler.value) {
      await aufListe();
      return;
    }
    const anzahl = Math.max(1, Number(menge.value) || 1);
    const ok = await addToCart({ productId: Number(auswahl.value), quantity: anzahl });
    if (ok) {
      send({ message: text.value.danke, type: 'positive' });
    } else if (anzahl > 1) {
      await hinweisZuWenigBestand(anzahl);
    }
  } finally {
    sendet.value = false;
  }
};
</script>

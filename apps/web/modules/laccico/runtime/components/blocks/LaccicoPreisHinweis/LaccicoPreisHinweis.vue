<template>
  <div class="mt-1 text-sm" data-testid="laccico-preis-hinweis">
    <template v-if="istHaendler && haendlerStaffel.length">
      <b>{{ text.haendlerTitel }}</b>
      <span v-for="(stufe, i) in haendlerStaffel" :key="stufe.quantity">
        {{ i ? ' · ' : ' ' }}{{ text.ab }} {{ stufe.quantity }} {{ text.paar }} <b>{{ format(stufe.price) }}</b>
      </span>
      <br />
      {{ text.haendlerFuss }}
    </template>
    <!-- Mengenrabatt als Liste, ohne „auch gemischt …“ (Zettel N 25.11. (5)) -->
    <template v-else-if="!istHaendler">
      <b>{{ text.rabattTitel }}</b>
      <ul class="list-disc pl-5" data-testid="laccico-rabatt-liste">
        <li v-for="stufe in text.stufen" :key="stufe">{{ stufe }}</li>
      </ul>
      {{ text.rabattFuss }}
    </template>
  </div>
</template>

<script setup lang="ts">
import { productGetters } from '@plentymarkets/shop-api';
import type { LaccicoKunde, LaccicoPreisHinweisProps, LaccicoStaffel } from './types';

/**
 * Preis-Hinweis unter dem Preis (wie Ceres-Artikelansicht, Set 30):
 * Händler (Kundenklasse 7) sehen ihre Staffel ab 25 Paar, alle anderen den Mengenrabatt.
 */
const props = defineProps<LaccicoPreisHinweisProps>();
const { currentProduct } = useProducts();
const { user } = useCustomer();
const { format } = usePriceFormatter();
const { locale } = useI18n();

const TEXTE = {
  de: {
    haendlerTitel: 'Händlerpreise je Paar (netto):',
    ab: 'ab',
    paar: 'Paar',
    haendlerFuss: 'Je Farbe und Länge, unter 25 Paar gilt der normale Preis.',
    rabattTitel: 'Mengenrabatt:',
    stufen: ['ab 8 € Warenwert 5 %', 'ab 12 € 8 %', 'ab 16 € 12 %', 'ab 25 € 20 %'],
    rabattFuss: 'Der Rabatt wird im Warenkorb abgezogen.',
  },
  en: {
    haendlerTitel: 'Trade prices per pair (net):',
    ab: 'from',
    paar: 'pairs',
    haendlerFuss: 'Per colour and length; below 25 pairs the regular price applies.',
    rabattTitel: 'Volume discount:',
    stufen: ['from €8 order value 5 %', 'from €12 8 %', 'from €16 12 %', 'from €25 20 %'],
    rabattFuss: 'The discount is deducted in the basket.',
  },
  fr: {
    haendlerTitel: 'Prix revendeurs par paire (HT) :',
    ab: 'dès',
    paar: 'paires',
    haendlerFuss: 'Par couleur et longueur ; en dessous de 25 paires, le prix normal s’applique.',
    rabattTitel: 'Remise sur quantité :',
    stufen: ['dès 8 € d’achat 5 %', 'dès 12 € 8 %', 'dès 16 € 12 %', 'dès 25 € 20 %'],
    rabattFuss: 'La remise est déduite dans le panier.',
  },
};

const text = computed(() => TEXTE[locale.value as keyof typeof TEXTE] ?? TEXTE.de);
const haendlerKlasse = computed(() => props.content?.haendlerKlasse ?? 7);
const istHaendler = computed(() => (user.value as LaccicoKunde | null)?.classId === haendlerKlasse.value);

const haendlerStaffel = computed<LaccicoStaffel[]>(() => {
  if (!currentProduct.value) {
    return [];
  }
  return productGetters
    .getGraduatedList(currentProduct.value)
    .filter((stufe) => Number(stufe.quantity) >= 25)
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));
});
</script>

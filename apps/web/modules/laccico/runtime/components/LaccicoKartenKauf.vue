<template>
  <div class="laccico-kartenkauf" data-testid="laccico-kartenkauf">
    <select
      v-model="auswahl"
      class="laccico-kartenkauf-laenge"
      :aria-label="text.laenge"
      data-testid="laccico-karte-laenge"
      @focus="laden"
      @pointerdown="laden"
    >
      <option value="">{{ geladen ? text.waehlen : laedt ? '…' : text.waehlen }}</option>
      <option v-for="o in optionen" :key="o.variationId" :value="String(o.variationId)" :disabled="!o.verkaeuflich">
        {{ o.laenge }}{{ o.verkaeuflich ? '' : ' – ' + text.ausverkauft }}
      </option>
    </select>
    <div class="laccico-kartenkauf-zeile">
      <input v-model.number="menge" type="number" min="1" max="999" class="laccico-kartenkauf-menge" :aria-label="text.menge" />
      <UiButton size="sm" class="w-fit" :disabled="!auswahl || sendet" data-testid="laccico-karte-warenkorb" @click="inWarenkorb">
        <template v-if="!sendet" #prefix><SfIconShoppingCart size="sm" /></template>
        <SfLoaderCircular v-if="sendet" size="sm" />
        <span v-else>{{ text.kaufen }}</span>
      </UiButton>
    </div>
    <NuxtLink v-if="fehler" :to="weiter" class="laccico-kartenkauf-fehler">{{ text.optionen }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { SfIconShoppingCart, SfLoaderCircular } from '@storefront-ui/vue';
import { laccicoLaengenAus } from '../utils/laccicoLaenge';
import type { LaccicoLaengenOption } from '../utils/laccicoLaenge';

/** Länge, Menge und Warenkorb direkt auf der Kategoriekachel (N 19.11.2026). */
const props = defineProps<{ itemId: number | string; weiter: string }>();
const { addToCart } = useCart();
const { send } = useNotification();
const { locale } = useI18n();
const { gewaehlt } = useLaccicoLaenge();

const TEXTE = {
  de: { laenge: 'Länge', waehlen: 'Länge wählen', ausverkauft: 'nicht lieferbar', menge: 'Menge', kaufen: 'In den Warenkorb', optionen: 'Optionen anzeigen', danke: 'In den Warenkorb gelegt' },
  en: { laenge: 'Length', waehlen: 'Choose length', ausverkauft: 'unavailable', menge: 'Quantity', kaufen: 'Add to cart', optionen: 'Show options', danke: 'Added to cart' },
  fr: { laenge: 'Longueur', waehlen: 'Choisir la longueur', ausverkauft: 'indisponible', menge: 'Quantité', kaufen: 'Ajouter au panier', optionen: 'Voir les options', danke: 'Ajouté au panier' },
} as const;
const text = computed(() => TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de']);

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
    const treffer = optionen.value.find((o) => o.laenge === laenge && o.verkaeuflich);
    auswahl.value = treffer ? String(treffer.variationId) : '';
  },
  { immediate: import.meta.client },
);

const inWarenkorb = async () => {
  if (!auswahl.value) return;
  sendet.value = true;
  try {
    await addToCart({ productId: Number(auswahl.value), quantity: Math.max(1, Number(menge.value) || 1) });
    send({ message: text.value.danke, type: 'positive' });
  } finally {
    sendet.value = false;
  }
};
</script>

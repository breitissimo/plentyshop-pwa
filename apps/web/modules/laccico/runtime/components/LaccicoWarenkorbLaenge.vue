<template>
  <div v-if="optionen.length > 1" class="laccico-warenkorb-laenge" data-testid="laccico-warenkorb-laenge">
    <label class="text-sm" :for="`laenge-${cartItem.id}`">{{ text.laenge }}:</label>
    <select :id="`laenge-${cartItem.id}`" :value="String(cartItem.variationId)" :disabled="tauscht" @change="tauschen(($event.target as HTMLSelectElement).value)">
      <option v-for="o in optionen" :key="o.variationId" :value="String(o.variationId)" :disabled="!o.verkaeuflich && o.variationId !== cartItem.variationId">
        {{ o.laenge }}{{ o.verkaeuflich || o.variationId === cartItem.variationId ? '' : ' – ' + text.ausverkauft }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { productGetters, cartGetters } from '@plentymarkets/shop-api';
import type { CartItem } from '@plentymarkets/shop-api';
import { laccicoLaengenAus } from '../utils/laccicoLaenge';
import type { LaccicoLaengenOption } from '../utils/laccicoLaenge';

/** Warenkorb: Länge je Zeile tauschen (N 19.11.2026): gleiche Farbe, gleiche Menge; erst neue Länge hinzufügen, dann alte entfernen. */
const props = defineProps<{ cartItem: CartItem }>();
const { addToCart, deleteCartItem } = useCart();
const { send } = useNotification();
const { locale } = useI18n();
const TEXTE = {
  de: { laenge: 'Länge', ausverkauft: 'nicht lieferbar', fehler: 'Länge konnte nicht getauscht werden' },
  en: { laenge: 'Length', ausverkauft: 'unavailable', fehler: 'Length could not be changed' },
  fr: { laenge: 'Longueur', ausverkauft: 'indisponible', fehler: 'La longueur n’a pas pu être changée' },
} as const;
const text = computed(() => TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de']);

const optionen = ref<LaccicoLaengenOption[]>([]);
const tauscht = ref(false);

onMounted(async () => {
  const itemId = props.cartItem.variation ? productGetters.getItemId(props.cartItem.variation) : 0;
  if (!itemId) return;
  try {
    const antwort = await useSdk().plentysystems.getProduct({ id: String(itemId) });
    optionen.value = laccicoLaengenAus((antwort?.data as { variationAttributeMap?: never })?.variationAttributeMap) ?? [];
  } catch {
    optionen.value = [];
  }
});

const tauschen = async (neueVariante: string) => {
  const menge = cartGetters.getItemQty(props.cartItem);
  tauscht.value = true;
  try {
    await addToCart({ productId: Number(neueVariante), quantity: menge });
    await deleteCartItem(props.cartItem);
  } catch {
    send({ message: text.value.fehler, type: 'negative' });
  } finally {
    tauscht.value = false;
  }
};
</script>

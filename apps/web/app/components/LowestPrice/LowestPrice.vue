<template>
  <div v-if="showLowestPrice" class="text-sm mb-2">
    {{ t('product.lowestPrice', { price: format(lowestPrice) }) }}
  </div>
</template>

<script setup lang="ts">
import { productGetters, productPriceGetters } from '@plentymarkets/shop-api';
import type { LowestPriceProps } from '~/components/LowestPrice/types';

const props = defineProps<LowestPriceProps>();
const { format } = usePriceFormatter();

const price = computed(() => productPriceGetters.getPrice(props.product));
const rrp = computed(() => productPriceGetters.getCrossedPrice(props.product));
const special = computed(() => productPriceGetters.getSpecialOffer(props.product));

const hasRrpPrice = computed(() => rrp.value !== null && price.value !== null && rrp.value > price.value);
const hasBeforePrice = computed(() => special.value !== null && price.value !== null && price.value > special.value);
const hasCrossPrice = computed(() => hasRrpPrice.value || hasBeforePrice.value);

/**
 * LACCICO (22.11.2026): Plenty rechnet den heutigen, gesenkten Preis in den 30-Tage-Tiefstpreis ein.
 * Nach einer Senkung liefert Plenty deshalb den Aktionspreis selbst. § 11 PAngV verlangt den
 * niedrigsten Preis vor der Senkung. Ist der Plenty-Wert nicht niedriger als der aktuelle Preis,
 * wird der durchgestrichene Preis angezeigt (bei LACCICO ist der UVP = bisheriger Standardpreis).
 */
const lowestPrice = computed(() => {
  const plentyLowest = Number(productGetters.getLowestPrice(props.product));
  const current = hasBeforePrice.value ? special.value : price.value;
  const crossed = hasBeforePrice.value ? price.value : rrp.value;

  if (current !== null && crossed !== null && plentyLowest >= current) {
    return crossed;
  }
  return plentyLowest;
});

const showLowestPrice = computed(() => lowestPrice.value && hasCrossPrice.value);
</script>

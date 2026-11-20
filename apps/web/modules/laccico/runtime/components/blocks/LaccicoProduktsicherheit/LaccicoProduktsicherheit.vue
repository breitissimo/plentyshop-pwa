<template>
  <div data-testid="laccico-produktsicherheit">
    <UiAccordionItem
      v-model="offen"
      summary-class="@md:rounded-md w-full hover:bg-neutral-100 py-2 flex justify-between items-center select-none"
      content-padding-class=""
    >
      <template #summary>
        <h2 class="font-bold text-lg leading-6 @md:text-2xl">{{ content?.text?.title }}</h2>
      </template>
      <ManufacturerResponsibleInfo :product="currentProduct" />
      <ManufacturerInformation :product="currentProduct" />
    </UiAccordionItem>
  </div>
</template>

<script setup lang="ts">
import ManufacturerResponsibleInfo from '~/components/ManufacturerResponsibleInfo/ManufacturerResponsibleInfo.vue';
import ManufacturerInformation from '~/components/ManufacturerInformation/ManufacturerInformation.vue';
import type { LaccicoProduktsicherheitProps } from './types';

/**
 * Reiter „Produktsicherheit“ wie in der Ceres-Artikelansicht (Set 30): verantwortliche Person (GPSR) und Hersteller
 * aufklappbar direkt auf der Seite statt Link mit Seitenfenster (N 20.11.2026). Daten kommen vom Hersteller des Artikels in Plenty.
 */
defineProps<LaccicoProduktsicherheitProps>();
const { currentProduct } = useProducts();
const offen = ref(false);
</script>

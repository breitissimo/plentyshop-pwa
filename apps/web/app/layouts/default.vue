<template>
  <div>
    <UiHeaderBlocks />

    <NarrowContainer v-if="breadcrumbs?.length" class="p-4">
      <LazyUiBreadcrumbs :breadcrumbs="breadcrumbs" />
    </NarrowContainer>
    <main>
      <slot />
    </main>
    <!-- LACCICO: Händler-Bestellliste über dem Fuß, nur Kundenklasse 7 (N 23.11.2026) -->
    <ClientOnly>
      <LaccicoHaendlerListe />
    </ClientOnly>
    <Cookiebar />
    <PreviewMode />
    <UiFooterBlocks />
    <LazyQuickCheckout v-if="isOpen" :product="product" />
  </div>
</template>

<script setup lang="ts">
import type { DefaultLayoutProps } from '~/layouts/types';
import LaccicoHaendlerListe from '~~/modules/laccico/runtime/components/LaccicoHaendlerListe.vue';

defineProps<DefaultLayoutProps>();

const { setLogoMeta } = useStructuredData();
const { isOpen, product } = useQuickCheckout();
setLogoMeta();
</script>

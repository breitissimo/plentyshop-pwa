<template>
  <NuxtLayout name="default" :breadcrumbs="laccicoBreadcrumbs">
    <LaccicoRechtsseite :titel="laccicoTitel" :html="getHTMLTexts()" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Locale } from '#i18n';
import LaccicoRechtsseite from '~~/modules/laccico/runtime/components/LaccicoRechtsseite.vue';

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
  // LACCICO: Adressen wie die Plenty-Kategorie bzw. der Ceres-Shop (N 24.11.2026), statt englischer Systemnamen
  paths: { de: '/laccico-finest-waxed-laces/impressum', en: '/laccico-finest-waxed-laces/imprint', fr: '/laccicolacetsfinscires/mentionslegales' },
});

const { data, getLegalTexts } = useLegalInformation();
const { getRobots, setRobotForStaticPage } = useRobots();
const { setPageMeta } = usePageMeta();

const icon = 'page';
setPageMeta(t('legal.legalDisclosure'), icon);

definePageMeta({
  layout: false,
  pageType: 'static',
});

// LACCICO (N 24.11.2026, Zettel (12)): Brotkrumen und Titelbalken wie die übrigen Infoseiten
const laccicoLocalePath = useLocalizedPath();
const laccicoTitel = computed(() => t('legal.legalDisclosure'));
const laccicoBreadcrumbs = computed(() => [
  { name: t('common.labels.home'), link: laccicoLocalePath(paths.home) },
  { name: laccicoTitel.value, link: laccicoLocalePath('legal-disclosure') },
]);

await getLegalTexts({
  type: 'LegalDisclosure',
});

const getHTMLTexts = () => {
  return data.value.htmlText ?? '';
};

await getRobots();
setRobotForStaticPage('LegalDisclosure');
</script>

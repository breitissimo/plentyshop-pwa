<template>
  <div class="w-full p-5 overflow-x-auto break-words no-preflight" v-html="getHTMLTexts()" />
</template>

<script setup lang="ts">
import type { Locale } from '#i18n';

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
  pageType: 'static',
});

await getLegalTexts({
  type: 'LegalDisclosure',
});

const getHTMLTexts = () => {
  return data.value.htmlText ?? '';
};

await getRobots();
setRobotForStaticPage('LegalDisclosure');
</script>

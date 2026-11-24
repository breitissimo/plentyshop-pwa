<template>
  <div class="w-full p-5 overflow-x-auto break-words no-preflight" v-html="getHTMLTexts()" />
</template>

<script setup lang="ts">
import type { Locale } from '#i18n';

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
  // LACCICO: Adressen wie die Plenty-Kategorie bzw. der Ceres-Shop (N 24.11.2026), statt englischer Systemnamen
  paths: { de: '/laccico-finest-waxed-laces/agb', en: '/laccico-finest-waxed-laces/terms-and-conditions', fr: '/laccicolacetsfinscires/termes' },
});

const { data, getLegalTexts } = useLegalInformation();
const { getRobots, setRobotForStaticPage } = useRobots();

definePageMeta({
  pageType: 'static',
});
const { setPageMeta } = usePageMeta();

const icon = 'page';
setPageMeta(t('legal.termsAndConditions'), icon);

await getLegalTexts({
  type: 'TermsConditions',
});

const getHTMLTexts = () => {
  return data.value.htmlText ?? '';
};

await getRobots();
setRobotForStaticPage('TermsAndConditions');
</script>

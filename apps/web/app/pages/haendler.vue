<template>
  <NuxtLayout name="default" :breadcrumbs="breadcrumbs">
    <LaccicoHaendlerSeite />
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Locale } from '#i18n';
import LaccicoHaendlerSeite from '~~/modules/laccico/runtime/components/LaccicoHaendlerSeite.vue';

/** LACCICO: Händler-Startseite mit Info, Anmeldung und Registrierung (Zettel N 23.11.2026) */
defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
});

definePageMeta({ layout: false, pageType: 'static' });

const localePath = useLocalizedPath();
const { locale } = useI18n();
const NAMEN: Record<string, string> = { de: 'Für Händler', en: 'For retailers', fr: 'Pour revendeurs' };

const breadcrumbs = computed(() => [
  { name: t('common.labels.home'), link: localePath(paths.home) },
  { name: NAMEN[String(locale.value)] ?? NAMEN.de!, link: localePath('/haendler') },
]);
</script>

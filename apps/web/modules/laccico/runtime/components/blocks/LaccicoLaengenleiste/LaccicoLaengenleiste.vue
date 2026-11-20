<template>
  <div class="laccico-laengenleiste" data-testid="laccico-laengenleiste">
    <span class="laccico-laengenleiste-titel">{{ text.titel }}</span>
    <button type="button" :class="{ aktiv: !gewaehlt }" @click="gewaehlt = ''">{{ text.alle }}</button>
    <button v-for="l in LACCICO_LAENGEN" :key="l" type="button" :class="{ aktiv: gewaehlt === l }" @click="gewaehlt = l">
      {{ l }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { LACCICO_LAENGEN } from '../../../utils/laccicoLaenge';

/** Längenleiste über der Artikelliste: „Alle Längen“ oder eine Länge für alle Kacheln (N 19.11.2026). */
defineProps<{ content?: Record<string, unknown> }>();
const { locale } = useI18n();
const { gewaehlt } = useLaccicoLaenge();
const TEXTE = {
  de: { titel: 'Länge:', alle: 'Alle Längen' },
  en: { titel: 'Length:', alle: 'All lengths' },
  fr: { titel: 'Longueur :', alle: 'Toutes les longueurs' },
} as const;
const text = computed(() => TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de']);
</script>

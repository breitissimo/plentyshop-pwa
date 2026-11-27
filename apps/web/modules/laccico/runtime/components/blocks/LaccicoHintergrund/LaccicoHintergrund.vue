<template>
  <section
    class="laccico-hintergrund"
    :class="{ 'laccico-hintergrund-fest': content.fest }"
    :style="stil"
    data-testid="laccico-hintergrund"
  >
    <div class="laccico-hintergrund-innen">
      <div v-if="content.kastenFarbe" class="laccico-hintergrund-kasten rte-prose" :style="kastenStil" v-html="content.html" />
      <div v-else class="rte-prose rte-prose--center" v-html="content.html" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LaccicoHintergrundProps } from './types';

/**
 * Abschnitt mit Hintergrundbild, optional fixiert (bleibt beim Scrollen stehen), wie das Ceres-Widget „Hintergrund“ (BackgroundWidget).
 */
const props = defineProps<LaccicoHintergrundProps>();

const stil = computed(() => ({
  backgroundImage: props.content.bild ? `url(${props.content.bild})` : undefined,
  minHeight: props.content.hoehe ? `${props.content.hoehe}px` : undefined,
}));
// Farbe als CSS-Variable: am Handy wird der Kasten durchsichtiger (Zettel N 27.11.2026, laccico.css)
const kastenStil = computed(() => ({ '--laccico-kasten-farbe': props.content.kastenFarbe, color: '#fff' }));
</script>

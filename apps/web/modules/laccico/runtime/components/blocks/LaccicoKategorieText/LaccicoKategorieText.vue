<template>
  <div
    v-if="html"
    :class="['no-preflight', 'laccico-kategorietext', `laccico-kategorietext-${teil}`]"
    :data-testid="`laccico-kategorietext-${teil}`"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { type Category, categoryGetters } from '@plentymarkets/shop-api';
import type { LaccicoKategorieTextProps } from './types';

/**
 * Kategoriebeschreibung 1 in zwei Teilen (Entwurf N 22.11.2026):
 * „titel“ = die erste H2 (steht über der grauen Sortierleiste), „text“ = alles danach (steht unter der Leiste).
 * Beginnt die Beschreibung nicht mit einer H2, zeigt „titel“ nichts und „text“ die ganze Beschreibung.
 */
const props = defineProps<LaccicoKategorieTextProps>();
const teil = computed(() => props.content?.teil ?? 'text');
const { data: produkte } = useProducts();

const teile = computed(() => {
  const kategorie = produkte.value.category || ({} as Category);
  const beschreibung = (categoryGetters.getCategoryDetails(kategorie)?.description ?? '').trim();
  const treffer = beschreibung.match(/^<h2[\s>][\s\S]*?<\/h2>/i);
  if (!treffer) {
    return { titel: '', text: beschreibung };
  }
  return { titel: treffer[0], text: beschreibung.slice(treffer[0].length).trim() };
});

const html = computed(() => (teil.value === 'titel' ? teile.value.titel : teile.value.text));
</script>

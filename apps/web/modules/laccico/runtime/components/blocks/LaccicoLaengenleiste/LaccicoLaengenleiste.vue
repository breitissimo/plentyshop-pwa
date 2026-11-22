<template>
  <div class="laccico-laengenleiste" data-testid="laccico-laengenleiste">
    <span class="laccico-laengenleiste-titel laccico-hinweis" tabindex="0" :data-hinweis="text.hinweis" :aria-label="text.hinweis">
      {{ text.titel }} <span class="laccico-hinweis-i" aria-hidden="true">i</span>
    </span>
    <button type="button" :class="{ aktiv: !gewaehlt }" :title="text.hinweis" @click="gewaehlt = ''">{{ text.alle }}</button>
    <button v-for="l in laengen" :key="l" type="button" :class="{ aktiv: gewaehlt === l }" :title="text.hinweis" @click="gewaehlt = l">
      {{ l }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { LACCICO_LAENGEN } from '../../../utils/laccicoLaenge';
import laengenJeKategorie from '../../../utils/laengenJeKategorie.json';

/** Längenleiste über der Artikelliste: „Alle Längen“ oder eine Länge für alle Kacheln (N 19.11.2026). */
defineProps<{ content?: Record<string, unknown> }>();
const { locale } = useI18n();
const { gewaehlt } = useLaccicoLaenge();
const { data: produkte } = useProducts();
/**
 * Nur Längen, die es in dieser Kategorie gibt (aktive Varianten, unabhängig vom Bestand; Liste je Kategorie aus Plenty,
 * Skript `PWA\Skripte\laengen_je_kategorie.ps1`). Ohne Eintrag: alle Standardlängen.
 */
const laengen = computed(() => {
  const kategorieId = String((produkte.value as { category?: { id?: number } })?.category?.id ?? '');
  const liste = (laengenJeKategorie as Record<string, string[]>)[kategorieId];
  return liste?.length ? liste : LACCICO_LAENGEN;
});
// Gewählte Länge zurücksetzen, wenn es sie in dieser Kategorie nicht gibt
watch(laengen, (liste) => {
  if (gewaehlt.value && !liste.includes(gewaehlt.value)) {
    gewaehlt.value = '';
  }
}, { immediate: true });
const TEXTE = {
  de: { titel: 'Länge:', alle: 'Alle Längen', hinweis: 'Wählen Sie hier eine Länge für alle Artikel dieser Seite: Sie ist dann bei jedem Artikel schon eingestellt, und Sie müssen nur noch in den Warenkorb legen.' },
  en: { titel: 'Length:', alle: 'All lengths', hinweis: 'Pick a length here for all articles on this page: it is then preselected on every article, and you only need to add it to the cart.' },
  fr: { titel: 'Longueur :', alle: 'Toutes les longueurs', hinweis: 'Choisissez ici une longueur pour tous les articles de cette page : elle est alors présélectionnée sur chaque article, il ne reste qu’à l’ajouter au panier.' },
} as const;
const text = computed(() => TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de']);
</script>

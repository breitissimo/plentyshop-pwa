<template>
  <!-- LACCICO: Versandkosten-Link öffnet ein Fenster wie in Ceres (N 21.11.2026); Inhalt = Seite 648 aus dem Fork -->
  <a
    href="#versandkosten"
    class="underline cursor-pointer focus:outline focus:outline-offset-2 focus:outline-2 outline-secondary-600 rounded"
    data-testid="shipping-link"
    @click.prevent="oeffnen"
  >
    {{ t('common.labels.delivery') }}
  </a>
  <UiModal
    v-if="offen"
    v-model="offen"
    tag="section"
    class="h-full w-full overflow-auto @md:w-[800px] @md:h-fit @md:max-h-[90vh] text-left font-normal text-base text-neutral-900"
    data-testid="laccico-versandkosten-fenster"
  >
    <UiButton
      :aria-label="schliessenText"
      square
      variant="tertiary"
      class="absolute right-2 top-2"
      @click="offen = false"
    >
      <SfIconClose />
    </UiButton>
    <div v-if="laedt" class="flex justify-center p-8"><SfLoaderCircular size="lg" /></div>
    <template v-else>
      <PageBlock v-for="(block, index) in bloecke" :key="block.meta?.uuid ?? index" :index="index" :block="block" :root="true" />
      <div v-if="bloecke.length === 0" class="p-4">
        <a :href="localePath(versandkostenSeite)">{{ t('common.labels.delivery') }}</a>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Block } from '@plentymarkets/shop-api';
import { SfIconClose, SfLoaderCircular } from '@storefront-ui/vue';
import { onKeyStroke } from '@vueuse/core';

/** Kategorie der Versandkosten-Seite in Plenty (Ceres zeigt deren Inhalt im Versandkosten-Fenster). */
const VERSANDKOSTEN_KATEGORIE = 648;
/** Nur Text und Tabelle, keine Artikellisten. */
const GEZEIGTE_BLOECKE = new Set(['TextCard']);
/** Alle Textbausteine in Seitenreihenfolge, auch aus Spalten (MultiGrid), damit der Umbau der Seite das Fenster nicht leert. */
const textkarten = (liste: Block[]): Block[] =>
  liste.flatMap((block) =>
    Array.isArray(block.content)
      ? textkarten(block.content as Block[])
      : GEZEIGTE_BLOECKE.has(block.name)
        ? [block]
        : [],
  );
const VERSANDKOSTEN_SEITE: Record<string, string> = {
  de: '/laccico-finest-waxed-laces/versandkosten',
  en: '/laccico-finest-waxed-laces/delivery-costs',
  fr: '/laccicolacetsfinscires/fraisdeport',
};
const SCHLIESSEN: Record<string, string> = { de: 'Schließen', en: 'Close', fr: 'Fermer' };

const { t, locale } = useI18n();
const localePath = useLocalizedPath();

const offen = ref(false);
const laedt = ref(false);
const bloecke = ref<Block[]>([]);
const sprache = computed(() => String(locale.value));
const versandkostenSeite = computed(() => VERSANDKOSTEN_SEITE[sprache.value] ?? '/laccico-finest-waxed-laces/versandkosten');
const schliessenText = computed(() => SCHLIESSEN[sprache.value] ?? SCHLIESSEN.en);
let geladeneSprache = '';

onKeyStroke('Escape', () => {
  offen.value = false;
});

const oeffnen = async () => {
  offen.value = true;
  if (geladeneSprache === sprache.value) {
    return;
  }
  laedt.value = true;
  try {
    const antwort = await $fetch<Block[] | null>(`/_laccico/inhalt/${sprache.value}/category_${VERSANDKOSTEN_KATEGORIE}`);
    bloecke.value = textkarten(Array.isArray(antwort) ? antwort : []).filter(
      (block) =>
        !/KI-generiert|AI-generated|générée par IA/.test(
          (block.content as { text?: { htmlDescription?: string } } | undefined)?.text?.htmlDescription ?? '',
        ),
    );
    geladeneSprache = sprache.value;
  } catch {
    bloecke.value = [];
  } finally {
    laedt.value = false;
  }
};
</script>

<template>
  <ul v-if="plaketten.length" class="laccico-plaketten" data-testid="laccico-plaketten">
    <li v-for="p in plaketten" :key="p">{{ p }}</li>
  </ul>
</template>

<script setup lang="ts">
import type { Product } from '@plentymarkets/shop-api';

/** Plaketten auf Kacheln wie Ceres: „Neuheit“ (Artikelmerkmal Neu) und „Artikelpaket“ (Paketartikel). Sonderangebot zeigt Ceres hier nicht (Befund 20.11.: viele Artikel tragen das Merkmal, ohne reduziert zu sein). */
const props = defineProps<{ product: Product }>();
const { locale } = useI18n();
const TEXTE = {
  de: { neu: 'Neuheit', paket: 'Artikelpaket' },
  en: { neu: 'New item', paket: 'Item bundle' },
  fr: { neu: 'Nouveauté', paket: 'Lot d’articles' },
} as const;

const plaketten = computed(() => {
  const t = TEXTE[(locale.value as keyof typeof TEXTE) in TEXTE ? (locale.value as keyof typeof TEXTE) : 'de'];
  const liste: string[] = [];
  const besonderheit = (props.product?.item as { storeSpecial?: { id?: number; names?: { name?: string } } } | undefined)?.storeSpecial;
  if (besonderheit?.id === 2) liste.push(t.neu);
  if ((props.product?.variation as { bundleType?: string } | undefined)?.bundleType === 'bundle') liste.push(t.paket);
  return liste;
});
</script>

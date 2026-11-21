<template>
  <div class="col-span-4 flex flex-wrap justify-center gap-x-8 gap-y-6" data-testid="laccico-megamenue">
    <div v-for="kind in knoten.children" :key="kind.id" class="w-44">
      <NuxtLink :to="localePath(linkFuer(kind))" class="block group/kachel focus-visible:outline focus-visible:rounded-md">
        <div class="aspect-[4/3] rounded-md overflow-hidden bg-[#f4f2ee] flex items-center justify-center">
          <img
            v-if="bildVon(kind)"
            :src="bildVon(kind)"
            :alt="categoryTreeGetters.getName(kind)"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-300 group-hover/kachel:scale-105"
          />
          <!-- Platzhalter, solange in Plenty (Kategorie › Bild) noch keins hinterlegt ist -->
          <span v-else class="text-xs text-neutral-400" data-testid="laccico-megamenue-platzhalter">Bild folgt</span>
        </div>
        <span class="mt-2 block text-center font-medium typography-text-base">{{ categoryTreeGetters.getName(kind) }}</span>
      </NuxtLink>
      <ul v-if="kind.children?.length" class="mt-1">
        <li v-for="enkel in kind.children" :key="enkel.id">
          <NuxtLink
            :to="localePath(linkFuer(enkel))"
            class="block py-1 text-center typography-text-sm nav-hover-bg rounded"
          >
            {{ categoryTreeGetters.getName(enkel) }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CategoryTreeItem, categoryTreeGetters } from '@plentymarkets/shop-api';
import { megamenueBilder } from '~~/modules/laccico/runtime/utils/megamenueBilder';

defineProps<{ knoten: CategoryTreeItem; linkFuer: (kategorie: CategoryTreeItem) => string }>();

const localePath = useLocalizedPath();

/** Kategoriebild aus Plenty (Kategorie › Bild, nur vollständige Adressen), sonst die Zuordnung aus megamenueBilder (Banner bzw. Artikelbild), sonst Platzhalter. */
const bildVon = (kategorie: CategoryTreeItem): string => {
  const pfad = kategorie.details?.[0]?.imagePath ?? '';
  return pfad.startsWith('http') ? pfad : (megamenueBilder[kategorie.id] ?? '');
};
</script>

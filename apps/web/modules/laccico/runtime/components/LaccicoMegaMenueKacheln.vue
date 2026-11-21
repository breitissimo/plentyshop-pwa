<template>
  <div
    class="col-span-4 flex flex-wrap justify-center gap-y-6"
    :class="nurRollen ? 'gap-x-2' : 'gap-x-8'"
    data-testid="laccico-megamenue"
  >
    <div v-for="kind in knoten.children" :key="kind.id" :class="istRolle(kind) ? 'w-36' : 'w-44'">
      <NuxtLink :to="localePath(linkFuer(kind))" class="block group/kachel focus-visible:outline focus-visible:rounded-md">
        <div
          class="overflow-hidden flex items-center justify-center"
          :class="istRolle(kind) ? 'aspect-square bg-white' : 'aspect-[4/3] rounded-md bg-[#f4f2ee]'"
        >
          <img
            v-if="bildVon(kind)"
            :src="bildVon(kind)"
            :alt="categoryTreeGetters.getName(kind)"
            loading="lazy"
            class="w-full h-full transition-transform duration-300 group-hover/kachel:scale-105"
            :class="istRolle(kind) ? 'object-contain p-2' : 'object-cover'"
          />
          <!-- Platzhalter, solange in Plenty (Kategorie › Bild) noch keins hinterlegt ist -->
          <span v-else class="text-xs text-neutral-400" data-testid="laccico-megamenue-platzhalter">Bild folgt</span>
        </div>
        <span class="mt-2 block text-center font-medium" :class="istRolle(kind) ? 'typography-text-sm' : 'typography-text-base'">{{ categoryTreeGetters.getName(kind) }}</span>
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
import { megamenueBilder, megamenueRollen } from '~~/modules/laccico/runtime/utils/megamenueBilder';

const props = defineProps<{ knoten: CategoryTreeItem; linkFuer: (kategorie: CategoryTreeItem) => string }>();

const localePath = useLocalizedPath();

/** Kategoriebild aus Plenty (Kategorie › Bild, nur vollständige Adressen), sonst die Zuordnung aus megamenueBilder (Banner bzw. Artikelbild), sonst Platzhalter. */
const bildVon = (kategorie: CategoryTreeItem): string => {
  const pfad = kategorie.details?.[0]?.imagePath ?? '';
  return pfad.startsWith('http') ? pfad : (megamenueBilder[kategorie.id] ?? '');
};

/** Farbwelten zeigen freigestellte Rollen (N 21.11.2026): quadratisch, weißer Grund, ganz sichtbar statt beschnitten. */
const istRolle = (kategorie: CategoryTreeItem): boolean => megamenueRollen.includes(kategorie.id);
/** Alle Kacheln sind Rollen (Farbwelten): enger stellen, damit alle 9 in eine Reihe passen. */
const nurRollen = computed(() => (props.knoten.children ?? []).every((kind) => istRolle(kind)));
</script>

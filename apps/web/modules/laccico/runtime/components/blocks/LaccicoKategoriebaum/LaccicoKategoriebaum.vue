<template>
  <div>
  <nav v-if="zeilen.length" class="laccico-kategoriebaum" data-testid="laccico-kategoriebaum" aria-label="Kategorien">
    <ul>
      <li v-for="z in zeilen" :key="z.id" :class="{ aktiv: z.aktiv, 'auf-pfad': z.aufPfad }" :style="{ paddingLeft: `${z.tiefe * 14 + 8}px` }">
        <NuxtLink :to="localePath(z.link)">
          <span class="name">{{ z.name }}</span>
          <span v-if="z.anzahl" class="zahl">{{ z.anzahl }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
  </div>
</template>

<script setup lang="ts">
import { categoryTreeGetters } from '@plentymarkets/shop-api';
import type { CategoryTreeItem } from '@plentymarkets/shop-api';
import type { LaccicoKategoriebaumProps } from './types';

/**
 * Kategoriebaum links wie Ceres („Kategorie-Navigation“): ganzer Baum von oben,
 * der Zweig der aktuellen Kategorie ist aufgeklappt, die aktuelle Kategorie hervorgehoben, dahinter die Artikelzahl.
 */
defineProps<LaccicoKategoriebaumProps>();
const localePath = useLocalePath();
const { data: baum, getCategoryTree } = useCategoryTree();
const { data: produkte } = useProducts();

if (baum.value.length === 0) await getCategoryTree();

type Zeile = { id: number; name: string; anzahl: number; link: string; tiefe: number; aktiv: boolean; aufPfad: boolean };

const aktuelleId = computed(() => Number((produkte.value as { category?: { id?: number } })?.category?.id ?? 0));
const pfad = computed<number[]>(() =>
  aktuelleId.value ? categoryTreeGetters.findCategoriesPathByCategoryId(baum.value, aktuelleId.value).map((k: CategoryTreeItem) => k.id) : [],
);

const zeilen = computed<Zeile[]>(() => {
  const liste: Zeile[] = [];
  const gehe = (knoten: CategoryTreeItem[], tiefe: number) => {
    for (const k of knoten) {
      const name = categoryTreeGetters.getName(k);
      if (!name) continue;
      const aufPfad = pfad.value.includes(k.id);
      liste.push({
        id: k.id,
        name,
        anzahl: categoryTreeGetters.getCount(k),
        link: categoryTreeGetters.generateCategoryLink(baum.value, k),
        tiefe,
        aktiv: k.id === aktuelleId.value,
        aufPfad,
      });
      if (aufPfad && categoryTreeGetters.getItems(k)?.length) gehe(categoryTreeGetters.getItems(k), tiefe + 1);
    }
  };
  gehe(baum.value, 0);
  return liste;
});
</script>

<template>
  <div v-if="passend.length || zuletzt.length" class="mt-10" data-testid="laccico-empfehlungen">
    <section v-if="passend.length" class="mb-10">
      <h2 class="typography-headline-4 font-bold mb-4">{{ texte.passend }}</h2>
      <ProductSlider :items="passend" />
    </section>
    <section v-if="zuletzt.length">
      <h2 class="typography-headline-4 font-bold mb-4">{{ texte.zuletzt }}</h2>
      <ProductSlider :items="zuletzt" />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * LACCICO (Zettel N 24.11.2026, Punkt 10): Empfehlungen unter einer Artikelliste, damit Seiten wie die
 * Wunschliste nicht in einer Sackgasse enden.
 * „Passend dazu“ = Plenty-Cross-Selling „Similar“ der ersten drei Artikel (gleiche Farbe in anderen Linien,
 * gepflegt an 268 von 271 Artikeln, Stand 25.11.2026), ohne Artikel, die schon in der Liste stehen.
 * „Zuletzt angesehen“ = Plenty-Liste der zuletzt angesehenen Artikel (Schalter in Shop 6 ist an).
 */
import type { Product } from '@plentymarkets/shop-api';
import { productGetters } from '@plentymarkets/shop-api';

const props = defineProps<{ artikel: Product[] }>();

const TEXTE: Record<string, { passend: string; zuletzt: string }> = {
  de: { passend: 'Passend dazu', zuletzt: 'Zuletzt angesehen' },
  en: { passend: 'You may also like', zuletzt: 'Recently viewed' },
  fr: { passend: 'Vous aimerez aussi', zuletzt: 'Vus récemment' },
};
const MAX_QUELLEN = 3;
const MAX_KACHELN = 12;

const { locale } = useI18n();
const texte = computed(() => TEXTE[String(locale.value)] ?? TEXTE.de!);

const passend = ref<Product[]>([]);
const zuletzt = ref<Product[]>([]);

const holen = async (payload: Record<string, unknown>) => {
  try {
    const antwort = await useSdk().plentysystems.getFacet(payload);
    return antwort?.data?.products ?? [];
  } catch {
    return [];
  }
};

const laden = async () => {
  const vorhanden = new Set(props.artikel.map((p) => String(productGetters.getItemId(p))));
  const quellen = [...vorhanden].slice(0, MAX_QUELLEN);
  const listen = await Promise.all(
    quellen.map((itemId) =>
      holen({
        type: 'cross_selling',
        itemId,
        crossSellingRelation: 'Similar',
        itemsPerPage: 20,
        sort: 'sorting.price.avg_asc',
      }),
    ),
  );
  const gesehen = new Set<string>();
  const ergebnis: Product[] = [];
  for (const produkt of listen.flat()) {
    const id = String(productGetters.getItemId(produkt));
    if (vorhanden.has(id) || gesehen.has(id)) {
      continue;
    }
    gesehen.add(id);
    ergebnis.push(produkt);
  }
  passend.value = ergebnis.slice(0, MAX_KACHELN);
  zuletzt.value = (await holen({ type: 'last_seen' }))
    .filter((p) => !vorhanden.has(String(productGetters.getItemId(p))))
    .slice(0, MAX_KACHELN);
};

onMounted(laden);
watch(
  () => props.artikel.map((p) => productGetters.getItemId(p)).join(','),
  () => laden(),
);
</script>

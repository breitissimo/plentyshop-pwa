<template>
  <!-- Megamenü „Form & Durchmesser“ (Skizze N 22.11.2026): über die ganze Breite je Linie eine Zeile mit den meistverkauften Artikeln, nur Hauptbild und Titel -->
  <div class="col-span-4 laccico-bestseller" data-testid="laccico-megamenue-bestseller">
    <div v-for="zeile in zeilen" :key="zeile.kategorie" class="laccico-bestseller-zeile">
      <NuxtLink :to="localePath(linkFuer(zeile.knoten))" class="laccico-bestseller-linie">{{ zeile.titel }}</NuxtLink>
      <div class="laccico-bestseller-reihe">
        <NuxtLink
          v-for="artikel in artikelVon(zeile.kategorie)"
          :key="artikel.link"
          :to="artikel.link"
          class="laccico-bestseller-kachel group/kachel"
        >
          <span class="laccico-bestseller-bild">
            <img
              :src="artikel.bild"
              :alt="artikel.name"
              loading="lazy"
              class="transition-transform duration-300 group-hover/kachel:scale-105"
            />
          </span>
          <span class="laccico-bestseller-titel">{{ artikel.titel }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CategoryTreeItem, type Product, categoryTreeGetters, productGetters } from '@plentymarkets/shop-api';
import { LACCICO_BESTSELLER_ANZAHL, LACCICO_BESTSELLER_ZEILEN } from '~~/modules/laccico/runtime/utils/laccicoBestseller';
import type { LaccicoBestsellerArtikel } from '~~/modules/laccico/runtime/utils/types';
// verkaufte Paare je Artikel, letzte 12 Monate, alle Kanäle (Skripte/bestseller_rangliste.ps1 im PWA-Ordner, neu erzeugen und mitliefern)
import ranglisteDatei from '~~/modules/laccico/runtime/utils/laccicoBestsellerRangliste.json';

const LACCICO_SEITE = 100;
const rangliste = ranglisteDatei as Record<string, number>;

const props = defineProps<{ knoten: CategoryTreeItem; linkFuer: (kategorie: CategoryTreeItem) => string }>();

const localePath = useLocalizedPath();
const { locale } = useI18n();

/** Zeilen aus dem Kategoriebaum unter „Form & Durchmesser“ (Name je Sprache), Reihenfolge fest: R2, R3, F3, F4, F6. */
const zeilen = computed(() =>
  LACCICO_BESTSELLER_ZEILEN.flatMap((z) => {
    const knoten = suche(props.knoten.children ?? [], z.kategorie);
    return knoten ? [{ kategorie: z.kategorie, knoten, titel: categoryTreeGetters.getName(knoten) }] : [];
  }),
);
function suche(knoten: CategoryTreeItem[], id: number): CategoryTreeItem | undefined {
  for (const k of knoten) {
    if (k.id === id) {
      return k;
    }
    const treffer = suche(k.children ?? [], id);
    if (treffer) {
      return treffer;
    }
  }
  return undefined;
}

/** Je Zeile die meistverkauften Artikel (Sortierung wie „Meistverkaufte Artikel“ im Shop), einmal je Sprache geladen. */
const daten = useState<Record<string, LaccicoBestsellerArtikel[]>>('laccico-megamenue-bestseller', () => ({}));
const schluessel = (kategorie: number) => `${locale.value}-${kategorie}`;
const artikelVon = (kategorie: number) => daten.value[schluessel(kategorie)] ?? [];

/** Titel kurz: Linie und Farbe ohne Gattungswort, z. B. „R2-CS Weiss“ aus „Gewachste Schnürsenkel Rund (2 mm) – Laccico R2-CS Weiss“. */
function kurzTitel(name: string): string {
  const nachMarke = name.split(/Laccico\s+/i).pop() ?? name;
  return nachMarke.replace(/\s+[–-]\s+/g, ' ').trim();
}

async function laden(kategorie: number) {
  const k = schluessel(kategorie);
  if (daten.value[k]) {
    return;
  }
  daten.value[k] = [];
  try {
    // alle Artikel der Kategorie (höchstens 3 Seiten à 100), dann nach verkauften Paaren der letzten 12 Monate ordnen
    const alle: Product[] = [];
    for (let seite = 1; seite <= 3; seite++) {
      const { data } = await useSdk().plentysystems.getFacet({
        type: 'category',
        categoryId: String(kategorie),
        page: seite,
        itemsPerPage: LACCICO_SEITE,
        sort: 'variation.position_desc',
      });
      const teil = data?.products ?? [];
      alle.push(...teil);
      if (teil.length < LACCICO_SEITE) {
        break;
      }
    }
    const paare = (p: Product) => rangliste[String(productGetters.getItemId(p))] ?? 0;
    const beste = alle
      .map((p, position) => ({ p, position }))
      .sort((a, b) => paare(b.p) - paare(a.p) || a.position - b.position)
      .slice(0, LACCICO_BESTSELLER_ANZAHL)
      .map((x) => x.p);
    daten.value[k] = beste.map((p: Product) => {
      const name = productGetters.getName(p);
      return {
        name,
        titel: kurzTitel(name),
        bild: productGetters.getCoverImage(p),
        link: localePath(`/${productGetters.getUrlPath(p)}_${productGetters.getItemId(p)}`),
      };
    });
  } catch {
    delete daten.value[k];
  }
}

onMounted(() => {
  LACCICO_BESTSELLER_ZEILEN.forEach((z) => laden(z.kategorie));
});
</script>

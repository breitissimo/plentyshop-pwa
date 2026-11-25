<template>
  <!-- Megamenü „Form & Durchmesser“ (Skizze N 22.11.2026): je Linie eine Zeile mit Bestsellern und Bestandstipps, nur Hauptbild und Titel;
       oben die Kategorien des Zweigs, links Zeilenname, rechts „Alle ansehen“ -->
  <div class="col-span-4 laccico-bestseller" data-testid="laccico-megamenue-bestseller">
    <div v-if="weitere.length" class="laccico-bestseller-weitere">
      <NuxtLink v-for="k in weitere" :key="k.id" :to="localePath(linkFuer(k))">{{ categoryTreeGetters.getName(k) }}</NuxtLink>
    </div>
    <!-- Ein Bild je Serie in einer Zeile wie Farbwelten (Zettel N 25.11.): Fenster kürzer, Name und Kürzel darunter -->
    <div class="flex flex-wrap justify-center gap-x-4 gap-y-6 pt-2" data-testid="laccico-megamenue-serien">
      <NuxtLink
        v-for="zeile in zeilen"
        :key="zeile.kategorie"
        :to="localePath(linkFuer(zeile.knoten))"
        class="w-36 block group/kachel focus-visible:outline focus-visible:rounded-md"
        data-testid="laccico-megamenue-serie"
      >
        <span class="aspect-[4/3] overflow-hidden flex items-center justify-center bg-white">
          <img
            v-if="zeile.bild"
            :src="zeile.bild"
            :alt="zeile.titel + ' ' + zeile.kuerzel"
            loading="lazy"
            class="w-full h-full object-contain p-1 transition-transform duration-300 group-hover/kachel:scale-105"
          />
        </span>
        <span class="mt-2 block text-center font-medium typography-text-sm">{{ zeile.titel }}</span>
        <span v-if="zeile.kuerzel" class="block text-center typography-text-xs text-neutral-500">{{ zeile.kuerzel }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CategoryTreeItem, categoryTreeGetters } from '@plentymarkets/shop-api';
import type { LaccicoBestsellerDatei, LaccicoSprache } from '~~/modules/laccico/runtime/utils/types';
// Erzeugt von Skripte/bestseller_rangliste.ps1 im PWA-Ordner (Absatz 12 Monate, Bestand, Bilder, Texte); monatlich neu erzeugen und mitliefern
import menueDatei from '~~/modules/laccico/runtime/utils/laccicoBestsellerMenue.json';

const props = defineProps<{ knoten: CategoryTreeItem; linkFuer: (kategorie: CategoryTreeItem) => string }>();

const localePath = useLocalizedPath();
const { locale } = useI18n();
const menue = menueDatei as LaccicoBestsellerDatei;

const sprache = computed<LaccicoSprache>(() => (['de', 'en', 'fr'].includes(locale.value) ? locale.value : 'de') as LaccicoSprache);

/** Oberkategorie der Kategorie id im Teilbaum (undefined, wenn sie direkt im Teilbaum liegt oder fehlt). */
function elternVon(knoten: CategoryTreeItem[], id: number): CategoryTreeItem | undefined {
  for (const k of knoten) {
    if ((k.children ?? []).some((c) => c.id === id)) {
      return k;
    }
    const treffer = elternVon(k.children ?? [], id);
    if (treffer) {
      return treffer;
    }
  }
  return undefined;
}

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

/** Zeilen in der Reihenfolge der Datei (R2-CS, R2-SL, R3, F3, F4, F6-CS, F6-XR); Name und Unterkategorien aus dem Kategoriebaum der Sprache. */
const zeilen = computed(() =>
  menue.zeilen.flatMap((z) => {
    const knoten = suche(props.knoten.children ?? [], z.kategorie);
    if (!knoten) {
      return [];
    }
    const artikel = z.artikel
      .filter((a) => a.bild && a.pfad[sprache.value])
      .map((a) => ({ id: a.id, tipp: a.tipp, bild: a.bild, titel: a.titel[sprache.value] ?? '', pfad: a.pfad[sprache.value] ?? '' }));
    // Linien-Kategorien (R2-CS, R2-SL, F6-CS, F6-XR) liegen eine Ebene tiefer: Name der Oberkategorie, darunter das Kürzel (N 22.11.)
    const eltern = elternVon(props.knoten.children ?? [], z.kategorie);
    const mitEltern = !!eltern && !(props.knoten.children ?? []).some((k) => k.id === eltern.id);
    const titel = mitEltern ? categoryTreeGetters.getName(eltern) : categoryTreeGetters.getName(knoten);
    const kuerzel = mitEltern ? categoryTreeGetters.getName(knoten) : '';
    // Serienbild: Bestseller Nr. 1 der Linie (ohne Bestandstipp)
    const bild = (artikel.find((a) => !a.tipp) ?? artikel[0])?.bild ?? '';
    return [{ kategorie: z.kategorie, knoten, titel, kuerzel, bild }];
  }),
);

/** Übrige Kategorien des Zweigs „Form & Durchmesser“ (Überkategorien, 3er Pack, Restposten) als Leiste oben. */
const weitere = computed(() => (props.knoten.children ?? []).filter((k) => categoryTreeGetters.getName(k)));
</script>

<template>
  <!-- Megamenü „Form & Durchmesser“ (Skizze N 22.11.2026): je Linie eine Zeile mit Bestsellern und Bestandstipps, nur Hauptbild und Titel;
       oben die Kategorien des Zweigs, links Zeilenname, rechts „Alle ansehen“ -->
  <div class="col-span-4 laccico-bestseller" data-testid="laccico-megamenue-bestseller">
    <div v-if="weitere.length" class="laccico-bestseller-weitere">
      <NuxtLink v-for="k in weitere" :key="k.id" :to="localePath(linkFuer(k))">{{ categoryTreeGetters.getName(k) }}</NuxtLink>
    </div>
    <div v-for="zeile in zeilen" :key="zeile.kategorie" class="laccico-bestseller-zeile">
      <div class="laccico-bestseller-kopf">
        <NuxtLink :to="localePath(linkFuer(zeile.knoten))" class="laccico-bestseller-linie">
          {{ zeile.titel }}<span v-if="zeile.kuerzel" class="laccico-bestseller-kuerzel">{{ zeile.kuerzel }}</span>
        </NuxtLink>
        <span v-if="zeile.unter.length" class="laccico-bestseller-unter">
          <NuxtLink v-for="u in zeile.unter" :key="u.id" :to="localePath(linkFuer(u))">{{ categoryTreeGetters.getName(u) }}</NuxtLink>
        </span>
      </div>
      <div class="laccico-bestseller-reihe">
        <NuxtLink
          v-for="artikel in zeile.artikel"
          :key="artikel.id"
          :to="localePath(artikel.pfad)"
          class="laccico-bestseller-kachel group/kachel"
          :title="artikel.titel"
          :data-testid="artikel.tipp ? 'laccico-bestseller-tipp' : 'laccico-bestseller-artikel'"
        >
          <span class="laccico-bestseller-bild">
            <img
              :src="artikel.bild"
              :alt="artikel.titel"
              loading="lazy"
              class="transition-transform duration-300 group-hover/kachel:scale-105"
            />
          </span>
          <!-- Farbname nur beim Überfahren (title) und für Vorleseprogramme, dafür größere Bilder (Zettel N 23.11.) -->
          <span class="sr-only">{{ artikel.titel }}</span>
        </NuxtLink>
      </div>
      <NuxtLink :to="localePath(linkFuer(zeile.knoten))" class="laccico-bestseller-alle">{{ text.alle(zeile.kuerzel || zeile.titel) }}</NuxtLink>
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

/** Knopf je Zeile mit Linienname, z. B. „Alle R2-CS ansehen“ (Zettel N 23.11.) */
const TEXTE: Record<LaccicoSprache, { alle: (linie: string) => string }> = {
  de: { alle: (linie) => `Alle ${linie} ansehen` },
  en: { alle: (linie) => `View all ${linie}` },
  fr: { alle: (linie) => `Voir tous les ${linie}` },
};
const sprache = computed<LaccicoSprache>(() => (['de', 'en', 'fr'].includes(locale.value) ? locale.value : 'de') as LaccicoSprache);
const text = computed(() => TEXTE[sprache.value]);

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
    const unter = (knoten.children ?? []).filter((u) => categoryTreeGetters.getName(u));
    // Linien-Kategorien (R2-CS, R2-SL, F6-CS, F6-XR) liegen eine Ebene tiefer: Name der Oberkategorie, darunter das Kürzel (N 22.11.)
    const eltern = elternVon(props.knoten.children ?? [], z.kategorie);
    const mitEltern = !!eltern && !(props.knoten.children ?? []).some((k) => k.id === eltern.id);
    const titel = mitEltern ? categoryTreeGetters.getName(eltern) : categoryTreeGetters.getName(knoten);
    const kuerzel = mitEltern ? categoryTreeGetters.getName(knoten) : '';
    return [{ kategorie: z.kategorie, knoten, titel, kuerzel, unter, artikel }];
  }),
);

/** Übrige Kategorien des Zweigs „Form & Durchmesser“ (Überkategorien, 3er Pack, Restposten) als Leiste oben. */
const weitere = computed(() => (props.knoten.children ?? []).filter((k) => categoryTreeGetters.getName(k)));
</script>

/** Seitentitel (ohne „| LACCICO“) und Meta-Beschreibung einer Seite. */
export type LaccicoSeitenMeta = { titel: string; beschreibung: string };
/** Shop-Sprachen von LACCICO. */
export type LaccicoSprache = 'de' | 'en' | 'fr';
/** Ein Artikel im Bestseller-Megamenü (Datei laccicoBestsellerMenue.json): Hauptbild, Kurztitel und Link je Sprache; tipp = Bestandstipp statt Bestseller. */
export type LaccicoBestsellerArtikel = {
  id: number;
  tipp: boolean;
  paare: number;
  bestand: number;
  bild: string;
  titel: Partial<Record<LaccicoSprache, string>>;
  pfad: Partial<Record<LaccicoSprache, string>>;
};
/** Inhalt von laccicoBestsellerMenue.json: je Zeile (Kategorie) die Artikel in Anzeigereihenfolge. */
export type LaccicoBestsellerDatei = {
  erstellt: string;
  zeitraumMonate: number;
  zeilen: { kategorie: number; artikel: LaccicoBestsellerArtikel[] }[];
};

/** Seitentitel (ohne „| LACCICO“) und Meta-Beschreibung einer Seite. */
export type LaccicoSeitenMeta = { titel: string; beschreibung: string };
/** Shop-Sprachen von LACCICO. */
export type LaccicoSprache = 'de' | 'en' | 'fr';
/** Ein Artikel im Bestseller-Megamenü: Hauptbild, kurzer Titel, Link. */
export type LaccicoBestsellerArtikel = { name: string; titel: string; bild: string; link: string };

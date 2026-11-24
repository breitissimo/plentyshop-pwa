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

/** Händler-Bestellliste (N 23.11.2026): Staffelstufe netto je Paar */
export type LaccicoListenStaffel = { ab: number; preis: number };

/** Eine Zeile der Händler-Bestellliste */
export type LaccicoListenZeile = {
  variationId: number;
  itemId: number;
  nummer: string;
  name: string;
  laenge: string;
  menge: number;
  /** Staffel des Händlers (netto je Paar), aufsteigend nach Menge */
  staffel: LaccicoListenStaffel[];
};

/**
 * Auswahl auf der Kachel: Menge und Preis je Paar der gewählten Länge (null = noch keine Länge).
 * Händler: Staffelpreis netto; Endkunden: Preis für 1 Paar mit Streichpreis der Länge (Rabatt rechnet die Kachel).
 */
export type LaccicoKartenWahl = { menge: number; preis: number | null; durchgestrichen?: number };

/** Preis auf der Kachel: Preis je Paar, durchgestrichener Vergleichspreis (0 = keiner), Ersparnis in Prozent (0 = keine) */
export type LaccicoKartenPreis = { preis: number; durchgestrichen: number; prozent: number };

/** Stufe der Rabattstaffel auf den Nettowarenwert (Kundenklasse Standard-Endkunden) */
export type LaccicoWarenwertStufe = { abNetto: number; prozent: number };

/** Staffel-Eintrag, wie ihn der Shop liefert (getGraduatedList) */
export type LaccicoShopStaffel = { quantity: string | number; price: number };

/** Kunde mit Kundenklasse */
export type LaccicoKundeMitKlasse = { classId?: number | null };

/** Antwort der Middleware-Funktion laccicoGewerbeschein (apps/server/laccicoGewerbeschein.ts) */
export type LaccicoGewerbescheinAntwort = { ok: boolean; grund?: string };

/** Google reCAPTCHA v3 im Fenster (nur geladen, wenn der Kunde den Gewerbeschein sendet) */
export type LaccicoGrecaptcha = {
  ready: (fertig: () => void) => void;
  execute: (schluessel: string, optionen: { action: string }) => Promise<string>;
};

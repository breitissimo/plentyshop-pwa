import type { LaccicoSprache } from './types';

/**
 * Hinweis bei zu wenig Bestand (Zettel N 27.11.2026): Lehnt Plenty die Menge ab, fragt die PWA den Vorrat ab
 * und weist auf die Händler-Bestellliste hin, über die Firmenkunden auch mehr als den Vorrat bestellen können.
 * Gilt für Kachel (LaccicoKartenKauf) und Artikelansicht (PurchaseCard).
 */
export const LACCICO_VORRAT_TEXTE = {
  de: {
    nurVorrat: 'Sofort lieferbar sind {n} Paar. Firmenkunden bestellen größere Mengen über die Händler-Bestellliste, der Rest wird nachgeliefert.',
    keinVorrat: 'Diese Länge ist zurzeit nicht in größerer Menge vorrätig. Firmenkunden bestellen größere Mengen über die Händler-Bestellliste, sie wird nachgeliefert.',
    zuHaendler: 'Zur Händlerseite',
    vorratKaufen: '{n} Paar in den Warenkorb',
    schliessen: 'Hinweis schließen',
  },
  en: {
    nurVorrat: '{n} pairs can be shipped right away. Business customers order larger quantities via the trade order list; the rest is delivered later.',
    keinVorrat: 'This length is not in stock in larger quantities at the moment. Business customers order larger quantities via the trade order list; it is delivered later.',
    zuHaendler: 'To the retailer page',
    vorratKaufen: 'Add {n} pairs to the cart',
    schliessen: 'Close notice',
  },
  fr: {
    nurVorrat: '{n} paires sont disponibles immédiatement. Les professionnels commandent de plus grandes quantités via la liste de commande revendeurs ; le reste est livré ultérieurement.',
    keinVorrat: 'Cette longueur n’est pas disponible en grande quantité pour le moment. Les professionnels commandent de plus grandes quantités via la liste de commande revendeurs ; elle est livrée ultérieurement.',
    zuHaendler: 'Page revendeurs',
    vorratKaufen: 'Ajouter {n} paires au panier',
    schliessen: 'Fermer',
  },
} as const;

/** Texte in der aktuellen Sprache (Rückfall Deutsch) */
export const laccicoVorratTexte = (sprache: string) =>
  LACCICO_VORRAT_TEXTE[(sprache as LaccicoSprache) in LACCICO_VORRAT_TEXTE ? (sprache as LaccicoSprache) : 'de'];

/**
 * Puffer, der nicht angeboten wird, damit eine Länge nicht gleich leer ist (N 27.11.2026: 5–10 Paar):
 * 10 % des Vorrats, mindestens 5, höchstens 10 Paar.
 */
export const laccicoVorratPuffer = (vorrat: number) => Math.min(10, Math.max(5, Math.round(vorrat * 0.1)));

/**
 * Angebotene Menge, wenn der Vorrat kleiner ist als die gewünschte Menge (dann Hinweis zeigen), sonst null.
 * Angeboten wird der Vorrat abzüglich Puffer (0 = nichts anbieten, nur Hinweis auf die Bestellliste);
 * diese Menge kann der Kunde direkt in den Warenkorb legen (N 27.11.2026).
 * Bestand vom PWA-Server (`server/routes/laccico-bestand.get.ts`); ohne Antwort kein Hinweis.
 */
export const laccicoVorratPruefen = async (variationId: string | number, menge: number) => {
  try {
    const id = String(variationId);
    const antwort = await $fetch<Record<string, number | null>>('/laccico-bestand', { query: { ids: id } });
    const vorrat = antwort?.[id];
    if (typeof vorrat !== 'number' || vorrat >= menge) {
      return null;
    }
    return Math.max(0, vorrat - laccicoVorratPuffer(vorrat));
  } catch {
    return null;
  }
};

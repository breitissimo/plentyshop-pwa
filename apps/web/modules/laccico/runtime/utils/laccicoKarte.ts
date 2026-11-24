import type { Product } from '@plentymarkets/shop-api';
import { productGetters } from '@plentymarkets/shop-api';
import type { LaccicoKartenPreis, LaccicoWarenwertStufe } from './types';

/**
 * Preis auf der Artikelkarte wie in Ceres (N 19.11.2026): Preis für 1 Paar (Standardpreis), kein „ab“ mit dem
 * günstigsten Mengenpreis und kein durchgestrichener Normalpreis – das sähe nach Rabatt aus. Durchgestrichen nur
 * bei einem echten Sonderangebot oder, wie in Ceres, beim UVP, wenn er über dem Preis liegt (N 22.11.2026, Black Week:
 * UVP = bisheriger Standardpreis, also nur bei gesenkten Preisen sichtbar).
 */
export const laccicoKartenPreis = (product: Product): LaccicoKartenPreis => {
  const normal = productGetters.getPrice(product) ?? 0;
  const angebot = productGetters.getSpecialOffer(product);
  const istAngebot = Boolean(angebot && angebot < normal);
  const uvp = productGetters.getCrossedPrice(product) ?? 0;
  let durchgestrichen = 0;
  if (istAngebot) {
    durchgestrichen = normal;
  } else if (uvp > normal) {
    durchgestrichen = uvp;
  }
  const preis = istAngebot ? (angebot as number) : normal;
  return { preis, durchgestrichen, prozent: laccicoProzent(preis, durchgestrichen) };
};

/** Ersparnis in ganzen Prozent gegenüber dem durchgestrichenen Preis (0, wenn keiner da ist). */
export const laccicoProzent = (preis: number, durchgestrichen: number) =>
  durchgestrichen > preis && durchgestrichen > 0 ? Math.round((1 - preis / durchgestrichen) * 100) : 0;

/**
 * Rabattstaffel auf den Nettowarenwert der Kundenklasse 2 „Standard-Endkunden“ (Plenty `discountTypeScales.scaleItemSumNet`,
 * gelesen 24.11.2026; brutto entspricht das 8 / 12 / 16 / 25 €). Ändert N die Staffel in Plenty, hier und im Text von
 * `LaccicoPreisHinweis` nachziehen.
 */
export const LACCICO_WARENWERT_STAFFEL: LaccicoWarenwertStufe[] = [
  { abNetto: 21, prozent: 20 },
  { abNetto: 13.44, prozent: 12 },
  { abNetto: 10.08, prozent: 8 },
  { abNetto: 6.72, prozent: 5 },
];

/** Mehrwertsteuer, mit der die Bruttopreise der Kachel auf den Nettowarenwert zurückgerechnet werden (Deutschland). */
const LACCICO_MWST = 1.19;

/**
 * Endkunden-Preis auf der Kachel für die gewählte Menge (Zettel N 24.11.2026): Die Rabattstaffel gilt im Warenkorb
 * auf den Warenwert; die Kachel zeigt schon vorher, was ein Paar bei dieser Menge kostet, mit Streichpreis und Prozent.
 * Durchgestrichen ist der höhere Ausgangspreis (UVP/Normalpreis bei Aktionen, sonst der Preis für 1 Paar).
 */
export const laccicoEndkundenPreis = (basis: LaccicoKartenPreis, menge: number): LaccicoKartenPreis => {
  const warenwertNetto = (basis.preis * Math.max(1, menge)) / LACCICO_MWST;
  const stufe = LACCICO_WARENWERT_STAFFEL.find((s) => warenwertNetto >= s.abNetto - 0.005);
  if (!stufe) {
    return basis;
  }
  const preis = Math.round(basis.preis * (1 - stufe.prozent / 100) * 100) / 100;
  const durchgestrichen = Math.max(basis.durchgestrichen, basis.preis);
  return { preis, durchgestrichen, prozent: laccicoProzent(preis, durchgestrichen) };
};

/** Sterne nur zeigen, wenn es Bewertungen gibt (Ceres zeigt bei 0 Bewertungen keine Sterne). */
export const laccicoSterneZeigen = (product: Product) => (productGetters.getTotalReviews(product) ?? 0) > 0;

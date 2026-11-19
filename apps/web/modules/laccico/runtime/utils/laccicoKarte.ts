import type { Product } from '@plentymarkets/shop-api';
import { productGetters } from '@plentymarkets/shop-api';

/**
 * Preis auf der Artikelkarte wie in Ceres (N 19.11.2026): Preis für 1 Paar (Standardpreis), kein „ab“ mit dem
 * günstigsten Mengenpreis und kein durchgestrichener Normalpreis – das sähe nach Rabatt aus. Durchgestrichen nur
 * bei einem echten Sonderangebot.
 */
export const laccicoKartenPreis = (product: Product) => {
  const normal = productGetters.getPrice(product) ?? 0;
  const angebot = productGetters.getSpecialOffer(product);
  const istAngebot = Boolean(angebot && angebot < normal);
  return {
    preis: istAngebot ? (angebot as number) : normal,
    durchgestrichen: istAngebot ? normal : 0,
  };
};

/** Sterne nur zeigen, wenn es Bewertungen gibt (Ceres zeigt bei 0 Bewertungen keine Sterne). */
export const laccicoSterneZeigen = (product: Product) => (productGetters.getTotalReviews(product) ?? 0) > 0;

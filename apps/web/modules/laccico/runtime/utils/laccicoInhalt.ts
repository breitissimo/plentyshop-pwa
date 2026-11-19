import type { Block, GetBlocksResponse } from '@plentymarkets/shop-api';

/**
 * Produktkategorien laden in der PWA alle dieselben Blöcke (identifier 0). Für LACCICO bekommt jede
 * Produktkategorie ihre eigene ID, damit Kategorien mit eigener Datei (z. B. FAQ wie in Ceres) diese zeigen.
 */
export const laccicoSeitenId = (identifier: string | number, type: string): string | number => {
  if (type === 'category' && Number(identifier) === 0) {
    const id = useProducts().data.value?.category?.id;
    return id ? Number(id) : identifier;
  }
  return identifier;
};

const istProduktkategorie = () => useProducts().data.value?.category?.type === 'item';

/** Seitenname im Fork: <typ>_<id>, z. B. category_648, immutable_index. */
const seitenName = (type: string, identifier: string | number) => `${type}_${identifier}`;

const ladeDatei = async (sprache: string, seite: string): Promise<Block[] | Block | null> => {
  try {
    return await $fetch<Block[] | Block | null>(`/_laccico/inhalt/${sprache}/${seite}`);
  } catch {
    return null;
  }
};

/**
 * Ergänzt die Antwort von getBlocksWithGlobalBlocks um die Inhalte aus dem Fork:
 * Seitenblöcke, Kopf (immutable_header) und Fuß (immutable_footer) aus den Dateien haben Vorrang.
 * Ohne Datei bleibt die Antwort aus Plenty unverändert.
 */
export const laccicoMitInhalt = async <T extends { data?: GetBlocksResponse; meta?: { hasSnapshot?: boolean } }>(
  antwort: T,
  identifier: string | number,
  type: string,
  sprache: string,
): Promise<T> => {
  const [seite, kopf, fuss] = await Promise.all([
    ladeDatei(sprache, seitenName(type, identifier)),
    ladeDatei(sprache, 'immutable_header'),
    ladeDatei(sprache, 'immutable_footer'),
  ]);

  // Vorlagen (alle Produktkategorien ohne eigene Datei, alle Artikel) kommen aus dem Code, nicht aus Plenty
  const vorlage =
    type === 'product'
      ? resolveBlockTemplate(PRODUCT_TEMPLATE_KIND, createProduct)()
      : type === 'category' && istProduktkategorie()
        ? resolveBlockTemplate(CATEGORY_TEMPLATE_KIND, createCategory)()
        : null;

  if (!seite && !kopf && !fuss && !vorlage) {
    return antwort;
  }

  const daten = { ...(antwort?.data ?? {}) } as GetBlocksResponse & Record<string, unknown>;

  if (Array.isArray(seite)) {
    daten.blocks = seite;
  } else if (vorlage) {
    daten.blocks = vorlage;
  }
  if (kopf && !Array.isArray(kopf)) {
    daten.HeaderContainer = kopf;
  }
  if (fuss && !Array.isArray(fuss)) {
    daten.FooterContainer = fuss;
  }

  return { ...antwort, data: daten, meta: { ...(antwort?.meta ?? {}), hasSnapshot: false } };
};

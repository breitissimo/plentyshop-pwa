import type { Block, GetBlocksResponse } from '@plentymarkets/shop-api';

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

  if (!seite && !kopf && !fuss) {
    return antwort;
  }

  const daten = { ...(antwort?.data ?? {}) } as GetBlocksResponse & Record<string, unknown>;

  if (Array.isArray(seite)) {
    daten.blocks = seite;
  }
  if (kopf && !Array.isArray(kopf)) {
    daten.HeaderContainer = kopf;
  }
  if (fuss && !Array.isArray(fuss)) {
    daten.FooterContainer = fuss;
  }

  return { ...antwort, data: daten, meta: { ...(antwort?.meta ?? {}), hasSnapshot: false } };
};

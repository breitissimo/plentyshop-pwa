/**
 * Längenwahl für Kategorielisten (N 19.11.2026): oben „Alle Längen“ oder eine Länge, die auf alle Kacheln wirkt;
 * jede Kachel bleibt einzeln änderbar. Die Längen einer Kachel werden erst bei Benutzung geladen (1 Abruf je Artikel).
 */
export const LACCICO_LAENGEN = ['45 cm', '60 cm', '75 cm', '90 cm', '120 cm', '150 cm', '180 cm'];

export const useLaccicoLaenge = () => ({
  /** Global gewählte Länge, z. B. „90 cm“; leer = „Alle Längen“. */
  gewaehlt: useState<string>('laccicoLaenge', () => ''),
});

export type LaccicoLaengenOption = { variationId: number; laenge: string; verkaeuflich: boolean };

type VariationAttributeMap = {
  variations?: { variationId: number; isSalable: boolean; attributes: { attributeId: number; attributeValueId: number }[] }[];
  attributes?: { attributeId: number; name: string; values: { attributeValueId: number; name: string }[] }[];
};

const istLaenge = (name: string) => /^\d+(?:[.,]\d+)?\s*cm$/i.test(name.trim());

/** Liest aus der Variantenzuordnung eines Artikels die wählbaren Längen. `null` = Artikel braucht noch eine weitere Wahl (z. B. Farbe). */
export const laccicoLaengenAus = (karte: VariationAttributeMap | undefined): LaccicoLaengenOption[] | null => {
  const attribute = karte?.attributes ?? [];
  const laengenAttr = attribute.find((a) => a.values?.length && a.values.every((v) => istLaenge(v.name)));
  if (!laengenAttr) return null;
  const andere = attribute.filter((a) => a !== laengenAttr && (a.values?.length ?? 0) > 1);
  if (andere.length) return null;
  const optionen: LaccicoLaengenOption[] = [];
  for (const v of karte?.variations ?? []) {
    const wert = v.attributes.find((a) => a.attributeId === laengenAttr.attributeId);
    const name = laengenAttr.values.find((x) => x.attributeValueId === wert?.attributeValueId)?.name;
    if (name) optionen.push({ variationId: v.variationId, laenge: name.trim(), verkaeuflich: v.isSalable });
  }
  return optionen.sort((a, b) => parseFloat(a.laenge) - parseFloat(b.laenge));
};

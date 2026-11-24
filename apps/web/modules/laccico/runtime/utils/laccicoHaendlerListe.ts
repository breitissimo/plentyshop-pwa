import { productGetters } from '@plentymarkets/shop-api';
import type { Product } from '@plentymarkets/shop-api';
import { laccicoLaengenAus } from './laccicoLaenge';
import type { LaccicoKundeMitKlasse, LaccicoListenStaffel, LaccicoListenZeile, LaccicoShopStaffel } from './types';

/**
 * Händler-Bestellliste (N 23.11.2026): Händler (Kundenklasse 7) legen Artikel nicht in den Warenkorb,
 * sondern auf diese Liste. Sie liegt nur im Browser des Händlers (localStorage, wie ein Warenkorb,
 * kein Tracking) und wird erst beim Absenden an LACCICO geschickt.
 */

export const LACCICO_HAENDLER_KLASSE = 7;
const SPEICHER_SCHLUESSEL = 'laccico-haendlerliste-v1';

/** Preis je Paar für eine Menge: höchste Staffel, deren Mindestmenge erreicht ist. */
export const laccicoListenPreis = (zeile: Pick<LaccicoListenZeile, 'staffel' | 'menge'>) => {
  let preis: number | null = null;
  for (const stufe of zeile.staffel) {
    if (zeile.menge >= stufe.ab) {
      preis = stufe.preis;
    }
  }
  return preis;
};

/** Staffel aus den Artikeldaten des Shops (getGraduatedList), bereinigt und aufsteigend sortiert. */
export const laccicoStaffelAus = (liste: LaccicoShopStaffel[] | undefined): LaccicoListenStaffel[] => {
  const stufen = (liste ?? [])
    .map((s) => ({ ab: Number(s.quantity) || 1, preis: Number(s.price) }))
    .filter((s) => Number.isFinite(s.preis) && s.preis > 0)
    .sort((a, b) => a.ab - b.ab);
  return stufen.filter((s, i) => i === stufen.length - 1 || stufen[i + 1]?.ab !== s.ab);
};

/** Baut eine Listenzeile aus den Artikeldaten des Shops (aktuelle Variante des Produkts). */
export const laccicoZeileAusProdukt = (produkt: Product, menge: number): LaccicoListenZeile => {
  const variationId = Number(productGetters.getVariationId(produkt));
  const karte = (produkt as { variationAttributeMap?: Parameters<typeof laccicoLaengenAus>[0] }).variationAttributeMap;
  const laenge = laccicoLaengenAus(karte)?.find((o) => o.variationId === variationId)?.laenge ?? '';
  return {
    variationId,
    itemId: Number(productGetters.getItemId(produkt)),
    nummer: productGetters.getVariationNumber(produkt) ?? '',
    name: productGetters.getName(produkt) ?? '',
    laenge,
    menge: Math.max(1, Math.round(Number(menge) || 1)),
    staffel: laccicoStaffelAus(productGetters.getGraduatedList(produkt) as LaccicoShopStaffel[]),
  };
};

/** Oberkategorien im Menü für Händler (N 23.11.2026): 727 Form & Durchmesser, 731 Farbwelten entdecken */
export const LACCICO_HAENDLER_MENUE = [727, 731];

/** Anker der Versandfrage auf der Händlerseite; Ziel des Menüpunkts „Versandkosten“ für Händler (Zettel N 24.11.2026) */
export const LACCICO_HAENDLER_VERSAND_ANKER = 'haendler-versand';

/** Menübaum je Kunde: Händler sehen nur die freigegebenen Oberkategorien, alle anderen den ganzen Baum. */
export const laccicoMenueFuerKunde = <T extends { id: number }>(baum: T[], istHaendler: boolean): T[] =>
  istHaendler ? baum.filter((k) => LACCICO_HAENDLER_MENUE.includes(Number(k.id))) : baum;

/** Ist der angemeldete Kunde ein freigeschalteter Händler (Klasse 7)? */
export const useLaccicoHaendler = () => {
  const { user } = useCustomer();
  // nur im lokalen Testserver: ?haendler=1 zeigt die Händleransicht ohne Händlerkonto (Preise bleiben Gastpreise)
  const testHaendler = import.meta.dev && useRoute().query.haendler === '1';
  const istHaendler = computed(
    () => testHaendler || (user.value as LaccicoKundeMitKlasse | null)?.classId === LACCICO_HAENDLER_KLASSE,
  );
  return { istHaendler };
};

/** Zustand der Händler-Bestellliste (im Browser gespeichert). */
export const useLaccicoHaendlerListe = () => {
  const zeilen = useState<LaccicoListenZeile[]>('laccico-haendlerliste', () => []);
  const geladen = useState('laccico-haendlerliste-geladen', () => false);
  const zuletzt = useState<number | null>('laccico-haendlerliste-zuletzt', () => null);

  const speichern = () => {
    if (!import.meta.client) {
      return;
    }
    try {
      localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(zeilen.value));
    } catch {
      // Speicher voll oder gesperrt: Liste gilt dann nur bis zum Neuladen
    }
  };

  const laden = () => {
    if (!import.meta.client || geladen.value) {
      return;
    }
    geladen.value = true;
    try {
      const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
      const daten = roh ? (JSON.parse(roh) as LaccicoListenZeile[]) : [];
      if (Array.isArray(daten)) {
        zeilen.value = daten.filter((z) => z && z.variationId && z.menge > 0);
      }
    } catch {
      zeilen.value = [];
    }
  };

  const hinzufuegen = (neu: LaccicoListenZeile) => {
    laden();
    const vorhanden = zeilen.value.find((z) => z.variationId === neu.variationId);
    if (vorhanden) {
      vorhanden.menge += neu.menge;
      if (neu.staffel.length) {
        vorhanden.staffel = neu.staffel;
      }
    } else {
      zeilen.value.push({ ...neu });
    }
    zuletzt.value = neu.variationId;
    speichern();
  };

  const mengeSetzen = (variationId: number, menge: number) => {
    const zeile = zeilen.value.find((z) => z.variationId === variationId);
    if (!zeile) {
      return;
    }
    zeile.menge = Math.max(1, Math.round(Number(menge) || 1));
    speichern();
  };

  const entfernen = (variationId: number) => {
    zeilen.value = zeilen.value.filter((z) => z.variationId !== variationId);
    speichern();
  };

  const leeren = () => {
    zeilen.value = [];
    speichern();
  };

  const summe = computed(() => zeilen.value.reduce((s, z) => s + (laccicoListenPreis(z) ?? 0) * z.menge, 0));
  const paare = computed(() => zeilen.value.reduce((s, z) => s + z.menge, 0));

  return { zeilen, zuletzt, laden, hinzufuegen, mengeSetzen, entfernen, leeren, summe, paare };
};

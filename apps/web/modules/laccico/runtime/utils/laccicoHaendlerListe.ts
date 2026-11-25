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
/** Kundenklasse 3 „Standard-Firmenkunden“: Firmenregistrierungen landen hier (Shop 6 B2B-Einstellung), also Händler-Anwärter. */
export const LACCICO_FIRMEN_KLASSE = 3;
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

/** Menge für Artikel, die nur im Konto stehen (anderes Gerät): kleinste Händlerstaffel (N 25.11.2026) */
const KONTO_STANDARDMENGE = 25;

/**
 * Konto-Abgleich (N 25.11.2026): Die Artikel der Liste stehen zusätzlich auf der Plenty-Wunschliste des
 * Händlerkontos (für Händler sonst ausgeblendet), damit die Liste auf jedem Gerät da ist. Die Shop-API gibt
 * die Menge der Wunschliste nicht zurück (getestet 25.11.2026); Mengen bleiben deshalb im Browser, Artikel,
 * die nur im Konto stehen, erscheinen mit KONTO_STANDARDMENGE. Fehler beim Abgleich stören die Liste nicht.
 */
const kontoHinzu = async (variationId: number, menge: number) => {
  try {
    await useSdk().plentysystems.doAddWishlistItem({ variationId, quantity: menge });
  } catch {
    // Konto nicht erreichbar: Liste bleibt im Browser
  }
};

const kontoWeg = async (variationId: number) => {
  try {
    await useSdk().plentysystems.deleteWishlistItem({ variationId });
  } catch {
    // Konto nicht erreichbar: Liste bleibt im Browser
  }
};

/** Zustand der Händler-Bestellliste (im Browser gespeichert, Artikel zusätzlich im Händlerkonto). */
export const useLaccicoHaendlerListe = () => {
  const zeilen = useState<LaccicoListenZeile[]>('laccico-haendlerliste', () => []);
  const geladen = useState('laccico-haendlerliste-geladen', () => false);
  const abgeglichen = useState('laccico-haendlerliste-konto', () => false);
  const zuletzt = useState<number | null>('laccico-haendlerliste-zuletzt', () => null);
  const { istHaendler } = useLaccicoHaendler();

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
      if (istHaendler.value) {
        void kontoHinzu(neu.variationId, neu.menge);
      }
    }
    zuletzt.value = neu.variationId;
    speichern();
  };

  /** Einmal je Sitzung: Konto und Browser zusammenführen (fehlende Artikel in beide Richtungen ergänzen). */
  const kontoAbgleich = async () => {
    if (!import.meta.client || abgeglichen.value || !istHaendler.value) {
      return;
    }
    abgeglichen.value = true;
    laden();
    let imKonto: Product[];
    try {
      imKonto = (await useSdk().plentysystems.getWishlist())?.data ?? [];
    } catch {
      return;
    }
    const kontoIds = new Set(imKonto.map((p) => Number(productGetters.getVariationId(p))));
    const browserIds = new Set(zeilen.value.map((z) => z.variationId));
    for (const produkt of imKonto) {
      if (!browserIds.has(Number(productGetters.getVariationId(produkt)))) {
        zeilen.value.push(laccicoZeileAusProdukt(produkt, KONTO_STANDARDMENGE));
      }
    }
    for (const zeile of zeilen.value) {
      if (!kontoIds.has(zeile.variationId)) {
        void kontoHinzu(zeile.variationId, zeile.menge);
      }
    }
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
    if (istHaendler.value) {
      void kontoWeg(variationId);
    }
    speichern();
  };

  const leeren = () => {
    if (istHaendler.value) {
      for (const zeile of zeilen.value) {
        void kontoWeg(zeile.variationId);
      }
    }
    zeilen.value = [];
    speichern();
  };

  const summe = computed(() => zeilen.value.reduce((s, z) => s + (laccicoListenPreis(z) ?? 0) * z.menge, 0));
  const paare = computed(() => zeilen.value.reduce((s, z) => s + z.menge, 0));

  return { zeilen, zuletzt, laden, kontoAbgleich, hinzufuegen, mengeSetzen, entfernen, leeren, summe, paare };
};

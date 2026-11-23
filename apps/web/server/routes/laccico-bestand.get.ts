import { defineEventHandler, getQuery } from 'h3';

/**
 * LACCICO (Zettel N 23.11.2026): Lagerbestand je Variante für die Händler-Bestellliste.
 * Die Shop-API liefert keinen Bestand. Plenty nennt ihn aber, wenn man mehr in den Warenkorb legen will,
 * als da ist (key cart.addToBasket.notEnoughStockForVariation, errors.stock).
 * Die Abfrage läuft hier auf dem Server mit einer eigenen, leeren Sitzung (ohne Cookies des Besuchers),
 * dadurch bleibt der Warenkorb des Kunden unberührt. Aufruf: /laccico-bestand?ids=1626,1627
 * Antwort: { "1626": 70, "1627": null }  (null = Bestand unbekannt bzw. Verkauf nicht auf Bestand begrenzt)
 */
const PROBE_MENGE = 999_999;
const MAX_IDS = 60;
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<number, { bestand: number | null; zeit: number }>();

const frage = async (basis: string, id: number): Promise<number | null> => {
  const treffer = cache.get(id);
  if (treffer && Date.now() - treffer.zeit < CACHE_MS) {
    return treffer.bestand;
  }
  let bestand: number | null = null;
  try {
    const antwort = await fetch(`${basis}/plentysystems/doAddCartItem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ productId: id, quantity: PROBE_MENGE }]),
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await antwort.json()) as { data?: { key?: string; errors?: { stock?: unknown; variationId?: unknown } } };
    const daten = json?.data;
    if (daten?.key === 'cart.addToBasket.notEnoughStockForVariation' && Number(daten.errors?.variationId) === id) {
      const zahl = Number(daten.errors?.stock);
      bestand = Number.isFinite(zahl) ? Math.max(0, zahl) : null;
    }
  } catch {
    bestand = null;
  }
  cache.set(id, { bestand, zeit: Date.now() });
  return bestand;
};

export default defineEventHandler(async (event) => {
  const roh = String(getQuery(event).ids ?? '');
  const ids = [...new Set(roh.split(',').map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))].slice(0, MAX_IDS);
  // wie shopCore.middlewareSSRUrl in nuxt.config.ts: die Middleware läuft neben dem Nuxt-Server
  const basis = 'http://localhost:8181';
  const ergebnis: Record<string, number | null> = {};
  // höchstens 6 Abfragen gleichzeitig
  for (let i = 0; i < ids.length; i += 6) {
    const teil = ids.slice(i, i + 6);
    const werte = await Promise.all(teil.map((id) => frage(basis, id)));
    teil.forEach((id, n) => {
      ergebnis[String(id)] = werte[n] ?? null;
    });
  }
  return ergebnis;
});

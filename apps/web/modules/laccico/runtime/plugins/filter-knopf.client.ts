/**
 * Knopf „Filter“ in der grauen Sortierleiste wie im Ceres-Shop (ab 768 px):
 * Die Plenty-Filter (Farbe, Breite, Finish) sind zugeklappt; ein Klick auf den Knopf öffnet sie als Feld
 * unter der Leiste, ein zweiter Klick schließt es. Ist schon ein Filter gesetzt (Adresse mit `facets=`), ist
 * das Feld offen. Unter 768 px bleibt der PWA-Knopf „Listeneinstellungen“ mit dem Seitenfenster.
 * Aussehen: `laccico.css` › „Knopf Filter“.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const OFFEN = 'laccico-filter-offen';
  const FELD = 'laccico-filterfeld';
  const BESCHRIFTUNG: Record<string, string> = { de: 'Filter', en: 'Filter', fr: 'Filtres' };
  let offen: boolean | null = null;

  const filterGesetzt = () => new URLSearchParams(window.location.search).has('facets');

  const einrichten = () => {
    document.querySelectorAll<HTMLElement>('[data-testid="category-sort-filter"]').forEach((leiste) => {
      const zeile = leiste.querySelector<HTMLElement>('aside > div');
      if (!zeile) {
        return;
      }
      const feld = Array.from(zeile.children).find(
        (kind) => kind.querySelector('[data-testid^="category-filter-"], input[type="checkbox"]') !== null,
      ) as HTMLElement | undefined;
      if (!feld) {
        leiste.classList.remove(OFFEN);
        zeile.querySelector('.laccico-filter-knopf')?.remove();
        return;
      }
      feld.classList.add(FELD);
      if (offen === null) {
        offen = filterGesetzt();
      }
      leiste.classList.toggle(OFFEN, offen);
      let knopf = zeile.querySelector<HTMLButtonElement>('.laccico-filter-knopf');
      if (!knopf) {
        knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.className = 'laccico-filter-knopf';
        knopf.addEventListener('click', () => {
          offen = !leiste.classList.contains(OFFEN);
          leiste.classList.toggle(OFFEN, offen);
          knopf?.setAttribute('aria-expanded', String(offen));
        });
        zeile.appendChild(knopf);
      }
      const sprache = (document.documentElement.lang || 'de').slice(0, 2);
      const text = BESCHRIFTUNG[sprache] ?? 'Filter';
      if (knopf.textContent !== text) {
        knopf.textContent = text;
      }
      knopf.setAttribute('aria-expanded', String(offen));
    });
  };

  let geplant = false;
  const planen = () => {
    if (geplant) {
      return;
    }
    geplant = true;
    requestAnimationFrame(() => {
      geplant = false;
      einrichten();
    });
  };

  nuxtApp.hook('app:mounted', () => {
    einrichten();
    new MutationObserver(planen).observe(document.body, { childList: true, subtree: true });
  });
  // Neue Seite: Feld wieder nach Adresse öffnen/schließen; beim Anklicken eines Filters (nur die Abfrage ändert sich) bleibt es offen.
  let letzterPfad = '';
  nuxtApp.hook('page:finish', () => {
    if (window.location.pathname !== letzterPfad) {
      letzterPfad = window.location.pathname;
      offen = null;
    }
    planen();
  });
});

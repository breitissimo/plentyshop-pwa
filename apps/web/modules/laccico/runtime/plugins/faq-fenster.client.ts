/**
 * FAQ-Fenster wie im Ceres-Shop (Footer-Skript „faq-global-modal“, Set 30):
 * Ab 992 px Breite öffnet ein Klick auf eine Klappbox-Frage die Antwort in einem Fenster mitten auf der Seite
 * (schließen per Klick daneben, Esc oder ×), die aktive Frage ist Altrosa hinterlegt.
 * Darunter (Handy, Tablet) klappt die Antwort wie gewohnt an Ort und Stelle auf.
 */
export default defineNuxtPlugin(() => {
  const BREITE = 992;
  let huelle: HTMLDivElement | null = null;
  let inhalt: HTMLDivElement | null = null;
  let aktiv: HTMLElement | null = null;

  const schliessen = () => {
    if (!huelle || !inhalt) {
      return;
    }
    huelle.style.display = 'none';
    inhalt.innerHTML = '';
    aktiv?.classList.remove('laccico-faq-aktiv');
    aktiv = null;
  };

  const fensterBauen = () => {
    if (huelle) {
      return;
    }
    huelle = document.createElement('div');
    huelle.id = 'laccico-faq-fenster';
    inhalt = document.createElement('div');
    inhalt.id = 'laccico-faq-inhalt';
    inhalt.className = 'rte-prose';
    const zu = document.createElement('button');
    zu.type = 'button';
    zu.className = 'laccico-faq-zu';
    zu.setAttribute('aria-label', 'Schließen');
    zu.textContent = '×';
    zu.addEventListener('click', schliessen);
    huelle.appendChild(zu);
    huelle.appendChild(inhalt);
    document.body.appendChild(huelle);
    huelle.addEventListener('click', (e) => {
      if (e.target === huelle) {
        schliessen();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        schliessen();
      }
    });
  };

  document.addEventListener(
    'click',
    (e) => {
      // Nur FAQ-Klappboxen (Block DetailsList); Artikel-Akkordeons (Details, Style Guide, Bewertungen) bleiben normal (Fehler 19.11.)
      const frage = (e.target as HTMLElement | null)?.closest(
        'main [data-testid="details-list"] details > summary',
      ) as HTMLElement | null;
      if (!frage || window.innerWidth < BREITE || frage.closest('header, [data-testid*="filter"]')) {
        return;
      }
      const klappe = frage.parentElement as HTMLDetailsElement;
      const antwort = [...klappe.children].filter((k) => k !== frage);
      if (!antwort.length) {
        return;
      }
      // Die PWA öffnet die Klappe per eigenem Klick-Handler: Ereignis hier beenden
      e.preventDefault();
      e.stopPropagation();
      klappe.open = false;
      fensterBauen();
      if (!huelle || !inhalt) {
        return;
      }
      aktiv?.classList.remove('laccico-faq-aktiv');
      aktiv = frage;
      frage.classList.add('laccico-faq-aktiv');
      inhalt.innerHTML = antwort.map((k) => k.innerHTML).join('');
      huelle.style.display = 'flex';
    },
    true,
  );
});

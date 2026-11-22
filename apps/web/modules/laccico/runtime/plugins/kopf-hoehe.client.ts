/**
 * Misst die Höhe des klebenden Kopfs und der Brotkrumenleiste und legt sie als CSS-Variablen
 * --laccico-kopf-hoehe und --laccico-krumen-hoehe ab (N 22.11.2026). Brotkrumenleiste und linke Kategoriespalte
 * kleben genau darunter; mit festen Werten stand die linke Spalte schon ohne Scrollen tiefer als die rechte,
 * und bei zweizeiligem Menü (z. B. Französisch) passt ein fester Wert nicht.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const wurzel = document.documentElement;
  const beobachter = new ResizeObserver(() => messen());
  let beobachtet: Element[] = [];

  function messen() {
    const kopf = document.querySelector('.header-blocks');
    const krumen = document.querySelector("div:has(> nav[data-testid='breadcrumbs'])");
    if (kopf) {
      wurzel.style.setProperty('--laccico-kopf-hoehe', `${Math.round(kopf.getBoundingClientRect().height)}px`);
    }
    wurzel.style.setProperty('--laccico-krumen-hoehe', `${krumen ? Math.round(krumen.getBoundingClientRect().height) : 0}px`);
    const neu = [kopf, krumen].filter((e): e is Element => !!e);
    if (neu.some((e, i) => e !== beobachtet[i]) || neu.length !== beobachtet.length) {
      beobachter.disconnect();
      neu.forEach((e) => beobachter.observe(e));
      beobachtet = neu;
    }
  }

  nuxtApp.hook('app:mounted', () => messen());
  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => messen());
  });
});

import { orderGetters, productGetters } from '@plentymarkets/shop-api';

/**
 * Google Ads für LACCICO (wie der Tag-Manager-Container GTM-T4GVHHB im Ceres-Shop):
 * Konto AW-976924790, Kauf-Conversion mit Label, nur nach Cookie-Zustimmung (gleiche Zustimmung wie Google Analytics, Gruppe Marketing).
 * GA4 (view_item, add_to_cart, purchase …) liefert das Modul @plentymarkets/shop-module-gtag.
 */
const ADS_ID = 'AW-976924790';
const KAUF_LABEL = 'mJLaCOD6t7oBEPbg6tED';

export default defineNuxtPlugin({
  parallel: true,
  setup() {
    const { consent } = useCookieConsent('CookieBar.moduleGoogleAnalytics.googleAnalytics');
    const gtag = (...args: unknown[]) => {
      (window as unknown as { dataLayer: unknown[] }).dataLayer ||= [];
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args as never);
    };
    let konfiguriert = false;
    const konfigurieren = () => {
      if (konfiguriert) return;
      konfiguriert = true;
      // Das GA4-Modul legt dataLayer + gtag.js beim Zustimmen an (`js`, `config`); erst danach das Ads-Konto
      // konfigurieren, sonst überspringt das Modul seine eigene Einrichtung (Befund 20.11.).
      let versuche = 0;
      const warten = setInterval(() => {
        const ebene = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
        if (ebene?.length || ++versuche > 50) {
          clearInterval(warten);
          if (ebene?.length) gtag('config', ADS_ID);
        }
      }, 200);
    };
    if (consent.value) konfigurieren();
    watch(consent, (wert) => wert && konfigurieren());

    // view_item beim Öffnen einer Artikelseite (Ceres: „Produktdetailseite“, Grundlage für Remarketing)
    const { currentProduct } = useProducts();
    let zuletzt = 0;
    watch(
      () => [productGetters.getVariationId(currentProduct.value), consent.value] as const,
      ([variante]) => {
        if (!consent.value || !variante || variante === zuletzt) return;
        zuletzt = variante;
        gtag('event', 'view_item', {
          currency: 'EUR',
          value: productGetters.getPrice(currentProduct.value) || undefined,
          items: [{ item_id: variante, item_name: productGetters.getName(currentProduct.value) }],
        });
      },
      { immediate: true },
    );

    const { on } = usePlentyEvent();
    on('frontend:orderCreated', (order) => {
      if (!consent.value || !order?.order || !order?.totals) return;
      gtag('event', 'conversion', {
        send_to: `${ADS_ID}/${KAUF_LABEL}`,
        // gleiche Grundlage wie das GA4-Modul (Einstellung „Bruttopreise an Google Analytics senden“, hier aus), damit GA4 und Ads gleich viel Umsatz melden
        value: useRuntimeConfig().public.pwa_module_gtag?.showGrossPrices ? order.totals.totalGross : order.totals.totalNet,
        currency: order.totals.currency,
        transaction_id: orderGetters.getId(order),
      });
    });
  },
});

import { addImportsDir, addPlugin, addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit';

/**
 * LACCICO: Aussehen und Seiteninhalte des LACCICO-Shops.
 *
 * - Farben, Logo, Favicon wie im bisherigen Ceres-Shop (Plugin-Set 30), als Standardwerte;
 *   im Editor gespeicherte Einstellungen gehen vor.
 * - Schrift Averta und Grundstil (runtime/assets/laccico.css).
 * - Seiteninhalte liegen im Fork unter runtime/inhalte/<sprache>/<typ>_<id>.json und werden über
 *   /_laccico/inhalt/<sprache>/<typ>_<id> ausgeliefert. Für Seiten mit eigener Datei hat die Datei Vorrang
 *   vor dem Plenty-Editor; alle anderen Seiten kommen wie gewohnt aus dem Editor.
 */
export default defineNuxtModule({
  meta: {
    name: 'laccico',
    configKey: 'laccico',
  },
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url);

    nuxt.options.css.push(resolver.resolve('./runtime/assets/laccico.css'));

    const oeffentlich = nuxt.options.runtimeConfig.public as Record<string, unknown>;
    const standard: Record<string, string> = {
      primaryColor: '#4e6066',
      secondaryColor: '#5e3b42',
      headerBackgroundColor: '#4e6066',
      iconColor: '#ffffff',
      // Logo wie Ceres Set 28 (N 19.11.2026: richtige Fassung mit Signet im O; Set 29/30 haben versehentlich die alte 2026-SHOP.png): 827 x 204 px, dort ca. 170 px breit angezeigt (Breite in laccico.css)
      headerLogo: 'https://cdn02.plentyone.com/qadol2fdwt1n/frontend/Logo/2026-2-SHOP.png',
      favicon: 'https://cdn02.plentyone.com/qadol2fdwt1n/frontend/Logo/Favicon/LACCICO_Favicon_Korund_16.png',
      metaTitle: 'LACCICO',
      ogTitle: 'LACCICO',
    };
    // Liste „Zuletzt angesehen“ auf Kategorie- und Artikelseiten wie Ceres (N 20.11.2026); ab Werk aus, dann bleibt die Liste leer.
    // Als Ja/Nein-Wert (Typ wie settings.config). Ein im Editor gespeicherter Wert (Einstellungen › Privacy › Track last seen products) geht vor.
    if (!process.env.NUXT_PUBLIC_ENABLE_LAST_SEEN_TRACKING) {
      oeffentlich.enableLastSeenTracking = true;
    }
    Object.entries(standard).forEach(([schluessel, wert]) => {
      const umgebung = `NUXT_PUBLIC_${schluessel.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      if (!process.env[umgebung]) {
        oeffentlich[schluessel] = wert;
      }
    });

    nuxt.options.nitro.serverAssets = nuxt.options.nitro.serverAssets || [];
    nuxt.options.nitro.serverAssets.push({ baseName: 'laccico', dir: resolver.resolve('./runtime/inhalte') });

    addServerHandler({
      route: '/_laccico/inhalt/:sprache/:seite',
      handler: resolver.resolve('./runtime/server/inhalt'),
    });

    // Alte Ceres-Adressen der Systemseiten (Rechtstexte, Kontakt, Warenkorb) führen auf die PWA-eigenen Seiten (301).
    // Die Rechtstexte verlinken das Widerrufsformular unter der alten Adresse; ohne Weiterleitung zeigt sie eine leere Kategorie.
    const systemseiten: Record<string, string> = {
      '/laccico-finest-waxed-laces/widerrufsrecht': '/cancellation-rights',
      '/en/laccico-finest-waxed-laces/withdrawal': '/en/cancellation-rights',
      '/fr/laccicolacetsfinscires/droitderevocation': '/fr/cancellation-rights',
      '/laccico-finest-waxed-laces/impressum': '/legal-disclosure',
      '/en/laccico-finest-waxed-laces/imprint': '/en/legal-disclosure',
      '/fr/laccicolacetsfinscires/mentionslegales': '/fr/legal-disclosure',
      '/laccico-finest-waxed-laces/datenschutzerklaerung': '/privacy-policy',
      '/en/laccico-finest-waxed-laces/privacy-policy': '/en/privacy-policy',
      '/fr/laccicolacetsfinscires/declarationdeconfidentialite': '/fr/privacy-policy',
      '/laccico-finest-waxed-laces/agb': '/terms-and-conditions',
      '/en/laccico-finest-waxed-laces/terms-and-conditions': '/en/terms-and-conditions',
      '/fr/laccicolacetsfinscires/termes': '/fr/terms-and-conditions',
      '/laccico-finest-waxed-laces/info/kontakt': '/contact',
      '/en/laccico-finest-waxed-laces/info/contact': '/en/contact',
      '/fr/laccicolacetsfinscires/info/contact': '/fr/contact',
      '/laccico-finest-waxed-laces/widerrufsrecht/widerrufsformular': '/cancellation-form',
      '/en/laccico-finest-waxed-laces/withdrawal/withdrawal-form': '/en/cancellation-form',
      '/fr/laccicolacetsfinscires/droitderevocation/formerevocable': '/fr/cancellation-form',
      '/warenkorb': '/cart',
      '/en/basket': '/en/cart',
      '/fr/panier': '/fr/cart',
    };
    const routeRules = (nuxt.options.routeRules = nuxt.options.routeRules || {});
    Object.entries(systemseiten).forEach(([von, nach]) => {
      routeRules[von] = { redirect: { to: nach, statusCode: 301 } };
    });

    // Weiterleitungen und Gast-/Newsletter-Seiten gehören nicht in die Sitemap (Search Console meldet sonst
    // „Seite mit Weiterleitung“). Das Sitemap-Modul liest die Liste erst nach diesem Modul.
    const sitemap = ((nuxt.options as unknown as Record<string, { exclude?: string[] }>).plentySitemap ||= {});
    sitemap.exclude = [
      ...(sitemap.exclude || []),
      ...Object.keys(systemseiten),
      '/guest**',
      '/newsletter**',
    ];

    addImportsDir(resolver.resolve('./runtime/utils'));

    addPlugin({ src: resolver.resolve('./runtime/plugins/faq-fenster.client'), mode: 'client' });
    addPlugin({ src: resolver.resolve('./runtime/plugins/google-ads.client'), mode: 'client' });
    addPlugin({ src: resolver.resolve('./runtime/plugins/filter-knopf.client'), mode: 'client' });
  },
});

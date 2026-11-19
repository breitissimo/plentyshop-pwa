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

    addImportsDir(resolver.resolve('./runtime/utils'));

    addPlugin({ src: resolver.resolve('./runtime/plugins/faq-fenster.client'), mode: 'client' });
  },
});

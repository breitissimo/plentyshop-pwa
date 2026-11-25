import type { Block } from '@plentymarkets/shop-api';
import { v4 as uuid } from 'uuid';

/**
 * LACCICO-Artikelseite nach der Ceres-Artikelansicht (Set 30):
 * Bilder | Name, Bewertung, Preis, Preis-Hinweis (Händlerstaffel bzw. Mengenrabatt), Länge, Warenkorb;
 * darunter Details & Qualität, Style Guide, Bewertungen (mit Echtheitshinweis), Produktsicherheit,
 * „Zuletzt angesehen“ und „Ähnliche Artikel“.
 */
const TITEL = {
  de: {
    details: 'Details & Qualität',
    stil: 'Style Guide',
    bewertungen: 'Bewertungen',
    technik: 'Technische Daten',
    sicherheit: 'Produktsicherheit',
    sicherheitLink: 'Hersteller und verantwortliche Person',
    zuletzt: 'Zuletzt angesehen',
    aehnlich: 'Ähnliche Artikel',
    echtheit:
      '<h6>Information zur Echtheit der Bewertungen:</h6><p>Bewertungen, die den Status ‚verifizierter Kauf‘ haben, stammen von Kunden, die innerhalb unseres Shops mit Kundenkonto angemeldet den Artikel gekauft haben. Unser Bewertungssystem stellt sicher, dass nur Bewertungen, die diese Kriterien erfüllen, dieses Label erhalten. Bewertungen ohne dieses Label stammen entweder von Kunden, die anonym bewerten wollten, oder von freiwilligen Bewertungen des Artikels ohne Kaufbezug. Diese Bewertungen können von uns nicht hinsichtlich ihrer Echtheit überprüft werden.</p>',
  },
  en: {
    details: 'Details & quality',
    stil: 'Style guide',
    bewertungen: 'Reviews',
    technik: 'Technical data',
    sicherheit: 'Product safety',
    sicherheitLink: 'Manufacturer and responsible person',
    zuletzt: 'Recently viewed',
    aehnlich: 'Similar items',
    echtheit:
      '<h6>About the authenticity of reviews:</h6><p>Reviews marked “verified purchase” come from customers who bought the item in our shop while logged in to their customer account. Our review system ensures that only reviews meeting these criteria receive this label. Reviews without this label come either from customers who chose to review anonymously or from voluntary reviews without a purchase. We cannot verify the authenticity of these reviews.</p>',
  },
  fr: {
    details: 'Détails & qualité',
    stil: 'Guide de style',
    bewertungen: 'Avis',
    technik: 'Données techniques',
    sicherheit: 'Sécurité du produit',
    sicherheitLink: 'Fabricant et personne responsable',
    zuletzt: 'Vus récemment',
    aehnlich: 'Articles similaires',
    echtheit:
      '<h6>Authenticité des avis :</h6><p>Les avis portant la mention « achat vérifié » proviennent de clients ayant acheté l’article dans notre boutique en étant connectés à leur compte client. Notre système garantit que seuls les avis remplissant ces critères reçoivent cette mention. Les avis sans cette mention proviennent soit de clients souhaitant rester anonymes, soit d’avis volontaires sans achat. Nous ne pouvons pas vérifier l’authenticité de ces avis.</p>',
  },
};

const meta = () => ({ uuid: uuid(), isGlobalTemplate: false });
const ohneAbstand = { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 };

export default function createLaccicoProduct(): Block[] {
  const sprache = (useNuxtApp().$i18n?.locale?.value ?? 'de') as keyof typeof TITEL;
  const t = TITEL[sprache] ?? TITEL.de;

  return [
    {
      name: 'MultiGrid',
      type: 'structure',
      meta: meta(),
      configuration: { columnWidths: [6, 6], sticky: [0], layout: { marginTop: '0', marginBottom: '0' } },
      layout: { gap: 'XL', narrowContainer: true },
      content: [
        {
          name: 'ImageGallery',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          content: { thumbnails: { showThumbnails: true, thumbnailType: 'left-vertical', enableHoverZoom: true } },
        },
        {
          name: 'PriceCard',
          type: 'content',
          meta: meta(),
          parent_slot: 1,
          slot_index: 0,
          content: {
            fields: {
              itemName: true,
              price: true,
              tags: false,
              availability: true,
              starRating: true,
              orderProperties: false, // N 19.11.: Bestelleigenschaften (Wunschlänge, Metallspitzen) nicht zeigen, wie Ceres
              variationProperties: false,
              previewText: true,
              attributes: true,
              itemBundle: false,
              graduatedPrices: false,
              addToWishlist: true,
              quantityAndAddToCart: true,
              itemText: false,
              technicalData: false,
            },
            fieldsOrder: [
              'itemName',
              'starRating',
              'previewText',
              'price',
              'availability',
              'tags',
              'variationProperties',
              'orderProperties',
              'attributes',
              'itemBundle',
              'graduatedPrices',
              'addToWishlist',
              'quantityAndAddToCart',
              'itemText',
              'technicalData',
            ],
            fieldsDisabled: ['quantityAndAddToCart', 'price', 'itemBundle', 'attributes'],
            wishlistSize: 'small',
            dropShadow: false,
            borders: false,
            borderColor: '#EFF4F1',
            layout: ohneAbstand,
          },
        },
        // Preis-Hinweis (Mengenrabatt/Händlerstaffel) steht seit 20.11. direkt neben dem Preis (PurchaseCard.vue)
      ],
    },
    // Zettel N 25.11. (2): Bild und Kaufbereich 50:50 wie Warenkorb/Kasse; Details, Style Guide, Bewertungen,
    // Technische Daten und Produktsicherheit unter dem Warenkorb-Knopf über die ganze Seitenbreite (vorher rechte Spalte)
    {
      name: 'MultiGrid',
      type: 'structure',
      meta: meta(),
      configuration: { columnWidths: [12], layout: { marginTop: '0', marginBottom: '0' } },
      layout: { gap: 'XL', narrowContainer: true },
      content: [
        {
          name: 'ItemText',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 0,
          content: {
            text: { title: t.details },
            layout: { displayAsCollapsable: true, initiallyCollapsed: false, ...ohneAbstand },
          },
        },
        {
          name: 'TechnicalData',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 1,
          content: {
            text: { title: t.stil },
            layout: { displayAsCollapsable: true, initiallyCollapsed: true, ...ohneAbstand },
          },
        },
        {
          name: 'CustomerReview',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 2,
          content: {
            text: { title: t.bewertungen, hinweis: t.echtheit },
            layout: { collapsible: true, initiallyCollapsed: true },
          },
        },
        // Technische Daten wie Ceres (ItemDataTableWidget: Artikel-ID, Zustand, externe ID, Modell, Hersteller, Herkunft, Inhalt, Gewichte, Zolltarif), N 20.11.
        {
          name: 'ItemData',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 3,
          content: {
            text: { title: t.technik },
            fields: {
              itemId: true,
              condition: true,
              ageRating: false,
              externalVariationId: true,
              model: true,
              manufacturer: true,
              manufacturingCountry: true,
              content: true,
              grossWeight: true,
              netWeight: true,
              dimensions: false,
              customTariffNumber: true,
              properties: false,
            },
            fieldsOrder: [
              'itemId',
              'condition',
              'ageRating',
              'externalVariationId',
              'model',
              'manufacturer',
              'manufacturingCountry',
              'content',
              'grossWeight',
              'netWeight',
              'dimensions',
              'customTariffNumber',
              'properties',
            ],
            layout: { displayAsCollapsable: true, initiallyCollapsed: true, ...ohneAbstand },
          },
        },
        // Produktsicherheit als eigener Reiter mit verantwortlicher Person (statt Link mit Seitenfenster), N 20.11.
        {
          name: 'LaccicoProduktsicherheit',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 4,
          content: { text: { title: t.sicherheit } },
        },
      ],
    },
    {
      name: 'ProductRecommendedProducts',
      type: 'content',
      meta: meta(),
      content: {
        text: { htmlDescription: `<h2>${t.zuletzt}</h2>` },
        layout: { fullWidth: false },
        source: { type: 'last_seen', itemId: '', categoryId: '', crossSellingRelation: 'Similar' },
      },
    },
    {
      name: 'ProductRecommendedProducts',
      type: 'content',
      meta: meta(),
      content: {
        text: { htmlDescription: `<h2>${t.aehnlich}</h2>` },
        layout: { fullWidth: false },
        source: { type: 'cross_selling', itemId: '', categoryId: '', crossSellingRelation: 'Similar' },
      },
    },
  ] as Block[];
}

import type { Block } from '@plentymarkets/shop-api';
import { v4 as uuid } from 'uuid';

/**
 * LACCICO-Kategorieseite nach der Ceres-Vorlage „Kategorie global“ (Set 30):
 * links Kategorienavigation/Filter, Kategoriename mit Beschreibung 1, darunter Beschreibung 2;
 * rechts Artikelraster mit 3 Artikeln je Reihe; darunter „Zuletzt angesehen“.
 * Gleicher Aufbau wie kategorie_raster() in 07_Shop\PWA\Skripte\ceres_zu_pwa.py.
 */
const ZULETZT = { de: 'Zuletzt angesehen', en: 'Recently viewed', fr: 'Vus récemment' };

const meta = () => ({ uuid: uuid(), isGlobalTemplate: false });

const kategorieDaten = (felder: { name: boolean; description1: boolean; description2: boolean }, slot: number, index: number) => ({
  name: 'CategoryData',
  type: 'content',
  meta: meta(),
  parent_slot: slot,
  slot_index: index,
  content: {
    name: '',
    fields: { ...felder, shortDescription: false },
    fieldsOrder: ['name', 'description1', 'description2', 'shortDescription'],
    fieldsDisabled: [],
    displayCategoryImage: 'off',
    image: { fillMode: 'fill', alt: '', brightness: 0.75 },
    text: { color: '#121212', bgColor: '#fbfbf9', bgOpacity: 1, textAlignment: 'left', justify: 'top', align: 'left', background: false },
    layout: { paddingTop: 16, paddingBottom: 16, paddingLeft: 0, paddingRight: 0 },
  },
});

export default function createLaccicoCategory(): Block[] {
  const sprache = (useNuxtApp().$i18n?.locale?.value ?? 'de') as keyof typeof ZULETZT;

  return [
    {
      name: 'MultiGrid',
      type: 'structure',
      meta: meta(),
      configuration: { columnWidths: [3, 9], columnWidthsTablet: [12, 12], sticky: [0], layout: { marginTop: '0', marginBottom: '0' } },
      layout: { gap: 'XL', narrowContainer: false },
      content: [
        kategorieDaten({ name: true, description1: true, description2: false }, 0, 0),
        {
          name: 'SortFilter',
          type: 'content',
          meta: meta(),
          parent_slot: 0,
          slot_index: 1,
          content: {
            fields: {
              category: true,
              sortBy: true,
              perPage: true,
              itemRating: false,
              manufacturer: false,
              price: false,
              availability: true,
              customizedFilters: true,
            },
            filtersOrder: ['category', 'customizedFilters', 'availability', 'sortBy', 'perPage', 'itemRating', 'manufacturer', 'price'],
            filtersDisabled: [],
            showAllFiltersImmediately: false,
            numberOfFiltersToShowInitially: 3,
          },
        },
        kategorieDaten({ name: false, description1: false, description2: true }, 0, 2),
        {
          name: 'ItemGrid',
          type: 'content',
          meta: meta(),
          parent_slot: 1,
          slot_index: 0,
          content: {
            itemsPerRowDesktop: 3,
            itemsPerRowTablet: 4, // LACCICO: Tablet-Hochformat ohne Baum, volle Breite (N 21.11.2026); 4 (Zettel N 23.11.), 5 war bei 768 px zu eng für Länge/Menge/Knopf
            itemsPerRowMobile: 1,
            showItemCount: true,
            itemCountPosition: 'left',
            fields: { manufacturer: false, title: true, rating: true, previewText: false, price: true, addToCart: true },
            fieldsOrder: ['manufacturer', 'title', 'rating', 'previewText', 'price', 'addToCart'],
            fieldsDisabled: ['title'],
            contentAlignment: 'left',
            cardBorders: true,
            showSecondImageOnHover: true,
            showWishlistButton: true,
            addToCartStyle: 'primary',
            paginationPosition: 'both',
          },
        },
      ],
    },
    {
      name: 'ProductRecommendedProducts',
      type: 'content',
      meta: meta(),
      content: {
        text: { htmlDescription: `<h2><strong>${ZULETZT[sprache] ?? ZULETZT.de}</strong></h2>` },
        layout: { fullWidth: false },
        source: { type: 'last_seen', itemId: '', categoryId: '', crossSellingRelation: 'Similar' },
      },
    },
  ] as Block[];
}

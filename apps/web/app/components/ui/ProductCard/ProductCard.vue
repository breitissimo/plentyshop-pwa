<template>
  <div
    class="rounded-md hover:shadow-lg flex flex-col"
    data-testid="product-card"
    :class="{ 'border border-neutral-200': configuration?.cardBorders }"
  >
    <div class="relative overflow-hidden laccico-kachelbild">
      <UiBadges
        :use-tags="useTagsOnCategoryPage"
        :class="['absolute', isFromWishlist ? 'mx-2' : 'm-2']"
        :product="product"
        :use-availability="isFromWishlist"
      />

      <!-- LACCICO: Plaketten Neuheit/Artikelpaket wie Ceres -->
      <LaccicoPlaketten v-if="!isFromWishlist" :product="product" />
      <!-- LACCICO: Ersparnis in Prozent oben rechts auf dem Bild, damit die Preiszeile einzeilig bleibt (Zettel N 24.11.2026) -->
      <span v-if="laccicoPreis.prozent" class="laccico-prozent" data-testid="laccico-karten-prozent">
        −{{ laccicoPreis.prozent }} %
      </span>

      <div ref="imageContainerRef" :class="[{ 'size-48': isFromSlider }, 'relative']">
        <UiLink
          :tag="NuxtLink"
          :to="productPath"
          :aria-label="ariaLabelContent"
          class="relative group/image flex items-center justify-center"
          data-testid="product-card-link"
          @touchstart.passive="wischStart"
          @touchmove.passive="wischBewegt"
          @touchend="wischEnde"
          @click.capture="wischKlick"
        >
          <div class="relative w-full aspect-square">
            <div
              v-if="!mainImageLoaded"
              class="absolute inset-0 rounded-md bg-neutral-100 animate-pulse"
              aria-hidden="true"
            />

            <NuxtImg
              v-if="canLoadMainImage"
              ref="mainImageRef"
              :src="imageUrl"
              :alt="imageAlt"
              :title="imageTitle || null"
              :loading="priority || lazy === false ? 'eager' : 'lazy'"
              :fetchpriority="priority ? 'high' : 'auto'"
              :preload="priority"
              :width="getWidth()"
              :height="getHeight()"
              :class="[
                'object-contain rounded-md aspect-square w-full h-full transition-opacity duration-300',
                mainImageLoaded ? 'opacity-100' : 'opacity-0',
                effectiveHoverImageUrl && hoverImageLoaded ? 'group-hover/image:opacity-0' : '',
              ]"
              data-testid="image-slot"
              @load="onMainImageLoad"
              @error="onMainImageError"
            />

            <!-- LACCICO: weitere Bilder durchblättern (Pfeile, Wischen); Hover zeigt das zweite Bild -->
            <img
              v-if="bildIndex > 0 && bilder[bildIndex]"
              :src="bilder[bildIndex]"
              :alt="imageAlt"
              class="absolute inset-0 z-raised w-full h-full object-contain rounded-md bg-white"
              data-testid="laccico-kartenbild"
            />
            <template v-if="bilder.length > 1 && !isFromWishlist">
              <button type="button" class="laccico-bildpfeil laccico-bildpfeil-links" aria-label="‹" @click.prevent.stop="bildWeiter(-1)">‹</button>
              <button type="button" class="laccico-bildpfeil laccico-bildpfeil-rechts" aria-label="›" @click.prevent.stop="bildWeiter(1)">›</button>
            </template>

            <NuxtImg
              v-if="canLoadHoverImage && effectiveHoverImageUrl && bildIndex === 0"
              ref="hoverImageRef"
              :src="effectiveHoverImageUrl"
              :alt="imageAlt"
              :title="imageTitle || null"
              :loading="lazy === false ? 'eager' : 'lazy'"
              fetchpriority="auto"
              :preload="false"
              :width="getWidth()"
              :height="getHeight()"
              :class="[
                'absolute inset-0 object-contain rounded-md w-full h-full opacity-0 transition-opacity duration-300',
                hoverImageLoaded ? 'group-hover/image:opacity-100' : '',
              ]"
              data-testid="hover-image-slot"
              @load="onHoverImageLoad"
              @error="onHoverImageError"
            />
          </div>
        </UiLink>
      </div>

      <template v-if="configuration?.showWishlistButton">
        <slot name="wishlistButton">
          <WishlistButton
            square
            class="absolute bottom-0 right-0 mr-2 mb-2 bg-white ring-1 ring-inset ring-neutral-200 !rounded-full"
            :product="product"
          />
        </slot>
      </template>
    </div>

    <div
      class="p-2 border-t border-neutral-200 typography-text-sm flex flex-col flex-auto"
      :class="{
        'items-center': configuration?.contentAlignment === 'center',
        'items-end': configuration?.contentAlignment === 'right',
        'items-start': configuration?.contentAlignment === 'left',
      }"
    >
      <template v-for="key in configuration?.fieldsOrder" :key="key">
        <template v-if="key === 'title' && configuration?.fields?.title">
          <UiLink
            :tag="NuxtLink"
            :to="productPath"
            class="no-underline"
            variant="secondary"
            data-testid="productcard-name"
          >
            {{ name }}
          </UiLink>
        </template>
        <template v-if="key === 'manufacturer' && configuration?.fields?.manufacturer">
          <div
            v-if="manufacturer"
            class="mb-1 typography-text-xs text-neutral-500"
            data-testid="productcard-manufacturer"
          >
            {{ manufacturer.externalName }}
          </div>
        </template>
        <template v-if="key === 'rating' && configuration?.fields?.rating && laccicoSterneZeigen(product)">
          <div class="flex items-center pt-1 gap-1 mb-2">
            <SfRating size="xs" :half-increment="true" :value="rating ?? 0" :max="5" />
            <SfCounter size="xs">{{ ratingCount }}</SfCounter>
          </div>
        </template>
        <template v-if="key === 'previewText' && configuration?.fields?.previewText">
          <div
            v-if="shortDescription"
            class="block py-2 font-normal typography-text-xs text-neutral-700 text-justify whitespace-pre-line break-words"
          >
            <div class="line-clamp-3 no-preflight" v-html="shortDescription" />
          </div>
        </template>
        <template v-if="key === 'price' && configuration?.fields?.price">
          <LowestPrice :product="product" />
          <div v-if="showBasePrice && unitContent !== 1" class="mb-2">
            <BasePriceInLine :base-price="basePrice" :unit-content="unitContent" :unit-name="unitName" />
          </div>
          <!-- LACCICO (N 22.11.): „1 Paar“ links und Preis rechts in einer Zeile -->
          <div class="flex flex-wrap items-baseline justify-between gap-x-3 mt-auto pb-2 w-full">
            <div v-if="unitContent === 1 && unitName" class="typography-text-sm laccico-einheit">
              {{ unitContent }} {{ unitName }}
            </div>
            <span class="block font-bold typography-text-sm" data-testid="product-card-vertical-price">
              <!-- LACCICO: Preis für 1 Paar wie Ceres (laccicoKartenPreis), kein „ab“ -->
              <span>{{ format(laccicoPreis.preis) }}</span>
              <span>{{ t('common.labels.asterisk') }}</span>
            </span>
            <span
              v-if="laccicoPreis.durchgestrichen"
              class="typography-text-sm text-neutral-500 line-through"
            >
              {{ format(laccicoPreis.durchgestrichen) }}
            </span>
          </div>
        </template>
        <template v-if="key === 'addToCart' && configuration?.fields?.addToCart">
          <UiButton
            v-if="canAddFromCategory"
            size="sm"
            class="min-w-[80px] w-fit"
            data-testid="add-to-basket-short"
            :disabled="loading"
            :variant="configuration?.addToCartStyle || 'primary'"
            @click="addWithLoader(Number(productGetters.getId(product)))"
          >
            <template v-if="!loading" #prefix>
              <SfIconShoppingCart size="sm" />
            </template>
            <SfLoaderCircular v-if="loading" class="flex justify-center items-center" size="sm" />
            <span v-else>{{ t('common.actions.add') }}</span>
          </UiButton>
          <!-- LACCICO: Länge, Menge und Warenkorb direkt auf der Kachel (N 19.11.2026), auch auf der Wunschliste (N 23.11.) -->
          <LaccicoKartenKauf
            v-else-if="productGetters.getItemId(product)"
            :item-id="productGetters.getItemId(product)"
            :weiter="productPath"
            @wahl="kartenWahl = $event"
          />
          <UiButton
            v-else
            data-testid="show-options"
            :variant="configuration?.addToCartStyle || 'primary'"
            type="button"
            :tag="NuxtLink"
            :to="productPath"
            size="sm"
            class="w-fit"
          >
            <span>{{ t('common.actions.showOptions') }}</span>
          </UiButton>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { productGetters, productImageGetters } from '@plentymarkets/shop-api';
import { SfIconShoppingCart, SfLoaderCircular, SfRating, SfCounter } from '@storefront-ui/vue';
import type { ProductCardProps } from '~/components/ui/ProductCard/types';
import type { ItemGridContent } from '~/components/blocks/ItemGrid/types';
import type { BasketItemOrderParamsProperty, Product, DoAddItemParams } from '@plentymarkets/shop-api';
import LaccicoKartenKauf from '~~/modules/laccico/runtime/components/LaccicoKartenKauf.vue';
import LaccicoPlaketten from '~~/modules/laccico/runtime/components/LaccicoPlaketten.vue';
import type { LaccicoKartenWahl, LaccicoShopStaffel } from '~~/modules/laccico/runtime/utils/types';
import { laccicoEndkundenPreis, laccicoProzent } from '~~/modules/laccico/runtime/utils/laccicoKarte';

const props = withDefaults(defineProps<ProductCardProps>(), {
  configuration: () => ({
    cardBorders: true,
    contentAlignment: 'left',
    fields: {
      title: true,
      rating: true,
      previewText: false,
      price: true,
      addToCart: true,
      manufacturer: false,
    },
    fieldsOrder: ['title', 'manufacturer', 'rating', 'previewText', 'price', 'addToCart'],
    showWishlistButton: false,
    showSecondImageOnHover: false,
    addToCartStyle: 'primary',
    itemsPerRowDesktop: 4,
    itemsPerRowTablet: 3,
    itemsPerRowMobile: 1,
    showItemCount: true,
    itemCountPosition: 'center',
    fieldsDisabled: [],
    paginationPosition: 'bottom',
    layout: {
      fullWidth: false,
    },
  }),
});

const product = computed(() => props.product);

const configuration = computed(() => props.configuration || ({} as ItemGridContent));

const { addModernImageExtension } = useModernImage();
const { format } = usePriceFormatter();
const { openQuickCheckout } = useQuickCheckout();
const { addToCart } = useCart();
const { send } = useNotification();
const loading = ref(false);
const config = useRuntimeConfig();
const useTagsOnCategoryPage = config.public.useTagsOnCategoryPage;
const name = computed(
  () => productGetters.getName(product.value) + productGetters.getGroupedAttributesString(product.value),
);
const manufacturer = computed(() => productGetters.getManufacturer(product.value));
const ratingCount = computed(() => productGetters.getTotalReviews(product.value));
const rating = computed(() => productGetters.getAverageRating(product.value, 'half'));
const shortDescription = computed(() => productGetters.getShortDescription(product.value) || '');
const autoOrderParams = computed(() => {
  return productGetters.hasOrderPropertiesRequiredAndPreselected(product.value)
    ? buildAutoBasketItemOrderParams(product.value)
    : undefined;
});
const canAddFromCategory = computed(
  () =>
    productGetters.canBeAddedToCartFromCategoryPage(product.value) ||
    productGetters.hasOrderPropertiesRequiredAndPreselected(product.value),
);
// LACCICO: Händler sehen den Preis je Paar für die auf der Kachel gewählte Menge und Länge (N 23.11.2026);
// Endkunden sehen den Preis je Paar nach Mengenrabatt (Warenwert-Staffel) mit Streichpreis und Prozent (Zettel N 24.11.).
const { istHaendler } = useLaccicoHaendler();
const kartenWahl = ref<LaccicoKartenWahl>({ menge: 1, preis: null });
const laccicoPreis = computed(() => {
  const basis = laccicoKartenPreis(product.value);
  if (!istHaendler.value) {
    const gewaehlt = kartenWahl.value.preis
      ? {
          preis: kartenWahl.value.preis,
          durchgestrichen: kartenWahl.value.durchgestrichen ?? 0,
          prozent: laccicoProzent(kartenWahl.value.preis, kartenWahl.value.durchgestrichen ?? 0),
        }
      : basis;
    return laccicoEndkundenPreis(gewaehlt, kartenWahl.value.menge);
  }
  if (kartenWahl.value.preis) {
    return { preis: kartenWahl.value.preis, durchgestrichen: 0, prozent: 0 };
  }
  const staffel = laccicoStaffelAus(productGetters.getGraduatedList(product.value) as LaccicoShopStaffel[]);
  const staffelPreis = laccicoListenPreis({ staffel, menge: kartenWahl.value.menge });
  return staffelPreis ? { preis: staffelPreis, durchgestrichen: 0, prozent: 0 } : basis;
});

const cover = computed(() => productGetters.getCoverImage(product.value));
const secondCover = computed(() => productGetters.getSecondCoverImage(product.value));
const firstImage = computed(() => productImageGetters.getFirstImage(product.value));

const imageUrl = computed(() => addModernImageExtension(cover.value));
const effectiveHoverImageUrl = computed(() => {
  if (props.isFromWishlist) return ''; // LACCICO: Hover zeigt überall das zweite Bild
  const src = addModernImageExtension(secondCover.value);
  return src || '';
});

// LACCICO: alle Bilder der Variante zum Blättern (Pfeile, Wischen)
const bilder = computed(() => {
  const bilderListe = product.value?.images;
  const quelle = bilderListe?.variation?.length ? bilderListe.variation : (bilderListe?.all ?? []);
  return (quelle as { urlMiddle?: string }[]).map((b) => addModernImageExtension(b.urlMiddle ?? '')).filter(Boolean);
});
const bildIndex = ref(0);
const bildWeiter = (schritt: number) => {
  const n = bilder.value.length;
  if (n > 1) bildIndex.value = (bildIndex.value + schritt + n) % n;
};
let wischX = 0;
let wischLetzt = 0;
let gewischt = false;
const wischStart = (e: TouchEvent) => {
  wischX = wischLetzt = e.touches[0]?.clientX ?? 0;
  gewischt = false;
};
const wischBewegt = (e: TouchEvent) => {
  wischLetzt = e.touches[0]?.clientX ?? wischLetzt;
};
const wischEnde = (e: TouchEvent) => {
  const dx = (e.changedTouches[0]?.clientX ?? wischLetzt) - wischX || wischLetzt - wischX;
  if (Math.abs(dx) > 40 && bilder.value.length > 1) {
    gewischt = true;
    bildWeiter(dx < 0 ? 1 : -1);
  }
};
const wischKlick = (e: Event) => {
  if (gewischt) {
    e.preventDefault();
    e.stopPropagation();
    gewischt = false;
  }
};

const imageAlt = computed(() => productImageGetters.getImageAlternate(firstImage.value) || name.value || '');
const imageTitle = computed(() => productImageGetters.getImageName(firstImage.value) || '');

const imageWidth = computed(() => productGetters.getImageWidth(product.value) || 600);
const imageHeight = computed(() => productGetters.getImageHeight(product.value) || 600);

const basePrice = computed(() => productGetters.getDefaultBasePrice(product.value));
const unitContent = computed(() => productGetters.getUnitContent(product.value));
const unitName = computed(() => productGetters.getUnitName(product.value));
const showBasePrice = computed(() => productGetters.showPricePerUnit(product.value));

const variationId = computed(() => productGetters.getVariationId(product.value));

const isGlobalProductCategoryTemplate = computed(() => {
  const route = useRoute();
  const slugParam = route.params.slug;

  if (slugParam === undefined) {
    return false;
  }

  const slug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam;
  return `/${slug}` === paths.globalItemCategory;
});

const localePath = useLocalizedPath();

const productPath = computed(() => {
  if (isGlobalProductCategoryTemplate?.value) {
    return localePath(paths.globalItemDetails);
  }
  if (useCallisto().isEnabled) {
    const urlPath = productGetters.getUrlPath(product.value);
    return localePath(`${urlPath ? `/${urlPath}` : ''}/a-${productGetters.getItemId(product.value)}`);
  }
  const basePath = `/${productGetters.getUrlPath(product.value)}_${productGetters.getItemId(product.value)}`;
  const shouldAppendVariation = productGetters.shouldAppendVariationToLink(product.value);
  return localePath(shouldAppendVariation ? `${basePath}_${variationId.value}` : basePath);
});

const priority = computed(() => !props.isFromSlider && (props.index ?? 0) < 5);
const {
  imageContainerRef,
  mainImageRef,
  hoverImageRef,
  shouldLoadMainImage,
  shouldLoadHoverImage,
  mainImageLoaded,
  hoverImageLoaded,
  onMainImageLoad,
  onMainImageError,
  onHoverImageLoad,
  onHoverImageError,
} = useLazyProductImage({
  priority,
  hoverImageUrl: effectiveHoverImageUrl,
});

const externalImagePermission = computed(() => {
  if (!props.isFromSlider) return true;
  return props.shouldLoadImage ?? true;
});
const canLoadMainImage = computed(() => {
  if (!externalImagePermission.value) return false;

  if (props.isFromSlider) return true;

  return shouldLoadMainImage.value;
});

const canLoadHoverImage = computed(() => {
  if (!externalImagePermission.value || !effectiveHoverImageUrl.value) return false;

  if (props.isFromSlider) return true;

  return shouldLoadHoverImage.value;
});

const ariaLabelContent = computed(() => {
  return t('common.accessibility.viewDetails', { name: name.value ?? '' });
});

const getWidth = () => {
  if (imageWidth.value && imageWidth.value > 0 && imageUrl.value.includes(defaults.IMAGE_LINK_SUFIX)) {
    return imageWidth.value;
  }
  return '';
};

const getHeight = () => {
  if (imageHeight.value && imageHeight.value > 0 && imageUrl.value.includes(defaults.IMAGE_LINK_SUFIX)) {
    return imageHeight.value;
  }
  return '';
};

/**
 * Builds basket order parameters for products that have
 * required and preselected order properties.
 *
 * This helper extracts only order properties that are marked as required
 * and converts them into the structure expected by the basket API.
 *
 * It is intended to be used only when the product is already validated
 * by `hasOrderPropertiesRequiredAndPreselected`, meaning no user input
 * is needed before adding the product to the basket.
 *
 * @param product - The product from which order properties are extracted.
 * @returns An array of basket order parameter objects if required order
 *          properties exist, otherwise `undefined`.
 */
const buildAutoBasketItemOrderParams = (product: Product): BasketItemOrderParamsProperty[] | undefined =>
  product.properties
    ?.filter((p) => p?.property?.isOderProperty && p.property.isRequired)
    .map((p) => {
      const pr = p.property;

      return {
        property: {
          id: p.propertyId ?? pr.id,
          names: { name: pr.names?.name ?? '' },
          valueType: pr.valueType,
          value: '1',
        },
      };
    }) || undefined;

const addWithLoader = async (productId: number, quickCheckout = true) => {
  loading.value = true;
  try {
    const isRequiredAndPreselected = productGetters.hasOrderPropertiesRequiredAndPreselected(product.value);
    const params = isRequiredAndPreselected ? autoOrderParams.value : undefined;

    if (isRequiredAndPreselected && !params) {
      await navigateTo(productPath.value);
      return;
    }

    const addToCartObject: DoAddItemParams = {
      productId,
      quantity: 1,
      ...(params ? { basketItemOrderParams: params } : {}),
    };

    await addToCart(addToCartObject);

    if (quickCheckout) openQuickCheckout(product.value, 1);
    else send({ message: t('cart.itemAdded'), type: 'positive' });
  } finally {
    loading.value = false;
  }
};
const NuxtLink = resolveComponent('NuxtLink');
</script>

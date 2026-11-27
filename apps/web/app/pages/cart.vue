<template>
  <NuxtLayout
    name="checkout"
    :back-label-desktop="t('common.actions.back')"
    :back-label-mobile="t('common.actions.back')"
    :heading="t('cart.myCart')"
  >
    <template v-if="!cartIsEmpty">
    <div class="@md:grid @md:grid-cols-12 @md:gap-x-6" data-testid="cart-page-content">
      <!-- LACCICO (N 24.11.2026): Warenkorb 50:50 wie die Kasse -->
      <div class="col-span-6 mb-2 @md:mb-0">
        <div v-for="(cartItem, index) in cart?.items" :key="cartItem.id">
          <UiCartProductCard :cart-item="cartItem" :class="{ 'border-t': index === 0 }" />
        </div>
        <!-- LACCICO (N 24.11.2026): kein Gutscheinfeld (Gutscheine im Tarif Expand nicht genutzt) -->
      </div>
      <div
        class="relative col-span-6 @md:sticky @md:top-10 h-fit"
        :class="{ 'pointer-events-none opacity-50': loading }"
      >
        <SfLoaderCircular v-if="loading" class="absolute top-[130px] right-0 left-0 m-auto z-loader" size="2xl" />
        <OrderSummary :cart="cart">
          <UiButton
            data-testid="checkout-button"
            :tag="NuxtLink"
            :to="goToCheckout()"
            size="lg"
            class="w-full mb-4 @md:mb-0"
          >
            {{ t('common.actions.goToCheckout') }}
          </UiButton>
          <client-only>
            <PayPalExpressButton :disabled="loading" location="cartPage" class="mt-4" type="CartPreview" />
            <PayPalPayLaterBanner
              placement="cart"
              location="cartPage"
              :amount="cartGetters.getTotal(cartGetters.getTotals(cart))"
            />
          </client-only>
        </OrderSummary>
      </div>
    </div>
    <!-- LACCICO (N 25.11.2026): „Passend dazu“ und „Zuletzt angesehen“ unter dem Warenkorb; außerhalb des Rasters,
         sonst läuft die mitlaufende Bestellübersicht beim Scrollen über die Empfehlungen (Zettel N 27.11.2026) -->
    <LaccicoEmpfehlungen :artikel="laccicoWarenkorbArtikel" />
    </template>
    <div v-else class="flex items-center justify-center flex-col pt-24 pb-32" data-testid="cart-page-content">
      <h2 class="mt-8 typography-headline-3 font-bold">{{ t('cart.empty') }}</h2>
      <ModuleComponentRendering area="cart.empty" class="mt-6" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import { cartGetters } from '@plentymarkets/shop-api';
import type { Product } from '@plentymarkets/shop-api';
import type { Locale } from '#i18n';
import LaccicoEmpfehlungen from '~~/modules/laccico/runtime/components/LaccicoEmpfehlungen.vue';

defineI18nRoute({
  locales: process.env.LANGUAGELIST?.split(',') as Locale[],
  // LACCICO: Adressen wie die Plenty-Kategorie bzw. der Ceres-Shop (N 24.11.2026), statt englischer Systemnamen
  paths: { de: '/warenkorb', en: '/basket', fr: '/panier' },
});

const { setPageMeta } = usePageMeta();

definePageMeta({ pageType: 'static' });

const NuxtLink = resolveComponent('NuxtLink');
const localePath = useLocalizedPath();
const { isAuthorized } = useCustomer();
const { data: cart, cartIsEmpty, loading } = useCart();
const laccicoWarenkorbArtikel = computed(
  () => (cart.value?.items ?? []).map((posten) => posten.variation).filter(Boolean) as Product[],
);
const goToCheckout = () => (isAuthorized.value ? localePath(paths.checkout) : localePath(paths.guestLogin));

const icon = 'page';
setPageMeta(t('common.labels.cart'), icon);
</script>

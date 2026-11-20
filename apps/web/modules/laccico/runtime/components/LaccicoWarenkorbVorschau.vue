<template>
  <!-- LACCICO: Warenkorbvorschau beim Überfahren des Warenkorb-Symbols (N 20.11.2026) -->
  <div
    class="laccico-wk-vorschau relative"
    @mouseenter="oeffnen"
    @mouseleave="schliessenVerzoegert"
    @focusin="oeffnen"
    @focusout="schliessenVerzoegert"
  >
    <slot />
    <div
      v-if="offen"
      class="absolute right-0 top-full z-dropdown pt-2"
      data-testid="laccico-warenkorb-vorschau"
      @mouseenter="oeffnen"
    >
      <div class="w-96 rounded-md bg-white text-neutral-900 shadow-lg border border-neutral-200 text-left">
        <div v-if="positionen.length === 0" class="p-4 text-sm">{{ t('cart.empty') }}</div>
        <template v-else>
          <div class="px-4 pt-3 pb-2 font-medium text-sm border-b border-neutral-200">
            {{ t('cart.numberInCart', { count: anzahl }) }}
          </div>
          <ul class="max-h-[320px] overflow-y-auto">
            <li
              v-for="position in sichtbar"
              :key="position.id"
              class="flex gap-3 px-4 py-2 border-b border-neutral-100 last:border-b-0"
            >
              <NuxtLink :to="pfad(position)" class="shrink-0" @click="offen = false">
                <NuxtImg
                  v-if="bild(position)"
                  :src="bild(position)"
                  :alt="cartGetters.getItemName(position)"
                  width="56"
                  height="56"
                  loading="lazy"
                  class="w-14 h-14 object-cover rounded border border-neutral-200"
                />
              </NuxtLink>
              <div class="flex-1 min-w-0 text-sm">
                <NuxtLink
                  :to="pfad(position)"
                  class="block font-medium no-underline text-neutral-900 hover:underline line-clamp-2"
                  @click="offen = false"
                >
                  {{ cartGetters.getItemName(position) }}
                </NuxtLink>
                <div v-if="merkmale(position)" class="text-xs text-neutral-600">{{ merkmale(position) }}</div>
                <div class="flex justify-between text-xs mt-0.5">
                  <span>{{ cartGetters.getItemQty(position) }} × {{ format(cartGetters.getCartItemPrice(position)) }}</span>
                  <span class="font-medium">
                    {{ format(cartGetters.getCartItemPrice(position) * cartGetters.getItemQty(position)) }}
                  </span>
                </div>
              </div>
            </li>
          </ul>
          <div v-if="weitere > 0" class="px-4 py-1 text-xs text-neutral-600">+ {{ weitere }} …</div>
          <div class="px-4 py-3 border-t border-neutral-200">
            <div class="flex justify-between text-sm mb-3">
              <span>{{ t('quickCheckout.subTotal') }}:</span>
              <span class="font-medium">{{ format(zwischensumme) }}</span>
            </div>
            <div class="flex gap-2">
              <UiButton
                :tag="NuxtLink"
                :to="localePath(paths.cart)"
                variant="secondary"
                size="sm"
                class="flex-1 whitespace-nowrap"
                @click="offen = false"
              >
                {{ t('common.actions.viewCart') }}
              </UiButton>
              <UiButton size="sm" class="flex-1 whitespace-nowrap" @click="zurKasse">
                {{ t('common.actions.goToCheckout') }}
              </UiButton>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cartGetters } from '@plentymarkets/shop-api';
import type { CartItem } from '@plentymarkets/shop-api';

const MAX_SICHTBAR = 5;

const { t } = useI18n();
const { data: cart, showNetPrices } = useCart();
const { format } = usePriceFormatter();
const { isAuthorized } = useCustomer();
const { getImageForViewport, addModernImageExtension } = useModernImage();
const localePath = useLocalizedPath();
const NuxtLink = resolveComponent('NuxtLink');

const offen = ref(false);
const kannHover = ref(false);
let zeitgeber: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  // Nur auf Geräten mit Maus; auf dem Handy führt ein Tipp wie bisher zum Warenkorb.
  kannHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
});

const positionen = computed<CartItem[]>(() => cart.value?.items ?? []);
const sichtbar = computed(() => positionen.value.slice(0, MAX_SICHTBAR));
const weitere = computed(() => Math.max(0, positionen.value.length - MAX_SICHTBAR));
const anzahl = computed(() => positionen.value.reduce((summe, { quantity }) => summe + quantity, 0));
const zwischensumme = computed(() =>
  showNetPrices.value ? cartGetters.getItemSumNet(cart.value) : cartGetters.getTotals(cart.value).subtotal,
);

const oeffnen = () => {
  if (!kannHover.value) return;
  clearTimeout(zeitgeber);
  offen.value = true;
};

const schliessenVerzoegert = () => {
  clearTimeout(zeitgeber);
  zeitgeber = setTimeout(() => (offen.value = false), 250);
};

onBeforeUnmount(() => clearTimeout(zeitgeber));

const pfad = (position: CartItem) => localePath('/' + cartGetters.getProductPath(position, useCallisto().isEnabled));

const bild = (position: CartItem) =>
  position.variation ? addModernImageExtension(getImageForViewport(position.variation, 'CartProductCard')) : '';

const merkmale = (position: CartItem) =>
  cartGetters
    .getItemAttributes(position)
    .map((merkmal) => merkmal.value)
    .filter(Boolean)
    .join(' · ');

const zurKasse = () => {
  offen.value = false;
  navigateTo(localePath(isAuthorized.value ? paths.checkout : paths.guestLogin));
};
</script>

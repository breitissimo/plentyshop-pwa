<template>
  <div class="shadow-lg @md:rounded-md @md:border @md:border-neutral-100" data-testid="order-summary">
    <div class="flex justify-between items-end py-2 px-4 @md:px-6 @md:pt-6 @md:pb-4">
      <h2 class="typography-headline-4 font-bold @md:typography-headline-3">{{ t('common.labels.orderSummary') }}</h2>
      <p class="typography-text-base font-medium" data-testid="total-in-cart">
        {{ t('cart.itemCount', { count: cartItemsCount }) }}
      </p>
    </div>

    <div class="px-4 pb-4 mt-3 @md:px-6 @md:pb-6 @md:mt-0">
      <p
        v-if="laccicoNaechsteStufe"
        class="mb-4 rounded-md bg-neutral-100 px-3 py-2 typography-text-sm font-medium"
        data-testid="laccico-naechste-stufe"
      >
        {{ laccicoNaechsteStufe }}
      </p>
      <div v-if="orderPropertiesWithVatAdditionalCosts.length > 0" class="mb-4">
        <div
          v-for="property in orderPropertiesWithVatAdditionalCosts"
          :key="cartGetters.getBasketItemOrderParamPropertyId(property)"
          class="flex justify-between typography-text-base w-full"
        >
          <p class="flex flex-col gap-2 grow pr-2">{{ cartGetters.getBasketItemOrderParamName(property) }}</p>
          <p class="flex flex-col gap-2 text-right">
            {{ format(cartGetters.getBasketItemOrderParamPrice(property)) }}
          </p>
        </div>

        <UiDivider class="mt-4 w-auto" />
      </div>

      <div class="flex justify-between typography-text-base mb-4">
        <div class="flex flex-col gap-1 grow pr-2">
          <!-- LACCICO: Rabatt auf Warenwert wie Ceres (Warenwert, Rabatt, danach Zwischensumme) -->
          <p v-if="laccicoRabatt" data-testid="laccico-warenwert-label">{{ laccicoText.warenwert }}</p>
          <p v-if="laccicoRabatt" data-testid="laccico-rabatt-label">
            {{ laccicoText.rabatt }} ({{ laccicoRabatt.prozent }} %)
          </p>
          <p data-testid="subtotal-label">
            {{ t('common.labels.itemsSubtotal') }} <span v-if="showNetPrices">({{ t('common.labels.netPrice') }})</span>
          </p>
          <p data-testid="shipping-label">
            {{ t('common.labels.delivery') }} <span v-if="showNetPrices">({{ t('common.labels.netPrice') }})</span>
          </p>
          <p v-if="cartGetters.getCouponDiscount(props.cart)" data-testid="coupon-label">{{ t('coupon.name') }}</p>
          <p v-for="(vat, index) in totals.vats" :key="index" data-testid="vat-label">
            {{ showNetPrices ? t('common.labels.excludedTax') : t('common.labels.includedTax') }} ({{
              cartGetters.getTotalVatValue(vat)
            }}%)
          </p>
        </div>
        <div v-if="showNetPrices" class="flex flex-col gap-1 text-right">
          <p v-if="laccicoRabatt" class="font-medium" data-testid="laccico-warenwert">
            {{ format(laccicoRabatt.vorherNetto) }}
          </p>
          <p v-if="laccicoRabatt" class="font-medium" data-testid="laccico-rabatt">
            −{{ format(laccicoRabatt.rabattNetto) }}
          </p>
          <p data-testid="subtotal" class="font-medium">{{ format(cartGetters.getItemSumNet(props.cart)) }}</p>
          <p data-testid="shipping" class="font-medium">
            {{ getShippingAmount(cartGetters.getShippingAmountNet(props.cart)) }}
          </p>
          <p v-if="cartGetters.getCouponDiscount(props.cart)" class="font-medium" data-testid="coupon-value">
            {{ format(cartGetters.getCouponDiscount(props.cart)) }}
          </p>
          <p v-for="(vat, index) in totals.vats" :key="index" data-testid="vat">
            {{ format(cartGetters.getTotalVatAmount(vat)) }}
          </p>
        </div>
        <div v-else class="flex flex-col gap-1 text-right">
          <p v-if="laccicoRabatt" class="font-medium" data-testid="laccico-warenwert">
            {{ format(laccicoRabatt.vorher) }}
          </p>
          <p v-if="laccicoRabatt" class="font-medium" data-testid="laccico-rabatt">
            −{{ format(laccicoRabatt.rabatt) }}
          </p>
          <p data-testid="subtotal" class="font-medium">{{ format(totals.subTotal) }}</p>
          <p data-testid="shipping" class="font-medium">
            {{ getShippingAmount(cartGetters.getShippingPrice(props.cart)) }}
          </p>
          <p v-if="cartGetters.getCouponDiscount(props.cart)" class="font-medium" data-testid="coupon-value">
            {{ format(cartGetters.getCouponDiscount(props.cart)) }}
          </p>
          <p v-for="(vat, index) in totals.vats" :key="index" data-testid="vat">
            {{ format(cartGetters.getTotalVatAmount(vat)) }}
          </p>
        </div>
      </div>

      <div v-if="orderPropertiesWithoutVat.length > 0" class="mb-4">
        <UiDivider class="mb-4" />
        <div
          v-for="property in orderPropertiesWithoutVat"
          :key="cartGetters.getBasketItemOrderParamPropertyId(property)"
          class="flex justify-between typography-text-base w-full"
        >
          <p class="flex flex-col gap-2 grow pr-2">{{ cartGetters.getBasketItemOrderParamName(property) }}</p>
          <p class="flex flex-col gap-2 text-right">
            {{ format(cartGetters.getBasketItemOrderParamPrice(property)) }}
          </p>
        </div>
        <UiDivider class="mt-4 w-auto" />
      </div>

      <div v-if="showNetPrices" class="flex justify-between typography-text-base mb-1">
        <h2 data-testid="total-net-label">{{ t('common.labels.total') }} ({{ t('common.labels.netPrice') }})</h2>
        <h2 data-testid="total-net">{{ format(cartGetters.getBasketAmountNet(cart)) }}</h2>
      </div>
      <div class="flex justify-between typography-text-base font-bold pb-4 mb-4">
        <h2 data-testid="total-label">
          {{ t('common.labels.total') }} <span v-if="showNetPrices">({{ t('common.labels.grossPrice') }})</span>
        </h2>
        <h2 data-testid="total">{{ format(totals.total) }}</h2>
      </div>
      <UiDivider class="w-auto mb-4" />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cartGetters } from '@plentymarkets/shop-api';
import type { OrderSummaryPropsType } from '~/components/OrderSummary/types';

const props = defineProps<OrderSummaryPropsType>();
const { showNetPrices } = useCart();
const { format } = usePriceFormatter();
const { locale } = useI18n();

// LACCICO: Warenkorbrabatt (Plenty: basketRebate in Prozent, Typ „0“) als Zeilen Warenwert und Rabatt zeigen
const LACCICO_TEXTE = {
  de: { warenwert: 'Warenwert', rabatt: 'Rabatt auf Warenwert' },
  en: { warenwert: 'Value of goods', rabatt: 'Discount on value of goods' },
  fr: { warenwert: 'Valeur des articles', rabatt: 'Remise sur la valeur des articles' },
} as const;
const laccicoText = computed(
  () =>
    LACCICO_TEXTE[
      (locale.value as keyof typeof LACCICO_TEXTE) in LACCICO_TEXTE
        ? (locale.value as keyof typeof LACCICO_TEXTE)
        : 'de'
    ],
);
const laccicoRabatt = computed(() => {
  const warenkorb = props.cart as unknown as {
    basketRebate?: number;
    basketRebateType?: string;
    itemSum?: number;
    itemSumNet?: number;
  };
  const prozent = Number(warenkorb?.basketRebate ?? 0);
  if (!prozent || prozent >= 100 || String(warenkorb?.basketRebateType ?? '0') !== '0') {
    return null;
  }
  const vorher = Number(warenkorb.itemSum ?? 0) / (1 - prozent / 100);
  const vorherNetto = Number(warenkorb.itemSumNet ?? 0) / (1 - prozent / 100);
  return {
    prozent,
    vorher,
    rabatt: vorher - Number(warenkorb.itemSum ?? 0),
    vorherNetto,
    rabattNetto: vorherNetto - Number(warenkorb.itemSumNet ?? 0),
  };
});

// LACCICO (N 25.11.2026): Hinweis „Noch X € bis Y % Rabatt“ zur nächsten Stufe der Warenwert-Staffel
// (LACCICO_WARENWERT_STAFFEL, netto). Nur Endkunden mit Bruttopreisen, nicht Händler; über der höchsten Stufe nichts.
const LACCICO_STUFE_TEXTE = {
  de: (betrag: string, prozent: number) => `Noch ${betrag} bis ${prozent} % Rabatt auf den Warenwert`,
  en: (betrag: string, prozent: number) => `Add ${betrag} more to get ${prozent} % off the value of goods`,
  fr: (betrag: string, prozent: number) =>
    `Encore ${betrag} pour obtenir ${prozent} % de remise sur la valeur des articles`,
} as const;
const { istHaendler } = useLaccicoHaendler();
const laccicoNaechsteStufe = computed(() => {
  const warenkorb = props.cart as unknown as { itemSum?: number; itemSumNet?: number };
  const netto = laccicoRabatt.value?.vorherNetto ?? Number(warenkorb?.itemSumNet ?? 0);
  const brutto = laccicoRabatt.value?.vorher ?? Number(warenkorb?.itemSum ?? 0);
  if (showNetPrices.value || istHaendler.value || netto <= 0) {
    return null;
  }
  const stufe = [...LACCICO_WARENWERT_STAFFEL]
    .sort((a, b) => a.abNetto - b.abNetto)
    .find((s) => s.abNetto > netto + 0.005);
  if (!stufe) {
    return null;
  }
  const fehltBrutto = Math.ceil((stufe.abNetto - netto) * (brutto / netto) * 100) / 100;
  const sprache = (locale.value as keyof typeof LACCICO_STUFE_TEXTE) in LACCICO_STUFE_TEXTE ? locale.value : 'de';
  return LACCICO_STUFE_TEXTE[sprache as keyof typeof LACCICO_STUFE_TEXTE](format(fehltBrutto) ?? '', stufe.prozent);
});

const totals = computed(() => {
  const totalsData = cartGetters.getTotals(props.cart);
  return {
    total: totalsData.total,
    subTotal: totalsData.subtotal,
    vats: totalsData.totalVats,
  };
});

const getShippingAmount = (amount: number) => {
  return amount === 0 ? t('shipping.method.free') : format(Number(amount));
};

const cartItemsCount = computed(() => props.cart?.items?.reduce((price, { quantity }) => price + quantity, 0) ?? 0);
const orderPropertiesWithoutVat = computed(() => cartGetters.getOrderPropertiesWithoutVat(props.cart));
const orderPropertiesWithVatAdditionalCosts = computed(() =>
  cartGetters.getOrderPropertiesAdditionalCostsWithVat(props.cart),
);
</script>

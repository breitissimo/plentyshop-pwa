<template>
  <!-- Gewerbeschein hochladen (N 24.11.2026): auf der Händlerseite für angemeldete, noch nicht freigeschaltete Kunden -->
  <div class="laccico-gewerbeschein" data-testid="laccico-gewerbeschein">
    <p v-if="gesendet" class="laccico-gewerbeschein-danke" data-testid="laccico-gewerbeschein-gesendet">
      {{ text.upGesendet }}
    </p>
    <template v-else>
      <label class="laccico-gewerbeschein-feld">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          data-testid="laccico-gewerbeschein-datei"
          @change="waehlen"
        />
        <span class="laccico-gewerbeschein-klein">{{ text.upDatei }}</span>
      </label>
      <p v-if="falsch" class="laccico-gewerbeschein-falsch">{{ text.upFalsch }}</p>
      <UiButton :disabled="!datei || sendet" data-testid="laccico-gewerbeschein-senden" @click="senden">
        <SfLoaderCircular v-if="sendet" size="sm" />
        <span v-else>{{ text.upSenden }}</span>
      </UiButton>
      <p class="laccico-gewerbeschein-klein">
        {{ text.upHinweis }}
        <NuxtLink :to="localePath(paths.privacyPolicy)" class="underline">{{ text.upHinweisLink }}</NuxtLink>.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import { userGetters } from '@plentymarkets/shop-api';
import { laccicoGewerbescheinPasst, laccicoGewerbescheinSenden } from '../utils/laccicoGewerbeschein';
import { LACCICO_HAENDLER_SEITE } from '../utils/laccicoHaendlerSeiteTexte';

const { locale } = useI18n();
const localePath = useLocalizedPath();
const { user } = useCustomer();
const { send } = useNotification();

const text = computed(
  () =>
    LACCICO_HAENDLER_SEITE[
      (locale.value as keyof typeof LACCICO_HAENDLER_SEITE) in LACCICO_HAENDLER_SEITE
        ? (locale.value as keyof typeof LACCICO_HAENDLER_SEITE)
        : 'de'
    ],
);
const datei = ref<File | null>(null);
const falsch = ref(false);
const sendet = ref(false);
const gesendet = ref(false);

const waehlen = (ereignis: Event) => {
  const gewaehlt = (ereignis.target as HTMLInputElement).files?.[0] ?? null;
  falsch.value = !!gewaehlt && !laccicoGewerbescheinPasst(gewaehlt);
  datei.value = gewaehlt && !falsch.value ? gewaehlt : null;
};

const senden = async () => {
  if (!datei.value || !user.value) {
    return;
  }
  sendet.value = true;
  try {
    const ok = await laccicoGewerbescheinSenden(datei.value, {
      kundennr: user.value.id ?? '',
      name: userGetters.getFullName(user.value) || '',
      email: userGetters.getEmailAddress(user.value) || '',
    });
    if (ok) {
      gesendet.value = true;
    } else {
      send({ type: 'negative', message: text.value.upFehler });
    }
  } catch {
    send({ type: 'negative', message: text.value.upFehler });
  } finally {
    sendet.value = false;
  }
};
</script>

<style scoped>
.laccico-gewerbeschein {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}
.laccico-gewerbeschein-feld {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.laccico-gewerbeschein-feld input {
  font-size: 0.9rem;
}
.laccico-gewerbeschein-klein {
  font-size: 0.8rem;
  color: #555;
}
.laccico-gewerbeschein-falsch {
  font-size: 0.85rem;
  color: #b00020;
}
.laccico-gewerbeschein-danke {
  background: #f3f4f4;
  padding: 0.75rem;
  border-radius: 4px;
}
</style>

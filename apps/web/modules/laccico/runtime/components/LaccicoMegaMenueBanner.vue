<template>
  <NuxtLink
    :to="link"
    class="block group/banner focus-visible:outline focus-visible:rounded-md"
    data-testid="laccico-megamenue-banner"
  >
    <div class="w-36 aspect-[4/3] rounded-md overflow-hidden bg-[#f4f2ee]">
      <img
        :src="bild"
        :alt="name"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover/banner:scale-105"
      />
    </div>
    <!-- KI-Kennzeichnung (Regel N 11.11.2026; Banner sind KI-Bilder auf Basis echter Fotos, N 22.11.2026) -->
    <span class="laccico-ki-zeile mt-1 block w-36 text-2xs leading-tight text-[#666]">{{ kiText }}</span>
    <span class="mt-2 block w-36 text-center font-medium typography-text-sm">{{ name }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Bannerbild eines Hauptmenüpunkts ohne Unterkategorien (Business, Sneaker, Stiefel; N 22.11.2026).
 * Erscheint beim Überfahren direkt unter dem Menüpunkt, gleiche Kachelgröße wie die übrigen Menübilder (144 x 108 px), Klick führt auf die Kategorie.
 */
defineProps<{ bild: string; name: string; link: string }>();

const KI_TEXT: Record<string, string> = {
  de: 'KI-generiertes Bild auf Basis eines echten Fotos',
  en: 'AI-generated image based on a real photo',
  fr: 'Image générée par IA à partir d’une photo réelle',
};

const { locale } = useI18n();
const kiText = computed(() => KI_TEXT[String(locale.value).slice(0, 2)] ?? KI_TEXT.de);
</script>

<template>
  <NuxtLink
    :to="link"
    class="block group/banner focus-visible:outline focus-visible:rounded-md"
    data-testid="laccico-megamenue-banner"
  >
    <div class="w-[480px] max-w-full aspect-[7/4] rounded-md overflow-hidden bg-[#f4f2ee]">
      <img
        :src="bild"
        :alt="name"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover/banner:scale-105"
      />
    </div>
    <span class="mt-2 block text-center font-medium typography-text-base">{{ name }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Bannerbild eines Hauptmenüpunkts ohne Unterkategorien (Business, Sneaker, Stiefel; N 22.11.2026).
 * Erscheint beim Überfahren des Menüpunkts und führt per Klick auf die Kategorie.
 */
defineProps<{ bild: string; name: string; link: string }>();
</script>

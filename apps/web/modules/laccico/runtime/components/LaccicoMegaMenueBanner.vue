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
    <span class="mt-2 block w-36 text-center font-medium typography-text-sm">{{ name }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Bannerbild eines Hauptmenüpunkts ohne Unterkategorien (Business, Sneaker, Stiefel; N 22.11.2026).
 * Erscheint beim Überfahren direkt unter dem Menüpunkt, gleiche Kachelgröße wie die übrigen Menübilder (144 x 108 px), Klick führt auf die Kategorie.
 * Ohne KI-Zeile (N 22.11.2026: im Menü nicht gewünscht; auf den Kategorieseiten steht sie unter dem Banner).
 */
defineProps<{ bild: string; name: string; link: string }>();
</script>

<template>
  <!-- Rechtsseiten (AGB, Datenschutz, Widerrufsrecht, Impressum) im Aufbau der übrigen Infoseiten:
       grauer Titelbalken wie die ShopBuilder-Titelleiste, gleiche Seitenränder (N 24.11.2026, Zettel (12)) -->
  <div class="laccico-rechtsseite" data-testid="laccico-rechtsseite">
    <div class="laccico-rechtsseite-balken">
      <h1>{{ titel }}</h1>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="laccico-rechtsseite-text overflow-x-auto break-words no-preflight" v-html="html" />
  </div>
</template>

<script setup lang="ts">
/** titel: Text im Balken; html: Rechtstext aus Plenty */
defineProps<{ titel: string; html: string }>();
</script>

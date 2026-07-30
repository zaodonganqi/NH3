<template>
  <section id="tool" class="content-section tool-section reveal-section">
    <PixelSectionHeading
      class="tool-heading"
      kicker="TOOL / 前端工具"
      title="TOOL"
      :density="16"
    />

    <div class="tool-entry-list" aria-label="工具入口预留区域">
      <PixelLinkCard
        v-for="item in toolItems"
        :key="item.id"
        class="tool-entry"
        :item="item"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { toolItems } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import PixelSectionHeading from './PixelSectionHeading.vue'
</script>

<style scoped>
.tool-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.68fr) minmax(0, 1.32fr);
  gap: clamp(48px, 7vw, 120px);
  align-items: center;
}

.tool-heading {
  min-width: 0;
}

.tool-entry-list {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid #d9e2f5;
  border-left: 1px solid #d9e2f5;
}

.tool-entry {
  min-width: 0;
}

@media (max-width: 820px) {
  .tool-section {
    grid-template-columns: minmax(0, 1fr);
    gap: 42px;
  }
}

@media (max-width: 480px) {
  .tool-entry-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .tool-entry {
    min-height: 190px;
  }
}
</style>

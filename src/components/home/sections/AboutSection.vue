<template>
  <section :id="homeSections.about.id" class="content-section about-section reveal-section">
    <PixelSectionHeading
      class="about-heading"
      :kicker="homeSections.about.kicker"
      :title="homeSections.about.title"
      :density="16"
    />

    <div class="about-space" :aria-label="homeSections.about.ariaLabel">
      <PixelLinkCard
        v-for="item in aboutItems"
        :key="item.id"
        class="about-entry"
        :item="item"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { aboutItems, homeSections } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import PixelSectionHeading from './PixelSectionHeading.vue'
</script>

<style scoped>
.about-section {
  display: grid;
  grid-template-columns: minmax(260px, 0.62fr) minmax(0, 1.38fr);
  gap: clamp(48px, 7vw, 120px);
  align-items: center;
}

.about-heading {
  min-width: 0;
}

.about-space {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.about-entry:last-child {
  grid-column: 1 / -1;
  width: calc(50% - 10px);
  justify-self: center;
}

@media (max-width: 820px) {
  .about-section {
    grid-template-columns: minmax(0, 1fr);
    gap: 42px;
  }

  .about-space {
    grid-template-columns: minmax(0, 1fr);
  }

  .about-entry:last-child {
    width: 100%;
    grid-column: auto;
  }
}
</style>

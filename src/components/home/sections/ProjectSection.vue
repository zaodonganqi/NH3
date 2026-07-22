<template>
  <section id="project" class="content-section project-section reveal-section">
    <PixelSectionHeading
      class="project-heading"
      kicker="PROJECT / 关联项目"
      title="PROJECT"
      :density="16"
    />

    <div class="project-field" aria-label="项目链接预留区域">
      <PixelLinkCard
        v-for="item in projectItems"
        :key="item.id"
        class="project-window"
        :item="item"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { projectItems } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import PixelSectionHeading from './PixelSectionHeading.vue'
</script>

<style scoped>
.project-section {
  display: grid;
  min-height: 820px;
  grid-template-columns: minmax(260px, 0.62fr) minmax(0, 1.38fr);
  gap: clamp(48px, 7vw, 120px);
  align-items: center;
}

.project-heading {
  min-width: 0;
}

.project-field {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.project-window {
  min-width: 0;
}

.project-window:nth-child(2) {
  margin-top: 54px;
}

.project-window:nth-child(3) {
  width: min(72%, 440px);
  grid-column: 1 / -1;
  justify-self: center;
}

@media (max-width: 1100px) {
  .project-section {
    grid-template-columns: minmax(230px, 0.55fr) minmax(0, 1.45fr);
    gap: 42px;
  }
}

@media (max-width: 820px) {
  .project-section {
    min-height: auto;
    grid-template-columns: minmax(0, 1fr);
    gap: 42px;
  }

  .project-field {
    grid-template-columns: minmax(0, 1fr);
  }

  .project-window:nth-child(2) {
    margin-top: 0;
  }

  .project-window:nth-child(3) {
    width: 100%;
    grid-column: auto;
  }
}
</style>

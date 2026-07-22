<template>
  <section id="blog" class="content-section blog-section reveal-section">
    <PixelSectionHeading
      class="blog-heading"
      kicker="BLOG / 随笔"
      title="BLOG"
      :density="16"
    />

    <div class="blog-window" aria-label="文章页面索引">
      <header class="blog-window__bar">
        <span>ARTICLE_STREAM</span>
        <span>{{ blogItems.length.toString().padStart(2, '0') }}</span>
      </header>

      <div class="blog-window__scroll">
        <PixelLinkCard
          v-for="item in blogItems"
          :key="item.id"
          class="blog-row"
          :item="item"
        />
      </div>

      <footer class="blog-window__status">
        <span>SCROLLABLE_INDEX</span>
        <span>Y_AXIS</span>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { blogItems } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import PixelSectionHeading from './PixelSectionHeading.vue'
</script>

<style scoped>
.blog-section {
  display: grid;
  min-height: 780px;
  grid-template-columns: minmax(260px, 0.62fr) minmax(0, 1.38fr);
  gap: clamp(48px, 7vw, 120px);
  align-items: center;
}

.blog-heading {
  align-self: start;
  padding-top: 40px;
}

.blog-window {
  display: grid;
  height: min(52vh, 560px);
  min-height: 430px;
  min-width: 0;
  grid-template-rows: 34px minmax(0, 1fr) 34px;
  border: 1px solid #bdcbea;
  background: #ffffff;
  box-shadow: 8px 8px 0 #eaf0fa;
}

.blog-window__bar,
.blog-window__status {
  display: flex;
  padding: 0 12px;
  align-items: center;
  justify-content: space-between;
  color: #5f70a4;
  background: #edf2fa;
  font-size: 11px;
  font-weight: 800;
}

.blog-window__bar {
  border-bottom: 1px solid #bdcbea;
}

.blog-window__status {
  border-top: 1px solid #bdcbea;
}

.blog-window__scroll {
  display: grid;
  min-height: 0;
  padding: 12px 20px 20px 12px;
  align-content: start;
  gap: 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: #8096d8 #edf2fa;
  scrollbar-width: thin;
}

.blog-window__scroll::-webkit-scrollbar {
  width: 10px;
}

.blog-window__scroll::-webkit-scrollbar-track {
  background: #edf2fa;
  border-left: 1px solid #ffffff;
}

.blog-window__scroll::-webkit-scrollbar-thumb {
  background: #8096d8;
  border: 2px solid #edf2fa;
  border-radius: 0;
}

.blog-row {
  min-height: 176px;
}

@media (max-width: 820px) {
  .blog-section {
    min-height: auto;
    grid-template-columns: minmax(0, 1fr);
    gap: 42px;
  }

  .blog-heading {
    padding-top: 0;
  }

  .blog-window {
    height: 520px;
    min-height: 0;
  }
}
</style>

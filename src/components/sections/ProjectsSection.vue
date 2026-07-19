<template>
  <section id="projects" class="content-section content-section--projects reveal-section">
    <div class="section-heading">
      <p class="section-kicker">PROJECTS / 项目</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="近期构建"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>
    <div class="project-list">
      <article v-for="(project, index) in projects" :key="project.title" class="project-item">
        <PixelArt :pattern="project.pattern" :palette="project.palette" />
        <div>
          <span>0{{ index + 1 }}</span>
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { projects } from '../../config/site'
import PixelArt from '../pixel/PixelArt.vue'
import PixelText from '../pixel/PixelText.vue'
</script>

<style scoped>
.project-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(28px, 4vw, 64px); }
.project-item { min-width: 0; }
.project-item :deep(.pixel-art) { width: 100%; max-width: 310px; margin-bottom: 28px; }
.project-item span { color: #a6b4d4; font-size: 12px; }
.project-item h3 { margin: 12px 0 14px; color: #5c72cf; font-family: "Microsoft YaHei", sans-serif; font-size: 23px; }
.project-item p { max-width: 300px; margin: 0; font-family: "Microsoft YaHei", sans-serif; font-size: 14px; line-height: 1.8; }

@media (max-width: 820px) {
  .project-list { grid-template-columns: 1fr; gap: 60px; }
  .project-item { display: grid; grid-template-columns: minmax(120px, 220px) minmax(0, 1fr); gap: 28px; align-items: center; }
  .project-item :deep(.pixel-art) { margin: 0; }
}

@media (max-width: 560px) {
  .project-item { grid-template-columns: 110px minmax(0, 1fr); gap: 18px; }
  .project-item h3 { font-size: 18px; }
  .project-item p { font-size: 12px; }
}
</style>

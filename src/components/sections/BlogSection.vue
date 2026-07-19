<template>
  <section id="blog" class="content-section content-section--blog reveal-section">
    <div class="section-heading">
      <p class="section-kicker">BLOG / 随笔</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="记录与思考"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>
    <div class="post-list">
      <a v-for="post in posts" :key="post.title" href="#contact" @click="emit('navigate', $event)">
        <time>{{ post.date }}</time>
        <strong>{{ post.title }}</strong>
        <span>READ →</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { posts } from '../../config/site'
import PixelText from '../pixel/PixelText.vue'

// 随笔列表把锚点导航交给应用级 GSAP 滚动控制器。
const emit = defineEmits<{ navigate: [event: MouseEvent] }>()
</script>

<style scoped>
.post-list { margin-top: 74px; }
.post-list a { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 24px; padding: 26px 0; align-items: center; border-top: 4px dotted #d9e2f8; text-decoration: none; }
.post-list a:last-child { border-bottom: 4px dotted #d9e2f8; }
.post-list time, .post-list span { color: #8ba0ce; font-size: 12px; }
.post-list strong { color: #5a6f9a; font-family: "Microsoft YaHei", sans-serif; font-size: 20px; }

@media (max-width: 560px) {
  .post-list { margin-top: 48px; }
  .post-list a { grid-template-columns: 72px minmax(0, 1fr); gap: 14px; padding: 22px 0; }
  .post-list strong { font-size: 15px; }
  .post-list span { display: none; }
}
</style>

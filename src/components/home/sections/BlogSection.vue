<template>
  <section id="blog" class="content-section blog-section reveal-section">
    <div class="blog-heading">
      <p class="section-kicker">BLOG / 随笔</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="BLOG"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>

    <div class="blog-window">
      <header class="blog-window__bar">
        <span>ARTICLE_INDEX.NH3</span>
        <span aria-hidden="true">□ ×</span>
      </header>
      <div class="blog-window__scroll" role="list" aria-label="文章列表">
        <div
          v-for="slot in blogSlots"
          :key="slot"
          class="blog-row"
          role="listitem"
        >
          <span>{{ slot }}</span>
          <strong>EMPTY ENTRY</strong>
          <time>----.--.--</time>
        </div>
      </div>
      <footer class="blog-window__status">
        <span>0 ARTICLES</span>
        <span>SCROLL BUFFER</span>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PixelText } from '../../base/pixel'

// 足够数量的空文章槽位让半屏列表窗口保持可滚动结构。
const blogSlots = [
  '001',
  '002',
  '003',
  '004',
  '005',
  '006',
  '007',
  '008',
  '009',
  '010',
  '011',
  '012',
  '013',
  '014',
]
</script>

<style scoped>
.blog-section {
  display: grid;
  min-height: 780px;
  grid-template-columns: minmax(300px, 0.72fr) minmax(620px, 1.28fr);
  gap: 7vw;
  align-items: center;
}

.blog-heading {
  align-self: start;
  padding-top: 56px;
}

.blog-window {
  border: 1px solid #bdcbea;
  background: #ffffff;
  box-shadow: 14px 14px 0 #eef2fa;
}

.blog-window__bar,
.blog-window__status {
  display: flex;
  min-height: 38px;
  padding: 0 14px;
  align-items: center;
  justify-content: space-between;
  color: #7184ad;
  background: #f8faff;
  font-size: 10px;
  font-weight: 800;
}

.blog-window__bar {
  border-bottom: 1px solid #d9e2f5;
}

.blog-window__status {
  border-top: 1px solid #d9e2f5;
}

.blog-window__scroll {
  height: min(48vh, 430px);
  overflow-y: auto;
  scrollbar-color: #9fb0db #edf1f9;
  scrollbar-width: thin;
}

.blog-row {
  display: grid;
  min-height: 64px;
  padding: 0 18px;
  grid-template-columns: 64px minmax(0, 1fr) 94px;
  gap: 18px;
  align-items: center;
  border-bottom: 1px solid #e3e9f6;
}

.blog-row span,
.blog-row time {
  color: #9aa9c5;
  font-size: 10px;
}

.blog-row strong {
  color: #7181a2;
  font-size: 13px;
}

.blog-row time {
  text-align: right;
}
</style>
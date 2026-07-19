<template>
  <section id="about" class="content-section content-section--about reveal-section">
    <div class="section-index" aria-hidden="true">01</div>
    <div class="section-copy">
      <p class="section-kicker">ABOUT / 关于</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="保持好奇，持续构建。"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
      <p>这里暂时放一段个人介绍。关注前端工程、交互设计与有趣的小工具，喜欢把复杂问题拆成清晰、可靠的体验。</p>
    </div>
    <PixelArt class="section-art section-art--face" :pattern="patterns.face" :palette="palettes.section" />
  </section>
</template>

<script setup lang="ts">
import { palettes, patterns } from '../../config/site'
import PixelArt from '../pixel/PixelArt.vue'
import PixelText from '../pixel/PixelText.vue'
</script>

<style scoped>
.section-index {
  position: absolute;
  top: 60px;
  right: 7%;
  color: #edf1ff;
  font-size: clamp(120px, 22vw, 320px);
  font-weight: 900;
  line-height: 1;
}

.section-copy { position: relative; z-index: 2; width: min(62%, 760px); }
.section-copy > p:last-child { max-width: 620px; margin: 38px 0 0; font-family: "Microsoft YaHei", sans-serif; font-size: 18px; line-height: 2; }
.section-art--face { position: absolute; right: 11%; bottom: 15%; width: clamp(180px, 24vw, 340px); }

@media (max-width: 820px) {
  .section-copy { width: 70%; }
  .section-art--face { right: 4%; width: 28vw; }
}

@media (max-width: 560px) {
  .section-copy { width: 100%; }
  .section-copy > p:last-child { font-size: 15px; line-height: 1.9; }
  .section-art--face { position: relative; right: auto; bottom: auto; width: 190px; margin: 58px auto 0; }
  .section-index { top: 48px; right: -10px; font-size: 150px; }
}
</style>

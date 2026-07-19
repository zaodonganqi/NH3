<template>
  <section id="contact" class="content-section content-section--contact reveal-section">
    <PixelArt class="contact-art" :pattern="patterns.mail" :palette="palettes.section" />
    <p class="section-kicker">CONTACT / 联系</p>
    <h2>
      <PixelText
        class="section-pixel-title"
        text="一起做点有意思的事。"
        :density="18"
        color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
      />
    </h2>
    <a class="pixel-link" href="mailto:hello@example.com" @mouseenter="emit('hover', $event)" @mouseleave="emit('leave', $event)">
      hello@example.com
    </a>
    <p class="copyright">© 2026 NH3 / BUILT WITH VUE + GSAP</p>
  </section>
</template>

<script setup lang="ts">
import { palettes, patterns } from '../../config/site'
import PixelArt from '../pixel/PixelArt.vue'
import PixelText from '../pixel/PixelText.vue'

// 联系区域把悬停事件交给应用级 GSAP 控制器。
const emit = defineEmits<{
  hover: [event: MouseEvent]
  leave: [event: MouseEvent]
}>()
</script>

<style scoped>
.content-section--contact { display: grid; min-height: 640px; place-content: center; justify-items: center; text-align: center; }
.content-section--contact h2 { margin-bottom: 42px; }
.contact-art { width: 92px; margin-bottom: 28px; }
.copyright { position: absolute; bottom: 28px; color: #b0bbd1; font-size: 11px; }

@media (max-width: 560px) {
  .content-section--contact h2 { font-size: 36px; }
}
</style>

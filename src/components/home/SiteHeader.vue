<template>
  <header class="site-header intro-piece">
    <a class="brand" href="#home" aria-label="NH3 首页" @click="emit('navigate', $event)">
      <PixelText
        class="brand__name"
        text="NH3"
        :density="14"
        color="linear-gradient(90deg, #294cc8 0%, #159e9a 100%)"
      />
      <span class="brand__spark" aria-hidden="true">
        <i v-for="index in 5" :key="index"></i>
      </span>
      <span class="brand__meta">// AMMONIA<br />{ NH3 }</span>
    </a>

    <nav class="nav" aria-label="主导航">
      <a
        v-for="item in navItems"
        :key="item.id"
        class="nav__item"
        :class="{ 'nav__item--active': item.id === 'home' }"
        :href="`#${item.id}`"
        @click="emit('navigate', $event)"
        @mouseenter="emit('hover', $event)"
        @mouseleave="emit('leave', $event)"
      >
        <PixelArt :pattern="item.icon" :palette="palettes.primary" />
        <span>{{ item.label }}</span>
      </a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { navItems, palettes } from '../../config/site'
import PixelArt from '../pixel/PixelArt.vue'
import PixelText from '../pixel/PixelText.vue'

// 站点头部把导航和悬停事件交给应用级 GSAP 控制器。
const emit = defineEmits<{
  navigate: [event: MouseEvent]
  hover: [event: MouseEvent]
  leave: [event: MouseEvent]
}>()
</script>

<style scoped>
.site-header {
  position: absolute;
  z-index: 10;
  top: 38px;
  left: 40px;
  display: flex;
  width: calc(100% - 80px);
  align-items: flex-start;
  justify-content: space-between;
}

.brand {
  position: relative;
  display: grid;
  width: 190px;
  text-decoration: none;
}

.brand__name {
  width: 190px;
  color: #5872ee;
  font-family: "Arial Black", sans-serif;
  font-size: 58px;
  line-height: 0.9;
}

.brand__meta {
  margin-top: 16px;
  color: #a7b5dc;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.brand__spark {
  position: absolute;
  top: -2px;
  right: 13px;
  width: 24px;
  height: 20px;
}

.brand__spark i {
  position: absolute;
  display: block;
  width: 6px;
  aspect-ratio: 1 / 1;
  color: #8fc5f3;
  background: currentColor;
  border: 1px solid #ffffff;
}

.brand__spark i:nth-child(1) { left: 9px; top: 0; }
.brand__spark i:nth-child(2) { left: 2px; top: 7px; }
.brand__spark i:nth-child(3) { left: 16px; top: 7px; }
.brand__spark i:nth-child(4) { left: 9px; top: 13px; }
.brand__spark i:nth-child(5) { left: 9px; top: 7px; }

.nav {
  display: flex;
  gap: clamp(28px, 4vw, 68px);
  padding-top: 7px;
}

.nav__item {
  position: relative;
  display: grid;
  width: 62px;
  justify-items: center;
  gap: 9px;
  color: #6b7d9d;
  text-decoration: none;
}

.nav__item :deep(.pixel-art) {
  width: 36px;
}

.nav__item span:last-child {
  font-size: 12px;
  font-weight: 800;
}

.nav__item--active {
  color: #5b77ef;
}

.nav__item--active::after {
  position: absolute;
  bottom: -13px;
  left: 6px;
  width: 50px;
  height: 4px;
  content: "";
  background: repeating-linear-gradient(90deg, #67a1ee 0 4px, transparent 4px 8px);
}

@media (max-width: 1100px) {
  .site-header { top: 28px; left: 28px; width: calc(100% - 56px); }
  .nav { gap: 22px; }
  .brand__name { width: 158px; font-size: 46px; }
}

@media (max-width: 820px) {
  .site-header {
    position: relative;
    top: auto;
    left: auto;
    width: auto;
    padding: 24px;
    flex-direction: column;
    gap: 30px;
  }

  .brand { width: 158px; }
  .nav { width: 100%; gap: 8px; justify-content: space-between; }
  .nav__item { width: 54px; }
  .nav__item span:last-child { font-size: 9px; }
  .nav__item :deep(.pixel-art) { width: 28px; }
  .nav__item--active::after { left: 9px; width: 36px; }
}

@media (max-width: 560px) {
  .site-header { padding: 20px 16px; }
  .brand { width: 140px; }
  .brand__name { width: 140px; font-size: 40px; }
  .brand__meta { margin-top: 10px; font-size: 10px; }
  .nav { gap: 2px; }
  .nav__item { width: 50px; gap: 6px; }
  .nav__item span:last-child { font-size: 8px; }
}
</style>

<template>
  <header class="site-header intro-piece">
    <a class="brand" href="#home" aria-label="NH3 首页" @click="handleBrandClick">
      <PixelText
        class="brand__name"
        text="NH3"
        :font-size="36"
        :letter-spacing="3"
        color="linear-gradient(90deg, #294cc8 0%, #159e9a 100%)"
      />
    </a>

    <nav class="nav" aria-label="主导航">
      <a
        v-for="item in navItems"
        :key="item.id"
        class="nav__item"
        :class="{
          'nav__item--active': !item.external && item.id === props.activeSection,
          'nav__item--external': item.external,
        }"
        :href="item.href"
        :style="{
          '--nav-active-color': item.activeColor,
          '--nav-hover-color': item.hoverColor,
        }"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noreferrer' : undefined"
        :aria-label="item.external ? '打开 GitHub' : undefined"
        @click="handleNavigationClick($event, item)"
      >
        <span class="nav__icon" aria-hidden="true">
          <HeaderPixelIcon :pattern="item.iconPattern" />
        </span>
        <span>{{ item.label }}</span>
      </a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import type { NavItem } from '../../../config/site'
import { navItems } from '../../../config/site'
import { PixelText } from '../../base/pixel'
import HeaderPixelIcon from './HeaderPixelIcon.vue'

// 当前章节用于同步顶部导航的选中状态。
const props = withDefaults(defineProps<{
  /**
   * 当前进入视口的首页章节标识，用于同步导航高亮状态。
   */
  activeSection?: string
}>(), {
  activeSection: 'home',
})

// Header 只把站内锚点点击交给页面处理，外部链接保留浏览器默认行为。
const emit = defineEmits<{
  /**
   * 请求首页滚动控制器导航到指定站内章节，并保留原始点击事件。
   */
  navigate: [event: MouseEvent, sectionId: string]
}>()

/**
 * 把左侧品牌点击作为 HOME 导航交给页面平滑滚动。
 */
function handleBrandClick(event: MouseEvent) {
  emit('navigate', event, 'home')
}

/**
 * 站内导航交给首页滚动控制器，GitHub 直接打开外部地址。
 */
function handleNavigationClick(event: MouseEvent, item: NavItem) {
  if (!item.external) {
    emit('navigate', event, item.id)
  }
}
</script>

<style scoped>
.site-header {
  position: fixed;
  z-index: 30;
  top: 38px;
  left: 40px;
  display: flex;
  width: calc(100% - 80px);
  align-items: flex-start;
  justify-content: space-between;
  isolation: isolate;
}

.site-header::before {
  position: absolute;
  z-index: -1;
  top: -38px;
  right: -40px;
  bottom: -34px;
  left: -40px;
  content: "";
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 99%) 0%,
    rgb(255 255 255 / 92%) 38%,
    rgb(255 255 255 / 58%) 68%,
    rgb(255 255 255 / 0%) 100%
  );
  backdrop-filter: blur(18px) saturate(1.18);
  mask-image: linear-gradient(180deg, #000 0%, #000 68%, transparent 100%);
  pointer-events: none;
  -webkit-backdrop-filter: blur(18px) saturate(1.18);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 68%, transparent 100%);
}

.brand {
  position: relative;
  display: block;
  width: 118px;
  text-decoration: none;
}

.brand__name {
  width: 190px;
  color: #5872ee;
  font-family: "Arial Black", sans-serif;
  font-size: 58px;
  line-height: 0.9;
}

.nav {
  display: flex;
  gap: clamp(20px, 2.7vw, 48px);
  padding-top: 7px;
}

.nav__item {
  position: relative;
  display: grid;
  width: 66px;
  justify-items: center;
  gap: 9px;
  color: #9aadd4;
  text-decoration: none;
  transition: color 180ms ease, transform 180ms ease;
}

.nav__icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
}


.nav__item > span:last-child {
  font-size: 11px;
  font-weight: 800;
}

.nav__item--active {
  color: var(--nav-active-color);
}

.nav__item:hover,
.nav__item:focus-visible {
  color: var(--nav-hover-color);
  transform: translateY(-3px);
}

.nav__item:active {
  color: var(--nav-active-color);
}


@media (max-width: 1100px) {
  .site-header { top: 28px; left: 28px; width: calc(100% - 56px); }
  .site-header::before { top: -28px; right: -28px; left: -28px; }
  .nav { gap: 14px; }
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

  .site-header::before {
    top: -24px;
    right: -24px;
    bottom: -20px;
    left: -24px;
  }

  .brand { width: 118px; }
  .nav { width: 100%; gap: 4px; justify-content: space-between; }
  .nav__item { width: 48px; }
  .nav__item > span:last-child { font-size: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .nav__item {
    transition: none;
  }
}
</style>

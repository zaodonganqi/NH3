<template>
  <a
    class="tool-portal-card"
    :class="{ 'tool-portal-card--disabled': !item.href }"
    :href="item.href || undefined"
    :target="item.href ? '_blank' : undefined"
    :rel="item.href ? 'noreferrer' : undefined"
    :aria-disabled="!item.href"
    :style="{
      '--tool-accent': item.accent,
      '--tool-secondary': item.secondary,
    }"
    @click="handleClick"
  >
    <div class="tool-portal-card__visual">
      <span class="tool-portal-card__number">{{ item.index }}</span>
      <PixelPattern
        class="tool-portal-card__icon"
        :pattern="item.pattern"
        :palette="visualPalette"
      />
      <span class="tool-portal-card__markers" aria-hidden="true">
        <i v-for="marker in 6" :key="marker"></i>
      </span>
    </div>

    <div class="tool-portal-card__content">
      <header>
        <span>{{ item.meta }}</span>
        <span>{{ item.href ? homeCardLabels.ready : homeCardLabels.unassigned }}</span>
      </header>

      <div class="tool-portal-card__copy">
        <strong>{{ item.title }}</strong>
        <p>{{ item.summary }}</p>
      </div>

      <footer>
        <span>{{ item.href ? homeCardLabels.openNewPage : homeCardLabels.noTarget }}</span>
        <PixelPattern
          class="tool-portal-card__arrow"
          :pattern="arrowPattern"
          :palette="arrowPalette"
        />
      </footer>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { homeCardLabels } from '../../../config/home'
import type { HomeSectionLinkItem } from '../../../config/home'
import { PixelPattern } from '../../base/pixel'

// 专属工具卡只接收首页配置，不持有详情业务状态。
const props = defineProps<{
  // 当前工具入口的展示、配色和跳转信息。
  item: HomeSectionLinkItem
}>()

// 模板使用的工具配置保持只读引用。
const item = props.item
// 浅色视觉区使用主色像素图标，降低大面积饱和色占比。
const visualPalette = computed(() => ({
  '1': item.accent,
  '2': item.secondary,
}))
// 箭头沿用当前工具主色，保持交互出口一致。
const arrowPalette = computed(() => ({
  '1': item.accent,
}))
// 新页面箭头使用紧凑五行像素矩阵。
const arrowPattern = ['..111', '....1', '111.1', '1....', '111..']

/**
 * 未配置地址时阻止卡片产生空导航。
 */
function handleClick(event: MouseEvent) {
  if (!item.href) {
    event.preventDefault()
  }
}
</script>

<style scoped>
.tool-portal-card {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  grid-template-columns: minmax(132px, 32%) minmax(0, 1fr);
  overflow: hidden;
  color: #73809c;
  background: #ffffff;
  outline: 1px solid var(--tool-accent);
  box-shadow:
    5px 5px 0 #ffffff,
    10px 10px 0 var(--tool-secondary),
    15px 15px 0 #dfe5f2;
  text-decoration: none;
  transition:
    box-shadow var(--motion-medium) var(--motion-step),
    outline-width var(--motion-instant) ease,
    transform var(--motion-medium) var(--motion-step);
}

.tool-portal-card::after {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  left: -18%;
  width: 16%;
  content: '';
  background: repeating-linear-gradient(90deg, transparent 0 5px, rgb(255 255 255 / 48%) 5px 10px);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-120%);
  transition:
    opacity var(--motion-instant) ease,
    transform 480ms steps(8, end);
}

.tool-portal-card__visual {
  position: relative;
  display: grid;
  min-width: 0;
  overflow: hidden;
  place-items: center;
  background:
    linear-gradient(135deg, transparent 0 44%, rgb(255 255 255 / 42%) 44% 56%, transparent 56%) 100% 100% / 260% 260%,
    var(--tool-secondary);
  border-right: 2px solid #ffffff;
  box-shadow: inset 0 0 0 1px #ffffff;
  transform-origin: left center;
  will-change: transform, opacity;
  transition: background-position var(--motion-medium) var(--motion-step);
  z-index: 1;
}

.tool-portal-card__number {
  position: absolute;
  top: 14px;
  left: 16px;
  color: var(--tool-accent);
  font-size: 58px;
  line-height: 1;
  will-change: transform, opacity;
}

.tool-portal-card__icon {
  width: 84px;
  will-change: transform, opacity;
  transform-origin: center;
  transition:
    filter var(--motion-fast) ease,
    scale var(--motion-medium) var(--motion-step),
    translate var(--motion-medium) var(--motion-step);
}

.tool-portal-card__markers {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 3px;
  transition: transform var(--motion-fast) var(--motion-step);
}

.tool-portal-card__markers i {
  position: relative;
  width: 8px;
  aspect-ratio: 1;
  background: var(--tool-accent);
  box-shadow: inset 0 0 0 1px #ffffff;
  will-change: transform, opacity;
}

.tool-portal-card__markers i::after {
  position: absolute;
  inset: 2px;
  content: '';
  background: #ffffff;
  opacity: 0.58;
  scale: 0.62;
  transition:
    opacity var(--motion-fast) ease,
    scale var(--motion-fast) var(--motion-step),
    translate var(--motion-fast) var(--motion-step);
}

.tool-portal-card__markers i:nth-child(2n) {
  background: #ffffff;
}

.tool-portal-card__content {
  position: relative;
  display: grid;
  min-width: 0;
  padding: 18px 22px;
  grid-template-rows: auto 1fr auto;
  background: #ffffff;
  z-index: 1;
}

.tool-portal-card header,
.tool-portal-card footer {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  color: #77839c;
  font-size: 10px;
  font-weight: 800;
}

.tool-portal-card__copy {
  min-width: 0;
  align-self: center;
}

.tool-portal-card__content header,
.tool-portal-card__copy,
.tool-portal-card__content footer {
  will-change: transform, opacity;
}

.tool-portal-card__copy strong {
  display: block;
  overflow: hidden;
  color: var(--tool-accent);
  font-size: 21px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    filter var(--motion-fast) ease,
    translate var(--motion-fast) var(--motion-step);
}

.tool-portal-card__copy p {
  margin: 14px 0 0;
  overflow: hidden;
  color: #66738b;
  font-size: 12px;
  line-height: 1.7;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    color var(--motion-fast) ease,
    translate var(--motion-fast) var(--motion-step);
}

.tool-portal-card__arrow {
  width: 22px;
  transition: transform var(--motion-fast) var(--motion-step);
}

.tool-portal-card:not(.tool-portal-card--disabled):hover,
.tool-portal-card:not(.tool-portal-card--disabled):focus-visible {
  outline-width: 2px;
  box-shadow:
    7px 7px 0 #ffffff,
    14px 14px 0 var(--tool-secondary),
    21px 21px 0 #dfe5f2;
  transform: translate(-4px, -4px);
}

.tool-portal-card--disabled {
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .tool-portal-card:hover .tool-portal-card__visual,
  .tool-portal-card:focus-visible .tool-portal-card__visual {
    background-position: 0 0;
  }

  .tool-portal-card:hover::after,
  .tool-portal-card:focus-visible::after {
    opacity: 1;
    transform: translateX(790%);
  }

  .tool-portal-card:hover .tool-portal-card__icon,
  .tool-portal-card:focus-visible .tool-portal-card__icon {
    filter: drop-shadow(6px 6px 0 rgb(255 255 255 / 72%));
    scale: 1.05 !important;
    translate: 0 -4px !important;
  }

  .tool-portal-card:hover .tool-portal-card__number,
  .tool-portal-card:focus-visible .tool-portal-card__number {
    filter: drop-shadow(4px 4px 0 rgb(255 255 255 / 72%));
  }

  .tool-portal-card:hover .tool-portal-card__markers,
  .tool-portal-card:focus-visible .tool-portal-card__markers {
    transform: translateY(-4px);
  }

  .tool-portal-card:hover .tool-portal-card__markers i:nth-child(odd)::after,
  .tool-portal-card:focus-visible .tool-portal-card__markers i:nth-child(odd)::after {
    opacity: 1;
    scale: 1;
    translate: 0 -2px;
  }

  .tool-portal-card:hover .tool-portal-card__markers i:nth-child(even)::after,
  .tool-portal-card:focus-visible .tool-portal-card__markers i:nth-child(even)::after {
    opacity: 0.82;
    scale: 0.84;
    translate: 0 2px;
  }

  .tool-portal-card:hover .tool-portal-card__arrow,
  .tool-portal-card:focus-visible .tool-portal-card__arrow {
    transform: translate(3px, -3px);
  }

  .tool-portal-card:hover .tool-portal-card__copy strong,
  .tool-portal-card:focus-visible .tool-portal-card__copy strong {
    filter: drop-shadow(4px 4px 0 var(--tool-secondary));
    translate: 6px -2px;
  }

  .tool-portal-card:hover .tool-portal-card__copy p,
  .tool-portal-card:focus-visible .tool-portal-card__copy p {
    color: #53627f;
    translate: 10px 1px;
  }

  .tool-portal-card--disabled:hover .tool-portal-card__arrow {
    transform: none;
  }
}

@container (max-width: 430px) {
  .tool-portal-card {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 44% minmax(0, 1fr);
  }

  .tool-portal-card__visual {
    border-right: 0;
    border-bottom: 2px solid #ffffff;
    transform-origin: center top;
  }

  .tool-portal-card__number {
    top: 10px;
    left: 12px;
    font-size: 40px;
  }

  .tool-portal-card__icon {
    width: 58px;
  }

  .tool-portal-card__content {
    padding: 14px 16px;
  }

  .tool-portal-card__copy strong {
    font-size: 16px;
  }

  .tool-portal-card__copy p {
    margin-top: 8px;
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-portal-card,
  .tool-portal-card::after,
  .tool-portal-card__visual,
  .tool-portal-card__copy strong,
  .tool-portal-card__copy p,
  .tool-portal-card__icon,
  .tool-portal-card__markers,
  .tool-portal-card__markers i::after,
  .tool-portal-card__arrow {
    transition: none;
  }

  .tool-portal-card__icon {
    scale: none !important;
    translate: none !important;
  }
}
</style>

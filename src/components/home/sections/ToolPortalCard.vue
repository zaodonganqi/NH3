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
        <span>{{ item.href ? 'READY' : 'UNASSIGNED' }}</span>
      </header>

      <div class="tool-portal-card__copy">
        <strong>{{ item.title }}</strong>
        <p>{{ item.summary }}</p>
      </div>

      <footer>
        <span>{{ item.href ? 'OPEN NEW PAGE' : 'NO TARGET' }}</span>
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
}

.tool-portal-card__visual {
  position: relative;
  display: grid;
  min-width: 0;
  overflow: hidden;
  place-items: center;
  background: var(--tool-secondary);
  border-right: 2px solid #ffffff;
  box-shadow: inset 0 0 0 1px #ffffff;
  transform-origin: left center;
  will-change: transform, opacity;
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
}

.tool-portal-card__markers {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  gap: 3px;
}

.tool-portal-card__markers i {
  width: 8px;
  aspect-ratio: 1;
  background: var(--tool-accent);
  box-shadow: inset 0 0 0 1px #ffffff;
  will-change: transform, opacity;
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
}

.tool-portal-card__copy p {
  margin: 14px 0 0;
  overflow: hidden;
  color: #66738b;
  font-size: 12px;
  line-height: 1.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-portal-card__arrow {
  width: 22px;
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
</style>

<template>
  <a
    class="pixel-link-card"
    :class="{ 'pixel-link-card--disabled': !item.href }"
    :href="item.href || undefined"
    :target="item.href ? '_blank' : undefined"
    :rel="item.href ? 'noreferrer' : undefined"
    :aria-disabled="!item.href"
    :style="{
      '--card-accent': item.accent,
      '--card-secondary': item.secondary,
    }"
    @click="handleClick"
  >
    <header>
      <span>{{ item.index }}</span>
      <span>{{ item.meta }}</span>
    </header>

    <div class="pixel-link-card__body">
      <PixelPattern
        class="pixel-link-card__icon"
        :pattern="item.pattern"
        :palette="cardPalette"
      />
      <div>
        <strong>{{ item.title }}</strong>
        <p>{{ item.summary }}</p>
      </div>
    </div>

    <footer>
      <span>{{ item.href ? homeCardLabels.openNewPage : homeCardLabels.noTarget }}</span>
      <PixelPattern
        class="pixel-link-card__arrow"
        :pattern="arrowPattern"
        :palette="cardPalette"
      />
    </footer>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { homeCardLabels } from '../../../config/home'
import type { HomeSectionLinkItem } from '../../../config/home'
import { PixelPattern } from '../../base/pixel'

// 卡片只接收配置对象，不持有任何详情业务状态。
const props = defineProps<{
  // 当前索引卡片的全部展示和跳转配置。
  item: HomeSectionLinkItem
}>()

// 模板使用的当前卡片配置保持只读引用。
const item = props.item

// 卡片 Canvas 图标把主色和浅色映射到统一字符键。
const cardPalette = computed(() => ({
  '1': item.accent,
  '2': item.secondary,
}))

// 新页面箭头使用紧凑的五行像素矩阵。
const arrowPattern = ['..111', '....1', '111.1', '1....', '111..']

/**
 * 未配置目标地址时阻止空卡片产生无意义导航。
 */
function handleClick(event: MouseEvent) {
  if (!item.href) {
    event.preventDefault()
  }
}
</script>

<style scoped>
.pixel-link-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 218px;
  grid-template-rows: 34px 1fr 34px;
  color: #71809e;
  background: #ffffff;
  border: 1px solid #cbd6ed;
  box-shadow: 8px 8px 0 var(--card-secondary);
  text-decoration: none;
}

.pixel-link-card::before,
.pixel-link-card::after {
  position: absolute;
  z-index: 2;
  width: 8px;
  aspect-ratio: 1;
  content: "";
  background: var(--card-accent);
  box-shadow: inset 0 0 0 1px #ffffff;
}

.pixel-link-card::before {
  top: -4px;
  left: -4px;
}

.pixel-link-card::after {
  right: -4px;
  bottom: -4px;
}

.pixel-link-card:hover,
.pixel-link-card:focus-visible {
  border-color: var(--card-accent);
  box-shadow: 12px 12px 0 var(--card-secondary);
  outline: none;
  transform: translate(-4px, -4px);
}

.pixel-link-card--disabled {
  cursor: not-allowed;
}

.pixel-link-card--disabled:hover {
  border-color: #cbd6ed;
  box-shadow: 8px 8px 0 var(--card-secondary);
  transform: none;
}

.pixel-link-card header,
.pixel-link-card footer {
  display: flex;
  min-width: 0;
  padding: 0 12px;
  align-items: center;
  justify-content: space-between;
  color: #8897b5;
  font-size: 10px;
  font-weight: 800;
}

.pixel-link-card header {
  border-bottom: 1px solid #dce4f4;
}

.pixel-link-card footer {
  border-top: 1px solid #dce4f4;
}

.pixel-link-card__body {
  display: grid;
  min-width: 0;
  padding: 22px;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.pixel-link-card__icon {
  width: 72px;
}

.pixel-link-card__body strong {
  display: block;
  overflow: hidden;
  color: var(--card-accent);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pixel-link-card__body p {
  margin: 10px 0 0;
  overflow: hidden;
  color: #8795b1;
  font-size: 11px;
  line-height: 1.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pixel-link-card__arrow {
  width: 20px;
}

@media (max-width: 480px) {
  .pixel-link-card {
    min-height: 190px;
  }

  .pixel-link-card__body {
    padding: 18px;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 14px;
  }

  .pixel-link-card__icon {
    width: 56px;
  }
}
</style>

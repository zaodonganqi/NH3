<template>
  <div class="pixel-section-heading">
    <p>{{ kicker }}</p>
    <h2>
      <PixelText
        class="pixel-section-heading__title"
        :text="title"
        :density="density"
        :color="color"
      />
    </h2>
    <span class="pixel-section-heading__rail" aria-hidden="true">
      <i v-for="index in 7" :key="index"></i>
    </span>
  </div>
</template>

<script setup lang="ts">
import { PixelText } from '../../base/pixel'

// 共享章节标题只接收展示文案和像素文字绘制参数。
const props = withDefaults(defineProps<{
  /**
   * 位于大标题上方的章节索引文案。
   */
  kicker: string
  /**
   * 使用 PixelText 绘制的章节英文标题。
   */
  title: string
  /**
   * 大标题的像素采样密度。
   */
  density?: number
  /**
   * 大标题使用的纯色或渐变填充。
   */
  color?: string
}>(), {
  density: 16,
  color: 'linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)',
})

// 模板直接解构只读属性，避免重复访问 props 前缀。
const { kicker, title, density, color } = props
</script>

<style scoped>
.pixel-section-heading {
  position: relative;
  min-width: 0;
}

.pixel-section-heading p {
  margin: 0 0 18px;
  color: #95a5c7;
  font-size: 12px;
  font-weight: 800;
}

.pixel-section-heading h2 {
  width: 100%;
  margin: 0;
}

.pixel-section-heading__title {
  width: 100%;
}

.pixel-section-heading__rail {
  display: flex;
  margin-top: 24px;
  gap: 4px;
}

.pixel-section-heading__rail i {
  width: 8px;
  aspect-ratio: 1;
  background: #6580ec;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.pixel-section-heading__rail i:nth-child(3n + 2) {
  background: #65c9c4;
}

.pixel-section-heading__rail i:nth-child(3n) {
  background: #eda5cb;
}

@media (max-width: 820px) {
  .pixel-section-heading {
    width: min(100%, 520px);
  }

  .pixel-section-heading__rail {
    margin-top: 16px;
  }
}
</style>

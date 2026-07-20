<template>
  <span class="pixel-atom" :class="`pixel-atom--${element.toLowerCase()}`">
    <PixelPattern class="pixel-atom__body" :pattern="bodyPattern" :palette="bodyPalette" />
    <PixelPattern class="pixel-atom__letter" :pattern="letterPattern" :palette="palettes.white" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { palettes } from '../../../config/site'
import { PixelPattern } from '../../base/pixel'

// 原子组件只接受当前 NH3 图形需要的氮、氢元素。
const props = defineProps<{
  element: 'N' | 'H'
}>()

/**
 * 生成带上下半区明暗层次的圆形像素图案。
 */
function createCircle(size: number) {
  // 圆形在正方形像素矩阵中的中心坐标。
  const center = (size - 1) / 2
  // 半径略小于矩阵边界，避免圆形四周被裁切。
  const radius = center - 0.25
  // 最终按行输出的像素字符图案。
  const rows: string[] = []

  // 纵向索引负责逐行构建圆形。
  for (let y = 0; y < size; y += 1) {
    // 当前行暂存透明格和两种明暗像素。
    const cells: string[] = []

    // 横向索引负责判断当前格是否位于圆形范围内。
    for (let x = 0; x < size; x += 1) {
      if (Math.hypot(x - center, y - center) > radius) {
        cells.push('.')
      } else {
        cells.push(y < center ? '2' : '1')
      }
    }

    rows.push(cells.join(''))
  }

  return rows
}

// 氢原子使用较小的圆形像素主体。
const hydrogenBody = createCircle(15)

// 氮原子使用更大的圆形像素主体。
const nitrogenBody = createCircle(21)

// 氢元素字母图案覆盖在氢原子主体中央。
const hydrogenLetter = [
  '11...11',
  '11...11',
  '11...11',
  '1111111',
  '1111111',
  '11...11',
  '11...11',
  '11...11',
  '11...11',
]

// 氮元素字母图案覆盖在氮原子主体中央。
const nitrogenLetter = [
  '11.....11',
  '111....11',
  '1111...11',
  '11.11..11',
  '11..11.11',
  '11...1111',
  '11....111',
  '11.....11',
  '11.....11',
]

// 当前元素对应的圆形主体图案。
const bodyPattern = computed(() => props.element === 'N' ? nitrogenBody : hydrogenBody)

// 当前元素对应的字母覆盖图案。
const letterPattern = computed(() => props.element === 'N' ? nitrogenLetter : hydrogenLetter)

// 当前元素对应的站点原子调色板。
const bodyPalette = computed(() => props.element === 'N' ? palettes.nitrogen : palettes.hydrogen)
</script>

<style scoped>
.pixel-atom {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
}

.pixel-atom__body,
.pixel-atom__letter {
  position: absolute;
}

.pixel-atom__body {
  inset: 0;
}

.pixel-atom--h .pixel-atom__letter {
  top: 20%;
  left: 27%;
  width: 46%;
}

.pixel-atom--n .pixel-atom__letter {
  top: 28%;
  left: 29%;
  width: 42%;
}
</style>

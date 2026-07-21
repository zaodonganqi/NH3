<template>
  <canvas
    ref="canvasRef"
    class="pixel-pattern"
    :style="{
      aspectRatio: `${props.pattern[0]?.length ?? 1} / ${props.pattern.length || 1}`,
    }"
    aria-hidden="true"
  ></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { PixelPalette } from '../../../types'

// 字符图案和调色板共同决定 Canvas 中每个方格是否填充及其颜色。
const props = defineProps<{
  /**
   * 按行保存的字符矩阵；点号表示透明格，其他字符作为调色板键。
   */
  pattern: string[]
  /**
   * 把图案字符映射为 CSS 填充颜色的调色板。
   */
  palette: PixelPalette
}>()

// 单一 Canvas 替代逐像素 DOM 节点，并随父容器统一参与动画合成。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 尺寸变化监听器只在 Canvas 的 CSS 尺寸改变时安排重绘。
let resizeObserver: ResizeObserver | undefined

// 同一帧内的属性和尺寸变化合并为一次 Canvas 绘制。
let renderFrame: number | undefined

// 图案或调色板变化后重绘同一个 Canvas，不重新创建像素节点。
watch(props, scheduleRender, { deep: true })

// 组件挂载后监听实际尺寸并绘制首帧像素图案。
onMounted(mountPattern)

// 组件卸载时清理尺寸监听和待执行动画帧。
onUnmounted(unmountPattern)

/**
 * 建立 Canvas 尺寸监听并安排首帧绘制。
 */
function mountPattern() {
  if (!canvasRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(scheduleRender)
  resizeObserver.observe(canvasRef.value)
  scheduleRender()
}

/**
 * 清理 Canvas 图案持有的浏览器监听和动画帧。
 */
function unmountPattern() {
  resizeObserver?.disconnect()

  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }
}

/**
 * 把同一帧内的连续变化合并为一次 Canvas 重绘。
 */
function scheduleRender() {
  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  renderFrame = window.requestAnimationFrame(drawPattern)
}

/**
 * 按当前 CSS 尺寸绘制像素填充和原有 1px 白色边线。
 */
function drawPattern() {
  renderFrame = undefined

  // 当前 Canvas 提供最终布局尺寸和二维绘图上下文。
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
    return
  }

  // 设备像素比限制在 2，兼顾硬边清晰度和纹理内存。
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  // 布局宽度不包含祖先 transform，缩放动画不会降低 Canvas 纹理分辨率。
  const width = canvas.clientWidth
  // 布局高度同样忽略 Flip 缩放，反向恢复时无需重新分配纹理。
  const height = canvas.clientHeight
  // 物理像素宽度只在真实尺寸变化时更新。
  const renderWidth = Math.max(1, Math.round(width * pixelRatio))
  // 物理像素高度只在真实尺寸变化时更新。
  const renderHeight = Math.max(1, Math.round(height * pixelRatio))

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth
    canvas.height = renderHeight
  }

  // 二维上下文承载当前图案的全部像素，不再创建子元素。
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  // 第一行列数沿用原组件的网格宽度规则。
  const columnCount = props.pattern[0]?.length ?? 1
  // 横纵共用同一逻辑边长，确保响应式尺寸下仍是正方形像素。
  const cellSize = width / columnCount
  // 物理像素取整后的真实横向缩放比用于覆盖完整 Canvas。
  const scaleX = renderWidth / width
  // 物理像素取整后的真实纵向缩放比用于覆盖完整 Canvas。
  const scaleY = renderHeight / height

  context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false

  // 行循环按原矩阵位置绘制有效像素。
  props.pattern.forEach((row, rowIndex) => {
    // 列循环跳过透明格，并保留每格原有白色边线。
    Array.from(row).forEach((cell, columnIndex) => {
      if (cell === '.') {
        return
      }

      // 当前像素左上角的逻辑横坐标。
      const x = columnIndex * cellSize
      // 当前像素左上角的逻辑纵坐标。
      const y = rowIndex * cellSize
      // 调色板中与图案字符对应的内部填充色。
      const fillColor = props.palette[cell]

      context.fillStyle = '#ffffff'
      context.fillRect(x, y, cellSize, cellSize)

      if (fillColor) {
        context.fillStyle = fillColor
        context.fillRect(
          x + 1,
          y + 1,
          Math.max(0, cellSize - 2),
          Math.max(0, cellSize - 2),
        )
      }
    })
  })
}
</script>

<style scoped>
.pixel-pattern {
  display: block;
  width: 100%;
  contain: layout paint style;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>

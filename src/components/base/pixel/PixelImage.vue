<template>
  <span ref="rootRef" class="pixel-image" role="img" :aria-label="label">
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  pixelateImage,
  type PixelArt,
  type PixelImageOptions,
} from '../../../utils'

// 图片地址、无障碍名称和可选生成配置构成组件的公开参数。
const props = defineProps<{
  /**
   * 浏览器可加载的图片 URL、Data URL 或构建工具生成的资源地址。
   */
  source: string
  /**
   * 组件作为图片暴露给辅助技术的可访问名称。
   */
  label: string
  /**
   * 覆盖来源颜色的纯色或受支持渐变；省略时沿用图片生成配置。
   */
  color?: string
  /**
   * 传递给图片栅格化工具的采样、背景识别和分隔线配置。
   */
  options?: PixelImageOptions
}>()

// 组件根节点提供最终 CSS 尺寸的观察边界。
const rootRef = ref<HTMLElement | null>(null)

// Canvas 承载图片生成后的像素化结果。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 当前来源生成的像素画对象可在尺寸变化时重复渲染。
let pixelArt: PixelArt | undefined

// 图片来源变化时中止已经过期的异步加载任务。
let renderController: AbortController | undefined

// 同一帧内的连续尺寸变化合并为一次 Canvas 重绘。
let renderFrame: number | undefined

// 根节点尺寸监听器在组件卸载时统一清理。
let resizeObserver: ResizeObserver | undefined

// 图片地址或生成参数变化后重新生成像素画对象。
watch(
  [() => props.source, () => props.options],
  generateImage,
  { deep: true },
)

// 组件挂载后建立尺寸监听并生成首个图片结果。
onMounted(async () => {
  await nextTick()

  if (rootRef.value) {
    resizeObserver = new ResizeObserver(scheduleRender)
    resizeObserver.observe(rootRef.value)
  }

  await generateImage()
})

// 组件卸载时取消异步加载、动画帧和尺寸监听。
onUnmounted(() => {
  renderController?.abort()
  resizeObserver?.disconnect()

  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }
})

/**
 * 加载当前图片地址并缓存对应的像素画对象。
 */
async function generateImage() {
  renderController?.abort()
  renderController = new AbortController()

  try {
    pixelArt = await pixelateImage(props.source, {
      ...props.options,
      signal: renderController.signal,
    })
    scheduleRender()
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      pixelArt = undefined
      clearCanvas()
    }
  }
}

/**
 * 把同一帧内的尺寸更新合并为一次 Canvas 绘制。
 */
function scheduleRender() {
  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  renderFrame = window.requestAnimationFrame(renderImage)
}

/**
 * 按组件当前 CSS 尺寸重绘缓存的像素画对象。
 */
function renderImage() {
  // Canvas 和像素画对象都就绪后才能执行实际绘制。
  const canvas = canvasRef.value

  if (!canvas || !pixelArt) {
    return
  }

  pixelArt.render(canvas, {
    color: props.color,
  })
}

/**
 * 清空加载失败前可能残留的旧图片结果。
 */
function clearCanvas() {
  // 当前 Canvas 可能尚未进入组件挂载阶段。
  const canvas = canvasRef.value
  // 二维上下文负责清除全部物理像素。
  const context = canvas?.getContext('2d')

  if (canvas && context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }
}
</script>

<style scoped>
.pixel-image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  text-align: center;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>
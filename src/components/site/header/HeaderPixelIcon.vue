<template>
  <span ref="rootRef" class="header-pixel-icon" aria-hidden="true">
    <canvas ref="canvasRef"></canvas>
  </span>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

// 图标颜色过渡跟踪时间略长于 Header 的 180ms CSS 过渡，确保绘制最终色。
const COLOR_TRACKING_DURATION = 220

// Header 图标始终使用原来的 4px 正方形逻辑像素。
const ICON_PIXEL_SIZE = 4

// 图标掩码是 Header 手工像素图形的唯一来源。
const props = defineProps<{
  /**
   * 固定像素图标的字符矩阵；点号表示透明格，其他字符表示填充格。
   */
  pattern: readonly string[]
}>()

// 40×40 根容器保持 Header 原有对齐、hover 和点击范围。
const rootRef = ref<HTMLElement | null>(null)

// 单一 Canvas 替代图标内部的全部像素 DOM 节点。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 同一帧内的尺寸或图案变化合并为一次重绘。
let renderFrame: number | undefined

// 颜色过渡期间短时运行的动画帧，用于同步父导航项的计算色。
let colorTrackingFrame: number | undefined

// 当前颜色跟踪的截止时间，非交互状态不会持续重绘。
let colorTrackingDeadline = 0

// 根容器尺寸监听器用于处理缩放和布局尺寸变化。
let resizeObserver: ResizeObserver | undefined

// 父导航项类名变化监听器用于捕获 GSAP 驱动的激活项切换。
let navigationObserver: MutationObserver | undefined

// 当前图标所属导航项，负责提供 hover、激活色和过渡事件。
let navigationItem: HTMLElement | null = null

// 手工图案变化时重绘同一个 Canvas，不创建新的像素节点。
watch(props, scheduleDraw, { deep: true })

// 组件挂载后绑定父导航项的颜色变化并绘制首帧。
onMounted(mountIcon)

// 组件卸载时释放监听器和待执行动画帧。
onUnmounted(unmountIcon)

/**
 * 建立尺寸、父导航状态和颜色过渡监听。
 */
function mountIcon() {
  if (!rootRef.value) {
    return
  }

  navigationItem = rootRef.value.closest<HTMLElement>('.nav__item')
  resizeObserver = new ResizeObserver(scheduleDraw)
  resizeObserver.observe(rootRef.value)

  if (navigationItem) {
    navigationItem.addEventListener('pointerenter', startColorTracking)
    navigationItem.addEventListener('pointerleave', startColorTracking)
    navigationItem.addEventListener('transitionrun', startColorTracking)
    navigationItem.addEventListener('transitionend', finishColorTracking)
    navigationItem.addEventListener('transitioncancel', finishColorTracking)
    navigationObserver = new MutationObserver(startColorTracking)
    navigationObserver.observe(navigationItem, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  window.addEventListener('resize', scheduleDraw)
  scheduleDraw()
}

/**
 * 清理 Header 图标持有的浏览器监听和动画帧。
 */
function unmountIcon() {
  resizeObserver?.disconnect()
  navigationObserver?.disconnect()
  window.removeEventListener('resize', scheduleDraw)

  if (navigationItem) {
    navigationItem.removeEventListener('pointerenter', startColorTracking)
    navigationItem.removeEventListener('pointerleave', startColorTracking)
    navigationItem.removeEventListener('transitionrun', startColorTracking)
    navigationItem.removeEventListener('transitionend', finishColorTracking)
    navigationItem.removeEventListener('transitioncancel', finishColorTracking)
  }

  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  if (colorTrackingFrame !== undefined) {
    window.cancelAnimationFrame(colorTrackingFrame)
  }
}

/**
 * 把连续的图案、尺寸和非动画颜色变化合并到下一帧。
 */
function scheduleDraw() {
  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  renderFrame = window.requestAnimationFrame(drawIcon)
}

/**
 * 在 CSS 颜色过渡期间短时逐帧同步 Canvas 填充色。
 */
function startColorTracking() {
  colorTrackingDeadline = performance.now() + COLOR_TRACKING_DURATION

  if (colorTrackingFrame === undefined) {
    colorTrackingFrame = window.requestAnimationFrame(drawColorTransitionFrame)
  }
}

/**
 * 在过渡结束时停止跟踪并强制绘制最终计算色。
 */
function finishColorTracking(event: TransitionEvent) {
  if (event.propertyName !== 'color') {
    return
  }

  colorTrackingDeadline = 0

  if (colorTrackingFrame !== undefined) {
    window.cancelAnimationFrame(colorTrackingFrame)
    colorTrackingFrame = undefined
  }

  scheduleDraw()
}

/**
 * 读取当前过渡色并在截止时间前继续安排下一帧。
 */
function drawColorTransitionFrame(timestamp: number) {
  drawIcon()

  if (timestamp < colorTrackingDeadline) {
    colorTrackingFrame = window.requestAnimationFrame(drawColorTransitionFrame)
  } else {
    colorTrackingFrame = undefined
  }
}

/**
 * 按原 40×40 容器、4px 像素和共享白线规则绘制图标。
 */
function drawIcon() {
  renderFrame = undefined

  // 根容器提供固定布局尺寸和当前继承颜色。
  const root = rootRef.value
  // Canvas 承载图标的全部像素和白色共享边。
  const canvas = canvasRef.value

  if (!root || !canvas || root.clientWidth <= 0 || root.clientHeight <= 0) {
    return
  }

  // 设备像素比限制在 2，避免小图标占用不必要的纹理内存。
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  // 图标容器的固定 CSS 宽度。
  const width = root.clientWidth
  // 图标容器的固定 CSS 高度。
  const height = root.clientHeight
  // Canvas 对应的物理像素宽度。
  const renderWidth = Math.max(1, Math.round(width * pixelRatio))
  // Canvas 对应的物理像素高度。
  const renderHeight = Math.max(1, Math.round(height * pixelRatio))

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth
    canvas.height = renderHeight
  }

  // 二维上下文负责一次性绘制图标全部有效像素。
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  // 第一行列数沿用原 CSS Grid 的宽度计算规则。
  const columnCount = props.pattern[0]?.length ?? 1
  // 图案行数沿用原 CSS Grid 的高度计算规则。
  const rowCount = props.pattern.length || 1
  // 横向偏移把固定 4px 像素矩阵居中放进 40px 容器。
  const offsetX = (width - columnCount * ICON_PIXEL_SIZE) / 2
  // 纵向偏移把固定 4px 像素矩阵居中放进 40px 容器。
  const offsetY = (height - rowCount * ICON_PIXEL_SIZE) / 2
  // 父导航项的计算色包含默认、hover、激活和过渡中间色。
  const fillColor = window.getComputedStyle(root).color
  // 物理像素取整后的真实横向缩放比用于覆盖完整 Canvas。
  const scaleX = renderWidth / width
  // 物理像素取整后的真实纵向缩放比用于覆盖完整 Canvas。
  const scaleY = renderHeight / height

  context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false
  context.fillStyle = fillColor

  // 行循环按原矩阵坐标绘制有效像素。
  props.pattern.forEach((row, rowIndex) => {
    // 列循环跳过透明格，保留手工图标形状。
    Array.from(row).forEach((cell, columnIndex) => {
      if (cell === '.') {
        return
      }

      // 当前像素左上角的逻辑横坐标。
      const x = offsetX + columnIndex * ICON_PIXEL_SIZE
      // 当前像素左上角的逻辑纵坐标。
      const y = offsetY + rowIndex * ICON_PIXEL_SIZE

      context.fillStyle = fillColor
      context.fillRect(x, y, ICON_PIXEL_SIZE, ICON_PIXEL_SIZE)
      context.fillStyle = '#ffffff'

      if (row[columnIndex + 1] !== '.') {
        context.fillRect(x + ICON_PIXEL_SIZE - 1, y, 1, ICON_PIXEL_SIZE)
      }

      if (props.pattern[rowIndex + 1]?.[columnIndex] !== '.') {
        context.fillRect(x, y + ICON_PIXEL_SIZE - 1, ICON_PIXEL_SIZE, 1)
      }
    })
  })
}
</script>

<style scoped>
.header-pixel-icon {
  display: block;
  width: 40px;
  height: 40px;
  color: inherit;
  contain: strict;
  image-rendering: pixelated;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>

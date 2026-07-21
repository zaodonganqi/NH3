<template>
  <span ref="rootRef" class="pixel-text" role="img" :aria-label="text" :style="textStyle">
    <span ref="layoutRef" class="pixel-text__layout" aria-hidden="true">{{ text }}</span>
    <canvas ref="canvasRef" aria-hidden="true"></canvas>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { readPixelTextLayout, renderPixelText } from '../../../utils'

// 组件参数与文本工具保持一致，布局宽度仍由外部容器控制。
const props = withDefaults(defineProps<{
  /**
   * 需要按浏览器真实排版转换为像素画的原始文本。
   */
  text: string
  /**
   * 来源文字使用的 CSS 字体族；省略时继承组件最终计算样式。
   */
  fontFamily?: string
  /**
   * 来源文字字号，单位为 CSS 像素；省略时读取组件计算字号。
   */
  fontSize?: number
  /**
   * 来源文字字形样式；省略时读取组件计算样式。
   */
  fontStyle?: 'normal' | 'italic' | 'oblique'
  /**
   * 字符之间追加的间距，单位为 CSS 像素。
   */
  letterSpacing?: number
  /**
   * 多行文字基线间距，单位为 CSS 像素。
   */
  lineHeight?: number
  /**
   * 多行宽度不一致时在来源画布内采用的水平对齐方式。
   */
  textAlign?: 'left' | 'center' | 'right'
  /**
   * 像素文字填充使用的纯色或受支持渐变；省略时继承普通 CSS 颜色。
   */
  color?: string
  /**
   * 每个 em 沿单轴允许的最大逻辑格数量；数值越大采样越细。
   */
  density?: number
}>(), {
  density: 16,
})

// 显式 JS 参数同步到不可见普通文本，使浏览器布局与 Canvas 结果一致。
const textStyle = computed(() => ({
  fontFamily: props.fontFamily,
  fontSize: props.fontSize === undefined ? undefined : `${props.fontSize}px`,
  fontStyle: props.fontStyle,
  letterSpacing: props.letterSpacing === undefined ? undefined : `${props.letterSpacing}px`,
  lineHeight: props.lineHeight === undefined ? undefined : `${props.lineHeight}px`,
  textAlign: props.textAlign,
}))

// 组件根节点提供外部 CSS 尺寸和字体样式的读取边界。
const rootRef = ref<HTMLElement | null>(null)
// 不可见普通文本由浏览器负责真实换行和自然高度计算。
const layoutRef = ref<HTMLElement | null>(null)
// Canvas 承载经过 DPR 量化后的最终像素结果。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 合并同一帧内连续触发的样式和尺寸更新。
let renderFrame: number | undefined
// 中止已经被新文本或新样式替代的异步生成任务。
let renderController: AbortController | undefined
// 监听外部 CSS 控制的组件区域尺寸变化。
let resizeObserver: ResizeObserver | undefined

// 任一 JS 文本参数变化都需要重新生成来源掩码。
watch(
  () => [
    props.text,
    props.fontFamily,
    props.fontSize,
    props.fontStyle,
    props.letterSpacing,
    props.lineHeight,
    props.textAlign,
    props.color,
    props.density,
  ],
  scheduleGeneration,
)

// 组件挂载后读取最终 CSS 并生成首个像素文本。
onMounted(async () => {
  await nextTick()

  if (rootRef.value) {
    resizeObserver = new ResizeObserver(scheduleGeneration)
    resizeObserver.observe(rootRef.value)
  }

  scheduleGeneration()
})

// 组件卸载时清理动画帧、异步任务和尺寸监听。
onUnmounted(() => {
  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  renderController?.abort()
  resizeObserver?.disconnect()
})

/**
 * 把连续的 ResizeObserver 和文本更新合并到下一动画帧。
 */
function scheduleGeneration() {
  if (renderFrame !== undefined) {
    window.cancelAnimationFrame(renderFrame)
  }

  renderFrame = window.requestAnimationFrame(generateText)
}

/**
 * 从组件根节点读取普通文字 CSS，并重新生成对应像素掩码。
 */
async function generateText() {
  // 根节点包含字体、对齐、颜色和最终区域的计算样式。
  const root = rootRef.value
  // 普通文本布局节点提供浏览器已经计算完成的换行结果。
  const layout = layoutRef.value
  // 目标 Canvas 必须已经进入布局后才能读取可用尺寸。
  const canvas = canvasRef.value

  if (!root || !layout || !canvas || root.clientWidth <= 0 || root.clientHeight <= 0) {
    return
  }

  // 浏览器计算样式是组件唯一的文字视觉配置来源。
  const style = window.getComputedStyle(root)
  // JS 字号优先，未传时使用真实 CSS 字号，异常值才回退浏览器常规 16px。
  const fontSize = Math.max(
    1,
    props.fontSize ?? (Number.parseFloat(style.fontSize) || 16),
  )
  // normal 行高回退到常规文本使用的 1.2 倍字号。
  const lineHeight = props.lineHeight ?? (
    style.lineHeight === 'normal'
      ? fontSize * 1.2
      : Math.max(1, Number.parseFloat(style.lineHeight) || fontSize * 1.2)
  )
  // normal 字距在 Canvas 文本测量中等价于零。
  const letterSpacing = props.letterSpacing ?? (
    style.letterSpacing === 'normal'
      ? 0
      : Number.parseFloat(style.letterSpacing) || 0
  )
  // 颜色和渐变由 JS color 参数配置，未传时使用继承的普通 CSS 颜色。
  const paint = props.color ?? style.color
  // density 是每 em 的颗粒数量上限，小字号会由工具自动降低实际密度。
  const density = props.density
  // Canvas API 只支持工具声明的三种文本对齐值。
  const textAlign = props.textAlign ?? (
    style.textAlign === 'center' || style.textAlign === 'right'
      ? style.textAlign
      : 'left'
  )
  // CSS font-style 归一化为文本工具支持的枚举值。
  const fontStyle = props.fontStyle ?? (
    style.fontStyle === 'italic' || style.fontStyle === 'oblique'
      ? style.fontStyle
      : 'normal'
  )
  // 字体族同样优先使用 JS 参数。
  const fontFamily = props.fontFamily ?? style.fontFamily
  // 工具函数读取浏览器普通文本行盒，组件不维护字形换行算法。
  const renderedText = readPixelTextLayout(layout)
  renderController?.abort()
  renderController = new AbortController()

  try {
    // 组件只把 JS 参数和目标 Canvas 交给工具函数。
    await renderPixelText(canvas, renderedText, {
      fontFamily,
      fontSize,
      fontStyle,
      letterSpacing,
      lineHeight,
      textAlign,
      color: paint,
      density,
      signal: renderController.signal,
    })
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      // 非取消错误时清空旧结果，避免展示与当前文字不一致的内容。
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

</script>

<style scoped>
.pixel-text {
  position: relative;
  display: block;
  min-width: 1px;
  white-space: pre-wrap;
}

.pixel-text__layout {
  display: block;
  visibility: hidden;
  white-space: inherit;
}

canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>

<template>
  <div ref="sceneRef" class="shape-curtain-background" aria-hidden="true">
    <div class="shape-curtain-background__stage">
      <div ref="curtainRef" class="shape-curtain-background__curtain">
        <canvas
          ref="canvasRef"
          class="shape-curtain-background__canvas"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type ShapeKind = 'circle' | 'triangle' | 'square' | 'star'

/**
 * 描述幕布中一个保持静止的基础几何图形。
 */
interface CurtainShape {
  // 图形类型决定圆形、三角形、方形或五角星轮廓。
  kind: ShapeKind
  // 图形中心的 CSS 横坐标。
  x: number
  // 图形中心的 CSS 纵坐标。
  y: number
  // 图形外接范围的 CSS 像素尺寸。
  size: number
  // 图形加载时确定的静态朝向。
  rotation: number
  // 图形内部使用的完全不透明纯色。
  color: string
  // 图形所属层级决定尺寸、密度和绘制顺序。
  layer: number
}

// 幕布初始只从左侧露出一条窄带，让滚动方向和展开起点保持明确。
const INITIAL_CURTAIN_REVEAL = 0.045
// Canvas 像素比设置上限，兼顾高分屏白色细边和高密度静态图形的绘制开销。
const MAX_CANVAS_PIXEL_RATIO = 2
// 四类基础图形按固定顺序参与随机分配。
const SHAPE_KINDS: readonly ShapeKind[] = ['circle', 'triangle', 'square', 'star']
// 底层增加圆形和方形权重，用完整轮廓封住三角形与星形留下的空隙。
const BASE_SHAPE_KINDS: readonly ShapeKind[] = [
  'circle',
  'circle',
  'square',
  'square',
  'triangle',
  'star',
]
// 三层配色全部保持低饱和浅色，只用有限明度差建立前后层级。
const LAYER_PALETTES = [
  ['#e7ecff', '#ddf4f1', '#ede5fb', '#fbe5ea'],
  ['#d5ddf4', '#cfe9e5', '#e4d9f3', '#f1d7df'],
  ['#bec9ed', '#afd8d3', '#d2c3e9', '#edc3cd'],
] as const
// 三层尺寸比例与 TOOL 的远、中、近景关系保持一致。
const LAYER_SCALES = [0.92, 1.24, 1.62] as const
// 静态朝向量化为 15 度步进，随机感明确但不会产生动态旋转。
const ROTATION_STEP = Math.PI / 12
// 所有图形统一使用两个 CSS 像素的白色轮廓线，密集重叠时仍保留清晰边缘。
const SHAPE_STROKE_WIDTH = 2
// 几何外沿在窄屏保留的最小透明边带宽度。
const CURTAIN_EDGE_BAND_MIN = 72
// 几何外沿在宽屏保留的最大透明边带宽度。
const CURTAIN_EDGE_BAND_MAX = 120
// Canvas 主体使用 TOOL 章节背景色铺底，最右侧仅保留几何外沿所需透明边带。
const CURTAIN_BACKGROUND_COLOR = '#f8faff'
// 背景场景根节点作为 ScrollTrigger 的固定区域。
const sceneRef = ref<HTMLElement | null>(null)
// 幕布节点提供固定绘制尺寸和裁切范围，本身不参与滚动位移。
const curtainRef = ref<HTMLElement | null>(null)
// 单一 Canvas 承载全部高密度图形，并作为滚动时唯一移动的合成层。
const canvasRef = ref<HTMLCanvasElement | null>(null)
// 当前图形集合会在容器尺寸变化时按固定种子重新生成。
let curtainShapes: CurtainShape[] = []
// Canvas 的 CSS 宽度用于布局、裁切和图形坐标计算。
let canvasWidth = 0
// Canvas 的 CSS 高度用于布局、裁切和图形坐标计算。
let canvasHeight = 0
// 幕布纯色主体的右边界，完整几何图形会自然伸入其后的透明边带。
let curtainBodyEdge = 0
// 当前设备采用的受限像素比用于绘制清晰的 2px 边框。
let canvasPixelRatio = 1
// 固定种子随机状态保证同一尺寸下的构图保持稳定。
let randomState = 1
// 背景组件内部 GSAP 上下文负责统一回收时间线和滚动触发器。
let backgroundContext: gsap.Context | undefined
// 尺寸观察器只在幕布真实尺寸变化时重建图形集合。
let curtainResizeObserver: ResizeObserver | undefined
/**
 * 初始化稳定随机序列，尺寸相同的画布会得到相同构图。
 */
function seedRandom(seed: number) {
  randomState = seed >>> 0 || 1
}

/**
 * 生成零到一之间的稳定伪随机数，仅用于幕布图形排布。
 */
function nextRandom() {
  randomState += 0x6d2b79f5
  let value = randomState
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296
}

/**
 * 在给定最小值和最大值之间生成稳定随机数。
 */
function randomBetween(minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * nextRandom()
}

/**
 * 从只读集合中选取一个稳定随机成员。
 */
function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(nextRandom() * items.length)] as T
}

/**
 * 从 TOOL 对应层级的固定调色板中选取纯色。
 */
function pickLayerColor(layer: number) {
  // 层级越界时回退到最浅的远景调色板。
  const palette = LAYER_PALETTES[layer] ?? LAYER_PALETTES[0]

  return pickRandom(palette)
}

/**
 * 根据 Canvas 宽度解析几何外沿透明边带和主体结束位置。
 */
function resolveCurtainBodyEdge(width: number) {
  // 边带宽度随画布响应式变化，但不会在极端屏幕下过宽或消失。
  const edgeBand = gsap.utils.clamp(
    CURTAIN_EDGE_BAND_MIN,
    CURTAIN_EDGE_BAND_MAX,
    width * 0.055,
  )

  return width - edgeBand
}

/**
 * 根据 Canvas 尺寸生成密集、重叠且完全静止的几何幕布。
 */
function createCurtainShapes(width: number, height: number, bodyEdge: number) {
  // 基础尺寸随短边调整，宽屏不会把几何元素横向拉长。
  const spacing = gsap.utils.clamp(42, 62, Math.min(width, height) / 15)
  // 横向中心距离小于图形直径，保证海洋球池式持续覆盖。
  const columnStep = spacing * 0.52
  // 纵向中心距离略小于横向距离，避免出现水平底色缝隙。
  const rowStep = spacing * 0.48
  // 左右额外生成四列以覆盖大图形旋转后的边缘。
  const columnCount = Math.ceil(width / columnStep) + 4
  // 上下额外生成四行以覆盖大图形旋转后的边缘。
  const rowCount = Math.ceil(height / rowStep) + 4
  // 当前尺寸派生的种子让响应式重排稳定且不依赖加载先后。
  const dimensionSeed = Math.round(width * 17 + height * 31 + 20260802)
  // 新集合先用密集错位网格覆盖，再通过有限扰动打散规则感。
  const nextShapes: CurtainShape[] = []

  seedRandom(dimensionSeed)

  for (let row = -2; row < rowCount - 2; row += 1) {
    // 相邻行错开半步，使圆形和多边形更接近自然堆叠。
    const staggerOffset = row % 2 === 0 ? columnStep * 0.5 : 0

    for (let column = -2; column < columnCount - 2; column += 1) {
      // 大多数元素属于远景，少量中近景负责遮挡和尺度变化。
      const layerRoll = nextRandom()
      // 非均匀分层避免大尺寸强调色吞掉浅色基底。
      const layer = layerRoll < 0.72 ? 0 : layerRoll < 0.94 ? 1 : 2
      // 图形尺寸在所属层级内保留少量随机差异。
      const size = spacing * (LAYER_SCALES[layer] ?? LAYER_SCALES[0])
        * randomBetween(0.94, 1.12)
      // 横坐标扰动不超过间距的 14%，维持覆盖率和整体秩序。
      const x = column * columnStep + staggerOffset
        + randomBetween(-spacing * 0.14, spacing * 0.14)
      // 纵坐标使用独立扰动，避免显露规则行列。
      const y = row * rowStep + randomBetween(-spacing * 0.14, spacing * 0.14)
      // 图形朝向在初始化时确定，后续滚动中不会自旋或抖动。
      const rotation = Math.floor(nextRandom() * 24) * ROTATION_STEP
      // 外接半径用于保证最右侧图形不会被 Canvas 自身边缘切断。
      const radius = size / 2

      if (x + radius > width - SHAPE_STROKE_WIDTH) {
        continue
      }

      if (x - radius > bodyEdge) {
        continue
      }

      nextShapes.push({
        kind: pickRandom(layer === 0 ? BASE_SHAPE_KINDS : SHAPE_KINDS),
        x,
        y,
        size,
        rotation,
        color: pickLayerColor(layer),
        layer,
      })
    }
  }

  return nextShapes.sort((left, right) => left.layer - right.layer)
}

/**
 * 绘制一个以当前坐标原点为圆心的圆形路径。
 */
function drawCircle(context: CanvasRenderingContext2D, radius: number) {
  context.arc(0, 0, radius, 0, Math.PI * 2)
}

/**
 * 绘制一个以当前坐标原点为中心的正三角形路径。
 */
function drawTriangle(context: CanvasRenderingContext2D, radius: number) {
  for (let index = 0; index < 3; index += 1) {
    // 三角形首个顶点从正上方开始。
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 3
    // 当前顶点的水平坐标由外接圆半径得到。
    const x = Math.cos(angle) * radius
    // 当前顶点的垂直坐标由外接圆半径得到。
    const y = Math.sin(angle) * radius

    if (index === 0) {
      context.moveTo(x, y)
    } else {
      context.lineTo(x, y)
    }
  }

  context.closePath()
}

/**
 * 绘制一个与其他图形外接范围一致的正方形路径。
 */
function drawSquare(context: CanvasRenderingContext2D, radius: number) {
  // 正方形边长由外接圆半径换算，旋转时不会突然放大。
  const side = radius * Math.SQRT2

  context.rect(-side / 2, -side / 2, side, side)
}

/**
 * 绘制一个十个顶点组成的规则五角星路径。
 */
function drawStar(context: CanvasRenderingContext2D, radius: number) {
  // 内半径使用标准五角星比例，保持尖角与凹口协调。
  const innerRadius = radius * 0.382

  for (let index = 0; index < 10; index += 1) {
    // 偶数顶点位于外接圆，奇数顶点位于内接圆。
    const pointRadius = index % 2 === 0 ? radius : innerRadius
    // 五角星首个尖角从正上方开始。
    const angle = -Math.PI / 2 + index * Math.PI / 5
    // 当前顶点的水平坐标。
    const x = Math.cos(angle) * pointRadius
    // 当前顶点的垂直坐标。
    const y = Math.sin(angle) * pointRadius

    if (index === 0) {
      context.moveTo(x, y)
    } else {
      context.lineTo(x, y)
    }
  }

  context.closePath()
}

/**
 * 根据图形类型构建纯色几何轮廓路径。
 */
function createShapePath(
  context: CanvasRenderingContext2D,
  kind: ShapeKind,
  radius: number,
) {
  context.beginPath()

  if (kind === 'circle') {
    drawCircle(context, radius)
  } else if (kind === 'triangle') {
    drawTriangle(context, radius)
  } else if (kind === 'square') {
    drawSquare(context, radius)
  } else {
    drawStar(context, radius)
  }
}

/**
 * 一次性绘制完整静态幕布，滚动期间只移动 Canvas 合成层。
 */
function renderCurtain() {
  // Canvas 节点在组件卸载或尺寸切换阶段可能暂时不可用。
  const canvas = canvasRef.value
  // 二维上下文负责全部纯色填充和白色内外边线。
  const context = canvas?.getContext('2d')

  if (!canvas || !context || canvasWidth <= 0 || canvasHeight <= 0) {
    return
  }

  // 实际横向缩放比覆盖物理 Canvas 的取整误差。
  const scaleX = canvas.width / canvasWidth
  // 实际纵向缩放比覆盖物理 Canvas 的取整误差。
  const scaleY = canvas.height / canvasHeight
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  context.fillStyle = CURTAIN_BACKGROUND_COLOR
  context.fillRect(0, 0, curtainBodyEdge, canvasHeight)
  context.imageSmoothingEnabled = true
  context.lineJoin = 'miter'
  context.lineCap = 'butt'
  context.lineWidth = SHAPE_STROKE_WIDTH

  for (const shape of curtainShapes) {
    context.save()
    context.translate(shape.x, shape.y)
    context.rotate(shape.rotation)
    context.globalAlpha = 1
    context.fillStyle = shape.color
    context.strokeStyle = '#ffffff'
    createShapePath(context, shape.kind, shape.size / 2)
    context.fill()
    context.stroke()
    context.restore()
  }
}

/**
 * 同步 Canvas 内部像素尺寸并按新视口重新生成密集图形。
 */
function resizeCurtainCanvas() {
  // 幕布真实尺寸决定 Canvas 坐标系统和图形数量。
  const curtain = curtainRef.value
  // Canvas 节点用于写入匹配设备像素比的内部尺寸。
  const canvas = canvasRef.value

  if (!curtain || !canvas) {
    return
  }

  // 当前可见幕布区域不包含桌面导航栏预留空间。
  const bounds = curtain.getBoundingClientRect()
  // CSS 宽度至少取一像素，避免隐藏阶段创建无效画布。
  canvasWidth = Math.max(1, Math.round(bounds.width))
  // CSS 高度至少取一像素，避免移动端地址栏变化期间归零。
  canvasHeight = Math.max(1, Math.round(bounds.height))
  // 限制设备像素比，防止高分屏下 Canvas 内存和重绘成本成倍增长。
  canvasPixelRatio = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_PIXEL_RATIO)
  canvas.width = Math.round(canvasWidth * canvasPixelRatio)
  canvas.height = Math.round(canvasHeight * canvasPixelRatio)
  curtainBodyEdge = resolveCurtainBodyEdge(canvasWidth)
  curtainShapes = createCurtainShapes(canvasWidth, canvasHeight, curtainBodyEdge)
  renderCurtain()
}

/**
 * 根据幕布和视口宽度计算只露出左侧窄带时的起始位移。
 */
function resolveCurtainStartX(curtainWidth: number, viewportWidth: number) {
  // 初始可见宽度始终按真实视口计算，不受幕布额外边带宽度影响。
  const initialVisibleWidth = viewportWidth * INITIAL_CURTAIN_REVEAL

  return -(curtainWidth - initialVisibleWidth)
}

/**
 * 建立由真实滚动进度直接驱动的整张 Canvas 平移场景。
 */
function createCurtainScene() {
  // 固定场景根节点提供视口宽度和 ScrollTrigger 区间。
  const scene = sceneRef.value
  // 幕布节点提供不受位移影响的真实绘制宽度。
  const curtain = curtainRef.value
  // Canvas 在绘制完成后作为唯一水平移动的合成层。
  const canvas = canvasRef.value

  if (!scene || !curtain || !canvas) {
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(canvas, { x: 0 })
    return
  }

  gsap.set(canvas, { force3D: true })
  // 快速写入器只更新 Canvas 合成层位移，不触发位图重绘。
  const setCanvasX = gsap.quickSetter(canvas, 'x', 'px') as (value: number) => void
  /**
   * 把当前滚动进度直接映射为整张 Canvas 的整数像素位移。
   */
  const renderCanvasPosition = (progress: number) => {
    // 幕布宽度包含用于容纳完整几何边缘的额外透明区域。
    const curtainWidth = curtain.getBoundingClientRect().width
    // 章节宽度对应当前真实视口可见范围。
    const viewportWidth = scene.getBoundingClientRect().width
    // 起始位移让幕布最右侧几何边缘先进入视口左边。
    const startX = resolveCurtainStartX(curtainWidth, viewportWidth)
    // 当前位移从起始负值线性回到零，画布内容本身不发生变化。
    const x = Math.round(startX * (1 - gsap.utils.clamp(0, 1, progress)))

    setCanvasX(x)
  }
  // 固定触发器只负责滚动区间和直接位置回调，不创建带时长的 scrub。
  const curtainTrigger = ScrollTrigger.create({
    trigger: scene,
    start: 'top top',
    end: () => `+=${Math.max(window.innerHeight * 2.1, 1500)}`,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => renderCanvasPosition(self.progress),
    onRefresh: (self) => renderCanvasPosition(self.progress),
  })

  renderCanvasPosition(curtainTrigger.progress)
}

// 组件挂载后先完成 Canvas 测量，再创建依赖真实尺寸的固定滚动场景。
onMounted(async () => {
  await nextTick()

  resizeCurtainCanvas()
  curtainResizeObserver = new ResizeObserver(resizeCurtainCanvas)

  if (curtainRef.value) {
    curtainResizeObserver.observe(curtainRef.value)
  }

  backgroundContext = gsap.context(createCurtainScene, sceneRef.value ?? undefined)
  ScrollTrigger.refresh()
})

// 组件卸载时停止观察尺寸并回收全部 GSAP 时间线和固定占位。
onUnmounted(() => {
  curtainResizeObserver?.disconnect()
  backgroundContext?.revert()
})
</script>

<style scoped>
.shape-curtain-background {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 620px;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
}

.shape-curtain-background__stage {
  --shape-curtain-top-clearance: clamp(112px, 12vh, 142px);
  --shape-curtain-overflow: clamp(100px, 8vw, 160px);

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
}

.shape-curtain-background__curtain {
  position: absolute;
  top: var(--shape-curtain-top-clearance);
  right: auto;
  bottom: 0;
  left: 0;
  width: calc(100% + var(--shape-curtain-overflow));
  contain: layout paint style;
  overflow: hidden;
  background: transparent;
}

.shape-curtain-background__canvas {
  display: block;
  width: 100%;
  height: 100%;
  transform: translate3d(calc(-100% + 4.5vw), 0, 0);
  backface-visibility: hidden;
  will-change: transform;
}

@media (max-width: 820px) {
  .shape-curtain-background {
    min-height: 540px;
  }

  .shape-curtain-background__stage {
    --shape-curtain-top-clearance: 24px;
    --shape-curtain-overflow: clamp(72px, 16vw, 96px);
  }
}

</style>

<template>
  <div ref="fieldRef" class="tool-depth-field" aria-hidden="true">
    <canvas ref="farCanvasRef" class="tool-depth-field__layer tool-depth-field__layer--far"></canvas>
    <canvas ref="middleCanvasRef" class="tool-depth-field__layer tool-depth-field__layer--middle"></canvas>
    <canvas ref="nearCanvasRef" class="tool-depth-field__layer tool-depth-field__layer--near"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'

/**
 * 描述一张预绘景深 Canvas 的像素矩阵、厚度和滚动范围。
 */
interface PixelDepthLayer {
  // 单个正面像素方块的边长。
  cellSize: number
  // 同一矩阵内相邻方块之间的白色间隔。
  gapSize: number
  // 方块正面和背面保留的白色边线宽度。
  borderSize: number
  // 背面相对正面的整像素偏移，形成离散厚度。
  depthOffset: number
  // 中间切片按正面色系一一对应的低饱和调色板。
  middlePalette: readonly string[]
  // 最后切片按正面色系一一对应的较深调色板。
  backPalette: readonly string[]
  // 不同层使用独立种子切换纯色顺序。
  seed: number
  // 滚动起点的水平位移比例。
  startX: number
  // 滚动终点的水平位移比例。
  endX: number
  // 滚动起点的垂直位移比例。
  startY: number
  // 滚动终点的垂直位移比例。
  endY: number
  // 水平方向为整段运动预留的画布范围。
  overscanX: number
  // 垂直方向为整段运动预留的画布范围。
  overscanY: number
  // 当前层允许使用的低饱和纯色调色板。
  palette: readonly string[]
  // 规则矩阵在视口中的归一化锚点。
  anchors: readonly (readonly [number, number])[]
  // 多种小型矩阵图案按锚点轮换使用。
  patterns: readonly (readonly string[])[]
}

// 三层 Canvas 只在尺寸变化时预绘，滚动期间仅由 GSAP 移动合成层。
const depthLayers: readonly PixelDepthLayer[] = [
  {
    cellSize: 7,
    gapSize: 3,
    borderSize: 1,
    depthOffset: 2,
    middlePalette: ['#d5ddf4', '#cfe9e5', '#e4d9f3', '#f1d7df'],
    backPalette: ['#c4cee8', '#bedbd5', '#d5c8e9', '#e7c6d0'],
    seed: 3,
    startX: -0.015,
    endX: 0.035,
    startY: 0.04,
    endY: -0.1,
    overscanX: 0.1,
    overscanY: 0.2,
    palette: ['#e3e9fb', '#def2ef', '#eee5fa', '#f9e7ed'],
    anchors: [
      [0.02, 0.08], [0.13, 0.2], [0.27, 0.07], [0.4, 0.23],
      [0.56, 0.1], [0.72, 0.24], [0.88, 0.08], [0.97, 0.28],
      [0.06, 0.48], [0.2, 0.62], [0.36, 0.43], [0.52, 0.58],
      [0.68, 0.44], [0.83, 0.62], [0.96, 0.5], [0.08, 0.84],
      [0.26, 0.94], [0.48, 0.8], [0.7, 0.93], [0.9, 0.82],
      [0.16, 1.05], [0.38, 1.12], [0.62, 1.04], [0.84, 1.14],
    ],
    patterns: [
      ['101', '111', '010'],
      ['1101', '0110', '1011'],
      ['1010', '0111', '1100'],
    ],
  },
  {
    cellSize: 19,
    gapSize: 5,
    borderSize: 1,
    depthOffset: 6,
    middlePalette: ['#a9b9e7', '#9dd3cd', '#cbb5e7', '#e7adbc'],
    backPalette: ['#91a3d4', '#82bdb7', '#b09bd2', '#d290a2'],
    seed: 7,
    startX: -0.06,
    endX: 0.13,
    startY: 0.14,
    endY: -0.42,
    overscanX: 0.2,
    overscanY: 0.46,
    palette: ['#b9c8f4', '#afe0da', '#d9c6f3', '#f2c2ce'],
    anchors: [
      [0.01, 0.22], [0.18, 0.05], [0.36, 0.3], [0.54, 0.08],
      [0.73, 0.28], [0.91, 0.12], [0.04, 0.7], [0.24, 0.88],
      [0.58, 0.78], [0.88, 0.68],
      [0.12, 1.12], [0.34, 1.3], [0.62, 1.18], [0.82, 1.34],
    ],
    patterns: [
      ['110', '011', '101'],
      ['111', '010', '011'],
      ['101', '111', '001'],
    ],
  },
  {
    cellSize: 48,
    gapSize: 10,
    borderSize: 2,
    depthOffset: 11,
    middlePalette: ['#7085c6', '#59a39c', '#8a68b5', '#c46a80'],
    backPalette: ['#5f70aa', '#498d87', '#76579d', '#aa586d'],
    seed: 11,
    startX: -0.12,
    endX: 0.24,
    startY: 0.3,
    endY: -0.55,
    overscanX: 0.4,
    overscanY: 0.62,
    palette: ['#8299e3', '#68bdb4', '#a77fd4', '#df8198'],
    anchors: [
      [0.12, 0.18], [0.02, 0.73], [0.48, 0.17],
      [0.9, 0.38], [0.4, 0.98], [0.77, 0.96],
      [-0.12, 0.68], [0, 1.15], [0.27, 1.42],
      [0.58, 1.24], [0.68, 1.46], [0.72, 0.62],
    ],
    patterns: [
      ['110', '011'],
      ['10', '11'],
      ['111', '010', '010'],
    ],
  },
]

// 景深容器提供实际视口内的响应式宽高。
const fieldRef = ref<HTMLDivElement | null>(null)
// 远层 Canvas 预绘最细小的规则矩阵。
const farCanvasRef = ref<HTMLCanvasElement | null>(null)
// 中层 Canvas 预绘中等尺寸的规则矩阵。
const middleCanvasRef = ref<HTMLCanvasElement | null>(null)
// 近层 Canvas 预绘最大且厚度最明显的规则矩阵。
const nearCanvasRef = ref<HTMLCanvasElement | null>(null)
// 三个 Canvas 引用与三层配置保持相同顺序。
const layerCanvasRefs = [farCanvasRef, middleCanvasRef, nearCanvasRef] as const

// 当前视口宽度用于计算三层整数像素位移。
let fieldWidth = 0
// 当前视口高度用于计算三层整数像素位移。
let fieldHeight = 0
// 最近一次主时间线传入的滚动进度在重绘后继续生效。
let depthProgress = 0
// 容器尺寸变化时重新预绘三张 Canvas。
let resizeObserver: ResizeObserver | undefined
// 三层 Canvas 的水平快速写入器避免滚动时重复解析 GSAP 属性。
let layerXSetters: Array<(value: number) => void> = []
// 三层 Canvas 的垂直快速写入器与水平写入器保持相同索引。
let layerYSetters: Array<(value: number) => void> = []

// 组件挂载后监听尺寸并预绘全部三层。
onMounted(() => {
  // 景深容器是三张 Canvas 的尺寸来源。
  const field = fieldRef.value

  if (!field) {
    return
  }

  resizeObserver = new ResizeObserver(drawDepthLayers)
  resizeObserver.observe(field)
  // 已挂载的 Canvas 仅初始化一次快速 transform 写入器。
  const canvases = layerCanvasRefs
    .map((canvasRef) => canvasRef.value)
    .filter((canvas): canvas is HTMLCanvasElement => Boolean(canvas))

  gsap.set(canvases, { force3D: true })
  layerXSetters = canvases.map(
    (canvas) => gsap.quickSetter(canvas, 'x', 'px') as (value: number) => void,
  )
  layerYSetters = canvases.map(
    (canvas) => gsap.quickSetter(canvas, 'y', 'px') as (value: number) => void,
  )
  drawDepthLayers()
})

// 组件卸载时停止尺寸监听并清除 GSAP 合成层状态。
onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  layerXSetters = []
  layerYSetters = []
  gsap.set(layerCanvasRefs.map((canvasRef) => canvasRef.value).filter(Boolean), { clearProps: 'transform' })
})

/**
 * 接收 TOOL 主 ScrollTrigger 进度，并仅移动预绘 Canvas 合成层。
 */
function renderProgress(progress: number) {
  depthProgress = Math.max(0, Math.min(1, progress))

  for (let index = 0; index < depthLayers.length; index += 1) {
    // 当前配置决定该层相对滚动距离。
    const layer = depthLayers[index]
    // 当前层使用预先创建的快速写入器更新合成 transform。
    const setX = layerXSetters[index]
    // 垂直写入器与当前层的水平写入器成对存在。
    const setY = layerYSetters[index]

    if (!layer || !setX || !setY) {
      continue
    }

    // 水平位移取整后仍保持连续帧更新和硬边像素。
    const x = Math.round(
      fieldWidth * (layer.startX + ((layer.endX - layer.startX) * depthProgress)),
    )
    // 垂直位移越接近前景越大，形成明显速度差。
    const y = Math.round(
      fieldHeight * (layer.startY + ((layer.endY - layer.startY) * depthProgress)),
    )

    setX(x)
    setY(y)
  }
}

/**
 * 按当前容器尺寸一次性预绘远、中、近三层 Canvas。
 */
function drawDepthLayers() {
  // 容器边界提供不受内部 transform 影响的布局尺寸。
  const field = fieldRef.value

  if (!field) {
    return
  }

  // 响应式边界用于更新三层共同的视口尺寸。
  const bounds = field.getBoundingClientRect()

  fieldWidth = Math.max(1, Math.round(bounds.width))
  fieldHeight = Math.max(1, Math.round(bounds.height))

  for (let index = 0; index < depthLayers.length; index += 1) {
    // 当前层配置与对应 Canvas 一一匹配。
    const layer = depthLayers[index]
    // 当前 Canvas 只在这里重新分配缓冲区。
    const canvas = layerCanvasRefs[index]?.value

    if (!layer || !canvas) {
      continue
    }

    drawLayerCanvas(canvas, layer)
  }

  renderProgress(depthProgress)
}

/**
 * 在带有运动预留区的单张 Canvas 上预绘一层重复矩阵。
 */
function drawLayerCanvas(canvas: HTMLCanvasElement, layer: PixelDepthLayer) {
  // 横向预留区覆盖该层完整位移范围。
  const overscanX = Math.round(fieldWidth * layer.overscanX)
  // 纵向预留区覆盖该层完整位移范围。
  const overscanY = Math.round(fieldHeight * layer.overscanY)
  // Canvas 逻辑宽度包含视口和左右预留区。
  const canvasWidth = fieldWidth + (overscanX * 2)
  // Canvas 逻辑高度包含视口和上下预留区。
  const canvasHeight = fieldHeight + (overscanY * 2)
  // 背景纹理按 CSS 像素绘制，再由 pixelated 放大到物理像素。
  const context = canvas.getContext('2d', { alpha: true })

  if (!context) {
    return
  }

  canvas.width = canvasWidth
  canvas.height = canvasHeight
  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  canvas.style.left = `${-overscanX}px`
  canvas.style.top = `${-overscanY}px`
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvasWidth, canvasHeight)
  context.imageSmoothingEnabled = false

  // 当前屏幕宽度只统一调整颗粒尺寸，不改变三层比例。
  const pixelScale = resolvePixelScale(fieldWidth)
  // 方块尺寸保持整数 CSS 像素。
  const cellSize = Math.max(4, Math.round(layer.cellSize * pixelScale))
  // 矩阵间隔量化为整数像素。
  const gapSize = Math.max(1, Math.round(layer.gapSize * pixelScale))
  // 白色内部边线至少保留一个像素。
  const borderSize = Math.max(1, Math.round(layer.borderSize * pixelScale))
  // 离散厚度同步按屏幕颗粒尺度调整。
  const depthOffset = Math.max(1, Math.round(layer.depthOffset * pixelScale))

  for (let anchorIndex = 0; anchorIndex < layer.anchors.length; anchorIndex += 1) {
    // 当前锚点决定矩阵在原始视口中的位置。
    const anchor = layer.anchors[anchorIndex]
    // 图案按锚点轮换，预绘结果保持稳定。
    const pattern = layer.patterns[anchorIndex % layer.patterns.length]

    if (!anchor || !pattern) {
      continue
    }

    // 当前矩阵水平位置包含左侧预留区，整段位移由 Canvas transform 完成。
    const clusterX = overscanX + (anchor[0] * fieldWidth)
    // 当前矩阵垂直位置包含顶部预留区，避免绘制无意义的整屏副本。
    const clusterY = overscanY + (anchor[1] * fieldHeight)

    drawPixelCluster(
      context,
      layer,
      pattern,
      anchorIndex,
      clusterX,
      clusterY,
      cellSize,
      gapSize,
      borderSize,
      depthOffset,
      canvasWidth,
      canvasHeight,
    )
  }
}

/**
 * 绘制一组由前后两层正方形叠成的低饱和像素薄片。
 */
function drawPixelCluster(
  context: CanvasRenderingContext2D,
  layer: PixelDepthLayer,
  pattern: readonly string[],
  anchorIndex: number,
  clusterX: number,
  clusterY: number,
  cellSize: number,
  gapSize: number,
  borderSize: number,
  depthOffset: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  // 每个矩阵只选择一种正面色，避免同一图案内部出现彩纸式噪点。
  const colorIndex = (layer.seed + anchorIndex) % layer.palette.length
  // 当前矩阵全部正面方块共享同一种纯色。
  const frontColor = layer.palette[colorIndex] ?? layer.palette[0] ?? '#b9c8f4'
  // 当前矩阵中间切片与正面色保持同一色系。
  const middleColor = layer.middlePalette[colorIndex] ?? layer.middlePalette[0] ?? '#a9b9e7'
  // 当前矩阵最后切片提供最深的离散厚度。
  const backColor = layer.backPalette[colorIndex] ?? layer.backPalette[0] ?? '#91a3d4'

  for (let rowIndex = 0; rowIndex < pattern.length; rowIndex += 1) {
    // 当前图案行保存本行需要绘制的方块。
    const row = pattern[rowIndex]

    if (!row) {
      continue
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (row[columnIndex] !== '1') {
        continue
      }

      // 当前正面方块的水平坐标保持整数像素。
      const x = Math.round(clusterX + (columnIndex * (cellSize + gapSize)))
      // 当前正面方块的垂直坐标保持整数像素。
      const y = Math.round(clusterY + (rowIndex * (cellSize + gapSize)))

      if (
        x > canvasWidth
        || y > canvasHeight
        || x + cellSize + depthOffset < 0
        || y + cellSize + depthOffset < 0
      ) {
        continue
      }

      // 三张切片的内部填充尺寸一致，保持纯色正方形边界。
      const innerSize = Math.max(0, cellSize - (borderSize * 2))
      // 中间切片落在正面和背面的整数中点。
      const middleOffset = Math.max(1, Math.round(depthOffset * 0.5))

      context.fillStyle = '#ffffff'
      context.fillRect(x + depthOffset, y + depthOffset, cellSize, cellSize)
      context.fillStyle = backColor
      context.fillRect(
        x + depthOffset + borderSize,
        y + depthOffset + borderSize,
        innerSize,
        innerSize,
      )
      context.fillStyle = '#ffffff'
      context.fillRect(x + middleOffset, y + middleOffset, cellSize, cellSize)
      context.fillStyle = middleColor
      context.fillRect(
        x + middleOffset + borderSize,
        y + middleOffset + borderSize,
        innerSize,
        innerSize,
      )
      context.fillStyle = '#ffffff'
      context.fillRect(x, y, cellSize, cellSize)
      context.fillStyle = frontColor
      context.fillRect(x + borderSize, y + borderSize, innerSize, innerSize)
    }
  }
}

/**
 * 窄屏缩小全部矩阵，超宽屏则增强近景颗粒存在感。
 */
function resolvePixelScale(width: number) {
  if (width <= 560) {
    return 0.72
  }

  if (width <= 960) {
    return 0.86
  }

  if (width >= 2200) {
    return 1.22
  }

  if (width >= 1680) {
    return 1.1
  }

  return 1
}

defineExpose({ renderProgress })
</script>

<style scoped>
.tool-depth-field {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.tool-depth-field__layer {
  position: absolute;
  display: block;
  will-change: transform;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

.tool-depth-field__layer--far {
  z-index: 0;
  opacity: 0.72;
}

.tool-depth-field__layer--middle {
  z-index: 1;
  opacity: 0.84;
}

.tool-depth-field__layer--near {
  z-index: 2;
  opacity: 0.92;
}
</style>

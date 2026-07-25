<template>
  <canvas ref="canvasRef" class="home-three-background" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import {
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

/**
 * 描述由纯色正方形组成的 WebGL 像素图案。
 */
interface PixelPatternDefinition {
  // 图案中心相对首屏宽度的横向位置。
  anchorX: number
  // 图案中心相对首屏高度的纵向位置。
  anchorY: number
  // 字符到纯色填充的映射。
  palette: Record<string, number>
  // 点号透明、其他字符可见的像素矩阵。
  pattern: string[]
  // 图案相对基础像素边长的缩放比例。
  scale: number
  // 图案整体透明度。
  opacity: number
  // 窄屏是否保留当前图案。
  mobile?: boolean
}

/**
 * 描述最底层横向循环的条状像素体。
 */
interface PixelWormDefinition {
  // 像素体相对首屏高度的纵向锚点。
  anchorY: number
  // 条状身体包含的正方形像素数量。
  length: number
  // 循环相位偏移用于把多个像素体分散在屏幕宽度中。
  offset: number
  // 多个纯色按身体顺序循环，避免整条像素体只使用一种颜色。
  palette: readonly number[]
  // 方块相对基础像素边长的缩放比例。
  scale: number
  // 窄屏是否继续显示当前像素体。
  mobile?: boolean
}

/**
 * 保存一个可移动引力节点的 Three.js 对象。
 */
interface GravityActorRuntime {
  // 当前节点的静态行为定义。
  definition: PixelPatternDefinition
  // 节点组承载布局、空闲轨道和碰撞位移。
  group: Group
  // 节点基础缩放由响应式像素边长决定。
  baseScale: number
  // 节点静态横向锚点是主分子在位时的外圈位置。
  anchorX: number
  // 节点静态纵向锚点是主分子在位时的外圈位置。
  anchorY: number
  // 主分子离开后当前节点进入中心空位的横向目标。
  fillX: number
  // 主分子离开后当前节点进入中心空位的纵向目标。
  fillY: number
  // 节点从主分子中心向外的归一化横向方向。
  directionX: number
  // 节点从主分子中心向外的归一化纵向方向。
  directionY: number
  // 节点到主分子的距离决定填充中心时的响应先后。
  response: number
}

// Three.js WebGL 画布由组件生命周期统一管理。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 背景图案提供足够数量的像素信息，但避开标题和主分子核心区域。
const backgroundDefinitions: PixelPatternDefinition[] = [
  { anchorX: 0.18, anchorY: 0.14, palette: { '1': 0x8edce7, '2': 0xbceef2 }, pattern: ['..11...', '.1221..', '112211.', '.1221..', '..11...', '..11...', '.1111..'], scale: 0.92, opacity: 0.5 },
  { anchorX: 0.48, anchorY: 0.1, palette: { '1': 0x8fa4ed }, pattern: ['1...1', '.1.1.', '..1..', '.1.1.', '1...1'], scale: 0.64, opacity: 0.4 },
  { anchorX: 0.86, anchorY: 0.18, palette: { '1': 0x8d9eed, '2': 0xb6c2fa }, pattern: ['111111..', '122221..', '12..2111', '12..2..1', '12222111', '111111..'], scale: 0.82, opacity: 0.46 },
  { anchorX: 0.94, anchorY: 0.36, palette: { '1': 0xd2a7e9 }, pattern: ['..111..', '.11.11.', '11...11', '.11.11.', '..111..'], scale: 0.62, opacity: 0.42, mobile: false },
  { anchorX: 0.27, anchorY: 0.72, palette: { '1': 0x96a7ef, '2': 0xeaa5cd }, pattern: ['1.....1', '.1...1.', '..121..', '...1...', '..121..', '.1...1.', '1.....1'], scale: 0.68, opacity: 0.28, mobile: false },
  { anchorX: 0.52, anchorY: 0.84, palette: { '1': 0x68c9c4 }, pattern: ['1.......1', '11.....11', '.11...11.', '..11.11..', '...111...', '..11.11..', '.11...11.', '11.....11', '1.......1'], scale: 0.66, opacity: 0.42 },
  { anchorX: 0.32, anchorY: 0.9, palette: { '1': 0x7f94ec, '2': 0x76cec9 }, pattern: ['1111111', '1.....1', '1.222.1', '1.2.2.1', '1.222.1', '1.....1', '1111111'], scale: 0.58, opacity: 0.34, mobile: false },
  { anchorX: 0.75, anchorY: 0.08, palette: { '1': 0xeaa4cb }, pattern: ['..1..', '.111.', '11111', '.111.', '..1..'], scale: 0.48, opacity: 0.36 },
  { anchorX: 0.91, anchorY: 0.76, palette: { '1': 0x6fcac6, '2': 0x91a5ed }, pattern: ['11......', '.11.....', '..22....', '...22...', '....11..', '.....11.'], scale: 0.58, opacity: 0.38, mobile: false },
]

// 五个引力节点使用强烈的尺寸层级，并从近到远错开响应。
const actorDefinitions: PixelPatternDefinition[] = [
  { anchorX: 0.36, anchorY: 0.18, palette: { '1': 0x67ccc5, '2': 0xee9fc9 }, pattern: ['...111...', '.11...11.', '11..2..11', '1..222..1', '11..2..11', '.11...11.', '...111...'], scale: 2.2, opacity: 0.9 },
  { anchorX: 0.6, anchorY: 0.2, palette: { '1': 0x8398ef, '2': 0xb8c5f7 }, pattern: ['...1...', '..121..', '.12221.', '1222221', '.12221.', '..121..', '...1...'], scale: 0.72, opacity: 0.78 },
  { anchorX: 0.84, anchorY: 0.62, palette: { '1': 0x75cdc8, '2': 0x93a4ef }, pattern: ['1111111', '1222221', '12...21', '12.2.21', '12...21', '1222221', '1111111'], scale: 1.5, opacity: 0.82 },
  { anchorX: 0.82, anchorY: 0.34, palette: { '1': 0xe99fc9, '2': 0x879aef }, pattern: ['1.1.1.1', '.1.1.1.', '..121..', '1112111', '..121..', '.1.1.1.', '1.1.1.1'], scale: 0.52, opacity: 0.74 },
  { anchorX: 0.39, anchorY: 0.74, palette: { '1': 0x8498eb, '2': 0x6ccbc5 }, pattern: ['11.....', '.11....', '..122..', '...122.', '..122..', '.11....', '11.....'], scale: 1.08, opacity: 0.68 },
]

// 主分子离场后的五点阵型按基础像素尺寸缩放，兼顾桌面与移动端的紧凑填充。
const actorFillOffsets = [
  [-7, 0],
  [1, 10],
  [11, 4],
  [2, -10],
  [10, -6],
] as const

// 六条背景像素体错开高度和初始相位，移动端仅保留其中三条。
const wormDefinitions: PixelWormDefinition[] = [
  { anchorY: 0.12, length: 7, offset: 0.06, palette: [0x91a4ee, 0x70cbc6, 0xe8a6cc], scale: 1.08 },
  { anchorY: 0.28, length: 9, offset: 0.74, palette: [0x76cdc8, 0xa6b4ef, 0xd9a9e7], scale: 1.18, mobile: false },
  { anchorY: 0.43, length: 6, offset: 0.38, palette: [0xeca8cc, 0x8fa3ed, 0x72cac5], scale: 1.24 },
  { anchorY: 0.61, length: 8, offset: 0.9, palette: [0xa2b0ed, 0xdca9e8, 0x77ccc7], scale: 1.12, mobile: false },
  { anchorY: 0.77, length: 10, offset: 0.52, palette: [0x75ccc7, 0x93a5ed, 0xe9a7cb], scale: 1.28 },
  { anchorY: 0.9, length: 7, offset: 0.2, palette: [0xdba8e7, 0x82ccc8, 0x99a9ed], scale: 1.16, mobile: false },
]

// 单个实例网格预留全部条状身体方块，运行时不改变 GPU 缓冲区容量。
const wormSegmentCount = wormDefinitions.reduce((count, definition) => count + definition.length, 0)

// 每条像素体记录最近一次颜色轮换步，避免每一帧重复上传实例颜色。
const wormColorSteps = wormDefinitions.map(() => -1)

// 单个贪吃蛇路径周期由横向格和一次上下折行组成，相邻坐标始终只差一个网格。
const wormPathOffsets = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 1],
  [5, 1],
  [6, 1],
  [7, 1],
  [8, 1],
] as const

// 每个完整路径周期向右推进八个像素网格。
const wormPathAdvance = 8

// 右下角频谱的列数保持固定，避免动态改变缓冲区容量。
const equalizerColumnCount = 11

// 每列频谱预留的最大像素数量。
const equalizerRowCount = 8

// GSAP 相位是整个 WebGL 场景唯一的持续动画时间源。
const animationState = { phase: 0 }

// 像素体使用更慢的独立 GSAP 相位完成机械伸缩爬行。
const wormAnimationState = { phase: 0 }

// 当前场景使用的响应式基础像素边长。
let baseCellSize = 8

// 主分子当前 GSAP 过渡进度持续决定引力目标位置。
let moleculeProgress = 0

// Three.js 场景只承载首屏像素装饰和引力节点。
let scene: Scene | undefined

// 正交相机让所有图案保持二维、等尺寸和无透视形变。
let camera: OrthographicCamera | undefined

// WebGL 渲染器使用现有 Canvas 并限制设备像素比。
let renderer: WebGLRenderer | undefined

// 最底层像素体共用一个动态实例网格以控制绘制提交和 DOM 开销。
let wormMesh: InstancedMesh | undefined

// 当前画布宽度用于计算像素体的屏外循环路径。
let sceneWidth = 1

// 当前画布高度用于恢复每条像素体的响应式纵向锚点。
let sceneHeight = 1

// 静态背景图案组在尺寸变化时重新锚定。
const backgroundGroups: Array<{ definition: PixelPatternDefinition, group: Group }> = []

// 引力节点运行时对象保存每个节点的组和实时坐标。
const actorRuntimes: GravityActorRuntime[] = []

// 所有引力节点共享同一个父组，确保反馈方向和节奏绝对一致。
let gravityFieldGroup: Group | undefined


// 频谱使用单个动态实例网格减少 GPU 提交次数。
let equalizerMesh: InstancedMesh | undefined

// 频谱组负责右下角响应式锚定。
let equalizerGroup: Group | undefined

// 实例矩阵更新复用同一代理对象，避免每帧制造垃圾对象。
const instanceTransform = new Object3D()

// 动态实例颜色复用同一颜色对象，避免颜色轮换时创建临时对象。
const instanceColor = new Color()

// Canvas 尺寸变化监听器负责同步正交投影和锚点。
let resizeObserver: ResizeObserver | undefined

// 首屏可见性监听器在离屏时暂停 GSAP 相位。
let visibilityObserver: IntersectionObserver | undefined

// 系统减少动态效果偏好用于关闭空闲轨道和高频余震。
let reducedMotionQuery: MediaQueryList | undefined

// 持续相位补间只在首屏可见时运行。
let phaseTween: gsap.core.Tween | undefined

// 像素体补间只更新爬行相位，由主场景补间统一提交 WebGL 帧。
let wormTween: gsap.core.Tween | undefined

// 当前首屏可见状态决定是否提交 WebGL 帧。
let sceneVisible = true


/**
 * 统计图案中需要实例化的非透明像素数量。
 */
function countPatternPixels(pattern: string[]) {
  // 汇总值决定 InstancedMesh 的固定缓冲区容量。
  let count = 0

  pattern.forEach((row) => {
    Array.from(row).forEach((cell) => {
      if (cell !== '.') {
        count += 1
      }
    })
  })

  return count
}

/**
 * 创建一个带白色像素间隙的纯色平面实例图案。
 */
function createPatternMesh(definition: PixelPatternDefinition) {
  // 单位平面通过实例缩放得到响应式正方形像素。
  const geometry = new PlaneGeometry(1, 1)
  // 无光照材质保持每个像素内部颜色绝对纯净。
  const material = new MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    opacity: definition.opacity,
    transparent: true,
  })
  // 每个非透明字符对应一个 GPU 实例。
  const mesh = new InstancedMesh(geometry, material, countPatternPixels(definition.pattern))
  // 最长行宽用于把局部图案中心对齐到 Group 原点。
  const columnCount = Math.max(...definition.pattern.map((row) => row.length))
  // 图案行数用于计算局部纵向中心。
  const rowCount = definition.pattern.length
  // 稳定下标按行写入实例矩阵和实例颜色。
  let instanceIndex = 0

  definition.pattern.forEach((row, rowIndex) => {
    Array.from(row).forEach((cell, columnIndex) => {
      if (cell === '.') {
        return
      }

      instanceTransform.position.set(
        columnIndex - (columnCount - 1) / 2,
        (rowCount - 1) / 2 - rowIndex,
        0,
      )
      instanceTransform.scale.setScalar(0.84)
      instanceTransform.updateMatrix()
      mesh.setMatrixAt(instanceIndex, instanceTransform.matrix)
      mesh.setColorAt(instanceIndex, new Color(definition.palette[cell] ?? 0x91a4ed))
      instanceIndex += 1
    })
  })

  mesh.instanceColor!.needsUpdate = true
  mesh.frustumCulled = false
  return mesh
}

/**
 * 创建一个位于其他 WebGL 图案之后的动态像素体实例层。
 */
function createWormField(nextScene: Scene) {
  // 所有身体方块共享单位正方形几何体。
  const geometry = new PlaneGeometry(1, 1)
  // 半透明纯色材质让运动层保持在背景层级而不压过正文。
  const material = new MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    opacity: 0.42,
    transparent: true,
  })
  // 全部像素体合并到一个实例网格中，只增加一次绘制提交。
  const mesh = new InstancedMesh(geometry, material, wormSegmentCount)
  // 固定实例下标按像素体定义顺序连续写入。
  let instanceIndex = 0

  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  wormDefinitions.forEach((definition) => {
    for (let segmentIndex = 0; segmentIndex < definition.length; segmentIndex += 1) {
      // 初始颜色沿身体循环使用当前像素体的三色调色板。
      const color = definition.palette[segmentIndex % definition.palette.length] ?? 0x91a4ed
      instanceColor.setHex(color)
      mesh.setColorAt(instanceIndex, instanceColor)
      instanceIndex += 1
    }
  })

  mesh.instanceColor!.setUsage(DynamicDrawUsage)
  mesh.instanceColor!.needsUpdate = true
  mesh.frustumCulled = false
  mesh.renderOrder = -10
  nextScene.add(mesh)
  wormMesh = mesh
}

/**
 * 创建全部静态背景图案和可移动引力节点。
 */
function createScenePatterns(nextScene: Scene) {
  backgroundDefinitions.forEach((definition) => {
    // 每个背景组只承担一个图案的响应式锚定。
    const group = new Group()
    group.add(createPatternMesh(definition))
    nextScene.add(group)
    backgroundGroups.push({ definition, group })
  })

  // 引力父组统一承载五个副元素的拖拽与回弹。
  const nextGravityFieldGroup = new Group()
  nextScene.add(nextGravityFieldGroup)
  gravityFieldGroup = nextGravityFieldGroup

  actorDefinitions.forEach((definition) => {
    // 引力节点组由 GPU 实例图案和组级变换共同组成。
    const group = new Group()
    group.add(createPatternMesh(definition))
    nextGravityFieldGroup.add(group)
    actorRuntimes.push({
      definition,
      group,
      baseScale: 1,
      anchorX: 0,
      anchorY: 0,
      fillX: 0,
      fillY: 0,
      directionX: 0,
      directionY: 0,
      response: 1,
    })
  })
}

/**
 * 创建右下角低频像素频谱。
 */
function createEqualizer(nextScene: Scene) {
  // 频谱方块共享单位平面几何体。
  const geometry = new PlaneGeometry(1, 1)
  // 频谱材质使用半透明纯色平面。
  const material = new MeshBasicMaterial({ depthTest: false, depthWrite: false, transparent: true, opacity: 0.58 })
  // 频谱预留固定实例容量并通过缩放隐藏空白格。
  const mesh = new InstancedMesh(geometry, material, equalizerColumnCount * equalizerRowCount)
  // 蓝、青、粉三色按列循环使用。
  const colors = [new Color(0x8095ee), new Color(0x6dcac5), new Color(0xeba5cc)]

  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  for (let column = 0; column < equalizerColumnCount; column += 1) {
    for (let row = 0; row < equalizerRowCount; row += 1) {
      mesh.setColorAt(column * equalizerRowCount + row, colors[column % colors.length])
    }
  }
  mesh.instanceColor!.needsUpdate = true
  mesh.frustumCulled = false

  // 频谱组只负责整体锚点，网格内部位置每帧量化更新。
  const group = new Group()
  group.add(mesh)
  nextScene.add(group)
  equalizerMesh = mesh
  equalizerGroup = group
}

/**
 * 将百分比锚点转换为正交相机使用的像素坐标。
 */
function resolveAnchor(anchorX: number, anchorY: number, width: number, height: number) {
  return {
    x: Math.round(anchorX * width - width / 2),
    y: Math.round(height / 2 - anchorY * height),
  }
}

/**
 * 根据当前画布尺寸更新二维正交投影和全部静态锚点。
 */
function layoutScene(width: number, height: number) {
  if (!camera) {
    return
  }

  // 基础像素边长只随画布短边变化并限制在可读范围。
  baseCellSize = Math.max(4, Math.min(10, Math.round(Math.min(width, height) / 118)))
  sceneWidth = width
  sceneHeight = height
  // 窄屏布局用于调整主分子引力中心和隐藏次要背景。
  const narrowLayout = width <= 820
  // 主分子中心按现有 CSS 布局估算到同一画布坐标系。
  const gravityAnchor = resolveAnchor(narrowLayout ? 0.5 : 0.585, narrowLayout ? 0.64 : 0.5, width, height)
  camera.left = -width / 2
  camera.right = width / 2
  camera.top = height / 2
  camera.bottom = -height / 2
  camera.updateProjectionMatrix()

  backgroundGroups.forEach(({ definition, group }) => {
    // 当前背景图案锚点由画布实际尺寸直接换算。
    const anchor = resolveAnchor(definition.anchorX, definition.anchorY, width, height)
    group.position.set(anchor.x, anchor.y, 0)
    group.scale.setScalar(baseCellSize * definition.scale)
    group.visible = !narrowLayout || definition.mobile !== false
  })

  actorRuntimes.forEach((runtime, index) => {
    // 移动端把节点围绕较低的主分子重新分布。
    const mobileAnchors = [
      [0.82, 0.54],
      [0.72, 0.42],
      [0.86, 0.74],
      [0.58, 0.88],
      [0.18, 0.76],
    ]
    // 当前节点使用桌面定义或移动端专用锚点。
    const anchorSource = narrowLayout ? mobileAnchors[index] : [runtime.definition.anchorX, runtime.definition.anchorY]
    // 当前节点锚点转换为正交像素坐标。
    const anchor = resolveAnchor(anchorSource[0], anchorSource[1], width, height)
    // 节点到主分子中心的距离用于推导响应强度。
    const actorDistance = Math.hypot(anchor.x - gravityAnchor.x, anchor.y - gravityAnchor.y)
    // 响应距离基准随视口短边变化，避免配置固定像素阈值。
    const responseDistance = Math.max(1, Math.min(width, height) * 0.56)

    runtime.anchorX = anchor.x
    runtime.anchorY = anchor.y
    runtime.directionX = (anchor.x - gravityAnchor.x) / Math.max(1, actorDistance)
    runtime.directionY = (anchor.y - gravityAnchor.y) / Math.max(1, actorDistance)
    runtime.response = gsap.utils.clamp(0.56, 1, 1 - actorDistance / responseDistance * 0.44)
    runtime.baseScale = baseCellSize * runtime.definition.scale
    // 当前节点在中心填充阵型中的固定网格偏移。
    const fillOffset = actorFillOffsets[index] ?? actorFillOffsets[0]

    runtime.fillX = gravityAnchor.x + fillOffset[0] * baseCellSize
    runtime.fillY = gravityAnchor.y + fillOffset[1] * baseCellSize
    runtime.group.position.set(anchor.x, anchor.y, 0)
    runtime.group.scale.setScalar(runtime.baseScale)
  })

  if (equalizerGroup) {
    // 频谱固定在右下角安全区域，桌面端整体放大以建立足够视觉重量。
    const equalizerAnchor = resolveAnchor(narrowLayout ? 0.68 : 0.83, narrowLayout ? 0.94 : 0.9, width, height)
    equalizerGroup.position.set(equalizerAnchor.x, equalizerAnchor.y, 0)
    equalizerGroup.scale.setScalar(narrowLayout ? 1.25 : 2.6)
  }
}

/**
 * 把整数路径步转换为可连续重复的贪吃蛇网格坐标。
 */
function resolveWormPathStep(pathStep: number, bendDirection: number) {
  // 当前路径步所在的完整周期下标，负数步骤同样保持连续。
  const cycleIndex = Math.floor(pathStep / wormPathOffsets.length)
  // 周期内部下标归一化到非负数组索引。
  const cycleStep = ((pathStep % wormPathOffsets.length) + wormPathOffsets.length) % wormPathOffsets.length
  // 当前周期内部的固定网格偏移。
  const offset = wormPathOffsets[cycleStep] ?? wormPathOffsets[0]

  return {
    x: cycleIndex * wormPathAdvance + offset[0],
    y: offset[1] * bendDirection,
  }
}

/**
 * 使用 GSAP 慢速相位让每个身体方块依次占据前一个方块的网格位置。
 */
function updateWormField() {
  if (!wormMesh) {
    return
  }

  // 本帧固定使用同一个实例网格，避免循环闭包重新读取可空组件状态。
  const mesh = wormMesh
  // 窄屏只渲染明确允许保留的三条像素体。
  const narrowLayout = sceneWidth <= 820
  // 固定实例下标与创建阶段的颜色写入顺序保持一致。
  let instanceIndex = 0
  // 仅在任意像素体进入下一机械步态时上传一次颜色缓冲。
  let colorsChanged = false

  wormDefinitions.forEach((definition, wormIndex) => {
    // 当前像素体是否参与本帧绘制。
    const visible = !narrowLayout || definition.mobile !== false
    // 身体方块边长从统一响应式基础像素尺寸派生。
    const cellSize = baseCellSize * definition.scale
    // 相位偏移把像素体均匀分散，并在屏外完成首尾衔接。
    const progress = (wormAnimationState.phase + definition.offset) % 1
    // 左右屏外缓冲确保整条身体离开画布后才执行循环重置。
    const travelBuffer = cellSize * (definition.length + wormPathOffsets.length)
    // 横向路径起点位于画布左边界外。
    const travelStart = -sceneWidth / 2 - travelBuffer
    // 穿过画布和两侧缓冲区所需的横向网格数量。
    const horizontalCellCount = Math.ceil((sceneWidth + travelBuffer * 2) / cellSize)
    // 路径周期数向上取整，保证最后一个周期完整离开右边界。
    const pathCycleCount = Math.ceil(horizontalCellCount / wormPathAdvance)
    // 当前像素体从左侧到右侧经历的离散路径步总数。
    const pathStepCount = pathCycleCount * wormPathOffsets.length
    // 头部只在整数路径步变化时跳到下一个相邻网格。
    const headPathStep = Math.floor(progress * pathStepCount)
    // 调色板每六个移动步骤向前轮换一格，保持低频颜色流动。
    const colorStep = Math.floor(headPathStep / 6) % definition.palette.length
    // 当前像素体只在颜色轮换步变化时重写实例颜色。
    const shouldUpdateColors = wormColorSteps[wormIndex] !== colorStep
    // 静态纵向锚点保持各条像素体之间的空间分布。
    const anchorY = sceneHeight / 2 - definition.anchorY * sceneHeight
    // 奇偶像素体交替向上或向下拐弯，避免所有路径完全重合。
    const bendDirection = wormIndex % 2 === 0 ? 1 : -1

    for (let segmentIndex = 0; segmentIndex < definition.length; segmentIndex += 1) {
      // 后续身体方块依次读取头部之前经过的路径位置。
      const segmentPathStep = headPathStep - (definition.length - 1 - segmentIndex)
      // 当前身体方块沿同一贪吃蛇路径取得整数网格坐标。
      const pathPoint = resolveWormPathStep(segmentPathStep, bendDirection)
      // 横向位置严格按完整像素网格移动，不使用拉伸插值。
      const x = Math.round(travelStart + pathPoint.x * cellSize)
      // 纵向位置只在路径的上下转折步骤改变一个完整网格。
      const y = Math.round(anchorY + pathPoint.y * cellSize)
      // 隐藏的移动端实例缩放为零，避免额外网格和分支绘制。
      const pixelSize = visible ? cellSize * 0.84 : 0

      if (shouldUpdateColors) {
        // 当前方块颜色按身体下标和机械周期共同决定。
        const color = definition.palette[(segmentIndex + colorStep) % definition.palette.length] ?? 0x91a4ed
        instanceColor.setHex(color)
        mesh.setColorAt(instanceIndex, instanceColor)
      }

      instanceTransform.position.set(x, y, -1)
      instanceTransform.scale.setScalar(pixelSize)
      instanceTransform.updateMatrix()
      mesh.setMatrixAt(instanceIndex, instanceTransform.matrix)
      instanceIndex += 1
    }

    if (shouldUpdateColors) {
      wormColorSteps[wormIndex] = colorStep
      colorsChanged = true
    }
  })

  mesh.instanceMatrix.needsUpdate = true

  if (colorsChanged && mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true
  }
}

/**
 * 根据主分子离场进度让副元素进入中心空位，反向滚动时恢复外圈挤压阵型。
 */
function updateGravityField() {
  if (!gravityFieldGroup) {
    return
  }

  // 减少动态效果模式把副元素固定在外圈，避免滚动触发大范围位移。
  const fillProgress = reducedMotionQuery?.matches
    ? 0
    : gsap.utils.clamp(0, 1, (moleculeProgress - 0.05) / 0.82)

  actorRuntimes.forEach((runtime, index) => {
    // 距离中心较远的节点略晚进入空位，形成依次挤入的空间层次。
    const delay = (1 - runtime.response) * 0.16
    // 当前节点移除自身延迟后的独立填充进度。
    const actorProgress = gsap.utils.clamp(0, 1, (fillProgress - delay) / Math.max(0.01, 1 - delay))
    // 三次平滑曲线保证正向和反向滚动都没有速度折点。
    const easedProgress = actorProgress * actorProgress * (3 - 2 * actorProgress)
    // 顺时针切向横向分量用于构造进入中心的弧线路径。
    const tangentX = -runtime.directionY
    // 顺时针切向纵向分量与径向方向保持正交。
    const tangentY = runtime.directionX
    // 中段弧线幅度让多个节点错开进入，不会沿直线同时穿过中心。
    const curveOffset = Math.sin(easedProgress * Math.PI)
      * baseCellSize
      * (2.4 + runtime.response * 1.8)
      * (index % 2 === 0 ? 1 : -1)
    // 横向位置从受挤压外圈可逆插值到中心填充阵型。
    const x = Math.round(gsap.utils.interpolate(runtime.anchorX, runtime.fillX, easedProgress) + tangentX * curveOffset)
    // 纵向位置沿同一弧线进入主分子留下的空间。
    const y = Math.round(gsap.utils.interpolate(runtime.anchorY, runtime.fillY, easedProgress) + tangentY * curveOffset)
    // 填充中心时略微放大，让空位被视觉上完整占据。
    const scale = runtime.baseScale * (1 + easedProgress * 0.07)

    runtime.group.position.set(x, y, 0)
    runtime.group.scale.setScalar(scale)
  })
}

/**
 * 按离散 GSAP 相位更新右下角频谱实例矩阵。
 */
function updateEqualizer() {
  if (!equalizerMesh) {
    return
  }

  // 连续相位量化为十六个时间格，保持低频像素跳动。
  const sampledPhase = Math.floor(animationState.phase * 16) / 16
  // 频谱方块边长略小于场景基础像素。
  const size = baseCellSize * 0.72

  for (let column = 0; column < equalizerColumnCount; column += 1) {
    // 两组正弦波叠加后得到当前列的整数高度。
    const wave = Math.sin((sampledPhase * 2 + column * 0.12) * Math.PI * 2)
    // 当前列显示两到七个方块。
    const activeRows = Math.max(2, Math.min(7, Math.round(4.5 + wave * 2.5)))

    for (let row = 0; row < equalizerRowCount; row += 1) {
      // 当前频谱方块在共享实例缓冲区中的固定下标。
      const instanceIndex = column * equalizerRowCount + row
      // 未激活方块缩放为零。
      const pixelSize = row < activeRows ? size : 0

      instanceTransform.position.set(column * baseCellSize, row * baseCellSize, 0)
      instanceTransform.scale.setScalar(pixelSize)
      instanceTransform.updateMatrix()
      equalizerMesh.setMatrixAt(instanceIndex, instanceTransform.matrix)
    }
  }

  equalizerMesh.instanceMatrix.needsUpdate = true
}

/**
 * 更新动态实例并提交一帧 WebGL 画面。
 */
function renderScene() {
  if (!sceneVisible || !renderer || !scene || !camera) {
    return
  }

  updateWormField()
  updateGravityField()
  updateEqualizer()
  renderer.render(scene, camera)
}

/**
 * 响应 Canvas 尺寸变化并更新正交相机和像素布局。
 */
function resizeScene() {
  if (!renderer || !canvasRef.value) {
    return
  }

  // Canvas 的 CSS 宽度直接对应正交相机世界宽度。
  const width = Math.max(1, canvasRef.value.clientWidth)
  // Canvas 的 CSS 高度直接对应正交相机世界高度。
  const height = Math.max(1, canvasRef.value.clientHeight)

  renderer.setSize(width, height, false)
  layoutScene(width, height)
  renderScene()
}

/**
 * 根据页面可见性和动态效果偏好启停 GSAP 场景相位。
 */
function syncAnimationState() {
  // 只有首屏和页面都可见且用户允许动态效果时才推进空闲动画。
  const shouldAnimate = sceneVisible && !document.hidden && !reducedMotionQuery?.matches

  phaseTween?.paused(!shouldAnimate)
  wormTween?.paused(!shouldAnimate)
  renderScene()
}

/**
 * 响应首屏画布进出视口并同步渲染状态。
 */
function handleSceneVisibility(entries: IntersectionObserverEntry[]) {
  // 单一观察目标的首个条目代表当前首屏可见状态。
  const entry = entries[0]

  if (!entry) {
    return
  }

  sceneVisible = entry.isIntersecting
  syncAnimationState()
}

/**
 * 响应标签页可见性变化并同步场景动画。
 */
function handleDocumentVisibility() {
  syncAnimationState()
}

/**
 * 响应系统减少动态效果偏好变化。
 */
function handleReducedMotionChange() {
  syncAnimationState()
}

/**
 * 创建纯二维正交 Three.js 场景和 GSAP 动画时间源。
 */
function mountScene() {
  // 当前组件必须先获得真实 Canvas 才能创建 WebGLRenderer。
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  // 新场景只包含平面像素，不创建灯光和三维透视对象。
  const nextScene = new Scene()
  // 正交相机初始边界会在首次 ResizeObserver 回调中更新。
  const nextCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  // WebGL 渲染器关闭抗锯齿以保持硬边并降低片元成本。
  const nextRenderer = new WebGLRenderer({ alpha: true, antialias: false, canvas, powerPreference: 'high-performance' })

  nextCamera.position.z = 5
  nextRenderer.setClearColor(0xffffff, 0)
  nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  nextRenderer.outputColorSpace = SRGBColorSpace
  scene = nextScene
  camera = nextCamera
  renderer = nextRenderer

  createWormField(nextScene)
  createScenePatterns(nextScene)
  createEqualizer(nextScene)

  resizeObserver = new ResizeObserver(resizeScene)
  resizeObserver.observe(canvas)
  visibilityObserver = new IntersectionObserver(handleSceneVisibility)
  visibilityObserver.observe(canvas)
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  document.addEventListener('visibilitychange', handleDocumentVisibility)

  wormTween = gsap.to(wormAnimationState, {
    duration: 90,
    ease: 'none',
    phase: 1,
    repeat: -1,
  })

  phaseTween = gsap.to(animationState, {
    duration: 9,
    ease: 'none',
    phase: 1,
    repeat: -1,
    onUpdate: renderScene,
  })

  resizeScene()
  syncAnimationState()
}

/**
 * 释放 Three.js GPU 资源、GSAP 补间和浏览器监听。
 */
function unmountScene() {
  phaseTween?.kill()
  wormTween?.kill()
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
  document.removeEventListener('visibilitychange', handleDocumentVisibility)

  backgroundGroups.forEach(({ group }) => {
    group.children.forEach((child) => {
      // 每个图案组只包含一个实例网格。
      const mesh = child as InstancedMesh
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
    })
  })
  actorRuntimes.forEach((runtime) => {
    runtime.group.children.forEach((child) => {
      // 每个引力组只包含一个实例网格。
      const mesh = child as InstancedMesh
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
    })
  })
  wormMesh?.geometry.dispose()
  ;(wormMesh?.material as MeshBasicMaterial | undefined)?.dispose()
  equalizerMesh?.geometry.dispose()
  ;(equalizerMesh?.material as MeshBasicMaterial | undefined)?.dispose()
  renderer?.dispose()
  renderer?.forceContextLoss()

  backgroundGroups.length = 0
  actorRuntimes.length = 0
  wormMesh = undefined
  sceneWidth = 1
  sceneHeight = 1
  gravityFieldGroup = undefined
  moleculeProgress = 0
  equalizerMesh = undefined
  equalizerGroup = undefined
  resizeObserver = undefined
  visibilityObserver = undefined
  reducedMotionQuery = undefined
  phaseTween = undefined
  wormTween = undefined
  wormAnimationState.phase = 0
  wormColorSteps.fill(-1)
  renderer = undefined
  camera = undefined
  scene = undefined
}

/**
 * 持续同步主分子进度，将滚动位置映射为可逆的填充与挤压状态。
 */
function syncAttraction(progress: number) {
  // 归一化进度是引力目标在完整过渡中的唯一输入。
  const normalizedProgress = gsap.utils.clamp(0, 1, progress)

  moleculeProgress = normalizedProgress
  renderScene()
}

defineExpose({ syncAttraction })

onMounted(mountScene)
onUnmounted(unmountScene)
</script>

<style scoped>
.home-three-background {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}
</style>

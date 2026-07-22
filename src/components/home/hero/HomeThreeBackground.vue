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
 * 保存一个可移动引力节点的 Three.js 对象。
 */
interface GravityActorRuntime {
  // 当前节点的静态行为定义。
  definition: PixelPatternDefinition
  // 节点组承载布局、空闲轨道和碰撞位移。
  group: Group
  // 节点基础缩放由响应式像素边长决定。
  baseScale: number
  // 节点静态横向锚点是抛射运动的固定起点。
  anchorX: number
  // 节点静态纵向锚点是抛射运动的固定起点。
  anchorY: number
  // 节点从主分子中心向外的归一化横向方向。
  directionX: number
  // 节点从主分子中心向外的归一化纵向方向。
  directionY: number
  // 节点到主分子的距离决定抛射初速度强度。
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

// 右下角频谱的列数保持固定，避免动态改变缓冲区容量。
const equalizerColumnCount = 11

// 每列频谱预留的最大像素数量。
const equalizerRowCount = 8

// GSAP 相位是整个 WebGL 场景唯一的持续动画时间源。
const animationState = { phase: 0 }

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

// Canvas 尺寸变化监听器负责同步正交投影和锚点。
let resizeObserver: ResizeObserver | undefined

// 首屏可见性监听器在离屏时暂停 GSAP 相位。
let visibilityObserver: IntersectionObserver | undefined

// 系统减少动态效果偏好用于关闭空闲轨道和高频余震。
let reducedMotionQuery: MediaQueryList | undefined

// 持续相位补间只在首屏可见时运行。
let phaseTween: gsap.core.Tween | undefined

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
 * 按滚动时间使用抛体运动公式计算每个节点的曲线散开位置。
 */
function updateGravityField() {
  if (!gravityFieldGroup) {
    return
  }

  // 减少动态效果模式把物理时间固定在起点。
  const releaseProgress = reducedMotionQuery?.matches
    ? 0
    : gsap.utils.clamp(0, 1, (moleculeProgress - 0.04) / 0.86)
  // 平滑时间映射只控制速度连续性，不改变抛物线几何关系。
  const normalizedTime = releaseProgress * releaseProgress * (3 - 2 * releaseProgress)
  // 一点二秒的归一化飞行时间提供足够大的曲线跨度。
  const flightTime = normalizedTime * 1.2
  // 向下重力统一作用于所有副元素。
  const gravity = baseCellSize * 10
  // 整数像素吸附消除亚像素抖动，同时保留连续曲线。
  const snapSize = 1

  actorRuntimes.forEach((runtime) => {
    // 顺时针切向横向分量让径向散开形成统一旋向的曲线。
    const tangentX = -runtime.directionY
    // 顺时针切向纵向分量与横向分量保持正交。
    const tangentY = runtime.directionX
    // 靠近主分子的节点获得更大的径向初速度。
    const radialSpeed = baseCellSize * (13 + runtime.response * 7)
    // 切向初速度制造明显弧线，但不超过径向能量。
    const tangentSpeed = baseCellSize * 6
    // 横向初速度由径向冲量和统一切向冲量叠加。
    const velocityX = runtime.directionX * radialSpeed + tangentX * tangentSpeed
    // 纵向初速度使用相同的向量合成规则。
    const velocityY = runtime.directionY * radialSpeed + tangentY * tangentSpeed
    // 横向位置遵循匀速运动公式。
    const x = Math.round((runtime.anchorX + velocityX * flightTime) / snapSize) * snapSize
    // 纵向位置叠加向下重力，形成真实抛物线。
    const y = Math.round((runtime.anchorY
      + velocityY * flightTime
      - 0.5 * gravity * flightTime * flightTime) / snapSize) * snapSize

    runtime.group.position.set(x, y, 0)
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

  createScenePatterns(nextScene)
  createEqualizer(nextScene)

  resizeObserver = new ResizeObserver(resizeScene)
  resizeObserver.observe(canvas)
  visibilityObserver = new IntersectionObserver(handleSceneVisibility)
  visibilityObserver.observe(canvas)
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  document.addEventListener('visibilitychange', handleDocumentVisibility)

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
  equalizerMesh?.geometry.dispose()
  ;(equalizerMesh?.material as MeshBasicMaterial | undefined)?.dispose()
  renderer?.dispose()
  renderer?.forceContextLoss()

  backgroundGroups.length = 0
  actorRuntimes.length = 0
  gravityFieldGroup = undefined
  moleculeProgress = 0
  equalizerMesh = undefined
  equalizerGroup = undefined
  resizeObserver = undefined
  visibilityObserver = undefined
  reducedMotionQuery = undefined
  phaseTween = undefined
  renderer = undefined
  camera = undefined
  scene = undefined
}

/**
 * 持续同步主分子进度，将滚动位置映射为可逆抛射时间。
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

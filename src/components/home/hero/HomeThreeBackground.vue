<template>
  <canvas ref="canvasRef" class="home-three-background" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

interface PixelShapeDefinition {
  anchorX: number
  anchorY: number
  color: number
  depth: number
  pattern: string[]
  pixelSize: number
}

// Three.js 背景画布，由组件生命周期统一创建和回收。
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 桌面背景开始启用的最小宽度，移动端布局后续单独设计。
const DESKTOP_MIN_WIDTH = 821

// 相机到背景平面的距离，用于把百分比锚点换算为稳定的世界坐标。
const CAMERA_DISTANCE = 36

// 透视相机的垂直视角，提供轻微空间感但不制造明显透视形变。
const CAMERA_FOV = 32

// 右下角频谱的固定列数。
const EQUALIZER_COLUMNS = 11

// 右下角频谱每列允许显示的最大方块数。
const EQUALIZER_ROWS = 9

// 频谱更新间隔固定为约 3Hz，避免持续躁动和无意义的高帧率重绘。
const EQUALIZER_INTERVAL = 334

// 背景像素形状定义，图案以完整轮廓代替散点粒子。
const PIXEL_SHAPES: PixelShapeDefinition[] = [
  {
    anchorX: 0.22,
    anchorY: 0.14,
    color: 0x91ddeb,
    depth: -1.8,
    pixelSize: 0.22,
    pattern: ['..11....', '.1111...', '11..11..', '.1111...', '..11....', '...1....', '..111...'],
  },
  {
    anchorX: 0.88,
    anchorY: 0.19,
    color: 0x8c9cf0,
    depth: -2.1,
    pixelSize: 0.24,
    pattern: ['111111..', '1....1..', '1.11.111', '1.11...1', '1....111', '111111..'],
  },
  {
    anchorX: 0.78,
    anchorY: 0.47,
    color: 0xbda2ec,
    depth: -3.1,
    pixelSize: 0.18,
    pattern: ['...11...', '..1111..', '.11..11.', '11.11.11', '11.11.11', '.11..11.', '..1111..', '...11...'],
  },
  {
    anchorX: 0.57,
    anchorY: 0.8,
    color: 0x72cfc6,
    depth: -2.4,
    pixelSize: 0.2,
    pattern: ['1.......1', '11.....11', '.11...11.', '..11.11..', '...111...', '..11.11..', '.11...11.', '11.....11', '1.......1'],
  },
]

// Three.js 场景实例，仅负责首屏背景装饰。
let scene: Scene | undefined

// 透视相机实例，按首屏尺寸同步宽高比。
let camera: PerspectiveCamera | undefined

// WebGL 渲染器实例，限制像素比以控制 GPU 成本。
let renderer: WebGLRenderer | undefined

// 按场景锚点静态展示的像素图形组。
const decorationGroups: Group[] = []

// 右下角像素频谱的实例化网格。
let equalizerMesh: InstancedMesh | undefined

// 右下角频谱组，用于统一定位和轻微倾斜。
let equalizerGroup: Group | undefined

// 首屏尺寸监听器，只在画布实际变化时更新投影。
let resizeObserver: ResizeObserver | undefined

// 系统减少动态效果偏好，用于停止频谱定时更新。
let reducedMotionQuery: MediaQueryList | undefined

// 频谱低频刷新定时器，页面隐藏或组件卸载时必须清理。
let equalizerTimer: number | undefined

/**
 * 统计图案中需要实例化的有效像素数量。
 */
function countPatternPixels(pattern: string[]) {
  // 当前图案内所有非透明字符的总数。
  let count = 0

  // 行变量表示当前扫描的像素行。
  for (const row of pattern) {
    // 单元变量表示当前行中的透明或有效像素。
    for (const cell of row) {
      if (cell !== '.') {
        count += 1
      }
    }
  }

  return count
}

/**
 * 把一个二维像素图案构造成单次绘制的实例化立方体组。
 */
function createPixelShape(definition: PixelShapeDefinition) {
  // 所有像素共享的单位立方体几何体。
  const geometry = new BoxGeometry(1, 1, 1)
  // 当前图形共享的半透明材质。
  const material = new MeshBasicMaterial({
    color: definition.color,
    opacity: 0.48,
    transparent: true,
    depthWrite: false,
  })
  // 当前图案所需的实例总数。
  const instanceCount = countPatternPixels(definition.pattern)
  // 同一图形的所有像素合并为一个实例化网格。
  const mesh = new InstancedMesh(geometry, material, instanceCount)
  // 复用的矩阵代理对象，避免为每个像素创建独立 Mesh。
  const transform = new Object3D()
  // 长度映射回调只读取每行列数，不改变原图案。
  const columnCount = Math.max(...definition.pattern.map((row) => row.length))
  // 图案行数用于把局部原点放到形状中心。
  const rowCount = definition.pattern.length
  // 当前写入实例缓冲区的位置。
  let instanceIndex = 0

  // 外层回调按行写入实例并保留纵向顺序。
  definition.pattern.forEach((row, rowIndex) => {
    // 内层回调按列跳过透明格并写入有效像素矩阵。
    Array.from(row).forEach((cell, columnIndex) => {
      if (cell === '.') {
        return
      }

      transform.position.set(
        (columnIndex - (columnCount - 1) / 2) * definition.pixelSize,
        ((rowCount - 1) / 2 - rowIndex) * definition.pixelSize,
        0,
      )
      transform.scale.setScalar(definition.pixelSize * 0.86)
      transform.updateMatrix()
      mesh.setMatrixAt(instanceIndex, transform.matrix)
      instanceIndex += 1
    })
  })

  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false

  // 图形容器保存布局定义，尺寸变化时无需重建几何体。
  const group = new Group()
  group.add(mesh)
  group.userData.definition = definition
  decorationGroups.push(group)

  return group
}

/**
 * 创建右下角实例化像素频谱，所有方块保持同一尺寸。
 */
function createEqualizer() {
  // 频谱方块共享的立方体几何体。
  const geometry = new BoxGeometry(1, 1, 1)
  // 频谱使用实例颜色区分蓝、青和粉色列。
  const material = new MeshBasicMaterial({
    opacity: 0.72,
    transparent: true,
    depthWrite: false,
  })
  // 频谱预留固定容量，通过缩放隐藏未激活方块。
  const mesh = new InstancedMesh(
    geometry,
    material,
    EQUALIZER_COLUMNS * EQUALIZER_ROWS,
  )
  // 三种频谱颜色按列循环使用。
  const colors = [new Color(0x79cfe8), new Color(0x7f90ee), new Color(0xefa3cd)]

  // 列循环为每根频谱柱选择稳定颜色。
  for (let column = 0; column < EQUALIZER_COLUMNS; column += 1) {
    // 行循环为当前列的每个预留方块写入颜色。
    for (let row = 0; row < EQUALIZER_ROWS; row += 1) {
      // 当前方块在实例缓冲区中的稳定下标。
      const instanceIndex = column * EQUALIZER_ROWS + row
      mesh.setColorAt(instanceIndex, colors[column % colors.length])
    }
  }

  mesh.instanceColor!.needsUpdate = true
  mesh.frustumCulled = false

  // 频谱容器负责右下角锚定和整体空间角度。
  const group = new Group()
  group.rotation.set(-0.08, 0.16, -0.035)
  group.add(mesh)
  equalizerMesh = mesh
  equalizerGroup = group

  return group
}

/**
 * 根据首屏宽高把百分比锚点映射到相机可见区域。
 */
function layoutScene(width: number, height: number) {
  if (!camera || !equalizerGroup) {
    return
  }

  // 背景平面在相机视锥中的可见高度。
  const visibleHeight = 2 * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2)) * CAMERA_DISTANCE
  // 背景平面在当前宽高比下的可见宽度。
  const visibleWidth = visibleHeight * (width / height)

  // 布局回调只更新图形组锚点，不改变内部像素。
  decorationGroups.forEach((group) => {
    // 当前图形创建时保存的布局定义。
    const definition = group.userData.definition as PixelShapeDefinition
    // 当前图形基于百分比锚点计算出的横向位置。
    const positionX = (definition.anchorX - 0.5) * visibleWidth
    // 当前图形基于百分比锚点计算出的纵向位置。
    const positionY = (0.5 - definition.anchorY) * visibleHeight
    group.position.set(positionX, positionY, definition.depth)
  })

  equalizerGroup.position.set(visibleWidth * 0.34, -visibleHeight * 0.405, -1.4)
}

/**
 * 按当前低频时间步更新右下角频谱实例矩阵。
 */
function updateEqualizer(elapsed: number) {
  if (!equalizerMesh) {
    return
  }

  // 时间按三分之一秒取样，使柱体以统一节奏变化。
  const sampledTime = Math.floor(elapsed * 3) / 3
  // 复用的矩阵代理对象，避免更新时创建临时 Mesh。
  const transform = new Object3D()
  // 每个频谱方块的固定世界尺寸。
  const blockSize = 0.2
  // 相邻方块之间的固定间距。
  const blockGap = 0.055

  // 列循环独立计算每根频谱柱的低频波形。
  for (let column = 0; column < EQUALIZER_COLUMNS; column += 1) {
    // 主波和次波共享同一时间步，使整组频谱连贯变化。
    const wave = Math.sin(sampledTime * 0.75 + column * 0.52) * 0.72
      + Math.sin(sampledTime * 0.3 - column * 0.24) * 0.28
    // 当前列显示的整数方块数。
    const activeRows = MathUtils.clamp(Math.round(4.8 + wave * 3.1), 1, EQUALIZER_ROWS)

    // 行循环按当前柱高显示或隐藏固定尺寸方块。
    for (let row = 0; row < EQUALIZER_ROWS; row += 1) {
      // 当前方块在实例缓冲区中的稳定下标。
      const instanceIndex = column * EQUALIZER_ROWS + row
      // 当前方块是否属于当前时间步的可见柱体高度。
      const isVisible = row < activeRows
      transform.position.set(
        column * (blockSize + blockGap),
        row * (blockSize + blockGap),
        0,
      )
      transform.scale.setScalar(isVisible ? blockSize : 0.0001)
      transform.updateMatrix()
      equalizerMesh.setMatrixAt(instanceIndex, transform.matrix)
    }
  }

  equalizerMesh.instanceMatrix.needsUpdate = true
}

/**
 * 更新频谱并渲染场景，静态像素形状不参与动画计算。
 */
function renderScene() {
  if (!renderer || !scene || !camera) {
    return
  }

  // 当前秒数只作为右下角频谱的低频时间源。
  const elapsed = performance.now() / 1000
  updateEqualizer(elapsed)
  renderer.render(scene, camera)
}

/**
 * 在尺寸变化时同步渲染分辨率、相机投影和场景锚点。
 */
function resizeScene() {
  if (!renderer || !camera || !canvasRef.value) {
    return
  }

  // Canvas 在页面中的实际 CSS 宽度。
  const width = Math.max(1, canvasRef.value.clientWidth)
  // Canvas 在页面中的实际 CSS 高度。
  const height = Math.max(1, canvasRef.value.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  layoutScene(width, height)
  renderScene()
}

/**
 * 根据页面可见性和减少动态效果偏好启停低频频谱。
 */
function syncAnimationState() {
  if (equalizerTimer !== undefined) {
    window.clearInterval(equalizerTimer)
    equalizerTimer = undefined
  }

  renderScene()

  // 当前是否允许频谱继续按低频时间步更新。
  const shouldAnimate = !document.hidden && !reducedMotionQuery?.matches

  if (shouldAnimate) {
    equalizerTimer = window.setInterval(renderScene, EQUALIZER_INTERVAL)
  }
}

/**
 * 响应标签页可见性变化，隐藏时停止频谱定时器。
 */
function handleVisibilityChange() {
  syncAnimationState()
}

/**
 * 响应系统动态效果偏好变化并立即同步当前场景。
 */
function handleReducedMotionChange() {
  syncAnimationState()
}

/**
 * 创建桌面首屏 Three.js 背景及其尺寸、生命周期监听。
 */
function mountScene() {
  if (!canvasRef.value || window.innerWidth < DESKTOP_MIN_WIDTH) {
    return
  }

  // 当前组件独占的 Three.js 场景。
  const nextScene = new Scene()
  // 与首屏比例同步的透视相机。
  const nextCamera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
  nextCamera.position.z = CAMERA_DISTANCE

  // 透明且无抗锯齿的画布保持像素硬边并降低片元成本。
  const nextRenderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    canvas: canvasRef.value,
    powerPreference: 'high-performance',
  })
  nextRenderer.setClearColor(0xffffff, 0)
  nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  scene = nextScene
  camera = nextCamera
  renderer = nextRenderer

  // 创建回调把每个预定义图案加入同一静态背景场景。
  PIXEL_SHAPES.forEach((definition) => {
    nextScene.add(createPixelShape(definition))
  })
  nextScene.add(createEqualizer())

  // 只监听首屏容器本身，避免无关窗口事件触发重复布局。
  const nextResizeObserver = new ResizeObserver(resizeScene)
  nextResizeObserver.observe(canvasRef.value)
  resizeObserver = nextResizeObserver

  // 系统减少动态效果媒体查询在组件存活期间保持复用。
  const nextReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  nextReducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  reducedMotionQuery = nextReducedMotionQuery

  document.addEventListener('visibilitychange', handleVisibilityChange)
  resizeScene()
  syncAnimationState()
}

/**
 * 释放 WebGL、几何体、材质、定时器和浏览器监听。
 */
function unmountScene() {
  if (equalizerTimer !== undefined) {
    window.clearInterval(equalizerTimer)
    equalizerTimer = undefined
  }

  resizeObserver?.disconnect()
  reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 场景遍历回调集中释放每个网格持有的 GPU 资源。
  scene?.traverse((object) => {
    // 当前遍历节点可能持有需要显式释放的 GPU 几何体。
    const mesh = object as Mesh
    mesh.geometry?.dispose()

    if (Array.isArray(mesh.material)) {
      // 材质数组回调逐个释放多材质网格资源。
      mesh.material.forEach((material) => material.dispose())
    } else {
      mesh.material?.dispose()
    }
  })

  renderer?.dispose()
  renderer?.forceContextLoss()
  decorationGroups.length = 0
  equalizerMesh = undefined
  equalizerGroup = undefined
  resizeObserver = undefined
  reducedMotionQuery = undefined
  renderer = undefined
  camera = undefined
  scene = undefined
}

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
}

@media (max-width: 820px) {
  .home-three-background {
    display: none;
  }
}
</style>

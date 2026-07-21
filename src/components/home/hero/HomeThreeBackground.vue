<template>
  <canvas ref="canvasRef" class="home-three-background" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
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

/**
 * 描述一个静态 Three.js 像素装饰的图案、视口锚点和空间样式。
 */
interface PixelShapeDefinition {
  /**
   * 图形中心相对首屏可见宽度的归一化横向位置，0 表示左侧，1 表示右侧。
   */
  anchorX: number
  /**
   * 图形中心相对首屏可见高度的归一化纵向位置，0 表示顶部，1 表示底部。
   */
  anchorY: number
  /**
   * Three.js 材质使用的十六进制数值颜色。
   */
  color: number
  /**
   * 图形相对背景平面的世界坐标深度，用于控制透视层次。
   */
  depth: number
  /**
   * 按行保存的字符矩阵；点号表示不创建立方体的透明格。
   */
  pattern: string[]
  /**
   * 单个实例化立方体在世界坐标中的正方形边长。
   */
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

// 全部静态像素图案共享的实例化网格，把装饰压缩为一个 draw call。
let decorationMesh: InstancedMesh | undefined

// 右下角像素频谱的实例化网格。
let equalizerMesh: InstancedMesh | undefined

// 右下角频谱组，用于统一定位和轻微倾斜。
let equalizerGroup: Group | undefined

// 静态装饰在尺寸变化时复用的矩阵代理对象。
const decorationTransform = new Object3D()

// 动态频谱更新实例矩阵时复用的代理对象。
const equalizerTransform = new Object3D()

// 每列上一次写入 GPU 缓冲区的高度，用于跳过未变化列。
const equalizerHeights = new Array<number>(EQUALIZER_COLUMNS).fill(-1)

// 上一次处理的低频时间片，避免同一时间片重复计算和绘制。
let lastEqualizerSample = -1

// 首屏尺寸监听器，只在画布实际变化时更新投影。
let resizeObserver: ResizeObserver | undefined

// 首屏可见性监听器，离开视口后停止 Three.js 定时渲染。
let sceneVisibilityObserver: IntersectionObserver | undefined

// 当前画布是否与视口相交，决定是否允许提交 WebGL 帧。
let sceneVisible = true

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
 * 把全部静态像素图案合并为一个带实例颜色的网格。
 */
function createPixelShapes() {
  // 全部图案有效像素的总数决定单个实例缓冲区容量。
  let instanceCount = 0

  // 图案循环汇总所有有效像素，避免为每个形状创建独立网格。
  for (const definition of PIXEL_SHAPES) {
    instanceCount += countPatternPixels(definition.pattern)
  }

  // 所有静态装饰共享的单位立方体几何体。
  const geometry = new BoxGeometry(1, 1, 1)
  // 单一材质结合实例颜色保留各图案原有配色。
  const material = new MeshBasicMaterial({
    opacity: 0.48,
    transparent: true,
    depthWrite: false,
  })
  // 合并后的网格把四个静态图案压缩为一个 draw call。
  const mesh = new InstancedMesh(geometry, material, instanceCount)
  // 当前写入实例颜色缓冲区的稳定下标。
  let instanceIndex = 0

  // 图案循环按原顺序为每个有效像素写入实例颜色。
  for (const definition of PIXEL_SHAPES) {
    // 当前图案复用的 Three.js 颜色对象。
    const color = new Color(definition.color)

    // 行循环只负责扫描图案中的有效像素。
    for (const row of definition.pattern) {
      // 单元循环跳过透明格并写入当前图案颜色。
      for (const cell of row) {
        if (cell === '.') {
          continue
        }

        mesh.setColorAt(instanceIndex, color)
        instanceIndex += 1
      }
    }
  }

  mesh.instanceColor!.needsUpdate = true
  mesh.frustumCulled = false
  decorationMesh = mesh

  return mesh
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
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  equalizerHeights.fill(-1)
  lastEqualizerSample = -1

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
 * 根据首屏宽高更新合并实例的世界矩阵和频谱锚点。
 */
function layoutScene(width: number, height: number) {
  if (!camera || !decorationMesh || !equalizerGroup) {
    return
  }

  // 背景平面在相机视锥中的可见高度。
  const visibleHeight = 2 * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2)) * CAMERA_DISTANCE
  // 背景平面在当前宽高比下的可见宽度。
  const visibleWidth = visibleHeight * (width / height)
  // 当前写入静态装饰实例矩阵的稳定下标。
  let instanceIndex = 0

  // 图案循环把各自锚点和局部像素坐标写入同一个实例缓冲区。
  for (const definition of PIXEL_SHAPES) {
    // 当前图形基于百分比锚点计算出的横向位置。
    const anchorX = (definition.anchorX - 0.5) * visibleWidth
    // 当前图形基于百分比锚点计算出的纵向位置。
    const anchorY = (0.5 - definition.anchorY) * visibleHeight
    // 当前图案最长行的列数用于保持局部原点居中。
    let columnCount = 0

    // 行循环解析图案的最大列数，不创建临时映射数组。
    for (const row of definition.pattern) {
      columnCount = Math.max(columnCount, row.length)
    }

    // 图案行数用于把局部原点放到形状中心。
    const rowCount = definition.pattern.length

    // 行索引循环保持图案原有纵向顺序。
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      // 当前图案行保存透明格和有效像素。
      const row = definition.pattern[rowIndex]

      // 列索引循环跳过透明格并更新有效实例矩阵。
      for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
        if (row[columnIndex] === '.') {
          continue
        }

        decorationTransform.position.set(
          anchorX + (columnIndex - (columnCount - 1) / 2) * definition.pixelSize,
          anchorY + ((rowCount - 1) / 2 - rowIndex) * definition.pixelSize,
          definition.depth,
        )
        decorationTransform.scale.setScalar(definition.pixelSize * 0.86)
        decorationTransform.updateMatrix()
        decorationMesh.setMatrixAt(instanceIndex, decorationTransform.matrix)
        instanceIndex += 1
      }
    }
  }

  decorationMesh.instanceMatrix.needsUpdate = true
  equalizerGroup.position.set(visibleWidth * 0.34, -visibleHeight * 0.405, -1.4)
}

/**
 * 更新高度发生变化的频谱列，并返回实例缓冲区是否被修改。
 */
function updateEqualizer(elapsed: number) {
  if (!equalizerMesh) {
    return false
  }

  // 三分之一秒对应一个离散时间片，同一时间片不重复计算。
  const sampleIndex = Math.floor(elapsed * 3)

  if (sampleIndex === lastEqualizerSample) {
    return false
  }

  lastEqualizerSample = sampleIndex

  // 离散时间片转换回秒数，保持原有低频波形节奏。
  const sampledTime = sampleIndex / 3
  // 每个频谱方块的固定世界尺寸。
  const blockSize = 0.2
  // 相邻方块之间的固定间距。
  const blockGap = 0.055
  // 标记本次是否有任意频谱列发生高度变化。
  let matrixChanged = false

  // 列循环独立计算每根频谱柱的低频波形。
  for (let column = 0; column < EQUALIZER_COLUMNS; column += 1) {
    // 主波和次波共享同一时间步，使整组频谱连贯变化。
    const wave = Math.sin(sampledTime * 0.75 + column * 0.52) * 0.72
      + Math.sin(sampledTime * 0.3 - column * 0.24) * 0.28
    // 当前列显示的整数方块数。
    const activeRows = MathUtils.clamp(Math.round(4.8 + wave * 3.1), 1, EQUALIZER_ROWS)

    if (equalizerHeights[column] === activeRows) {
      continue
    }

    equalizerHeights[column] = activeRows
    matrixChanged = true

    // 行循环仅在当前柱高变化时重写这一列的实例矩阵。
    for (let row = 0; row < EQUALIZER_ROWS; row += 1) {
      // 当前方块在实例缓冲区中的稳定下标。
      const instanceIndex = column * EQUALIZER_ROWS + row
      // 当前方块是否属于当前时间步的可见柱体高度。
      const isVisible = row < activeRows
      equalizerTransform.position.set(
        column * (blockSize + blockGap),
        row * (blockSize + blockGap),
        0,
      )
      equalizerTransform.scale.setScalar(isVisible ? blockSize : 0.0001)
      equalizerTransform.updateMatrix()
      equalizerMesh.setMatrixAt(instanceIndex, equalizerTransform.matrix)
    }
  }

  if (matrixChanged) {
    equalizerMesh.instanceMatrix.needsUpdate = true
  }

  return matrixChanged
}

/**
 * 仅在频谱变化或场景强制刷新时提交 WebGL 帧。
 */
function renderScene(forceRender = false) {
  if (!renderer || !scene || !camera) {
    return
  }

  // 当前秒数只作为右下角频谱的低频时间源。
  const elapsed = performance.now() / 1000
  // 频谱矩阵是否在当前时间片发生实际变化。
  const equalizerChanged = updateEqualizer(elapsed)

  if (!forceRender && !equalizerChanged) {
    return
  }

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

  if (sceneVisible) {
    renderScene(true)
  }
}

/**
 * 根据视口、标签页可见性和减少动态效果偏好启停频谱。
 */
function syncAnimationState() {
  if (equalizerTimer !== undefined) {
    window.clearInterval(equalizerTimer)
    equalizerTimer = undefined
  }

  if (sceneVisible) {
    renderScene(true)
  }

  // 只有首屏真实可见且允许动态效果时才保持低频更新。
  const shouldAnimate = sceneVisible
    && !document.hidden
    && !reducedMotionQuery?.matches

  if (shouldAnimate) {
    equalizerTimer = window.setInterval(renderScene, EQUALIZER_INTERVAL)
  }
}

/**
 * 响应首屏画布进出视口，避免离屏时继续提交 WebGL 帧。
 */
function handleSceneVisibility(entries: IntersectionObserverEntry[]) {
  // 单一画布观察器的首个条目表示当前首屏可见状态。
  const entry = entries[0]

  if (!entry || sceneVisible === entry.isIntersecting) {
    return
  }

  sceneVisible = entry.isIntersecting
  syncAnimationState()
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

  // 全部静态像素图案合并后只向场景添加一个实例化网格。
  nextScene.add(createPixelShapes())
  nextScene.add(createEqualizer())

  // 只监听首屏容器本身，避免无关窗口事件触发重复布局。
  const nextResizeObserver = new ResizeObserver(resizeScene)
  nextResizeObserver.observe(canvasRef.value)
  resizeObserver = nextResizeObserver

  // 首屏画布离开视口后停止频谱更新和 WebGL 帧提交。
  const nextSceneVisibilityObserver = new IntersectionObserver(handleSceneVisibility)
  nextSceneVisibilityObserver.observe(canvasRef.value)
  sceneVisibilityObserver = nextSceneVisibilityObserver

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
  sceneVisibilityObserver?.disconnect()
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
  decorationMesh = undefined
  equalizerMesh = undefined
  equalizerGroup = undefined
  equalizerHeights.fill(-1)
  lastEqualizerSample = -1
  resizeObserver = undefined
  sceneVisibilityObserver = undefined
  sceneVisible = true
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

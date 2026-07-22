<template>
  <div ref="rootRef" class="molecule" aria-label="NH3 分子像素图形">
    <div ref="positionRef" class="molecule__position">
      <div ref="flightRef" class="molecule__flight">
        <div class="molecule__idle">
          <div ref="stageRef" class="molecule__stage">
            <div v-for="bond in bonds" :key="bond" class="bond" :class="bond">
              <i
                v-for="index in 9"
                :key="index"
                :style="{ '--offset': `${(index - 1) * 3.05}%` }"
              ></i>
            </div>

            <PixelAtom class="atom atom--n" element="N" />
            <PixelAtom class="atom atom--h atom--top" element="H" />
            <PixelAtom class="atom atom--h atom--left" element="H" />
            <PixelAtom class="atom atom--h atom--bottom" element="H" />
          </div>

          <div ref="coreRef" class="molecule__transition-core" aria-hidden="true">
            <PixelPattern
              :pattern="transitionCorePattern"
              :palette="transitionPalette"
            />
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <button
        ref="returnButtonRef"
        class="molecule-return-overlay"
        type="button"
        aria-label="返回页面顶部"
        title="返回顶部"
        @click="scrollToTop"
      >
        <PixelPattern :pattern="returnTopPattern" :palette="returnTopPalette" />
      </button>

      <canvas
        ref="trailCanvasRef"
        class="molecule-transition-trail"
        aria-hidden="true"
      ></canvas>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PixelPattern } from '../../base/pixel'
import PixelAtom from './PixelAtom.vue'

gsap.registerPlugin(Flip, MotionPathPlugin, ScrollToPlugin, ScrollTrigger)

/**
 * 保存分子真实经过的单个屏幕坐标采样点。
 */
interface PixelTrailPoint {
  // 采样点在视口中的横坐标。
  x: number
  // 采样点在视口中的纵坐标。
  y: number
}

// 三组真实 DOM 像素键分别连接氮原子与三个氢原子。
const bonds = ['bond--top', 'bond--left', 'bond--bottom']

// 分子组件把统一滚动进度交给首屏伴生元素，不在父组件创建响应式动画状态。
const emit = defineEmits<{
  // 主分子从原位到返回按钮的统一过渡进度。
  transitionProgress: [progress: number]
}>()

// 返回顶部状态使用 17×17 像素圆环、白色内底，并在中央绘制向上的 ^。
const returnTopPattern = [
  '......11111......',
  '....113333311....',
  '...13333333331...',
  '..1333333333331..',
  '.133333333333331.',
  '.133333333333331.',
  '13333333233333331',
  '13333332323333331',
  '13333323332333331',
  '13333233333233331',
  '13333333333333331',
  '.133333333333331.',
  '.133333333333331.',
  '..1333333333331..',
  '...13333333331...',
  '....113333311....',
  '......11111......',
]

// 分子坍缩时短暂出现的像素核心连接原形态和返回按钮形态。
const transitionCorePattern = [
  '....1....',
  '..1.1.1..',
  '...111...',
  '.1.111.1.',
  '111121111',
  '.1.111.1.',
  '...111...',
  '..1.1.1..',
  '....1....',
]

// 返回按钮使用淡蓝圆环、深蓝箭头和白色内部底面。
const returnTopPalette = {
  '1': '#91a9d9',
  '2': '#496cb8',
  '3': '#ffffff',
}

// 过渡核心使用蓝、青两色形成短暂的能量收束效果。
const transitionPalette = {
  '1': '#7893db',
  '2': '#63c7c3',
}

// 拖尾使用更高对比度的蓝、青、粉，避免在白色背景中被忽略。
const trailColors = ['#3158df', '#00a99d', '#d93a8b']

// 拖尾保留十八个真实位置采样点，形成更长的像素路径。
const TRAIL_PIXEL_COUNT = 18

// 轨迹网格以视口宽度的固定分母计算，不依赖固定像素边长。
const TRAIL_GRID_DIVISOR = 250

// 返回顶部图标使用较短视口边的 8.5% 作为响应式边长。
const COMPACT_SIZE_RATIO = 0.085

// 返回顶部图标使用较短视口边的 4% 作为响应式安全距离。
const COMPACT_OFFSET_RATIO = 0.04

// 最后 10% 滚动进度才开始把飞行中的分子交接给圆环按钮。
const BUTTON_MORPH_START = 0.9

// 滚动目标进度使用 0.8 秒缓冲，确保短区间内仍能看清完整形态变化。
const TRANSITION_SMOOTH_DURATION = 0.8

// 分子根节点在首页原位置和右下角固定状态之间执行 Flip 过渡。
const rootRef = ref<HTMLElement | null>(null)

// 坐标校正层独立承担滚动差值，避免与根节点的 Flip transform 冲突。
const positionRef = ref<HTMLElement | null>(null)

// 内层飞行容器叠加弧线偏移，不与根节点的 Flip transform 冲突。
const flightRef = ref<HTMLElement | null>(null)

// 原始分子舞台在滚动区间内负责坍缩、旋转和重新展开。
const stageRef = ref<HTMLElement | null>(null)

// 像素核心只在两种稳定形态交接的中段显示。
const coreRef = ref<HTMLElement | null>(null)

// 返回顶部按钮在完整过渡结束后接管交互。
const returnButtonRef = ref<HTMLButtonElement | null>(null)

// Teleport 到 body 的完成态按钮与 Canvas 脱离 Hero 的 stacking context。
const trailCanvasRef = ref<HTMLCanvasElement | null>(null)

// 第二个 section 提供进入 1/10 到 1/3 的真实触发距离。
let transitionSectionElement: HTMLElement | null = null

// Flip 返回的暂停时间线由 ScrollTrigger 进度直接控制。
let flightTimeline: gsap.core.Timeline | undefined

// 进度缓冲补间让移动、收束、核心和按钮始终同步追随滚动目标。
let progressTween: gsap.core.Tween | undefined

// 返回原位阶段保持飞行状态，避免主时间线归零时短暂恢复空闲动画。
let isReturningToOrigin = false

// 进入过渡区间时的纵向滚动位置用于校正 fixed 状态和文档坐标的差值。
let flightStartScrollY = 0

// Project 滚动触发器把进入 1/10 到 1/3 的区间映射到完整过渡。
let moleculeScrollTrigger: ScrollTrigger | undefined

// 减少动态效果偏好关闭弧形尾迹，但仍保留返回顶部功能。
let reducedMotionQuery: MediaQueryList | undefined

// 当前分子过渡进度控制拖尾整体显隐区间。
let trailProgress = 0

// 最近的真实屏幕中心按新到旧保存，用于直接绘制拖尾。
const trailPoints: PixelTrailPoint[] = []

// 上一帧过渡进度用于检测运动方向反转并清除旧方向轨迹。
let previousTrailProgress = 0

// 当前拖尾采样方向避免前进与返回路径在同一帧混合。
let trailDirection = 0

// 组件挂载后建立第二个 section 进入 1/10 到 1/3 的滚动控制器。
onMounted(mountMoleculeTransition)

// 组件卸载时销毁滚动触发器、Flip 时间线和临时 Canvas。
onUnmounted(unmountMoleculeTransition)

/**
 * 建立 Project section 进入自身 1/10 到 1/3 的滚动触发器。
 */
function mountMoleculeTransition() {
  // 分子根节点必须存在才能建立跨 section 的布局过渡。
  const root = rootRef.value
  // Project 是首页后的第二个 section，也是新过渡区间的尺寸来源。
  const transitionSection = document.getElementById('project')

  if (!root || !transitionSection || window.innerWidth <= 820) {
    return
  }

  transitionSectionElement = transitionSection
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  moleculeScrollTrigger = ScrollTrigger.create({
    trigger: transitionSection,
    start: resolveMoleculeTransitionStart,
    end: resolveMoleculeTransitionEnd,
    invalidateOnRefresh: true,
    onEnter: prepareMoleculeFlight,
    onUpdate: handleMoleculeScroll,
    onRefresh: handleMoleculeScroll,
    onLeaveBack: finishMoleculeReturn,
  })
}

/**
 * 销毁分子滚动过渡持有的 GSAP 状态和临时绘制资源。
 */
function unmountMoleculeTransition() {
  moleculeScrollTrigger?.kill()
  progressTween?.kill()
  releaseMoleculeFlight()
  transitionSectionElement = null
}

/**
 * 返回 Project section 进入自身高度 1/10 时的过渡起点。
 */
function resolveMoleculeTransitionStart() {
  // 从视口底部向上偏移 section 高度的 1/10，表示已有 1/10 进入视口。
  const startOffset = (transitionSectionElement?.offsetHeight ?? 0) / 10
  return `top bottom-=${startOffset}`
}

/**
 * 返回 Project section 进入自身高度 1/3 时的过渡终点。
 */
function resolveMoleculeTransitionEnd() {
  // 从视口底部向上偏移 section 高度的 1/3，完整过程占用约 7/30 section 高度。
  const endOffset = (transitionSectionElement?.offsetHeight ?? 0) / 3
  return `top bottom-=${endOffset}`
}

/**
 * 首次进入过渡区间时捕获原布局并创建可滚动控制的 Flip 时间线。
 */
function prepareMoleculeFlight() {
  if (flightTimeline) {
    return
  }

  isReturningToOrigin = false

  // 根节点提供原始布局矩形和右下角固定目标。
  const root = rootRef.value
  // 内层飞行容器提供不干扰 Flip 的弧线偏移层。
  const flight = flightRef.value
  // 完整分子舞台负责从可见状态向中心坍缩。
  const stage = stageRef.value
  // 中间像素核心负责承接坍缩后的瞬时能量状态。
  const core = coreRef.value
  // 返回顶部按钮负责时间线末端的圆环展开。
  const button = returnButtonRef.value

  if (!root || !flight || !stage || !core || !button) {
    return
  }

  flightStartScrollY = window.scrollY
  // 原始布局状态必须在应用固定定位之前捕获。
  const flipState = Flip.getState(root)
  // 过渡起点矩形对应 Project 刚进入自身高度 1/10 的时刻。
  const startBounds = root.getBoundingClientRect()
  // 较短视口边是紧凑尺寸和安全距离的共同响应式基准。
  const viewportBase = Math.min(window.innerWidth, window.innerHeight)
  // 返回顶部图标边长随当前视口等比变化。
  const compactSize = viewportBase * COMPACT_SIZE_RATIO
  // 右侧和底部安全距离随当前视口等比变化。
  const compactOffset = viewportBase * COMPACT_OFFSET_RATIO
  // 保持原始布局宽度并只缩放视觉结果，避免内部 Canvas 降分辨率。
  const compactScale = compactSize / startBounds.width
  // 缩放围绕中心执行时，固定盒子的左坐标需要补偿两侧尺寸差。
  const compactLeft = window.innerWidth
    - compactOffset
    - (startBounds.width + compactSize) / 2
  // 缩放围绕中心执行时，固定盒子的上坐标需要补偿底部尺寸差。
  const compactTop = window.innerHeight
    - compactOffset
    - (startBounds.height + compactSize) / 2

  root.style.setProperty('--molecule-compact-left', `${compactLeft}px`)
  root.style.setProperty('--molecule-compact-top', `${compactTop}px`)
  root.style.setProperty('--molecule-compact-scale', `${compactScale}`)
  root.classList.add('molecule--compact')

  // 新飞行开始前清除上一次方向留下的真实位置采样。
  resetTrailHistory()

  // Flip 时间线同时承载根节点移动和内部形态变化，统一映射滚动进度。
  const timeline = Flip.from(flipState, {
    duration: 1,
    ease: 'none',
    paused: true,
    scale: true,
  })

  if (!reducedMotionQuery?.matches) {
    // 弧线横向偏移取原分子宽度的一定比例。
    const arcOffsetX = -startBounds.width * 0.13
    // 弧线纵向偏移取原分子高度的一定比例。
    const arcOffsetY = -startBounds.height * 0.2

    timeline.to(
      flight,
      {
        duration: 1,
        ease: 'none',
        motionPath: {
          autoRotate: false,
          curviness: 1.45,
          path: [
            { x: 0, y: 0 },
            { x: arcOffsetX, y: arcOffsetY },
            { x: 0, y: 0 },
          ],
        },
      },
      0,
    )
  }

  timeline
    .fromTo(
      stage,
      { autoAlpha: 1, rotation: 0, scale: 1 },
      {
        duration: 0.92,
        ease: 'power1.inOut',
        rotation: 120,
        scale: 0.68,
      },
      0,
    )
    .to(
      stage,
      {
        autoAlpha: 0,
        duration: 0.08,
        ease: 'none',
      },
      0.92,
    )
    .fromTo(
      core,
      { autoAlpha: 0, rotation: -72, scale: 0.35 },
      {
        autoAlpha: 1,
        duration: 0.14,
        ease: 'steps(4)',
        rotation: 36,
        scale: 1,
      },
      0.78,
    )
    .to(
      core,
      {
        autoAlpha: 0,
        duration: 0.08,
        ease: 'none',
        rotation: 90,
        scale: 0.55,
      },
      0.92,
    )

  timeline.pause(0)
  flightTimeline = timeline
}

/**
 * 让统一时间线平滑追随滚动目标，避免短触发区间造成形态跳变。
 */
function handleMoleculeScroll(trigger: ScrollTrigger) {
  if (trigger.progress > 0.001) {
    isReturningToOrigin = false
  }

  if (trigger.progress > 0 && !flightTimeline) {
    prepareMoleculeFlight()
  }

  if (!flightTimeline) {
    return
  }

  // 减少动态效果模式直接同步目标进度，不增加额外缓冲动画。
  if (reducedMotionQuery?.matches) {
    flightTimeline.progress(trigger.progress).pause()
    syncMoleculeTransition(trigger.progress)
    return
  }

  progressTween?.kill()
  progressTween = gsap.to(flightTimeline, {
    duration: TRANSITION_SMOOTH_DURATION,
    ease: 'power2.out',
    overwrite: true,
    progress: trigger.progress,
    onUpdate: syncBufferedMoleculeProgress,
  })
}

/**
 * 使用缓冲后时间线的真实进度同步层级、尾迹和圆环位置。
 */
function syncBufferedMoleculeProgress() {
  syncMoleculeTransition(flightTimeline?.progress() ?? 0)
}

/**
 * 向上越过起点时先平滑回到零进度，再恢复普通文档定位。
 */
function finishMoleculeReturn() {
  if (!flightTimeline || reducedMotionQuery?.matches) {
    releaseMoleculeFlight()
    return
  }

  isReturningToOrigin = true
  progressTween?.kill()
  progressTween = gsap.to(flightTimeline, {
    duration: 0.28,
    ease: 'power2.out',
    overwrite: true,
    progress: 0,
    onUpdate: syncBufferedMoleculeProgress,
    onComplete: releaseMoleculeFlight,
  })
}

/**
 * 根据统一进度控制动画状态类、返回按钮交互和像素尾迹。
 */
function syncMoleculeTransition(progress: number) {
  // 根节点状态类决定飞行期间层级、CSS 动画和最终按钮交互。
  const root = rootRef.value
  // 坐标校正层保持视觉位置与当前文档滚动位置一致。
  const position = positionRef.value

  if (!root || !position) {
    return
  }

  syncMoleculeScrollCompensation(position, progress)
  emit('transitionProgress', progress)
  root.classList.toggle(
    'molecule--in-flight',
    progress > 0.001 || isReturningToOrigin,
  )
  syncReturnButton(progress)
  trailProgress = progress

  if (reducedMotionQuery?.matches || progress <= 0.001 || progress >= 0.999) {
    clearTrailCanvas()
    return
  }

  sampleTrailPoint(progress)
  ensureTrailCanvas()
  drawPixelTrail()
}

/**
 * 按剩余过渡进度补偿滚动差，使 fixed 根节点始终对应当前文档坐标。
 */
function syncMoleculeScrollCompensation(position: HTMLElement, progress: number) {
  // 越接近原始形态越完整地应用滚动补偿，紧凑完成态保持固定目标位置。
  const compensationWeight = 1 - gsap.utils.clamp(0, 1, progress)
  // 当前滚动位置相对进入过渡区间时产生的视口坐标差。
  const scrollDelta = flightStartScrollY - window.scrollY
  // 独立校正层不占用 Flip 管理的根节点 transform。
  const compensationY = scrollDelta * compensationWeight

  gsap.set(position, { y: compensationY })
}

/**
 * 在最后 10% 进度中让圆环按钮跟随分子实时位置完成视觉交接。
 */
function syncReturnButton(progress: number) {
  // 坐标校正层提供包含滚动差值后的真实视觉位置。
  const position = positionRef.value
  // Teleport 按钮脱离 Hero 层级，但位置始终跟随分子当前包围盒。
  const button = returnButtonRef.value

  if (!position || !button) {
    return
  }

  // 最后 10% 区间内从 0 到 1 的圆环显现进度。
  const morphProgress = gsap.utils.clamp(
    0,
    1,
    (progress - BUTTON_MORPH_START) / (1 - BUTTON_MORPH_START),
  )

  button.classList.toggle(
    'molecule-return-overlay--interactive',
    progress >= 0.995,
  )

  if (morphProgress <= 0) {
    button.style.visibility = 'hidden'
    button.style.opacity = '0'
    button.style.pointerEvents = 'none'
    return
  }

  // 当前分子包围盒已经包含 Flip 移动和整体缩放结果。
  const bounds = position.getBoundingClientRect()
  // 圆环自身轻微展开，避免在交接开始点突然出现完整尺寸。
  const buttonScale = 0.78 + morphProgress * 0.22

  button.style.top = `${bounds.top}px`
  button.style.right = 'auto'
  button.style.bottom = 'auto'
  button.style.left = `${bounds.left}px`
  button.style.width = `${bounds.width}px`
  button.style.height = `${bounds.height}px`
  button.style.visibility = 'visible'
  button.style.opacity = `${morphProgress}`
  button.style.pointerEvents = progress >= 0.995 ? 'auto' : 'none'
  button.style.transform = `scale(${buttonScale})`
}

/**
 * 离开过渡区间上边界后直接恢复与当前文档坐标一致的正常定位。
 */
function releaseMoleculeFlight() {
  progressTween?.kill()
  progressTween = undefined
  // 根节点需要移除固定目标类和 Flip 留下的内联布局属性。
  const root = rootRef.value
  // 坐标校正层需要清除滚动差值写入的 transform。
  const position = positionRef.value
  // 内层飞行容器需要清除 MotionPath 写入的 transform。
  const flight = flightRef.value
  // 完整分子舞台需要清除坍缩过程写入的状态。
  const stage = stageRef.value
  // 中间像素核心需要恢复默认隐藏状态。
  const core = coreRef.value
  // 返回按钮需要恢复默认不可交互状态。
  const button = returnButtonRef.value

  flightTimeline?.progress(0)

  if (position) {
    syncMoleculeScrollCompensation(position, 0)
  }

  flightTimeline?.kill()
  flightTimeline = undefined
  isReturningToOrigin = false
  flightStartScrollY = 0

  if (root) {
    Flip.killFlipsOf(root)
    root.classList.remove(
      'molecule--compact',
      'molecule--in-flight',
    )
    root.style.removeProperty('--molecule-compact-left')
    root.style.removeProperty('--molecule-compact-top')
    root.style.removeProperty('--molecule-compact-scale')
    gsap.set(root, {
      clearProps: 'bottom,height,left,position,right,top,transform,width,zIndex',
    })
  }

  if (position) {
    gsap.set(position, { clearProps: 'transform' })
  }

  if (flight) {
    gsap.set(flight, { clearProps: 'transform' })
  }

  if (stage) {
    gsap.set(stage, { clearProps: 'opacity,rotation,scale,transform,visibility' })
  }

  if (core) {
    gsap.set(core, { clearProps: 'opacity,rotation,scale,transform,visibility' })
  }

  if (button) {
    button.classList.remove('molecule-return-overlay--interactive')
    gsap.set(button, {
      clearProps: 'bottom,height,left,opacity,pointerEvents,right,rotation,scale,top,transform,visibility,width',
    })
  }

  clearTrailCanvas()
  emit('transitionProgress', 0)
}

/**
 * 清除拖尾位置、进度和运动方向状态。
 */
function resetTrailHistory() {
  trailPoints.length = 0
  trailProgress = 0
  previousTrailProgress = 0
  trailDirection = 0
}

/**
 * 采样分子飞行层的真实屏幕中心，并在方向反转时重新开始拖尾。
 */
function sampleTrailPoint(progress: number) {
  // 飞行层的包围盒包含 Flip、MotionPath、缩放和滚动补偿的最终结果。
  const flight = flightRef.value

  if (!flight) {
    return
  }

  // 当前进度变化方向用于区分前进和返回轨迹。
  const nextDirection = Math.sign(progress - previousTrailProgress)

  if (nextDirection !== 0 && trailDirection !== 0 && nextDirection !== trailDirection) {
    trailPoints.length = 0
  }

  if (nextDirection !== 0) {
    trailDirection = nextDirection
  }

  previousTrailProgress = progress

  // 真实包围盒中心就是当前帧拖尾应连接的位置。
  const bounds = flight.getBoundingClientRect()
  // 当前帧分子中心横坐标。
  const x = bounds.left + bounds.width / 2
  // 当前帧分子中心纵坐标。
  const y = bounds.top + bounds.height / 2
  // 最新采样点用于过滤相邻帧重复坐标。
  const latestPoint = trailPoints[0]
  // 采样间距随视口变化，但最低保持两个 CSS 像素。
  const minimumDistance = Math.max(2, window.innerWidth / TRAIL_GRID_DIVISOR * 0.6)

  if (latestPoint && Math.hypot(x - latestPoint.x, y - latestPoint.y) < minimumDistance) {
    return
  }

  trailPoints.unshift({ x, y })

  if (trailPoints.length > TRAIL_PIXEL_COUNT + 1) {
    trailPoints.length = TRAIL_PIXEL_COUNT + 1
  }
}

/**
 * 按当前视口尺寸为瞬时像素尾迹分配有限分辨率纹理。
 */
function ensureTrailCanvas() {
  // 全屏轨迹 Canvas 只在过渡区间内部持有真实纹理尺寸。
  const canvas = trailCanvasRef.value

  if (!canvas) {
    return
  }

  // 设备像素比限制在 1.5，方形尾迹无需高分辨率抗锯齿。
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  // 当前视口对应的物理纹理宽度。
  const renderWidth = Math.max(1, Math.round(window.innerWidth * pixelRatio))
  // 当前视口对应的物理纹理高度。
  const renderHeight = Math.max(1, Math.round(window.innerHeight * pixelRatio))

  if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
    canvas.width = renderWidth
    canvas.height = renderHeight
  }
}

/**
 * 按统一滚动进度绘制吸附到响应式网格的方形弧线尾迹。
 */
function drawPixelTrail() {
  // 当前全屏 Canvas 承载过渡路径上的瞬时像素方块。
  const canvas = trailCanvasRef.value
  // 二维上下文每帧清除旧轨迹并绘制新位置。
  const context = canvas?.getContext('2d')

  if (!canvas || !context || canvas.width <= 1 || canvas.height <= 1) {
    return
  }

  // Canvas 物理宽度与视口宽度的真实缩放比。
  const scaleX = canvas.width / window.innerWidth
  // Canvas 物理高度与视口高度的真实缩放比。
  const scaleY = canvas.height / window.innerHeight
  // 拖尾在过渡大部分区间保持高可见度，只在两端快速淡出。
  const trailOpacity = Math.min(
    1,
    trailProgress * 7,
    (1 - trailProgress) * 10,
  )

  context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  context.clearRect(0, 0, window.innerWidth, window.innerHeight)
  context.imageSmoothingEnabled = false

  // 真实位置采样从最新到最旧绘制，并沿时间逐渐缩小和减弱。
  trailPoints.forEach((point, index) => {
    if (index >= TRAIL_PIXEL_COUNT) {
      return
    }

    // 当前视口宽度换算出的响应式拖尾像素边长。
    const trailGridSize = window.innerWidth / TRAIL_GRID_DIVISOR
    // 横坐标吸附到响应式像素网格。
    const snappedX = Math.round(point.x / trailGridSize) * trailGridSize
    // 纵坐标吸附到响应式像素网格。
    const snappedY = Math.round(point.y / trailGridSize) * trailGridSize
    // 拖尾前端使用更大的像素块，中后段逐级收窄。
    const pixelSize = index < 4
      ? trailGridSize * 3.2
      : index < 10
        ? trailGridSize * 2.1
        : trailGridSize * 1.35

    context.globalAlpha = trailOpacity * (1 - index / TRAIL_PIXEL_COUNT) * 0.98
    context.fillStyle = trailColors[index % trailColors.length]
    context.fillRect(
      snappedX - pixelSize / 2,
      snappedY - pixelSize / 2,
      pixelSize,
      pixelSize,
    )
  })

  context.globalAlpha = 1
}

/**
 * 清空并缩小临时尾迹纹理，避免稳定状态占用全屏 Canvas 内存。
 */
function clearTrailCanvas() {
  // 尾迹 Canvas 可能在组件完成挂载前尚不存在。
  const canvas = trailCanvasRef.value

  resetTrailHistory()

  if (!canvas || (canvas.width === 1 && canvas.height === 1)) {
    return
  }

  canvas.width = 1
  canvas.height = 1
}

/**
 * 使用 GSAP 平滑滚动到页面顶部，滚动进度会同步反向重组分子。
 */
function scrollToTop() {
  gsap.to(window, {
    duration: 0.9,
    ease: 'power3.inOut',
    overwrite: 'auto',
    scrollTo: { y: 0 },
  })
}
</script>

<style scoped>
.molecule {
  --molecule-size: clamp(450px, 41vw, 820px);
  position: absolute;
  z-index: 4;
  top: 24%;
  left: calc(58.5% - var(--molecule-size) / 2);
  width: var(--molecule-size);
  aspect-ratio: 1 / 1;
  filter: drop-shadow(0 18px 28px rgb(91 112 188 / 9%));
}

.molecule__position,
.molecule__flight,
.molecule__idle,
.molecule__stage {
  position: absolute;
  inset: 0;
}

.molecule__flight {
  transform-origin: center;
}

.molecule__idle {
  animation: molecule-idle 8.5s ease-in-out infinite;
  transform-origin: 50% 52%;
  will-change: transform;
}

.molecule__stage {
  transform-origin: 50% 52%;
  will-change: transform;
}

.molecule.molecule--compact {
  position: fixed;
  z-index: 40;
  top: var(--molecule-compact-top);
  left: var(--molecule-compact-left);
  transform: scale(var(--molecule-compact-scale));
  transform-origin: center;
}

.molecule--in-flight {
  z-index: 40;
  filter: none;
}

.molecule--in-flight .molecule__idle {
  animation-play-state: paused;
}

.molecule__transition-core {
  position: absolute;
  z-index: 6;
  top: 31%;
  left: 31%;
  width: 38%;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform-origin: center;
}

:global(.molecule-return-overlay) {
  position: fixed;
  z-index: 41;
  right: 4vmin;
  bottom: 4vmin;
  display: grid;
  width: 8.5vmin;
  height: 8.5vmin;
  padding: 0;
  visibility: hidden;
  place-items: center;
  color: #496cb8;
  background: transparent;
  border: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform-origin: center;
  transition: translate 180ms ease;
}

:global(.molecule-return-overlay--interactive) {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

:global(.molecule-return-overlay--interactive:hover) {
  translate: 0 -0.45vmin;
}

:global(.molecule-return-overlay:focus-visible) {
  outline: 0.14rem dashed #6f89c0;
  outline-offset: 0.28rem;
}
.atom {
  position: absolute;
  z-index: 4;
}

.atom--n {
  top: 25%;
  left: 25%;
  width: 48%;
}

.atom--h {
  width: 24%;
}

.atom--top {
  top: 0;
  left: 66%;
}

.atom--left {
  top: 66%;
  left: 0;
}

.atom--bottom {
  right: 0;
  bottom: 0;
}

.bond {
  position: absolute;
  z-index: 2;
  inset: 0;
}

.bond i {
  position: absolute;
  width: 4.8%;
  aspect-ratio: 1 / 1;
  background: #cbd7ff;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.bond i:nth-child(3n) {
  background: #c4e6eb;
}

.bond--top i {
  left: calc(56% + var(--offset));
  top: calc(28% - var(--offset));
}

.bond--left i {
  left: calc(30% - var(--offset));
  top: calc(55% + var(--offset));
}

.bond--bottom i {
  left: calc(64% + var(--offset));
  top: calc(64% + var(--offset));
}

:global(.molecule-transition-trail) {
  position: fixed;
  z-index: 39;
  inset: 0;
  display: block;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

@keyframes molecule-idle {
  0%,
  100% {
    transform: translate3d(0, 5px, 0) rotate(-0.35deg);
  }

  50% {
    transform: translate3d(0, -7px, 0) rotate(0.35deg);
  }
}

@media (max-width: 1100px) {
  .molecule {
    left: 38%;
    width: 50vw;
  }
}

@media (max-width: 820px) {
  .molecule {
    top: 430px;
    left: 16%;
    width: min(76vw, 520px);
  }
}

@media (max-width: 560px) {
  .molecule {
    top: 420px;
    left: 7%;
    width: 86vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .molecule__idle,
  :global(.molecule-return-overlay) {
    animation: none;
    transition: none;
  }
}
</style>

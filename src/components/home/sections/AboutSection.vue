<template>
  <section
    :id="homeSections.about.id"
    ref="sectionRef"
    class="about-section"
    :aria-label="homeSections.about.ariaLabel"
    :style="resolvePaletteStyle()"
  >
    <div ref="stageRef" class="about-stage">
      <div class="about-rhythm-field" aria-hidden="true">
        <div
          class="about-rhythm-side about-rhythm-side--left"
          :style="resolveBarFieldStyle(leftBars.length)"
        >
          <div
            v-for="bar in leftBars"
            :key="bar.id"
            class="about-rhythm-bar about-rhythm-bar--left"
            :data-bar-id="bar.id"
            :style="resolveBarStyle(bar)"
          >
            <span
              v-for="pixelIndex in bar.segmentCount"
              :key="pixelIndex"
              class="about-rhythm-bar__pixel"
              :data-mobile-hidden="pixelIndex > bar.mobileSegmentCount ? 'true' : 'false'"
              :data-pixel-index="pixelIndex - 1"
              :style="resolveRhythmPixelStyle(pixelIndex - 1, bar)"
            ></span>
          </div>
        </div>

        <div
          class="about-rhythm-side about-rhythm-side--right"
          :style="resolveBarFieldStyle(rightBars.length)"
        >
          <div
            v-for="bar in rightBars"
            :key="bar.id"
            class="about-rhythm-bar about-rhythm-bar--right"
            :data-bar-id="bar.id"
            :style="resolveBarStyle(bar)"
          >
            <span
              v-for="pixelIndex in bar.segmentCount"
              :key="pixelIndex"
              class="about-rhythm-bar__pixel"
              :data-mobile-hidden="pixelIndex > bar.mobileSegmentCount ? 'true' : 'false'"
              :data-pixel-index="pixelIndex - 1"
              :style="resolveRhythmPixelStyle(pixelIndex - 1, bar)"
            ></span>
          </div>
        </div>
      </div>

      <div class="about-intro" aria-hidden="true">
        <div
          v-for="line in aboutContent.intro"
          :key="line.id"
          class="about-intro-line"
          :data-intro-id="line.id"
        >
          <PixelText
            class="about-intro-line__text"
            :text="line.text"
            :color="line.color"
            :density="line.density"
            text-align="center"
          />
        </div>
      </div>

      <div ref="profileRef" class="about-profile">
        <div class="about-profile__shell">
          <div class="about-profile__fragments about-profile__fragments--left">
            <article
              v-for="fragment in leftFragments"
              :key="fragment.id"
              class="about-profile-fragment"
              data-side="left"
              :data-fragment-id="fragment.id"
              :style="resolveFragmentStyle(fragment)"
            >
              <div class="about-profile-fragment__body">
                <span class="about-profile-fragment__label">{{ fragment.label }}</span>
                <strong class="about-profile-fragment__value">{{ fragment.value }}</strong>
              </div>
            </article>
          </div>

          <div class="about-profile__portrait-zone">
            <span
              v-for="pixelIndex in 8"
              :key="pixelIndex"
              class="about-profile__orbit-pixel"
              :style="resolveOrbitPixelStyle(pixelIndex - 1)"
              aria-hidden="true"
            ></span>
            <div class="about-profile__portrait">
              <img
                v-if="aboutContent.profile.portrait.src"
                :src="aboutContent.profile.portrait.src"
                :alt="aboutContent.profile.portrait.alt"
              />
              <span v-else>{{ aboutContent.profile.portrait.fallback }}</span>
            </div>
          </div>

          <div class="about-profile__fragments about-profile__fragments--right">
            <article
              v-for="fragment in rightFragments"
              :key="fragment.id"
              class="about-profile-fragment"
              data-side="right"
              :data-fragment-id="fragment.id"
              :style="resolveFragmentStyle(fragment)"
            >
              <div class="about-profile-fragment__body">
                <span class="about-profile-fragment__label">{{ fragment.label }}</span>
                <strong class="about-profile-fragment__value">{{ fragment.value }}</strong>
              </div>
            </article>
          </div>

          <div class="about-profile__identity">
            <PixelText
              class="about-profile__name"
              :text="aboutContent.profile.name"
              :color="profileNameGradient"
              :density="10"
              text-align="center"
            />
            <p class="about-profile__role">{{ aboutContent.profile.role }}</p>
            <p class="about-profile__statement">{{ aboutContent.profile.statement }}</p>
            <nav class="about-profile__contacts" aria-label="联系方式">
              <a
                v-for="contact in aboutContent.profile.contacts"
                :key="contact.id"
                class="about-profile-contact"
                :href="contact.href"
                target="_blank"
                rel="noopener noreferrer"
                :style="{ '--contact-accent': contact.accent }"
              >
                <span>{{ contact.label }}</span>
                <strong>{{ contact.value }}</strong>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="about-scroll-track" aria-hidden="true">
      <div
        v-for="line in aboutContent.intro"
        :key="`step-${line.id}`"
        class="about-scroll-step about-scroll-step--text"
      ></div>
      <div class="about-scroll-step about-scroll-step--fracture"></div>
      <div class="about-scroll-step about-scroll-step--profile"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PixelText from '../../base/pixel/PixelText.vue'
import {
  aboutContent,
  homeSections,
} from '../../../config/home'
import type {
  AboutProfileFragment,
  AboutRhythmBar,
} from '../../../config/home'

gsap.registerPlugin(ScrollTrigger)

/**
 * 保存一根律动柱及其全部正方形像素节点。
 */
interface RhythmBarRuntime {
  // 当前运行时对应的配置项。
  config: AboutRhythmBar
  // 柱体根节点用于读取原始空间位置。
  element: HTMLElement
  // 柱体内部按视觉顺序排列的像素节点。
  pixels: HTMLElement[]
}

/**
 * 保存一个柱体像素飞向最终信息块时的目标变换。
 */
interface FractureMotion {
  // 四组正交路线的稳定编号，用于错开横穿与落位节奏。
  route: number
  // 方块横穿屏幕后在对侧形成编织像素流的水平位移。
  crossX: number
  // 复杂路线进入交换区前使用的中段水平位移。
  waypointX: number
  // 复杂路线进入交换区前使用的纵向错层位移。
  waypointY: number
  // 方块从对侧像素流进入资料块后的水平位移。
  targetX: number
  // 方块从对侧像素流进入资料块后的垂直位移。
  targetY: number
  // 方块抵达资料块附近时的尺寸比例。
  targetScale: number
}

// 像素柱开始完全展开并准备裂解的滚动进度。
const FRACTURE_START = 0.56
// 律动逐渐收束为完整柱体的滚动进度。
const RHYTHM_SETTLE_START = 0.5
// 中心文字序列开始出现的滚动进度。
const TEXT_SEQUENCE_START = 0.035
// 中心文字序列全部离场的滚动进度。
const TEXT_SEQUENCE_END = 0.53
// 最终个人名片开始重组的滚动进度。
const PROFILE_REVEAL_START = 0.66
// 侧边柱在窄屏下切换为横向宽度约束，避免遮住中心文字。
const RHYTHM_MOBILE_BREAKPOINT = 700
// 一轮律动只完成约一次呼吸，滚动时保持缓慢而连续的传播感。
const RHYTHM_WAVE_DISTANCE = Math.PI * 2.15
// About 根节点提供自然文档滚动范围和导航锚点。
const sectionRef = ref<HTMLElement | null>(null)
// Sticky 舞台节点提供所有动画元素的坐标系。
const stageRef = ref<HTMLElement | null>(null)
// 最终个人名片节点用于统一控制可见性。
const profileRef = ref<HTMLElement | null>(null)
// 左侧碎片信息按配置顺序自然适配数量。
const leftFragments = computed(() => aboutContent.profile.fragments.filter(
  (fragment) => fragment.side === 'left',
))
// 右侧碎片信息按配置顺序自然适配数量。
const rightFragments = computed(() => aboutContent.profile.fragments.filter(
  (fragment) => fragment.side === 'right',
))
// 左侧横向柱按配置顺序从上到下连续排列。
const leftBars = computed(() => aboutContent.bars.filter((bar) => bar.side === 'left'))
// 右侧横向柱按配置顺序从上到下连续排列。
const rightBars = computed(() => aboutContent.bars.filter((bar) => bar.side === 'right'))
// 名称渐变始终由 About 配置中的四个柔和主色生成。
const profileNameGradient = computed(() => `linear-gradient(90deg, ${aboutContent.palette.blue} 0%, ${aboutContent.palette.teal} 34%, ${aboutContent.palette.purple} 68%, ${aboutContent.palette.pink} 100%)`)
// About 内部 GSAP 上下文负责统一回收时间线和 ScrollTrigger。
let animationContext: gsap.Context | undefined
// 窗口连续变化时只在下一动画帧重建一次目标坐标。
let resizeFrame: number | undefined

/**
 * 把 About 配置调色板暴露为组件内部统一使用的 CSS 变量。
 */
function resolvePaletteStyle() {
  return {
    '--about-blue': aboutContent.palette.blue,
    '--about-teal': aboutContent.palette.teal,
    '--about-purple': aboutContent.palette.purple,
    '--about-pink': aboutContent.palette.pink,
    '--about-blue-light': aboutContent.palette.blueLight,
    '--about-teal-light': aboutContent.palette.tealLight,
    '--about-purple-light': aboutContent.palette.purpleLight,
    '--about-pink-light': aboutContent.palette.pinkLight,
  } as CSSProperties
}

/**
 * 把柱体配置转换为响应式 CSS 自定义属性。
 */
function resolveBarStyle(bar: AboutRhythmBar) {
  return {
    '--bar-color': bar.color,
    '--rhythm-breath': '0.5',
    '--rhythm-settle': '0',
    '--rhythm-shift': '0px',
    '--rhythm-visible-length': String(bar.minVisible),
  } as CSSProperties
}

/**
 * 为每个现有方块提供稳定索引、方向和错位相位，不创建额外像素节点。
 */
function resolveRhythmPixelStyle(pixelIndex: number, bar: AboutRhythmBar) {
  // 左右两侧使用相反方向，使隐藏端都从外侧压缩并向中心展开。
  const direction = bar.side === 'left' ? 1 : -1
  // 五档错位相位让相邻方块在伸缩边缘形成离散波纹。
  const tilt = pixelIndex % 5 - 2
  // 四档深度控制内部亮片和轴向位移的细微差异。
  const depth = pixelIndex % 4 + 1

  return {
    '--rhythm-depth': String(depth),
    '--rhythm-direction': String(direction),
    '--rhythm-index': String(pixelIndex),
    '--rhythm-tilt': String(tilt),
  } as CSSProperties
}

/**
 * 根据当前侧边柱数量使用统一的整数像素尺寸创建固定轨道。
 */
function resolveBarFieldStyle(barCount: number) {
  return {
    gridTemplateRows: `repeat(${Math.max(1, barCount)}, var(--about-rhythm-cell-size))`,
  } as CSSProperties
}

/**
 * 按舞台真实尺寸计算统一的整数方块边长，并把剩余空间平均留在上下两端。
 */
function syncRhythmGrid(stage: HTMLElement) {
  // 左右两侧使用相同的行数和方块尺寸，确保横向轨道严格对齐。
  const barCount = Math.max(leftBars.value.length, rightBars.value.length, 1)
  // 当前断点决定横向最多允许柱体占据多少屏幕宽度。
  const mobileLayout = stage.clientWidth <= RHYTHM_MOBILE_BREAKPOINT
  // 窄屏只统计实际保留的方块数量，桌面端则使用完整配置长度。
  const maxSegmentCount = Math.max(
    1,
    ...aboutContent.bars.map((bar) => (
      mobileLayout ? bar.mobileSegmentCount : bar.segmentCount
    )),
  )
  // 导航栏下方的真实可用高度用于计算纵向整数尺寸。
  const navClearance = Number.parseFloat(
    window.getComputedStyle(stage).getPropertyValue('--about-nav-clearance'),
  ) || 0
  // 方块纵向可用空间不包含顶部导航栏占位。
  const availableHeight = Math.max(barCount, stage.clientHeight - navClearance)
  // 纵向尺寸向下取整，避免 Grid 把亚像素余数分配到不同行。
  const verticalCellSize = Math.floor(availableHeight / barCount)
  // 横向占用上限为中心文字保留稳定的可读区域。
  const sideWidthRatio = mobileLayout ? 0.42 : 0.38
  // 横向尺寸同样向下取整，保证正方形不会产生半像素边缘。
  const horizontalCellSize = Math.floor(
    stage.clientWidth * sideWidthRatio / maxSegmentCount,
  )
  // 最终边长同时满足纵向排列和横向留白约束。
  const cellSize = Math.max(20, Math.min(verticalCellSize, horizontalCellSize))
  // 固定轨道占据的总高度只由整数方块数量决定。
  const usedHeight = cellSize * barCount
  // 未使用的纵向余量平均分布，防止轨道整体偏向顶部或底部。
  const verticalOffset = Math.max(0, Math.floor((availableHeight - usedHeight) / 2))

  stage.style.setProperty('--about-rhythm-cell-size', `${cellSize}px`)
  stage.style.setProperty('--about-rhythm-offset', `${verticalOffset}px`)
}

/**
 * 把个人信息碎片配置转换为纯色像素块样式。
 */
function resolveFragmentStyle(fragment: AboutProfileFragment) {
  return {
    '--fragment-accent': fragment.accent,
    '--fragment-background': fragment.background,
    '--fragment-shift': `${fragment.shift}px`,
  } as CSSProperties
}

/**
 * 为头像周围八个像素生成稳定位置和当前主题色。
 */
function resolveOrbitPixelStyle(index: number) {
  // 四个主色按顺序循环，确保头像装饰和其他章节共享配色。
  const colors = [
    aboutContent.palette.blue,
    aboutContent.palette.teal,
    aboutContent.palette.purple,
    aboutContent.palette.pink,
  ]
  // 八个像素均匀分布在圆周上。
  const angle = index * Math.PI / 4
  // 水平坐标以头像中心为原点。
  const x = Math.cos(angle) * 178
  // 垂直坐标以头像中心为原点。
  const y = Math.sin(angle) * 178

  return {
    '--orbit-color': colors[index % colors.length],
    '--orbit-x': `${Math.round(x)}px`,
    '--orbit-y': `${Math.round(y)}px`,
  } as CSSProperties
}

/**
 * 收集配置对应的柱体与像素节点，滚动期间不再查询 DOM。
 */
function createBarRuntimes(section: HTMLElement) {
  return aboutContent.bars.flatMap((config) => {
    // 当前配置对应的真实柱体节点。
    const element = section.querySelector<HTMLElement>(`[data-bar-id="${config.id}"]`)

    if (!element) {
      return []
    }

    // 柱体像素顺序与配置中的 segmentCount 保持一致。
    const pixels = Array.from(
      element.querySelectorAll<HTMLElement>('.about-rhythm-bar__pixel'),
    ).filter((pixel) => window.getComputedStyle(pixel).display !== 'none')

    return [{ config, element, pixels } satisfies RhythmBarRuntime]
  })
}

/**
 * 根据真实页面滚动进度连续显示柱体末端方块，停止滚动时不会继续运动。
 */
function renderBarRhythm(progress: number, bars: RhythmBarRuntime[]) {
  // 律动阶段归一化进度用于生成一轮缓慢且连续的波峰传播。
  const rhythmProgress = gsap.utils.clamp(0, 1, progress / FRACTURE_START)
  // 裂解前逐步让所有柱体回到完整高度，避免突然补齐隐藏像素。
  const settleProgress = gsap.utils.clamp(
    0,
    1,
    (progress - RHYTHM_SETTLE_START) / (FRACTURE_START - RHYTHM_SETTLE_START),
  )

  for (const runtime of bars) {
    // 配置相位差异让相邻柱体形成连续传播而非同步闪动。
    const wave = 0.5 + Math.sin(
      rhythmProgress * RHYTHM_WAVE_DISTANCE + runtime.config.phase,
    ) * 0.5
    // 当前波形对应的连续可见长度保留小数部分，用于驱动末端方块过渡。
    const segmentCount = runtime.pixels.length
    // 窄屏隐藏超出配置上限的像素后同步限制最小长度。
    const minVisible = Math.min(runtime.config.minVisible, segmentCount)
    // 当前波形只改变从屏幕边缘向中心延伸的连续方块长度。
    const waveVisible = minVisible + (segmentCount - minVisible) * wave
    // 接近裂解阶段时把律动结果平滑收束到完整柱体。
    const visibleLength = gsap.utils.interpolate(
      waveVisible,
      segmentCount,
      settleProgress,
    )
    // 四分之一格步进避免方块边缘在滚动中产生连续亚像素伸缩。
    const steppedVisibleLength = Math.round(visibleLength * 4) / 4
    // 八档呼吸强度让端点与导轨保持离散像素节奏。
    const steppedBreath = Math.round(wave * 8) / 8
    // 八档收束进度用于控制导轨和最终完整柱体之间的清晰阶段。
    const steppedSettle = Math.round(settleProgress * 8) / 8

    // 当前侧别决定整根柱呼吸偏移的方向。
    const shiftDirection = runtime.config.side === 'left' ? 1 : -1
    // 接近裂解时整根柱回到中性位置，避免飞散起点产生额外偏差。
    const rhythmShift = Math.round((wave - 0.5) * 18 * shiftDirection * (1 - settleProgress))

    runtime.element.style.setProperty('--rhythm-breath', steppedBreath.toFixed(3))
    runtime.element.style.setProperty('--rhythm-settle', steppedSettle.toFixed(3))
    runtime.element.style.setProperty('--rhythm-shift', `${rhythmShift}px`)
    runtime.element.style.setProperty('--rhythm-visible-length', steppedVisibleLength.toFixed(2))
  }
}

/**
 * 计算两侧像素横穿全屏并直接组装到对侧资料块的正交运动目标。
 */
function createFractureMotions(
  stage: HTMLElement,
  pixelElements: HTMLElement[],
  fragmentElements: HTMLElement[],
) {
  // 左侧资料块接收来自右侧的像素流，形成明显的交叉编织方向。
  const leftTargets = fragmentElements.filter((element) => element.dataset.side === 'left')
  // 右侧资料块接收来自左侧的像素流。
  const rightTargets = fragmentElements.filter((element) => element.dataset.side === 'right')

  if (leftTargets.length === 0 || rightTargets.length === 0) {
    return pixelElements.map(() => ({
      crossX: 0,
      route: 0,
      targetScale: 0,
      targetX: 0,
      targetY: 0,
      waypointX: 0,
      waypointY: 0,
    }))
  }

  // 舞台边界限定像素流横穿后的对侧停靠区域。
  const stageBounds = stage.getBoundingClientRect()
  // 舞台中心横坐标用于把左右来源映射到相反区域。
  const stageCenterX = stageBounds.left + stageBounds.width / 2

  return pixelElements.map((pixel, index) => {
    // 当前方块来自左侧或右侧，决定横穿方向和最终资料块集合。
    const fromLeft = Boolean(pixel.closest('.about-rhythm-bar--left'))
    // 左侧方块进入右侧资料块，右侧方块进入左侧资料块。
    const targetPool = fromLeft ? rightTargets : leftTargets
    // 方块按稳定顺序循环分配到对侧资料块。
    const target = targetPool[index % targetPool.length]
    // 起点矩形用于计算当前方块中心。
    const pixelBounds = pixel.getBoundingClientRect()
    // 目标矩形提供最终资料块中心。
    const targetBounds = target.getBoundingClientRect()
    // 当前方块中心是所有相对位移的统一起点。
    const pixelCenterX = pixelBounds.left + pixelBounds.width / 2
    // 当前纵向中心用于第二拍垂直落位。
    const pixelCenterY = pixelBounds.top + pixelBounds.height / 2
    // 同一横向柱中的像素索引用于在对侧展开成多列，而不是叠成单线。
    const segmentIndex = Number(pixel.dataset.pixelIndex ?? 0)
    // 四组路线按稳定索引循环分配，每次进入页面都保持同一编织结构。
    const route = index % 4
    // 横穿后的像素墙位于对侧约三分之一屏宽，并保留六档整数列间距。
    const crossTargetX = stageCenterX
      + (fromLeft ? 1 : -1) * stageBounds.width * (0.27 + route * 0.018)
      + (segmentIndex % 6 - 2.5) * 18
    // 中段交换轨保留左右方向，但靠近屏幕中心形成多层交叉节点。
    const waypointTargetX = stageCenterX
      + (fromLeft ? -1 : 1) * stageBounds.width * (0.06 + route % 2 * 0.045)
    // 纵向错层在舞台安全范围内按 48px 像素步进上下展开。
    const waypointTargetY = gsap.utils.clamp(
      stageBounds.top + 120,
      stageBounds.bottom - 96,
      pixelCenterY + (index % 7 - 3) * 48,
    )
    // 同一资料块接收的像素分散在稳定小网格中。
    const clusterIndex = Math.floor(index / targetPool.length)
    // 水平散布使用 12px 像素步进。
    const jitterX = ((clusterIndex * 3 + index) % 7 - 3) * 12
    // 垂直散布使用 8px 像素步进。
    const jitterY = ((clusterIndex * 5 + index * 2) % 7 - 3) * 8

    return {
      crossX: Math.round(crossTargetX - pixelCenterX),
      route,
      targetX: Math.round(targetBounds.left + targetBounds.width / 2 - pixelCenterX + jitterX),
      targetY: Math.round(targetBounds.top + targetBounds.height / 2 - pixelCenterY + jitterY),
      targetScale: 0.42 + index % 4 * 0.1,
      waypointX: Math.round(waypointTargetX - pixelCenterX),
      waypointY: Math.round(waypointTargetY - pixelCenterY),
    } satisfies FractureMotion
  })
}

/**
 * 创建由零到一滚动进度直接控制的完整 About 动画时间线。
 */
function createAboutTimeline(stage: HTMLElement) {
  // 中心文字节点数量由配置自动决定。
  const introLines = gsap.utils.toArray<HTMLElement>('.about-intro-line', stage)
  // 全部柱体像素在裂解阶段转化为最终信息块的视觉来源。
  const pixelElements = gsap.utils.toArray<HTMLElement>('.about-rhythm-bar__pixel', stage)
  // 最终碎片信息节点作为柱体像素的重组目标。
  const fragmentElements = gsap.utils.toArray<HTMLElement>('.about-profile-fragment', stage)
  // 头像和周围八个像素共同组成名片视觉中心。
  const portraitElements = gsap.utils.toArray<HTMLElement>(
    '.about-profile__portrait, .about-profile__orbit-pixel',
    stage,
  )
  // 名称、身份与联系入口在重组末段统一进入。
  const identity = stage.querySelector<HTMLElement>('.about-profile__identity')
  // 联系入口单独交错进入，避免底部信息一次性挤在一起。
  const contactElements = gsap.utils.toArray<HTMLElement>('.about-profile-contact', stage)
  // 每个柱体像素对应的稳定飞行目标只在尺寸变化时重算。
  const fractureMotions = createFractureMotions(stage, pixelElements, fragmentElements)
  // 方块节点到运动目标的映射允许四组子时间线使用各自局部索引。
  const fractureMotionMap = new Map(
    pixelElements.map((pixel, index) => [pixel, fractureMotions[index]]),
  )
  // 四组路线按稳定编号拆分，形成不同顺序的横向与纵向编织过程。
  const routeGroups = Array.from({ length: 4 }, (_, route) => (
    pixelElements.filter((pixel) => fractureMotionMap.get(pixel)?.route === route)
  ))
  // 叙事时间线只负责中心文字和最终名片，不再持有律动像素的样式。
  const storyTimeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
  // 裂解时间线独立持有像素位移和透明度，回到前段时可完整释放控制权。
  const fractureTimeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
  // 文字序列可用区间平均分配给配置中的全部段落。
  const textSlot = introLines.length > 0
    ? (TEXT_SEQUENCE_END - TEXT_SEQUENCE_START) / introLines.length
    : 0

  gsap.set(introLines, { autoAlpha: 0 })
  gsap.set(profileRef.value, { autoAlpha: 0 })
  gsap.set([...fragmentElements, ...portraitElements, identity, ...contactElements].filter(Boolean), {
    autoAlpha: 0,
  })

  introLines.forEach((line, index) => {
    // 当前段落的进入起点根据配置顺序自动计算。
    const start = TEXT_SEQUENCE_START + index * textSlot
    // 渐显占据当前段落约四成滚动距离。
    const fadeInDuration = textSlot * 0.4
    // 完整显示后保留约两成滚动距离。
    const holdDuration = textSlot * 0.22
    // 渐隐延伸到下一段进入区间，形成同步交叉。
    const fadeOutDuration = textSlot * 0.52

    storyTimeline.fromTo(
      line,
      { autoAlpha: 0, y: 48, scale: 0.9 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: fadeInDuration,
        ease: 'power4.out',
      },
      start,
    )
    storyTimeline.to(
      line,
      {
        autoAlpha: 0,
        y: -44,
        scale: 1.05,
        duration: fadeOutDuration,
        ease: 'power3.in',
      },
      start + fadeInDuration + holdDuration,
    )
  })

  fractureTimeline.set(pixelElements, { autoAlpha: 1 }, FRACTURE_START)
  // 第一拍统一压缩与回弹，让两侧 174 个方块同时响应中央吸引信号。
  fractureTimeline.fromTo(
    pixelElements,
    {
      scale: 1,
      transformOrigin: (_, element) => (
        element.closest('.about-rhythm-bar--left') ? 'left center' : 'right center'
      ),
    },
    {
      scale: (index) => index % 2 === 0 ? 0.78 : 1.08,
      duration: 0.018,
      stagger: { each: 0.00015, from: 'edges' },
      ease: 'steps(2)',
    },
    FRACTURE_START,
  )
  // 路线一先横穿、再纵向落位，保持最清晰的主方向基准。
  fractureTimeline.to(
    routeGroups[0],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.crossX ?? 0,
      scale: 0.82,
      duration: 0.08,
      stagger: { each: 0.00045, from: 'edges' },
      ease: 'steps(12)',
    },
    0.575,
  )
  fractureTimeline.to(
    routeGroups[0],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetY ?? 0,
      duration: 0.055,
      stagger: { each: 0.0004, from: 'center' },
      ease: 'steps(9)',
    },
    0.68,
  )
  fractureTimeline.to(
    routeGroups[0],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetX ?? 0,
      scale: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetScale ?? 0.48,
      duration: 0.045,
      stagger: { each: 0.00035, from: 'edges' },
      ease: 'steps(8)',
    },
    0.75,
  )

  // 路线二先上下错层，再从不同高度横穿，恢复更复杂的纵横交织感。
  fractureTimeline.to(
    routeGroups[1],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.waypointY ?? 0,
      duration: 0.055,
      stagger: { each: 0.0004, from: 'center' },
      ease: 'steps(8)',
    },
    0.575,
  )
  fractureTimeline.to(
    routeGroups[1],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.crossX ?? 0,
      scale: 0.88,
      duration: 0.085,
      stagger: { each: 0.00045, from: 'edges' },
      ease: 'steps(12)',
    },
    0.635,
  )
  fractureTimeline.to(
    routeGroups[1],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetY ?? 0,
      duration: 0.05,
      stagger: { each: 0.00035, from: 'center' },
      ease: 'steps(8)',
    },
    0.725,
  )
  fractureTimeline.to(
    routeGroups[1],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetX ?? 0,
      scale: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetScale ?? 0.48,
      duration: 0.04,
      stagger: { each: 0.0003, from: 'edges' },
      ease: 'steps(8)',
    },
    0.78,
  )

  // 路线三先进入中段交换轨，再垂直错层并继续横穿，形成多次折返。
  fractureTimeline.to(
    routeGroups[2],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.waypointX ?? 0,
      duration: 0.05,
      stagger: { each: 0.00035, from: 'edges' },
      ease: 'steps(8)',
    },
    0.575,
  )
  fractureTimeline.to(
    routeGroups[2],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.waypointY ?? 0,
      duration: 0.05,
      stagger: { each: 0.00035, from: 'center' },
      ease: 'steps(8)',
    },
    0.63,
  )
  fractureTimeline.to(
    routeGroups[2],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.crossX ?? 0,
      scale: 0.78,
      duration: 0.075,
      stagger: { each: 0.0004, from: 'edges' },
      ease: 'steps(11)',
    },
    0.685,
  )
  fractureTimeline.to(
    routeGroups[2],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetY ?? 0,
      duration: 0.045,
      stagger: { each: 0.0003, from: 'center' },
      ease: 'steps(8)',
    },
    0.765,
  )
  fractureTimeline.to(
    routeGroups[2],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetX ?? 0,
      scale: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetScale ?? 0.48,
      duration: 0.035,
      stagger: { each: 0.00025, from: 'edges' },
      ease: 'steps(7)',
    },
    0.815,
  )

  // 路线四先对齐目标行，再反向横穿并折回资料块，制造交叉流中的逆向层。
  fractureTimeline.to(
    routeGroups[3],
    {
      y: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetY ?? 0,
      duration: 0.065,
      stagger: { each: 0.00045, from: 'center' },
      ease: 'steps(10)',
    },
    0.575,
  )
  fractureTimeline.to(
    routeGroups[3],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.crossX ?? 0,
      scale: 0.84,
      duration: 0.09,
      stagger: { each: 0.00045, from: 'edges' },
      ease: 'steps(13)',
    },
    0.645,
  )
  fractureTimeline.to(
    routeGroups[3],
    {
      x: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetX ?? 0,
      scale: (_, element: HTMLElement) => fractureMotionMap.get(element)?.targetScale ?? 0.48,
      duration: 0.05,
      stagger: { each: 0.00035, from: 'center' },
      ease: 'steps(9)',
    },
    0.745,
  )

  // 四组路线全部完成后再统一熄灭残余像素，避免任何一组提前消失。
  fractureTimeline.to(
    pixelElements,
    {
      autoAlpha: 0,
      scale: 0.08,
      duration: 0.035,
      stagger: { each: 0.00008, from: 'center' },
      ease: 'steps(5)',
    },
    0.86,
  )

  storyTimeline.set(profileRef.value, { autoAlpha: 1 }, PROFILE_REVEAL_START)
  storyTimeline.fromTo(
    portraitElements,
    { autoAlpha: 0, scale: 0.12, y: 180 },
    {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: 0.13,
      stagger: 0.012,
      ease: 'power4.out',
    },
    PROFILE_REVEAL_START,
  )
  storyTimeline.fromTo(
    fragmentElements,
    {
      autoAlpha: 0,
      x: (_, element) => element.dataset.side === 'left' ? -220 : 220,
      y: (index) => index % 2 === 0 ? -110 : 110,
      scale: 0.42,
    },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.13,
      stagger: { each: 0.018, from: 'center' },
      ease: 'power4.out',
    },
    0.675,
  )

  if (identity) {
    storyTimeline.fromTo(
      identity,
      { autoAlpha: 0, y: 150, scale: 0.72 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.1,
        ease: 'power4.out',
      },
      0.74,
    )
  }

  storyTimeline.fromTo(
    contactElements,
    { autoAlpha: 0, y: 56 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.06,
      stagger: 0.018,
      ease: 'steps(6)',
    },
    0.79,
  )
  storyTimeline.to({}, { duration: 0.001 }, 1)
  fractureTimeline.to({}, { duration: 0.001 }, 1)

  return { storyTimeline, fractureTimeline }
}

/**
 * 建立自然页面滚动驱动的 About 场景，不创建内部滚动区或 GSAP pin。
 */
function createAboutScene() {
  // About 根节点提供完整的自然滚动区间。
  const section = sectionRef.value
  // Sticky 舞台提供动画元素坐标与当前视口展示区域。
  const stage = stageRef.value

  if (!section || !stage) {
    return
  }

  syncRhythmGrid(stage)

  // 当前配置对应的柱体运行时只在场景创建时收集一次。
  const bars = createBarRuntimes(section)
  // 所有柱体像素用于无动画偏好下直接隐藏。
  const pixels = bars.flatMap((bar) => bar.pixels)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.about-intro-line', { autoAlpha: 0 })
    gsap.set(pixels, { autoAlpha: 0 })
    gsap.set(profileRef.value, { autoAlpha: 1 })
    gsap.set(
      '.about-profile-fragment, .about-profile__portrait, .about-profile__orbit-pixel, .about-profile__identity, .about-profile-contact',
      { autoAlpha: 1, clearProps: 'transform' },
    )
    return
  }

  // 两条时间线共享滚动进度，但分别拥有叙事元素和裂解像素的样式控制权。
  const { storyTimeline, fractureTimeline } = createAboutTimeline(stage)
  // 标记裂解时间线是否已经接管像素，回滚越界时只执行一次完整释放。
  let fractureActive = false
  /**
   * 同步当前滚动进度，并在律动与裂解阶段之间明确移交像素样式控制权。
   */
  const renderProgress = (progress: number) => {
    // 所有时间线只接收零到一之间的稳定滚动进度。
    const normalizedProgress = gsap.utils.clamp(0, 1, progress)
    // 像素流横穿期间提高全屏轨道强度，落入资料块前快速归零。
    const convergenceIntensity = gsap.utils.clamp(
      0,
      1,
      (normalizedProgress - FRACTURE_START) / 0.1,
    ) * (1 - gsap.utils.clamp(0, 1, (normalizedProgress - 0.82) / 0.08))
    // 第一组主路线穿过屏幕中线时产生持续时间较长的冲击波。
    const crossingPulseOne = 1 - gsap.utils.clamp(
      0,
      1,
      Math.abs(normalizedProgress - 0.64) / 0.055,
    )
    // 第二、三组错层路线经过中线时补充第二次冲击。
    const crossingPulseTwo = 1 - gsap.utils.clamp(
      0,
      1,
      Math.abs(normalizedProgress - 0.705) / 0.05,
    )
    // 逆向路线最后穿过中线时形成收尾冲击。
    const crossingPulseThree = 1 - gsap.utils.clamp(
      0,
      1,
      Math.abs(normalizedProgress - 0.755) / 0.045,
    )
    // 三组冲击取当前最大值，避免叠加后亮度失控。
    const convergenceLock = Math.max(
      crossingPulseOne,
      crossingPulseTwo * 0.86,
      crossingPulseThree * 0.72,
    )
    // 最终资料结构接近完成后再淡出导轨，保证交叉像素流路径始终可读。
    const guideOpacity = 1 - gsap.utils.clamp(
      0,
      1,
      (normalizedProgress - 0.84) / 0.08,
    )

    stage.classList.toggle(
      'about-stage--fracturing',
      normalizedProgress >= FRACTURE_START && normalizedProgress < 0.9,
    )
    stage.style.setProperty('--about-convergence-intensity', convergenceIntensity.toFixed(4))
    stage.style.setProperty('--about-convergence-lock', convergenceLock.toFixed(4))
    stage.style.setProperty('--about-guide-opacity', guideOpacity.toFixed(4))
    stage.style.setProperty('--about-scene-progress', normalizedProgress.toFixed(4))

    storyTimeline.progress(normalizedProgress, false)

    if (normalizedProgress < FRACTURE_START) {
      if (fractureActive) {
        fractureTimeline.progress(0, false)
        gsap.set(pixels, { clearProps: 'transform,opacity,visibility' })
        fractureActive = false
      }

      renderBarRhythm(normalizedProgress, bars)
      return
    }

    renderBarRhythm(normalizedProgress, bars)
    fractureActive = true
    fractureTimeline.progress(normalizedProgress, false)
  }
  // ScrollTrigger 只测量 About 在文档中的自然起止位置。
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => renderProgress(self.progress),
    onRefresh: (self) => renderProgress(self.progress),
  })

  renderProgress(trigger.progress)
}

/**
 * 清除柱级律动变量，避免响应式重建继承旧尺寸下的伸缩状态。
 */
function resetBarPixelStyles() {
  stageRef.value?.classList.remove('about-stage--fracturing')
  stageRef.value?.style.removeProperty('--about-convergence-intensity')
  stageRef.value?.style.removeProperty('--about-convergence-lock')
  stageRef.value?.style.removeProperty('--about-guide-opacity')
  stageRef.value?.style.removeProperty('--about-scene-progress')
  sectionRef.value
    ?.querySelectorAll<HTMLElement>('.about-rhythm-bar')
    .forEach((bar) => {
      bar.style.removeProperty('--rhythm-breath')
      bar.style.removeProperty('--rhythm-settle')
      bar.style.removeProperty('--rhythm-shift')
      bar.style.removeProperty('--rhythm-visible-length')
    })
}

/**
 * 重新测量头像、信息块和柱体像素坐标并创建场景。
 */
function rebuildAboutScene() {
  animationContext?.revert()
  resetBarPixelStyles()
  animationContext = gsap.context(createAboutScene, sectionRef.value ?? undefined)
  ScrollTrigger.refresh()
}

/**
 * 合并连续窗口尺寸变化，避免移动端地址栏变化时频繁重建动画。
 */
function scheduleSceneRebuild() {
  if (resizeFrame !== undefined) {
    window.cancelAnimationFrame(resizeFrame)
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = undefined
    rebuildAboutScene()
  })
}

// 组件挂载后等待 PixelText 完成首轮布局，再测量全部动画目标。
onMounted(async () => {
  await nextTick()
  await document.fonts.ready

  rebuildAboutScene()
  window.addEventListener('resize', scheduleSceneRebuild)
})

// 组件卸载时回收窗口监听、动画帧、时间线和 ScrollTrigger。
onUnmounted(() => {
  window.removeEventListener('resize', scheduleSceneRebuild)

  if (resizeFrame !== undefined) {
    window.cancelAnimationFrame(resizeFrame)
  }

  animationContext?.revert()
})
</script>

<style scoped>
.about-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
}

.about-stage {
  --about-nav-clearance: 112px;
  --about-rhythm-cell-size: 48px;
  --about-rhythm-offset: 0px;
  --about-rhythm-stroke: transparent;
  --about-rhythm-inner-stroke: #fff4df;
  --about-convergence-intensity: 0;
  --about-convergence-lock: 0;
  --about-guide-opacity: 1;
  --about-scene-progress: 0;

  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  isolation: isolate;
  background: #ffffff;
}

.about-stage::before,
.about-stage::after {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  content: '';
  pointer-events: none;
  translate: -50% -50%;
}

.about-stage::before {
  width: 100%;
  height: min(76vh, 820px);
  background: repeating-linear-gradient(
    180deg,
    transparent 0 42px,
    color-mix(in srgb, var(--about-blue) 26%, #ffffff) 42px 46px,
    transparent 46px 84px,
    color-mix(in srgb, var(--about-teal) 24%, #ffffff) 84px 88px,
    transparent 88px 126px,
    color-mix(in srgb, var(--about-purple) 22%, #ffffff) 126px 130px,
    transparent 130px 168px
  );
  opacity: calc(var(--about-convergence-intensity) * 0.48);
  scale: 1 calc(0.72 + var(--about-convergence-intensity) * 0.28);
}

.about-stage::after {
  width: 100%;
  height: 10px;
  background: repeating-linear-gradient(
    90deg,
    var(--about-blue) 0 8px,
    transparent 8px 16px,
    var(--about-teal) 16px 24px,
    transparent 24px 32px,
    var(--about-pink) 32px 40px,
    transparent 40px 48px
  );
  box-shadow:
    0 -252px 0 color-mix(in srgb, var(--about-purple) 18%, transparent),
    0 -126px 0 color-mix(in srgb, var(--about-teal) 18%, transparent),
    0 126px 0 color-mix(in srgb, var(--about-pink) 18%, transparent),
    0 252px 0 color-mix(in srgb, var(--about-blue) 18%, transparent);
  opacity: calc(var(--about-convergence-intensity) * 0.22 + var(--about-convergence-lock) * 0.72);
  scale: calc(0.72 + var(--about-convergence-lock) * 0.28) 1;
}

.about-scroll-track {
  position: relative;
  z-index: 0;
  width: 1px;
  margin-left: auto;
  pointer-events: none;
}

.about-scroll-step--text {
  height: 58vh;
  min-height: 440px;
}

.about-scroll-step--fracture {
  height: 76vh;
  min-height: 560px;
}

.about-scroll-step--profile {
  height: 100vh;
  min-height: 720px;
}

.about-rhythm-field,
.about-intro,
.about-profile {
  position: absolute;
  inset: 0;
}

.about-rhythm-field {
  z-index: 1;
  pointer-events: none;
}

.about-stage--fracturing .about-rhythm-field {
  z-index: 4;
}

.about-stage--fracturing .about-rhythm-bar {
  contain: layout style;
  overflow: visible;
}

.about-stage--fracturing .about-rhythm-bar__pixel {
  will-change: transform, opacity;
}

.about-rhythm-field::before,
.about-rhythm-field::after {
  position: absolute;
  top: var(--about-nav-clearance);
  bottom: 24px;
  width: 2px;
  content: '';
  background: repeating-linear-gradient(180deg, #d8e1f4 0 6px, transparent 6px 12px);
  opacity: calc(var(--about-guide-opacity) * 0.38);
}

.about-rhythm-field::before {
  left: 50%;
  translate: -18vw 0;
}

.about-rhythm-field::after {
  right: 50%;
  translate: 18vw 0;
}

.about-rhythm-side {
  position: absolute;
  display: grid;
  top: calc(var(--about-nav-clearance) + var(--about-rhythm-offset));
  width: 50%;
  gap: 0;
}

.about-rhythm-side::after {
  position: absolute;
  top: -8px;
  bottom: -8px;
  width: 7px;
  content: '';
  background: repeating-linear-gradient(180deg, #ffffff 0 5px, #d9e2f5 5px 9px, transparent 9px 13px);
  opacity: calc(var(--about-guide-opacity) * 0.54);
}

.about-rhythm-side--left {
  left: 0;
}

.about-rhythm-side--left::after {
  right: -3px;
}

.about-rhythm-side--right {
  right: 0;
}

.about-rhythm-side--right::after {
  left: -3px;
}

.about-rhythm-bar {
  --rhythm-breath: 0.5;
  --rhythm-settle: 0;
  --rhythm-shift: 0px;
  --rhythm-visible-length: 0;

  display: flex;
  position: relative;
  z-index: 0;
  width: max-content;
  min-width: 0;
  height: var(--about-rhythm-cell-size);
  align-items: stretch;
  contain: layout paint style;
  isolation: isolate;
  translate: var(--rhythm-shift) 0;
  will-change: transform;
}

.about-rhythm-bar::before {
  position: absolute;
  z-index: -2;
  top: calc(50% - 2px);
  right: -18px;
  left: -18px;
  height: 4px;
  content: '';
  background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--bar-color) 52%, #ffffff) 0 7px, transparent 7px 11px);
  opacity: calc(var(--about-guide-opacity) * (0.18 + var(--rhythm-breath) * 0.42));
  scale: calc(0.9 + var(--rhythm-breath) * 0.1) 1;
}

.about-rhythm-bar::after {
  position: absolute;
  z-index: 3;
  top: calc(50% - 7px);
  width: 14px;
  height: 14px;
  content: '';
  background: #ffffff;
  border: 3px solid var(--bar-color);
  box-shadow: 4px 4px 0 color-mix(in srgb, var(--bar-color) 22%, transparent);
  opacity: calc(var(--about-guide-opacity) * (0.45 + var(--rhythm-breath) * 0.55));
  scale: calc(0.76 + var(--rhythm-breath) * 0.24);
}

.about-rhythm-bar--left {
  justify-self: start;
}

.about-rhythm-bar--left::after {
  right: -12px;
}

.about-rhythm-bar--right {
  flex-direction: row-reverse;
  justify-self: end;
}

.about-rhythm-bar--right::after {
  left: -12px;
}

.about-rhythm-bar__pixel {
  --rhythm-collapse: calc(1 - var(--rhythm-reveal));
  --rhythm-reveal: clamp(0, calc(var(--rhythm-visible-length) - var(--rhythm-index)), 1);

  position: relative;
  z-index: 1;
  display: block;
  width: var(--about-rhythm-cell-size);
  height: var(--about-rhythm-cell-size);
  box-sizing: border-box;
  flex: 0 0 auto;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 34%) 0 11%, transparent 11% 100%),
    var(--bar-color);
  background-clip: padding-box;
  border: 4px solid var(--about-rhythm-stroke);
  opacity: var(--rhythm-reveal, 0);
  transform:
    translate3d(
      calc(var(--rhythm-direction) * var(--rhythm-collapse) * (5px + var(--rhythm-depth) * 2px)),
      calc(var(--rhythm-collapse) * var(--rhythm-tilt) * 3px),
      0
    )
    scale(calc(0.62 + var(--rhythm-reveal) * 0.38));
  transform-origin: calc(50% - var(--rhythm-direction) * 50%) center;
}

.about-rhythm-bar__pixel::before {
  position: absolute;
  inset: 9px;
  content: '';
  background:
    linear-gradient(90deg, #ffffff 0 28%, transparent 28% 72%, #ffffff 72%),
    linear-gradient(180deg, transparent 0 34%, color-mix(in srgb, var(--bar-color) 52%, #ffffff) 34% 66%, transparent 66%);
  clip-path: polygon(0 0, 72% 0, 72% 24%, 100% 24%, 100% 100%, 28% 100%, 28% 76%, 0 76%);
  opacity: calc(var(--rhythm-reveal) * (0.38 + var(--rhythm-depth) * 0.07));
  scale: calc(0.62 + var(--rhythm-reveal) * 0.38);
}

.about-rhythm-bar__pixel::after {
  position: absolute;
  inset: 4px;
  box-sizing: border-box;
  border: 2px solid color-mix(in srgb, var(--about-rhythm-inner-stroke) 82%, var(--bar-color));
  box-shadow:
    inset 3px 3px 0 rgb(255 255 255 / 24%),
    inset -3px -3px 0 color-mix(in srgb, var(--bar-color) 18%, transparent);
  content: '';
  opacity: calc(0.42 + var(--rhythm-reveal) * 0.58);
  pointer-events: none;
  translate:
    calc(var(--rhythm-direction) * var(--rhythm-collapse) * 4px)
    calc(var(--rhythm-tilt) * var(--rhythm-collapse) * 2px);
}

.about-rhythm-bar__pixel:nth-child(4n + 2) {
  background:
    linear-gradient(225deg, rgb(255 255 255 / 28%) 0 12%, transparent 12% 100%),
    color-mix(in srgb, var(--bar-color) 94%, #ffffff);
}

.about-rhythm-bar__pixel:nth-child(4n + 3)::before {
  clip-path: polygon(0 0, 100% 0, 100% 28%, 76% 28%, 76% 100%, 24% 100%, 24% 72%, 0 72%);
}

.about-rhythm-bar__pixel:nth-child(4n)::after {
  inset: 6px;
  border-width: 3px;
}

.about-intro {
  z-index: 2;
  display: grid;
  place-items: center;
  padding: var(--about-nav-clearance) 22vw 32px;
  pointer-events: none;
}

.about-intro-line {
  grid-area: 1 / 1;
  width: min(1120px, 68vw);
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.about-intro-line__text {
  min-height: 196px;
  color: var(--about-blue);
  font-size: 68px;
  line-height: 1.32;
  text-align: center;
}

.about-profile {
  z-index: 3;
  display: grid;
  place-items: center;
  padding: calc(var(--about-nav-clearance) + 22px) 92px 26px;
  visibility: hidden;
  opacity: 0;
}

.about-profile::before,
.about-profile::after {
  position: absolute;
  z-index: -1;
  top: 50%;
  left: 50%;
  content: '';
  pointer-events: none;
}

.about-profile::before {
  width: min(48vw, 620px);
  aspect-ratio: 1;
  border: 2px dashed #dce4f6;
  box-shadow:
    0 0 0 18px rgb(101 127 226 / 2%),
    0 0 0 36px rgb(101 201 196 / 2%);
  opacity: 0.56;
  translate: -50% -50%;
  animation: about-profile-frame 16s steps(16, end) infinite;
}

.about-profile::after {
  width: min(72vw, 980px);
  height: 8px;
  background: repeating-linear-gradient(90deg, #7189e2 0 8px, transparent 8px 16px, #73c8c2 16px 24px, transparent 24px 32px, #dda5c5 32px 40px, transparent 40px 48px);
  opacity: 0.18;
  translate: -50% -50%;
  animation: about-profile-signal 9s steps(12, end) infinite;
}

@keyframes about-profile-frame {
  0%,
  100% { scale: 0.98; translate: -50% -50%; }
  50% { scale: 1.02; translate: calc(-50% + 8px) calc(-50% - 8px); }
}

@keyframes about-profile-signal {
  0%,
  100% { background-position: 0 0; scale: 0.86 1; }
  50% { background-position: 48px 0; scale: 1 1; }
}

.about-profile__shell {
  display: grid;
  width: min(1520px, 100%);
  height: min(860px, 100%);
  grid-template-columns: minmax(260px, 1fr) 340px minmax(260px, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 30px 66px;
  align-items: center;
}

.about-profile__fragments {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
}

.about-profile-fragment {
  width: min(100%, 350px);
  min-height: 106px;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.about-profile__fragments--left .about-profile-fragment {
  align-self: flex-end;
}

.about-profile__fragments--right .about-profile-fragment {
  align-self: flex-start;
}

.about-profile-fragment__body {
  display: flex;
  min-height: inherit;
  padding: 18px 20px;
  flex-direction: column;
  justify-content: center;
  border: 2px solid #ffffff;
  outline: 3px solid var(--fragment-accent);
  background: var(--fragment-background);
  box-shadow: 10px 10px 0 var(--fragment-accent);
  transform: translateX(var(--fragment-shift));
  transition:
    box-shadow var(--motion-medium) var(--motion-step),
    filter var(--motion-fast) ease,
    translate var(--motion-medium) var(--motion-step);
}

.about-profile-fragment__label {
  margin-bottom: 10px;
  color: var(--fragment-accent);
  font-size: 12px;
  line-height: 1;
}

.about-profile-fragment__value {
  overflow-wrap: anywhere;
  color: #4f5f7d;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.38;
}

.about-profile__portrait-zone {
  position: relative;
  display: grid;
  width: 340px;
  height: 340px;
  place-items: center;
}

.about-profile__portrait {
  position: relative;
  z-index: 2;
  display: grid;
  width: 278px;
  height: 278px;
  overflow: hidden;
  place-items: center;
  border: 8px solid #ffffff;
  border-radius: 50%;
  background: var(--about-teal-light);
  box-shadow:
    0 0 0 8px var(--about-blue),
    20px 20px 0 var(--about-teal-light);
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.about-profile__portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter var(--motion-fast) ease,
    scale var(--motion-medium) var(--motion-step);
}

.about-profile__portrait > span {
  color: #5470d2;
  font-size: 56px;
}

.about-profile__orbit-pixel {
  --orbit-size: 34px;

  position: absolute;
  top: calc(50% - var(--orbit-size) / 2);
  left: calc(50% - var(--orbit-size) / 2);
  z-index: 1;
  width: var(--orbit-size);
  height: var(--orbit-size);
  border: 2px solid #ffffff;
  background: var(--orbit-color);
  transform: translate(var(--orbit-x), var(--orbit-y));
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.about-profile__identity {
  display: grid;
  grid-column: 1 / -1;
  min-width: 0;
  justify-items: center;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
}

.about-profile__name {
  width: min(420px, 100%);
  min-height: 86px;
  font-size: 72px;
  line-height: 1.1;
  transition:
    filter var(--motion-fast) ease,
    translate var(--motion-medium) var(--motion-step);
}

.about-profile__role {
  margin: 12px 0 0;
  color: #657694;
  font-size: 15px;
  line-height: 1.4;
  text-align: center;
}

.about-profile__statement {
  margin: 7px 0 0;
  color: #95a5c7;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.about-profile__contacts {
  display: flex;
  margin-top: 18px;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
}

.about-profile-contact {
  position: relative;
  display: grid;
  min-width: 168px;
  min-height: 58px;
  padding: 10px 15px;
  border: 2px solid var(--contact-accent);
  color: var(--contact-accent);
  background: #ffffff;
  box-shadow: 6px 6px 0 color-mix(in srgb, var(--contact-accent) 24%, #ffffff);
  text-decoration: none;
  visibility: hidden;
  opacity: 0;
  will-change: transform, opacity;
  transition:
    background-color var(--motion-fast) ease,
    box-shadow var(--motion-medium) var(--motion-step),
    color var(--motion-fast) ease,
    translate var(--motion-medium) var(--motion-step);
}

.about-profile-contact::after {
  position: absolute;
  right: 10px;
  bottom: 8px;
  width: 24px;
  height: 4px;
  content: "";
  background: repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 7px);
  opacity: 0.45;
  transform: scaleX(0.6);
  transform-origin: right center;
  transition: transform var(--motion-medium) var(--motion-step);
}

@media (hover: hover) and (pointer: fine) {
  .about-profile-fragment:hover .about-profile-fragment__body {
    box-shadow: 14px 14px 0 var(--fragment-accent);
    filter: saturate(1.06);
    translate: -4px -5px;
  }

  .about-profile__fragments--right .about-profile-fragment:hover .about-profile-fragment__body {
    translate: 4px -5px;
  }

  .about-profile__portrait-zone:hover .about-profile__portrait img {
    filter: saturate(1.08) contrast(1.02);
    scale: 1.045;
  }

  .about-profile__identity:hover .about-profile__name {
    filter: drop-shadow(7px 7px 0 rgb(95 120 237 / 10%));
    translate: 0 -4px;
  }
}

.about-profile-contact span {
  font-size: 10px;
  line-height: 1;
}

.about-profile-contact strong {
  margin-top: 7px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.15;
}

@media (hover: hover) and (pointer: fine) {
  .about-profile-contact:hover,
  .about-profile-contact:focus-visible {
    color: #ffffff;
    background: var(--contact-accent);
    box-shadow: 10px 10px 0 color-mix(in srgb, var(--contact-accent) 24%, #ffffff);
    outline: none;
    translate: -4px -4px !important;
  }

  .about-profile-contact:hover::after,
  .about-profile-contact:focus-visible::after {
    transform: scaleX(1);
  }
}

@media (max-width: 1500px) {
  .about-stage {
    --about-nav-clearance: 104px;
  }

  .about-intro-line__text {
    min-height: 170px;
    font-size: 54px;
  }

  .about-profile {
    padding-right: 62px;
    padding-left: 62px;
  }

  .about-profile__shell {
    grid-template-columns: minmax(220px, 1fr) 280px minmax(220px, 1fr);
    gap: 24px 44px;
  }

  .about-profile__portrait-zone {
    width: 280px;
    height: 280px;
  }

  .about-profile__portrait {
    width: 226px;
    height: 226px;
  }

  .about-profile__orbit-pixel {
    --orbit-size: 28px;
  }

  .about-profile__fragments {
    gap: 18px;
  }

  .about-profile-fragment {
    min-height: 88px;
  }

  .about-profile-fragment__body {
    padding: 14px 16px;
  }

  .about-profile__name {
    min-height: 70px;
    font-size: 58px;
  }
}

@media (max-width: 980px) {
  .about-stage {
    --about-nav-clearance: 92px;
  }

  .about-intro {
    padding-right: 18vw;
    padding-left: 18vw;
  }

  .about-intro-line {
    width: 72vw;
  }

  .about-intro-line__text {
    min-height: 148px;
    font-size: 44px;
  }

  .about-profile {
    padding: calc(var(--about-nav-clearance) + 16px) 26px 20px;
  }

  .about-profile__shell {
    grid-template-columns: minmax(170px, 1fr) 210px minmax(170px, 1fr);
    gap: 18px 24px;
  }

  .about-profile__portrait-zone {
    width: 210px;
    height: 210px;
  }

  .about-profile__portrait {
    width: 164px;
    height: 164px;
    border-width: 5px;
    box-shadow:
      0 0 0 6px var(--about-blue),
      12px 12px 0 var(--about-teal-light);
  }

  .about-profile__orbit-pixel {
    --orbit-size: 20px;
  }

  .about-profile-fragment {
    min-height: 76px;
  }

  .about-profile-fragment__body {
    padding: 11px 12px;
    box-shadow: 6px 6px 0 var(--fragment-accent);
  }

  .about-profile-fragment__label {
    margin-bottom: 7px;
    font-size: 10px;
  }

  .about-profile-fragment__value {
    font-size: 14px;
  }

  .about-profile__name {
    min-height: 62px;
    font-size: 50px;
  }
}

@media (max-width: 700px) {
  .about-stage {
    --about-nav-clearance: 82px;

    min-height: 620px;
  }

  .about-rhythm-bar__pixel[data-mobile-hidden="true"] {
    display: none;
  }

  .about-scroll-step--text {
    height: 52vh;
    min-height: 360px;
  }

  .about-scroll-step--fracture {
    height: 68vh;
    min-height: 500px;
  }

  .about-scroll-step--profile {
    height: 96vh;
    min-height: 700px;
  }

  .about-intro {
    padding: var(--about-nav-clearance) 14vw 24px;
  }

  .about-intro-line {
    width: 78vw;
  }

  .about-intro-line__text {
    min-height: 126px;
    font-size: 34px;
    line-height: 1.38;
  }

  .about-profile {
    padding: calc(var(--about-nav-clearance) + 8px) 16px 14px;
  }

  .about-profile__shell {
    width: 100%;
    height: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: 172px minmax(0, 1fr) auto;
    gap: 12px 10px;
    align-items: start;
  }

  .about-profile__portrait-zone {
    width: 170px;
    height: 170px;
    grid-column: 1 / -1;
    justify-self: center;
  }

  .about-profile__portrait {
    width: 132px;
    height: 132px;
  }

  .about-profile__orbit-pixel {
    --orbit-size: 16px;
  }

  .about-profile__fragments {
    align-self: stretch;
    gap: 9px;
    justify-content: start;
  }

  .about-profile__fragments--left,
  .about-profile__fragments--right {
    grid-row: 2;
  }

  .about-profile__fragments--left {
    grid-column: 1;
  }

  .about-profile__fragments--right {
    grid-column: 2;
  }

  .about-profile-fragment {
    width: 100%;
    min-height: 62px;
  }

  .about-profile-fragment__body {
    min-height: 62px;
    padding: 8px 9px;
    outline-width: 2px;
    box-shadow: 4px 4px 0 var(--fragment-accent);
    transform: none;
  }

  .about-profile-fragment__label {
    margin-bottom: 5px;
    font-size: 9px;
  }

  .about-profile-fragment__value {
    font-size: 11px;
    line-height: 1.3;
  }

  .about-profile__identity {
    grid-row: 3;
    margin-top: 0;
  }

  .about-profile__name {
    width: 220px;
    min-height: 48px;
    font-size: 40px;
  }

  .about-profile__role {
    margin-top: 6px;
    font-size: 11px;
  }

  .about-profile__statement {
    margin-top: 3px;
    font-size: 9px;
  }

  .about-profile__contacts {
    width: 100%;
    margin-top: 9px;
    gap: 7px;
  }

  .about-profile-contact {
    min-width: 0;
    min-height: 44px;
    padding: 7px 9px;
    flex: 1 1 120px;
    box-shadow: 4px 4px 0 color-mix(in srgb, var(--contact-accent) 24%, #ffffff);
  }

  .about-profile-contact span {
    font-size: 8px;
  }

  .about-profile-contact strong {
    margin-top: 4px;
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-profile::before,
  .about-profile::after {
    animation: none;
  }

  .about-profile-contact,
  .about-profile-contact::after {
    transition: none;
  }

  .about-profile-fragment__body,
  .about-profile__portrait img,
  .about-profile__name {
    transition: none;
  }

  .about-profile-contact {
    translate: none !important;
  }
}
</style>

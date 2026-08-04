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
  // 目标水平位移。
  x: number
  // 目标垂直位移。
  y: number
  // 飞行结束时的尺寸比例。
  scale: number
  // 飞行过程中采用的直角旋转量。
  rotation: number
}

// 像素柱开始完全展开并准备裂解的滚动进度。
const FRACTURE_START = 0.6
// 律动逐渐收束为完整柱体的滚动进度。
const RHYTHM_SETTLE_START = 0.52
// 中心文字序列开始出现的滚动进度。
const TEXT_SEQUENCE_START = 0.035
// 中心文字序列全部离场的滚动进度。
const TEXT_SEQUENCE_END = 0.56
// 最终个人名片开始重组的滚动进度。
const PROFILE_REVEAL_START = 0.69
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

    for (let pixelIndex = 0; pixelIndex < runtime.pixels.length; pixelIndex += 1) {
      // 只有柱体末端方块处于零到一之间，其余方块保持完整显示或隐藏。
      const revealProgress = gsap.utils.clamp(0, 1, visibleLength - pixelIndex)
      // 平滑步进减弱线性淡入的机械感，同时保持滚动进度直接控制动画。
      const easedReveal = revealProgress * revealProgress * (3 - 2 * revealProgress)

      runtime.pixels[pixelIndex].style.setProperty(
        '--rhythm-reveal',
        easedReveal.toFixed(4),
      )
    }
  }
}

/**
 * 计算每个柱体像素飞向最终信息碎片时的稳定目标。
 */
function createFractureMotions(
  pixelElements: HTMLElement[],
  fragmentElements: HTMLElement[],
) {
  if (fragmentElements.length === 0) {
    return pixelElements.map(() => ({ x: 0, y: 0, scale: 0, rotation: 0 }))
  }

  return pixelElements.map((pixel, index) => {
    // 像素按顺序循环分配到最终信息块。
    const target = fragmentElements[index % fragmentElements.length]
    // 起点矩形用于计算像素中心。
    const pixelBounds = pixel.getBoundingClientRect()
    // 终点矩形用于计算信息块中心。
    const targetBounds = target.getBoundingClientRect()
    // 同一信息块接收的像素分散在规则小网格中，避免全部叠成一点。
    const clusterIndex = Math.floor(index / fragmentElements.length)
    // 水平散布使用稳定整数步进。
    const jitterX = ((clusterIndex * 3 + index) % 7 - 3) * 13
    // 垂直散布使用另一组稳定整数步进。
    const jitterY = ((clusterIndex * 5 + index * 2) % 7 - 3) * 11

    return {
      x: targetBounds.left + targetBounds.width / 2
        - (pixelBounds.left + pixelBounds.width / 2)
        + jitterX,
      y: targetBounds.top + targetBounds.height / 2
        - (pixelBounds.top + pixelBounds.height / 2)
        + jitterY,
      scale: 0.55 + index % 4 * 0.14,
      rotation: (index % 5 - 2) * 90,
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
  const fractureMotions = createFractureMotions(pixelElements, fragmentElements)
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
      { autoAlpha: 0, y: 48, scale: 0.9, rotation: index % 2 === 0 ? -3 : 3 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: 0,
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
        rotation: index % 2 === 0 ? 2 : -2,
        duration: fadeOutDuration,
        ease: 'power3.in',
      },
      start + fadeInDuration + holdDuration,
    )
  })

  fractureTimeline.set(pixelElements, { autoAlpha: 1 }, FRACTURE_START)
  fractureTimeline.to(
    pixelElements,
    {
      x: (index) => fractureMotions[index]?.x ?? 0,
      y: (index) => fractureMotions[index]?.y ?? 0,
      scale: (index) => fractureMotions[index]?.scale ?? 1,
      rotation: (index) => fractureMotions[index]?.rotation ?? 0,
      duration: 0.18,
      stagger: { each: 0.00045, from: 'edges' },
      ease: 'power4.inOut',
    },
    FRACTURE_START,
  )
  fractureTimeline.to(
    pixelElements,
    {
      autoAlpha: 0,
      scale: 0.12,
      duration: 0.11,
      stagger: { each: 0.0002, from: 'random' },
      ease: 'power3.in',
    },
    0.775,
  )

  storyTimeline.set(profileRef.value, { autoAlpha: 1 }, PROFILE_REVEAL_START)
  storyTimeline.fromTo(
    portraitElements,
    { autoAlpha: 0, scale: 0.12, rotation: -180, y: 180 },
    {
      autoAlpha: 1,
      scale: 1,
      rotation: 0,
      y: 0,
      duration: 0.2,
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
      rotation: (_, element) => element.dataset.side === 'left' ? -14 : 14,
    },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      duration: 0.19,
      stagger: { each: 0.018, from: 'center' },
      ease: 'power4.out',
    },
    0.72,
  )

  if (identity) {
    storyTimeline.fromTo(
      identity,
      { autoAlpha: 0, y: 150, scale: 0.72 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.16,
        ease: 'power4.out',
      },
      0.82,
    )
  }

  storyTimeline.fromTo(
    contactElements,
    { autoAlpha: 0, y: 56, rotation: 8 },
    {
      autoAlpha: 1,
      y: 0,
      rotation: 0,
      duration: 0.1,
      stagger: 0.018,
      ease: 'steps(6)',
    },
    0.89,
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
 * 清除直接写入的像素律动进度，避免响应式重建继承旧状态。
 */
function resetBarPixelStyles() {
  sectionRef.value
    ?.querySelectorAll<HTMLElement>('.about-rhythm-bar__pixel')
    .forEach((pixel) => pixel.style.removeProperty('--rhythm-reveal'))
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
  height: 96vh;
  min-height: 680px;
}

.about-scroll-step--profile {
  height: 126vh;
  min-height: 820px;
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

.about-rhythm-side {
  position: absolute;
  display: grid;
  top: calc(var(--about-nav-clearance) + var(--about-rhythm-offset));
  width: 50%;
  gap: 0;
}

.about-rhythm-side--left {
  left: 0;
}

.about-rhythm-side--right {
  right: 0;
}

.about-rhythm-bar {
  display: flex;
  width: max-content;
  min-width: 0;
  height: var(--about-rhythm-cell-size);
  align-items: stretch;
  contain: layout style;
  will-change: transform;
}

.about-rhythm-bar--left {
  justify-self: start;
}

.about-rhythm-bar--right {
  flex-direction: row-reverse;
  justify-self: end;
}

.about-rhythm-bar__pixel {
  position: relative;
  display: block;
  width: var(--about-rhythm-cell-size);
  height: var(--about-rhythm-cell-size);
  box-sizing: border-box;
  flex: 0 0 auto;
  background: var(--bar-color);
  background-clip: padding-box;
  border: 4px solid var(--about-rhythm-stroke);
  opacity: var(--rhythm-reveal, 0);
  transform: scale(calc(0.72 + var(--rhythm-reveal, 0) * 0.28));
  will-change: transform, opacity;
}

.about-rhythm-bar__pixel::after {
  position: absolute;
  inset: 4px;
  box-sizing: border-box;
  border: 2px solid var(--about-rhythm-inner-stroke);
  content: '';
  pointer-events: none;
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

.about-profile-contact:hover {
  color: #ffffff;
  background: var(--contact-accent);
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
    height: 82vh;
    min-height: 560px;
  }

  .about-scroll-step--profile {
    height: 118vh;
    min-height: 760px;
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
</style>

<template>
  <section
    :id="homeSections.tool.id"
    ref="sectionRef"
    class="content-section tool-section"
  >
    <ToolDepthField ref="depthFieldRef" />

    <PixelSectionHeading
      class="tool-heading"
      :kicker="homeSections.tool.kicker"
      :title="homeSections.tool.title"
      :density="14"
    />

    <div class="tool-stage" :aria-label="homeSections.tool.ariaLabel">
      <div
        v-for="(item, index) in toolItems"
        :key="item.id"
        class="tool-card-shell"
        :class="`tool-card-shell--${index + 1}`"
      >
        <ToolPortalCard :item="item" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { homeSections, toolItems } from '../../../config/home'
import PixelSectionHeading from './PixelSectionHeading.vue'
import ToolDepthField from './ToolDepthField.vue'
import ToolPortalCard from './ToolPortalCard.vue'

gsap.registerPlugin(ScrollTrigger)

/**
 * TOOL 景深 Canvas 暴露给主滚动时间线的最小控制接口。
 */
interface ToolDepthFieldHandle {
  // 传入归一化滚动进度并移动预绘背景层。
  renderProgress: (progress: number) => void
}

/**
 * 保存由 GSAP 主时间线平滑推进的景深进度。
 */
interface ToolDepthProgress {
  // 当前远中近三层共享的归一化滚动进度。
  progress: number
}

/**
 * 描述一张桌面工具卡从视口外进入最终网格的起点。
 */
interface ToolCardMotion {
  // 初始水平位移。
  x: number
  // 初始垂直位移。
  y: number
}

// 固定 TOOL 场景进入视口时通知主页同步导航激活态。
const emit = defineEmits<{
  activate: []
  leaveForward: []
}>()
// TOOL 根节点提供固定场景和局部选择器边界。
const sectionRef = ref<HTMLElement | null>(null)
// 背景组件由主 ScrollTrigger 同步滚动进度。
const depthFieldRef = ref<ToolDepthFieldHandle | null>(null)
// GSAP 上下文统一回收局部补间和固定场景。
let animationContext: gsap.Context | undefined
// 响应式媒体上下文分别管理桌面固定场景与移动端普通流。
let animationMedia: gsap.MatchMedia | undefined

// 组件挂载后按当前断点创建 TOOL 专属滚动场景。
onMounted(async () => {
  await nextTick()

  // 当前 section 是桌面 pin 和移动端触发器的共同边界。
  const section = sectionRef.value

  if (!section) {
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    depthFieldRef.value?.renderProgress(0.5)
    return
  }

  animationContext = gsap.context(() => {
    animationMedia = gsap.matchMedia()
    animationMedia.add('(min-width: 821px)', () => createDesktopToolScene(section))
    animationMedia.add('(max-width: 820px)', () => createMobileToolScene(section))
  }, section)

  ScrollTrigger.refresh()
})

// 组件卸载时恢复全部 pin、transform 和 Canvas 进度状态。
onUnmounted(() => {
  animationMedia?.revert()
  animationContext?.revert()
  animationMedia = undefined
  animationContext = undefined
})

/**
 * 创建桌面端固定滚动场景，让四张卡逐张撞入并拼成不对称矩阵。
 */
function createDesktopToolScene(section: HTMLElement) {
  // 标题索引从主标题相反方向进入。
  const headingKicker = section.querySelector<HTMLElement>('.tool-heading p')
  // 大标题在固定场景开始时承担第一次强位移。
  const headingTitle = section.querySelector<HTMLElement>('.tool-heading h2')
  // 标题像素轨在标题稳定后逐格装配。
  const headingRailPixels = gsap.utils.toArray<HTMLElement>('.tool-heading span i', section)
  // 四张卡片外壳分别承接各自的大幅撞入轨迹。
  const cardShells = gsap.utils.toArray<HTMLElement>('.tool-card-shell', section)
  // 主时间线映射完整固定滚动距离。
  const sceneTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${resolveDesktopScrollDistance()}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: activateToolSection,
      onEnterBack: handleDesktopToolEnterBack,
      onLeave: handleDesktopToolLeave,
      onLeaveBack: handleDesktopToolLeaveBack,
      onUpdate: syncToolActivation,
      onRefresh: syncToolActivation,
    },
  })
  // 景深代理与卡片共用主时间线的 scrub，避免两套滚动进度互相错位。
  const depthState: ToolDepthProgress = { progress: 0 }

  sceneTimeline.fromTo(depthState, {
    progress: 0,
  }, {
    progress: 1,
    duration: 1,
    ease: 'none',
    onUpdate: syncDepthProgress,
    onUpdateParams: [depthState],
  }, 0)

  if (headingKicker) {
    sceneTimeline.fromTo(headingKicker, {
      autoAlpha: 0,
      x: 220,
    }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.12,
      ease: 'power3.out',
    }, 0)
  }

  if (headingTitle) {
    sceneTimeline.fromTo(headingTitle, {
      autoAlpha: 0,
      x: -360,
    }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.22,
      ease: 'power4.out',
    }, 0.02)
  }

  sceneTimeline.fromTo(headingRailPixels, {
    autoAlpha: 0,
    y: 44,
    scale: 0,
  }, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    duration: 0.12,
    stagger: 0.012,
    ease: 'power3.out',
  }, 0.14)

  // 四张卡使用不同起点依次装入最终矩阵。
  const cardStartTimes = [0.1, 0.27, 0.41, 0.57]

  cardShells.forEach((shell, index) => {
    addDesktopCardAssembly(
      sceneTimeline,
      shell,
      index,
      cardStartTimes[index] ?? 0.62,
    )
  })

  return () => {
    depthFieldRef.value?.renderProgress(0)
  }
}

/**
 * 把单张工具卡拆成长轨迹落位、色块进入和信息装配三个阶段。
 */
function addDesktopCardAssembly(
  timeline: gsap.core.Timeline,
  shell: HTMLElement,
  index: number,
  startTime: number,
) {
  // 当前卡片使用与最终网格位置对应的长距离入场方向。
  const motion = resolveDesktopCardMotion(index)
  // 纯色视觉块在外壳撞入时从边缘展开。
  const visual = shell.querySelector<HTMLElement>('.tool-portal-card__visual')
  // 内容区的标题、正文和出口分别承担一次短距离装配。
  const contentParts = gsap.utils.toArray<HTMLElement>(
    '.tool-portal-card__content header, .tool-portal-card__copy, .tool-portal-card__content footer',
    shell,
  )
  // 卡片编号拥有独立的垂直落位动作。
  const number = shell.querySelector<HTMLElement>('.tool-portal-card__number')
  // Canvas 图标从撞入方向的反方向顶入视觉块。
  const icon = shell.querySelector<HTMLElement>('.tool-portal-card__icon')
  // 六个标记像素最后逐格点亮。
  const markers = gsap.utils.toArray<HTMLElement>('.tool-portal-card__markers i', shell)

  timeline
    .fromTo(shell, {
      autoAlpha: 0,
      x: motion.x,
      y: motion.y,
    }, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: 0.28,
      ease: 'power4.out',
    }, startTime)

  if (visual) {
    timeline.fromTo(visual, {
      autoAlpha: 0,
      xPercent: motion.x >= 0 ? 34 : -34,
    }, {
      autoAlpha: 1,
      xPercent: 0,
      duration: 0.18,
      ease: 'power4.out',
    }, startTime + 0.018)
  }

  timeline.fromTo(contentParts, {
    autoAlpha: 0,
    x: motion.x >= 0 ? 54 : -54,
  }, {
    autoAlpha: 1,
    x: 0,
    duration: 0.13,
    stagger: 0.018,
    ease: 'power3.out',
  }, startTime + 0.04)

  if (number) {
    timeline.fromTo(number, {
      autoAlpha: 0,
      y: -72,
    }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12,
      ease: 'power3.out',
    }, startTime + 0.055)
  }

  if (icon) {
    timeline.fromTo(icon, {
      autoAlpha: 0,
      x: motion.x > 0 ? -84 : 84,
      y: motion.y > 0 ? -56 : 56,
    }, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: 0.14,
      ease: 'power4.out',
    }, startTime + 0.085)
  }

  timeline.fromTo(markers, {
    autoAlpha: 0,
    scale: 0,
  }, {
    autoAlpha: 1,
    scale: 1,
    duration: 0.08,
    stagger: 0.012,
    ease: 'power2.out',
  }, startTime + 0.12)
}

/**
 * 创建移动端普通文档流动画，逐卡触发且不使用固定场景。
 */
function createMobileToolScene(section: HTMLElement) {
  // 标题和像素轨在 section 进入视口时完成一次滚动装配。
  const headingTargets = section.querySelectorAll('.tool-heading p, .tool-heading h2, .tool-heading span i')
  // 每张移动端卡片根据自身位置独立触发，避免在屏幕外提前完成。
  const cardShells = gsap.utils.toArray<HTMLElement>('.tool-card-shell', section)

  // 移动端景深代理只跟随本 section 的自然滚动范围。
  const depthState: ToolDepthProgress = { progress: 0 }

  gsap.fromTo(depthState, {
    progress: 0,
  }, {
    progress: 1,
    ease: 'none',
    onUpdate: syncDepthProgress,
    onUpdateParams: [depthState],
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.45,
      invalidateOnRefresh: true,
      onEnter: activateToolSection,
      onEnterBack: activateToolSection,
    },
  })

  gsap.fromTo(headingTargets, {
    autoAlpha: 0,
    x: -88,
  }, {
    autoAlpha: 1,
    x: 0,
    stagger: 0.025,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 88%',
      end: 'top 38%',
      scrub: 0.24,
    },
  })

  cardShells.forEach((shell, index) => {
    // 相邻卡片从左右两侧交替进入。
    const horizontalOffset = index % 2 === 0 ? -96 : 96

    // 单卡时间线让外壳、色块和文字保持同一次触发但拥有不同速度。
    const cardTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: shell,
        start: 'top 92%',
        end: 'top 48%',
        scrub: 0.38,
      },
    })
    // 当前卡片的大面积视觉块比外壳稍晚进入。
    const visual = shell.querySelector<HTMLElement>('.tool-portal-card__visual')
    // 当前卡片的内容节点使用短距离交错装配。
    const contentParts = gsap.utils.toArray<HTMLElement>(
      '.tool-portal-card__content header, .tool-portal-card__copy, .tool-portal-card__content footer',
      shell,
    )

    cardTimeline.fromTo(shell, {
      autoAlpha: 0,
      x: horizontalOffset,
      y: 72,
    }, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: 0.72,
      ease: 'power4.out',
    }, 0)

    if (visual) {
      cardTimeline.fromTo(visual, {
        autoAlpha: 0,
        xPercent: index % 2 === 0 ? -28 : 28,
      }, {
        autoAlpha: 1,
        xPercent: 0,
        duration: 0.48,
        ease: 'power3.out',
      }, 0.08)
    }

    cardTimeline.fromTo(contentParts, {
      autoAlpha: 0,
      x: horizontalOffset * 0.35,
    }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.42,
      stagger: 0.05,
      ease: 'power3.out',
    }, 0.16)
  })
}

/**
 * 把主时间线平滑后的代理进度同步给三层 Canvas 景深背景。
 */
function syncDepthProgress(state: ToolDepthProgress) {
  depthFieldRef.value?.renderProgress(state.progress)
}

/**
 * 固定场景处于活动区间时持续校正主页导航选中项。
 */
function syncToolActivation(trigger: ScrollTrigger) {
  if (trigger.isActive) {
    activateToolSection()
  }
}

/**
 * 通知主页当前可见的固定场景属于 TOOL section。
 */
function activateToolSection() {
  emit('activate')
}

/**
 * 把固定场景立即对齐到指定滚动进度，避免重新 pin 后追赶旧状态。
 */
function setDesktopToolProgress(trigger: ScrollTrigger, progress: number) {
  // 外部传入值统一限制在 ScrollTrigger 的有效进度范围内。
  const resolvedProgress = gsap.utils.clamp(0, 1, progress)
  // 边界切换前结束旧 scrub，防止它在后续帧重新覆盖已同步的真实进度。
  const scrubTween = trigger.getTween()

  scrubTween?.progress(1)
  trigger.animation?.progress(resolvedProgress, true)
  depthFieldRef.value?.renderProgress(resolvedProgress)
}

/**
 * 从 BLOG 反向回到 TOOL 时直接采用当前真实进度，避免 Canvas 从终态回追。
 */
function handleDesktopToolEnterBack(trigger: ScrollTrigger) {
  // 回调触发时 trigger.progress 可能仍是边界值，滚动坐标才代表本帧真实落点。
  const scrollProgress = gsap.utils.normalize(trigger.start, trigger.end, trigger.scroll())

  setDesktopToolProgress(trigger, scrollProgress)
  activateToolSection()
}

/**
 * 正向离开 TOOL 时锁定完整终态并通知主页激活下一区域。
 */
function handleDesktopToolLeave(trigger: ScrollTrigger) {
  setDesktopToolProgress(trigger, 1)
  emit('leaveForward')
}

/**
 * 反向离开 TOOL 顶部时恢复初始状态，保证下次正向进入没有残留。
 */
function handleDesktopToolLeaveBack(trigger: ScrollTrigger) {
  setDesktopToolProgress(trigger, 0)
}

/**
 * 根据当前视口返回四张卡各自的大幅入场位置。
 */
function resolveDesktopCardMotion(index: number): ToolCardMotion {
  // 水平运动基于真实视口宽度，确保 2K 屏幕仍有足够冲击力。
  const viewportWidth = window.innerWidth
  // 垂直运动基于真实视口高度，卡片会完整越过场景边界。
  const viewportHeight = window.innerHeight
  // 四组轨迹与最终不对称网格的位置一一对应。
  const motions: readonly ToolCardMotion[] = [
    {
      x: viewportWidth * 0.72,
      y: -viewportHeight * 0.12,
    },
    {
      x: viewportWidth * 0.18,
      y: -viewportHeight * 0.92,
    },
    {
      x: -viewportWidth * 0.58,
      y: viewportHeight * 0.54,
    },
    {
      x: viewportWidth * 0.76,
      y: viewportHeight * 0.52,
    },
  ]

  return motions[index] ?? motions[0] ?? {
    x: viewportWidth,
    y: 0,
  }
}

/**
 * 给桌面固定场景提供足够滚动距离，使四次撞入都能被清楚看到。
 */
function resolveDesktopScrollDistance() {
  return Math.max(window.innerHeight * 2.8, 2400)
}
</script>

<style scoped>
.tool-section {
  display: grid;
  grid-template-columns: minmax(320px, 0.42fr) minmax(0, 1.58fr);
  gap: clamp(64px, 6vw, 112px);
  align-items: center;
  isolation: isolate;
  background: #f8faff;
}

.tool-heading {
  position: relative;
  z-index: 2;
  min-width: 0;
}

.tool-heading :deep(.pixel-section-heading__title) {
  font-size: 108px;
}

.tool-stage {
  position: relative;
  z-index: 2;
  display: grid;
  width: 100%;
  height: min(68vh, 740px);
  min-height: 560px;
  padding: 0 12px 12px 0;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr) minmax(0, 0.92fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tool-card-shell {
  min-width: 0;
  min-height: 0;
  container-type: inline-size;
  will-change: transform, opacity;
}

.tool-card-shell--1 {
  grid-column: 1 / 3;
  grid-row: 1;
}

.tool-card-shell--2 {
  grid-column: 3;
  grid-row: 1;
}

.tool-card-shell--3 {
  grid-column: 1;
  grid-row: 2;
}

.tool-card-shell--4 {
  grid-column: 2 / 4;
  grid-row: 2;
}

@media (max-width: 1200px) and (min-width: 821px) {
  .tool-section {
    grid-template-columns: minmax(230px, 0.38fr) minmax(0, 1.62fr);
    gap: 40px;
  }

  .tool-heading :deep(.pixel-section-heading__title) {
    font-size: 76px;
  }

  .tool-stage {
    height: min(70vh, 660px);
    min-height: 520px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tool-card-shell--1,
  .tool-card-shell--2,
  .tool-card-shell--3,
  .tool-card-shell--4 {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 820px) {
  .tool-section {
    display: block;
  }

  .tool-heading {
    margin-bottom: 48px;
  }

  .tool-heading :deep(.pixel-section-heading__title) {
    font-size: 58px;
  }

  .tool-stage {
    display: grid;
    width: 100%;
    height: auto;
    min-height: 0;
    padding: 0 10px 10px 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    gap: 22px;
  }

  .tool-card-shell,
  .tool-card-shell--1,
  .tool-card-shell--2,
  .tool-card-shell--3,
  .tool-card-shell--4 {
    min-height: 300px;
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 480px) {
  .tool-heading :deep(.pixel-section-heading__title) {
    font-size: 48px;
  }

  .tool-card-shell,
  .tool-card-shell--1,
  .tool-card-shell--2,
  .tool-card-shell--3,
  .tool-card-shell--4 {
    min-height: 270px;
  }
}
</style>

<template>
  <section :id="homeSections.blog.id" class="content-section blog-section">
    <canvas
      ref="fieldCanvas"
      class="blog-field-canvas"
      aria-hidden="true"
    ></canvas>

    <div class="blog-heading" :aria-label="homeSections.blog.title">
      <div class="blog-heading__title" aria-hidden="true">
        <PixelText
          v-for="(letter, index) in blogTitleLetters"
          :key="`${letter.text}-${index}`"
          class="blog-heading__letter"
          :text="letter.text"
          :density="letter.density"
          :font-family="letter.fontFamily"
          :color="letter.color"
        />
      </div>
    </div>

    <div class="blog-window" :aria-label="homeSections.blog.ariaLabel">
      <header class="blog-window__bar">
        <div class="blog-window__bar-label">
          <i></i>
          <span>{{ homeSections.blog.streamLabel }}</span>
        </div>
        <span>{{ blogItems.length.toString().padStart(2, '0') }} {{ homeSections.blog.entriesLabel }}</span>
      </header>

      <div class="blog-window__scroll" @scroll="handleBlogScroll">
        <div class="blog-window__scrollline" aria-hidden="true">
          <span
            class="blog-window__scroll-marker"
            :style="{ top: `${scrollProgress}%` }"
          ></span>
          <i
            v-for="item in blogItems"
            :key="item.id"
            :style="{ background: item.accent }"
          ></i>
        </div>

        <PixelLinkCard
          v-for="(item, index) in blogItems"
          :key="item.id"
          :class="['blog-row', `blog-row--${index + 1}`]"
          :data-blog-index="index"
          :item="item"
        />
      </div>

      <footer class="blog-window__status">
        <span>{{ homeSections.blog.scrollLabel }}</span>
        <span>{{ scrollProgress.toString().padStart(2, '0') }}% {{ homeSections.blog.readLabel }}</span>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { blogItems, homeSections } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import { PixelText } from '../../base/pixel'

gsap.registerPlugin(ScrollTrigger)

// 当前文章容器的真实阅读比例，只用于列表页脚和像素滑块。
const scrollProgress = ref(0)

// 单一 Canvas 承载整张像素重组场，避免为每个像素创建独立 DOM 节点。
const fieldCanvas = ref<HTMLCanvasElement | null>(null)

// 大型干涉图案使用独立冷暖配色，不读取文章图标或内容配置。
const fieldColors = ['#4164e0', '#12a79d', '#e45f91', '#9b62d8'] as const
// BLOG 标题保留原有逐字配色，配置只负责提供实际展示文字。
const blogTitleColors = ['#4164e0', '#657de8', '#438ac7', '#12a79d'] as const

// 配置中的 BLOG 标题按字符拆分，以便每个字母继续拥有独立 GSAP 轨迹。
const blogTitleLetters = Array.from(homeSections.blog.title, createBlogTitleLetter)

/**
 * 为配置标题中的单个字符分配循环色和稳定的像素绘制参数。
 */
function createBlogTitleLetter(text: string, index: number) {
  // 当前字符按索引循环读取标题配色，支持配置中调整标题长度。
  const color = blogTitleColors[index % blogTitleColors.length] ?? blogTitleColors[0]

  return {
    text,
    color,
    density: 14,
    fontFamily: text === 'G' ? 'Arial' : 'Zpix',
  }
}

// Canvas 背景的 GSAP 相位和章节重组进度，均由渲染函数读取。
const fieldState = {
  phase: 0,
  scroll: 0,
}

// 页面卸载时销毁 GSAP、观察器和 Canvas 资源。
let animationContext: gsap.Context | undefined
let resizeObserver: ResizeObserver | undefined
let visibilityObserver: IntersectionObserver | undefined

/**
 * 根据文章容器的真实滚动距离更新阅读比例。
 */
function handleBlogScroll(event: Event) {
  const target = event.currentTarget

  if (!(target instanceof HTMLElement)) {
    return
  }

  const scrollableDistance = target.scrollHeight - target.clientHeight
  scrollProgress.value = scrollableDistance > 0
    ? Math.round((target.scrollTop / scrollableDistance) * 100)
    : 0

  revealVisibleCards(target)
}

/**
 * 在文章卡片进入内部滚动容器时播放完整的 GSAP 入场序列。
 */
function revealVisibleCards(scrollContainer: HTMLElement) {
  // 当前滚动容器的视口边界用于判断卡片是否真正进入可见区域。
  const viewportBounds = scrollContainer.getBoundingClientRect()
  // 尚未播放的文章卡片按 DOM 顺序参与本轮延迟编排。
  const hiddenCards = Array.from(
    scrollContainer.querySelectorAll<HTMLElement>('.blog-row:not([data-blog-revealed="true"])'),
  )

  hiddenCards.forEach((card, index) => {
    // 卡片边界需要与内部容器视口相交，避免提前播放屏幕外动画。
    const cardBounds = card.getBoundingClientRect()
    const isVisible = cardBounds.bottom > viewportBounds.top + 24
      && cardBounds.top < viewportBounds.bottom - 24

    if (!isVisible) {
      return
    }

    card.dataset.blogRevealed = 'true'

    // 卡片主体先大幅滑入并回弹，建立明确的列表出现动作。
    const cardTimeline = gsap.timeline({ delay: index * 0.12 })
    // 卡片内部的像素图标在主体稳定后独立旋转展开。
    const icon = card.querySelector<HTMLElement>('.pixel-link-card__icon')
    // 顶栏和底栏从左向右展开，强化像素窗口装配感。
    const chrome = card.querySelectorAll<HTMLElement>('header, footer')

    cardTimeline
      .to(card, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
        duration: 0.92,
        ease: 'back.out(1.75)',
      }, 0)
      .to(chrome, {
        scaleX: 1,
        duration: 0.48,
        stagger: 0.08,
        ease: 'steps(6)',
      }, 0.2)

    if (icon) {
      cardTimeline.to(icon, {
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
        duration: 0.68,
        ease: 'back.out(2.2)',
      }, 0.3)
    }
  })
}

/**
 * 重置文章卡片及其内部元素，确保章节再次进入时重新播放装配动画。
 */
function resetCardEntrances(cards: NodeListOf<HTMLElement>) {
  cards.forEach((card) => {
    delete card.dataset.blogRevealed

    // 卡片主体回到容器左下方，等待下一次进入可见区域。
    gsap.set(card, { x: -180, y: 104, scale: 0.84, rotation: -4, autoAlpha: 0 })
    // 像素图标回到旋转收缩状态。
    gsap.set(card.querySelector<HTMLElement>('.pixel-link-card__icon'), {
      scale: 0,
      rotation: -90,
      autoAlpha: 0,
    })
    // 顶栏和底栏重新收拢到左侧，等待横向装配。
    gsap.set(card.querySelectorAll<HTMLElement>('header, footer'), {
      scaleX: 0,
      transformOrigin: 'left center',
    })
  })
}

/**
 * 绘制多层反向旋转的像素转子，形成单一且边界完整的背景主体。
 */
function drawPixelRotor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelUnit: number,
  centerX: number,
  centerY: number,
) {
  // 叶片方块使用稳定的大尺寸，确保涡轮在大屏下仍有足够视觉重量。
  const cellSize = Math.max(14, Math.round(pixelUnit * 2.7))
  // 方块之间留出白色缝隙，形成统一的内部像素边线。
  const gap = Math.max(2, Math.round(cellSize * 0.12))
  // GSAP 相位严格映射到完整一圈，循环首尾保持同一几何状态。
  const phase = fieldState.phase * Math.PI * 2
  // 外半径覆盖右侧主要负空间，并通过自然曲线消除固定裁切线。
  const baseOuterRadius = Math.min(width * (width > 820 ? 0.39 : 0.68), height * 0.64)
  // 基准内半径只参与固定拓扑计算，避免呼吸动画改变方块总数。
  const baseInnerRadius = baseOuterRadius * 0.2
  // 主体半径保持固定，让所有悬臂作为同一刚性结构连续旋转。
  const outerRadius = baseOuterRadius
  // 中心留白让 BLOG 标题成为涡轮的轴心。
  const innerRadius = outerRadius * 0.2
  // 八片叶片形成稳定对称关系，同时保留足够负空间。
  const bladeCount = 8
  // 三列并行方块组成宽幅叶片，不再出现单列点状轨迹。
  const bladeTrackCount = 3
  // 叶片采样数量只依据基准半径计算，循环中不再出现方块增减导致的跳变。
  const bladeStepCount = Math.max(
    18,
    Math.ceil((baseOuterRadius - baseInnerRadius) / (cellSize * 0.82)),
  )
  // 预计算连续颜色轮，避免每个方块只在四种颜色之间生硬跳变。
  const colorWheel = Array.from({ length: 32 }, (_, index) => (
    gsap.utils.interpolate([...fieldColors, fieldColors[0]], index / 31)
  ))

  for (let bladeIndex = 0; bladeIndex < bladeCount; bladeIndex += 1) {
    // 每片叶片从等分角度出发，整体保持严格的八向秩序。
    const bladeOrigin = bladeIndex / bladeCount * Math.PI * 2
    // 整体旋转幅度由时间和滚动共同驱动，形成明显的长距离运动。
    const rotation = phase + fieldState.scroll * 1.45

    for (let stepIndex = 0; stepIndex <= bladeStepCount; stepIndex += 1) {
      // 归一化进度用于同时控制半径、弯曲程度和颜色流动。
      const progress = stepIndex / bladeStepCount
      // 叶片从轴心外缘连续伸展到转子边界。
      const radius = innerRadius + (outerRadius - innerRadius) * progress
      // 外端弯曲更明显，形成统一方向的机械涡旋。
      const angle = bladeOrigin + rotation + progress * 1.14
      // 颜色沿叶片和叶片序号连续错开，形成稳定的旋转色流。
      const colorProgress = ((progress * 0.52 + bladeIndex / bladeCount + fieldState.phase) % 1 + 1) % 1
      // 颜色轮索引稳定映射到预计算结果，避免每帧产生随机变化。
      const colorIndex = Math.min(colorWheel.length - 1, Math.floor(colorProgress * colorWheel.length))

      for (let trackIndex = 0; trackIndex < bladeTrackCount; trackIndex += 1) {
        // 并行轨道沿叶片法线展开，形成三格厚度的连续宽带。
        const trackOffset = (trackIndex - (bladeTrackCount - 1) / 2) * cellSize * 1.02
        // 法线横向分量控制叶片厚度，不改变叶片中心曲线。
        const normalX = Math.cos(angle + Math.PI / 2) * trackOffset
        // 法线纵向分量与横向共同保持方块带宽一致。
        const normalY = Math.sin(angle + Math.PI / 2) * trackOffset
        // 当前方块横坐标沿弯曲叶片中心线计算。
        const x = centerX + Math.cos(angle) * radius + normalX - cellSize / 2
        // 当前方块纵坐标沿同一弯曲中心线计算。
        const y = centerY + Math.sin(angle) * radius + normalY - cellSize / 2

        context.globalAlpha = 0.3 + progress * 0.12
        context.fillStyle = colorWheel[colorIndex]
        context.fillRect(
          Math.round(x) + gap / 2,
          Math.round(y) + gap / 2,
          cellSize - gap,
          cellSize - gap,
        )
      }
    }
  }

  // 轴环使用更小的独立方块，提升圆周均匀度并保留标题周围的呼吸空间。
  const hubCellSize = Math.max(9, Math.round(cellSize * 0.7))
  // 轴环方块同样保留清晰白缝，避免缩小后粘连成普通实线。
  const hubGap = Math.max(1, Math.round(hubCellSize * 0.14))
  // 轴环基准半径固定圆周采样拓扑，只让实际半径做连续的小幅呼吸。
  const baseHubRadius = baseInnerRadius * 0.82
  // 轴环半径固定，使内环与悬臂始终共享同一个稳定圆心。
  const hubRadius = baseHubRadius
  // 固定且更密集的圆周采样消除运行过程中方块数量变化和间距忽大忽小。
  const hubBlockCount = Math.max(
    32,
    Math.round(Math.PI * 2 * baseHubRadius / (hubCellSize * 1.22)),
  )

  for (let blockIndex = 0; blockIndex < hubBlockCount; blockIndex += 1) {
    // 轴环与叶片反向旋转，增强中心机械咬合感。
    const angle = blockIndex / hubBlockCount * Math.PI * 2 - phase - fieldState.scroll
    // 轴环颜色沿圆周持续流动，并与外侧叶片共享同一颜色轮。
    const colorProgress = ((blockIndex / hubBlockCount + fieldState.phase) % 1 + 1) % 1
    // 颜色轮索引保持稳定，避免轴环出现随机闪烁。
    const colorIndex = Math.min(colorWheel.length - 1, Math.floor(colorProgress * colorWheel.length))
    // 轴环横坐标沿中心圆周计算。
    const x = centerX + Math.cos(angle) * hubRadius - hubCellSize / 2
    // 轴环纵坐标与横坐标共享同一角度。
    const y = centerY + Math.sin(angle) * hubRadius - hubCellSize / 2

    context.globalAlpha = 0.54
    context.fillStyle = colorWheel[colorIndex]
    context.fillRect(
      Math.round(x) + hubGap / 2,
      Math.round(y) + hubGap / 2,
      hubCellSize - hubGap,
      hubCellSize - hubGap,
    )
  }

  // 六组外圈配重以反向公转和径向开合补充第二套清晰可见的运动节奏。
  const gateCount = 6
  // 配重方块略大于叶片方块，使外圈结构在浅色背景中拥有足够视觉权重。
  const gateCellSize = Math.max(cellSize + 3, Math.round(cellSize * 1.24))
  // 配重内部仍使用白色像素缝，保持与主体一致的拼接语言。
  const gateGap = Math.max(2, Math.round(gateCellSize * 0.12))
  // 配重轨道向主叶片内侧收进，避免大部分结构落在画布裁切区之外。
  const gateBaseRadius = baseOuterRadius * 0.82

  for (let gateIndex = 0; gateIndex < gateCount; gateIndex += 1) {
    // 配重等分布置在外圈，并与主叶片反向旋转。
    const gateAngle = gateIndex / gateCount * Math.PI * 2 - phase
    // 每组配重使用错开的完整周期相位，形成依次向内咬合和向外释放的节奏。
    const gateRadius = gateBaseRadius * (
      1 + Math.sin(phase * 2 + gateIndex / gateCount * Math.PI * 2) * 0.075
    )

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        // 对称缺格把配重塑造成宽幅机械夹爪，而不是没有方向性的实心矩形。
        if ((row === 0 && (column < 2 || column > 6))
          || (row === 1 && column === 4)
          || (row === 2 && (column === 3 || column === 5))
          || (row === 3 && (column === 0 || column === 8))) {
          continue
        }

        // 配重颜色沿自身宽度和公转相位连续流动，强化大块结构的内部层次。
        const gateColorProgress = ((
          fieldState.phase + gateIndex / gateCount + column / 18
        ) % 1 + 1) % 1
        // 固定颜色轮保证循环端点颜色一致，不产生整组闪烁。
        const gateColorIndex = Math.min(
          colorWheel.length - 1,
          Math.floor(gateColorProgress * colorWheel.length),
        )
        // 列方向沿圆周切线展开，形成真正可辨识的宽幅配重。
        const tangentialOffset = (column - 4) * gateCellSize * 1.04
        // 行方向沿半径展开，使配重拥有四格厚度和清晰剪影。
        const radialOffset = (row - 1.5) * gateCellSize * 1.04
        // 配重横坐标由公转半径、径向厚度和切向宽度共同决定。
        const x = centerX
          + Math.cos(gateAngle) * (gateRadius + radialOffset)
          + Math.cos(gateAngle + Math.PI / 2) * tangentialOffset
          - gateCellSize / 2
        // 配重纵坐标与横坐标共享同一局部坐标系。
        const y = centerY
          + Math.sin(gateAngle) * (gateRadius + radialOffset)
          + Math.sin(gateAngle + Math.PI / 2) * tangentialOffset
          - gateCellSize / 2

        context.globalAlpha = 0.68
        context.fillStyle = colorWheel[gateColorIndex]
        context.fillRect(
          Math.round(x) + gateGap / 2,
          Math.round(y) + gateGap / 2,
          gateCellSize - gateGap,
          gateCellSize - gateGap,
        )
      }
    }
  }
}

/**
 * 绘制单一平面的离散像素重组场，所有位置和尺寸都量化到当前像素网格。
 */
function drawField(context: CanvasRenderingContext2D) {
  const canvas = fieldCanvas.value

  if (!canvas) {
    return
  }

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (!width || !height) {
    return
  }

  // 设备像素比只用于提高 Canvas 清晰度，不改变 CSS 布局尺寸。
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  const pixelUnit = Math.max(3, Math.round(Math.min(width, height) / 180))
  // BLOG 章节边界提供 Canvas 内部坐标系的稳定原点。
  const section = canvas.closest<HTMLElement>('.blog-section')
  // 标题容器的真实布局中心作为转子唯一圆心，不再使用屏幕比例估算。
  const heading = section?.querySelector<HTMLElement>('.blog-heading')
  // 章节和标题边界用于把页面坐标换算为 Canvas 局部坐标。
  const sectionBounds = section?.getBoundingClientRect()
  const headingBounds = heading?.getBoundingClientRect()
  // 标题缺失时保留原有桌面与移动端回退位置，避免 Canvas 无法绘制。
  const centerX = sectionBounds && headingBounds
    ? headingBounds.left + headingBounds.width / 2 - sectionBounds.left
    : width * (width > 820 ? 0.8 : 0.5)
  // 纵向圆心与标题真实中心严格一致，悬臂和内环共同读取该值。
  const centerY = sectionBounds && headingBounds
    ? headingBounds.top + headingBounds.height / 2 - sectionBounds.top
    : height * (width > 820 ? 0.5 : 0.27)

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false

  // 单一大型转子承担全部背景视觉，不叠加粒子、logo 或额外装饰块。
  drawPixelRotor(context, width, height, pixelUnit, centerX, centerY)

  context.globalAlpha = 1
}

/**
 * 按 Canvas 实际 CSS 尺寸调整缓冲区，并立即绘制一帧。
 */
function resizeField(context: CanvasRenderingContext2D) {
  const canvas = fieldCanvas.value

  if (!canvas) {
    return
  }

  const width = Math.max(1, canvas.clientWidth)
  const height = Math.max(1, canvas.clientHeight)
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)

  canvas.width = Math.round(width * devicePixelRatio)
  canvas.height = Math.round(height * devicePixelRatio)
  drawField(context)
}

// BLOG 挂载时建立 Canvas、GSAP 相位动画和单平面重组。
onMounted(() => {
  const section = document.getElementById(homeSections.blog.id)
  const canvas = fieldCanvas.value

  if (!section || !canvas) {
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  animationContext = gsap.context(() => {
    // 文章窗口作为整体入场，标题字母使用独立轨迹。
    const windowTarget = section.querySelector<HTMLElement>('.blog-window')
    // BLOG 四个像素字母分别执行旋转坠落动画。
    const letterTargets = section.querySelectorAll<HTMLElement>('.blog-heading__letter')
    // 文章卡片在进入内部滚动视口前保持隐藏状态。
    const cardTargets = section.querySelectorAll<HTMLElement>('.blog-row')
    // 内部滚动容器提供文章卡片的真实可见范围。
    const scrollContainer = section.querySelector<HTMLElement>('.blog-window__scroll')
    // Canvas 进入视口时才允许推进相位，避免后台持续消耗资源。
    const phaseTween = gsap.to(fieldState, {
      phase: 1,
      duration: 28,
      repeat: -1,
      ease: 'none',
      onUpdate: () => drawField(context),
    })

    // 标题容器保持最终布局，只让内部字母承担入场位移。
    gsap.set(section.querySelector('.blog-heading'), { autoAlpha: 1 })
    gsap.set(windowTarget, { x: -128, y: 72, scale: 0.9, rotation: -1.5, autoAlpha: 1 })
    gsap.set(letterTargets, {
      y: -220,
      x: (index) => (index % 2 === 0 ? -42 : 42),
      rotation: (index) => (index % 2 === 0 ? -210 : 210) + index * 24,
      scale: 0.42,
      autoAlpha: 0,
      transformOrigin: '50% 0%',
    })
    resetCardEntrances(cardTargets)
    gsap.set(canvas, { autoAlpha: 1, scale: 1, rotation: 0 })

    // 章节入场时间线负责背景、窗口和逐字标题，卡片由内部可见性单独触发。
    const introTimeline = gsap.timeline({ paused: true })

    introTimeline
      .to(windowTarget, {
        y: 0,
        x: 0,
        scale: 1,
        rotation: 0,
        duration: 1.12,
        ease: 'back.out(1.8)',
      }, 0.12)
      .to(letterTargets, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 1.08,
        stagger: 0.14,
        ease: 'bounce.out',
      }, 0.04)
      .to(letterTargets, {
        y: (index) => (index % 2 === 0 ? -10 : 8),
        rotation: (index) => (index % 2 === 0 ? -7 : 7),
        duration: 0.18,
        stagger: 0.05,
        ease: 'power2.out',
      }, 0.92)
      .to(letterTargets, {
        y: 0,
        rotation: 0,
        duration: 0.24,
        stagger: 0.05,
        ease: 'back.out(2)',
      }, 1.08)

    /**
     * 播放 BLOG 标题、窗口和当前可见卡片的完整入场序列。
     */
    const playBlogEntrance = () => {
      if (introTimeline.isActive() || introTimeline.progress() > 0) {
        return
      }

      introTimeline.play(0)

      if (scrollContainer) {
        revealVisibleCards(scrollContainer)
      }
    }

    // 背景滚动进度独立覆盖整个章节，不参与内容入场时机判定。
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      invalidateOnRefresh: true,
      onUpdate: (trigger) => {
        fieldState.scroll = trigger.progress
        drawField(context)
      },
    })

    // 入场触发器绑定真实文章窗口，避免整页被上游 pin 覆盖时提前播放。
    ScrollTrigger.create({
      trigger: windowTarget ?? section,
      start: 'top 72%',
      end: 'bottom top',
      invalidateOnRefresh: true,
      refreshPriority: -10,
      onEnter: playBlogEntrance,
      onEnterBack: playBlogEntrance,
      // 锚点直达或刷新恢复位置时，活动状态需要立即同步到最终入场。
      onRefresh: (trigger) => {
        if (trigger.isActive) {
          playBlogEntrance()
        }
      },
    })

    // 上游 PROJECT 和 TOOL 完成 pin spacer 后再统一重排并刷新后续触发坐标。
    const layoutRefresh = gsap.delayedCall(0.2, () => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
    })

    // 延迟刷新归当前 GSAP 上下文管理，变量保留以明确其生命周期。
    void layoutRefresh

    // IntersectionObserver 只管理后台暂停和完全离场重置，不再承担入场触发。
    visibilityObserver = new IntersectionObserver(([entry]) => {
      // 当前章节是否与视口相交，用于暂停后台 Canvas 和重置离场状态。
      const visible = Boolean(entry?.isIntersecting)
      phaseTween.paused(!visible)

      if (!visible) {
        introTimeline.pause(0)
        resetCardEntrances(cardTargets)
        return
      }
    })
    visibilityObserver.observe(canvas)

    resizeObserver = new ResizeObserver(() => resizeField(context))
    resizeObserver.observe(canvas)
    resizeField(context)
  }, section)
})

// BLOG 卸载时停止相位动画并释放观察器。
onUnmounted(() => {
  animationContext?.revert()
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  animationContext = undefined
  resizeObserver = undefined
  visibilityObserver = undefined
})
</script>

<style scoped>
.blog-section {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.38fr) minmax(300px, 0.62fr);
  gap: clamp(52px, 7vw, 128px);
  align-items: center;
  isolation: isolate;
  overflow: hidden;
  background: #f7f9ff;
}

.blog-field-canvas {
  position: absolute;
  z-index: 0;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  image-rendering: pixelated;
}

.blog-heading,
.blog-window {
  position: relative;
  z-index: 2;
  min-width: 0;
}

.blog-heading {
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  width: min(100%, 580px);
  padding: 12px 0 28px;
}

.blog-heading__title {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 580px);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(2px, 0.45vw, 8px);
  align-items: end;
  font-size: clamp(92px, 10vw, 168px);
  line-height: 0.86;
}

.blog-heading__letter {
  min-width: 0;
  overflow: visible;
}

.blog-heading__letter :deep(canvas) {
  display: block;
  width: 100%;
}

.blog-window {
  display: grid;
  width: 100%;
  height: min(68vh, 740px);
  min-height: 560px;
  grid-column: 1;
  grid-row: 1;
  grid-template-rows: 46px minmax(0, 1fr) 42px;
  border: 1px solid #aebfe2;
  background: rgb(255 255 255 / 92%);
  box-shadow: 14px 14px 0 #dfe7f7, -8px -8px 0 #edf2fc;
}

.blog-window::before,
.blog-window::after {
  position: absolute;
  z-index: 3;
  width: 14px;
  aspect-ratio: 1;
  content: "";
  background: #5d78db;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.blog-window::before {
  top: -7px;
  left: -7px;
}

.blog-window::after {
  right: -7px;
  bottom: -7px;
  background: #63b9b0;
}

.blog-window__bar,
.blog-window__status {
  display: flex;
  min-width: 0;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
  color: #5d73a1;
  background: #eaf0fb;
  font-size: 11px;
  font-weight: 800;
}

.blog-window__bar {
  border-bottom: 1px solid #b9c8e5;
}

.blog-window__bar-label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.blog-window__bar-label i {
  display: block;
  width: 8px;
  aspect-ratio: 1;
  background: #5d78db;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.blog-window__status {
  border-top: 1px solid #b9c8e5;
  color: #7e8db0;
  background: #f1f5fc;
}

.blog-window__scroll {
  position: relative;
  display: grid;
  min-height: 0;
  padding: 24px 30px 34px 54px;
  align-content: start;
  gap: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: #6e87d9 #eaf0fb;
  scrollbar-width: thin;
  background: rgb(251 253 255 / 92%);
}

.blog-window__scroll::-webkit-scrollbar {
  width: 12px;
}

.blog-window__scroll::-webkit-scrollbar-track {
  background: #eaf0fb;
  border-left: 1px solid #ffffff;
}

.blog-window__scroll::-webkit-scrollbar-thumb {
  background: #6e87d9;
  border: 3px solid #eaf0fb;
  border-radius: 0;
}

.blog-window__scrollline {
  position: absolute;
  z-index: 2;
  top: 24px;
  bottom: 34px;
  left: 24px;
  display: flex;
  width: 10px;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.blog-window__scrollline::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 4px;
  width: 1px;
  content: "";
  background: #dce5f5;
}

.blog-window__scrollline i {
  position: relative;
  z-index: 1;
  display: block;
  width: 8px;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.blog-window__scroll-marker {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 1px;
  display: block;
  width: 8px;
  height: 22px;
  background: #ffffff;
  border: 2px solid #5d78db;
  transform: translateY(-50%);
}

.blog-row {
  min-height: 218px;
}

:deep(.blog-row) {
  border-color: #aebfe2;
  box-shadow: 12px 12px 0 var(--card-secondary);
}

:deep(.blog-row header) {
  min-height: 40px;
  background: #f0f4fc;
}

:deep(.blog-row footer) {
  min-height: 40px;
  background: #fbfcff;
}

:deep(.blog-row .pixel-link-card__body) {
  padding: 28px 34px;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 26px;
}

:deep(.blog-row .pixel-link-card__icon) {
  width: 86px;
}

:deep(.blog-row .pixel-link-card__body strong) {
  font-size: 17px;
}

:deep(.blog-row .pixel-link-card__body p) {
  margin-top: 12px;
  font-size: 12px;
}

:deep(.blog-row--1) {
  background: #ffffff;
}

:deep(.blog-row--2) {
  background: #fcffff;
}

:deep(.blog-row--3) {
  background: #fffdfd;
}

@media (max-width: 1200px) and (min-width: 821px) {
  .blog-section {
    gap: 48px;
    grid-template-columns: minmax(0, 1.5fr) minmax(250px, 0.5fr);
  }

  .blog-window {
    min-height: 520px;
  }

  .blog-window__scroll {
    padding-left: 44px;
  }
}

@media (max-width: 820px) {
  .blog-section {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    align-content: center;
  }

  .blog-heading,
  .blog-window {
    grid-column: 1;
    grid-row: auto;
  }

  .blog-heading {
    order: -1;
    justify-self: stretch;
    width: 100%;
    padding: 0 0 8px;
  }

  .blog-heading__title {
    width: min(100%, 520px);
    font-size: 72px;
  }

  .blog-window {
    height: 460px;
    min-height: 0;
    grid-template-rows: 42px minmax(0, 1fr) 38px;
  }

  .blog-window__scroll {
    padding: 18px 22px 28px 42px;
    gap: 18px;
  }

  .blog-window__scrollline {
    top: 18px;
    bottom: 28px;
    left: 18px;
  }

  :deep(.blog-row .pixel-link-card__body) {
    padding: 20px 22px;
    grid-template-columns: 62px minmax(0, 1fr);
    gap: 16px;
  }

  :deep(.blog-row .pixel-link-card__icon) {
    width: 62px;
  }
}

@media (max-width: 480px) {
  .blog-heading__title {
    font-size: 58px;
  }

  .blog-window {
    height: 430px;
  }

  .blog-window__bar,
  .blog-window__status {
    padding: 0 10px;
    font-size: 9px;
  }

  .blog-window__scroll {
    padding-right: 16px;
  }

  :deep(.blog-row .pixel-link-card__body strong) {
    font-size: 14px;
  }

  :deep(.blog-row .pixel-link-card__body p) {
    font-size: 10px;
  }
}
</style>

<template>
  <section id="blog" class="content-section blog-section">
    <canvas
      ref="fieldCanvas"
      class="blog-field-canvas"
      aria-hidden="true"
    ></canvas>

    <div class="blog-heading">
      <PixelText
        class="blog-heading__title"
        text="BLOG"
        :density="14"
        color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
      />
    </div>

    <div class="blog-window" aria-label="文章页面索引">
      <header class="blog-window__bar">
        <div class="blog-window__bar-label">
          <i></i>
          <span>ARTICLE_STREAM</span>
        </div>
        <span>{{ blogItems.length.toString().padStart(2, '0') }} ENTRIES</span>
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
        <span>SCROLL INDEX</span>
        <span>{{ scrollProgress.toString().padStart(2, '0') }}% READ</span>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { blogItems } from '../../../config/home'
import PixelLinkCard from './PixelLinkCard.vue'
import { PixelText } from '../../base/pixel'

gsap.registerPlugin(ScrollTrigger)

// 当前文章容器的真实阅读比例，只用于列表页脚和像素滑块。
const scrollProgress = ref(0)

// 单一 Canvas 承载整张像素重组场，避免为每个像素创建独立 DOM 节点。
const fieldCanvas = ref<HTMLCanvasElement | null>(null)

// 大型干涉图案使用独立冷暖配色，不读取文章图标或内容配置。
const fieldColors = ['#4164e0', '#12a79d', '#e45f91', '#9b62d8'] as const

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
}

/**
 * 绘制多层反向旋转的像素转子，形成单一且边界完整的背景主体。
 */
function drawPixelRotor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  pixelUnit: number,
) {
  // 叶片方块使用稳定的大尺寸，确保涡轮在大屏下仍有足够视觉重量。
  const cellSize = Math.max(14, Math.round(pixelUnit * 2.7))
  // 方块之间留出白色缝隙，形成统一的内部像素边线。
  const gap = Math.max(2, Math.round(cellSize * 0.12))
  // 桌面端转子位于标题后方，移动端则回到页面水平中心。
  const centerX = width * (width > 820 ? 0.8 - fieldState.scroll * 0.06 : 0.5)
  // 滚动时整个涡轮向下迁移，避免只做原地抽搐式旋转。
  const centerY = height * (width > 820 ? 0.5 + fieldState.scroll * 0.1 : 0.27)
  // 外半径覆盖右侧主要负空间，并通过自然曲线消除固定裁切线。
  const outerRadius = Math.min(width * (width > 820 ? 0.39 : 0.68), height * 0.64)
  // 中心留白让 BLOG 标题成为涡轮的轴心。
  const innerRadius = outerRadius * 0.2
  // 八片叶片形成稳定对称关系，同时保留足够负空间。
  const bladeCount = 8
  // 三列并行方块组成宽幅叶片，不再出现单列点状轨迹。
  const bladeTrackCount = 3
  // 沿半径的采样数量根据图案尺寸自适应，保证叶片连续。
  const bladeStepCount = Math.max(18, Math.ceil((outerRadius - innerRadius) / (cellSize * 0.82)))
  // GSAP 相位统一驱动涡轮旋转和沿叶片颜色流动。
  const phase = fieldState.phase * Math.PI * 2
  // 预计算连续颜色轮，避免每个方块只在四种颜色之间生硬跳变。
  const colorWheel = Array.from({ length: 32 }, (_, index) => (
    gsap.utils.interpolate([...fieldColors, fieldColors[0]], index / 31)
  ))

  for (let bladeIndex = 0; bladeIndex < bladeCount; bladeIndex += 1) {
    // 每片叶片从等分角度出发，整体保持严格的八向秩序。
    const bladeOrigin = bladeIndex / bladeCount * Math.PI * 2
    // 整体旋转幅度由时间和滚动共同驱动，形成明显的长距离运动。
    const rotation = phase * 0.22 + fieldState.scroll * 1.45

    for (let stepIndex = 0; stepIndex <= bladeStepCount; stepIndex += 1) {
      // 归一化进度用于同时控制半径、弯曲程度和颜色流动。
      const progress = stepIndex / bladeStepCount
      // 叶片从轴心外缘连续伸展到转子边界。
      const radius = innerRadius + (outerRadius - innerRadius) * progress
      // 外端弯曲更明显，形成统一方向的机械涡旋。
      const angle = bladeOrigin + rotation + progress * 1.18
      // 颜色沿叶片和叶片序号连续错开，形成稳定的旋转色流。
      const colorProgress = ((progress * 0.52 + bladeIndex / bladeCount + fieldState.phase * 0.62) % 1 + 1) % 1
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

  // 轴环使用反向旋转，把 BLOG 标题与外侧叶片连接成一个完整机械主体。
  const hubRadius = innerRadius * 0.78
  // 轴环方块数量根据周长计算，确保不同屏幕下间距一致。
  const hubBlockCount = Math.max(20, Math.round(Math.PI * 2 * hubRadius / (cellSize * 1.08)))

  for (let blockIndex = 0; blockIndex < hubBlockCount; blockIndex += 1) {
    // 每五格留出一格缺口，形成稳定节拍而不是完整实线圆环。
    if (blockIndex % 5 === 4) {
      continue
    }

    // 轴环与叶片反向旋转，增强中心机械咬合感。
    const angle = blockIndex / hubBlockCount * Math.PI * 2 - phase * 0.32 - fieldState.scroll
    // 轴环颜色沿圆周持续流动，并与外侧叶片共享同一颜色轮。
    const colorProgress = ((blockIndex / hubBlockCount + fieldState.phase * 0.8) % 1 + 1) % 1
    // 颜色轮索引保持稳定，避免轴环出现随机闪烁。
    const colorIndex = Math.min(colorWheel.length - 1, Math.floor(colorProgress * colorWheel.length))
    // 轴环横坐标沿中心圆周计算。
    const x = centerX + Math.cos(angle) * hubRadius - cellSize / 2
    // 轴环纵坐标与横坐标共享同一角度。
    const y = centerY + Math.sin(angle) * hubRadius - cellSize / 2

    context.globalAlpha = 0.44
    context.fillStyle = colorWheel[colorIndex]
    context.fillRect(
      Math.round(x) + gap / 2,
      Math.round(y) + gap / 2,
      cellSize - gap,
      cellSize - gap,
    )
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

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = false

  // 单一大型转子承担全部背景视觉，不叠加粒子、logo 或额外装饰块。
  drawPixelRotor(context, width, height, pixelUnit)

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
  const section = document.querySelector<HTMLElement>('#blog')
  const canvas = fieldCanvas.value

  if (!section || !canvas) {
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  animationContext = gsap.context(() => {
    // 左侧文章舱保留真实列表，右侧只展示单一 BLOG 标题。
    const contentTargets = section.querySelectorAll<HTMLElement>('.blog-heading, .blog-window')
    const cardTargets = section.querySelectorAll<HTMLElement>('.blog-row')
    // Canvas 进入视口时才允许推进相位，避免后台持续消耗资源。
    const phaseTween = gsap.to(fieldState, {
      phase: 1,
      duration: 28,
      repeat: -1,
      ease: 'none',
      onUpdate: () => drawField(context),
    })

    // 标题和列表保持可见，避免锚点直达时等待 ScrollTrigger 导致内容消失。
    gsap.set(contentTargets, { autoAlpha: 1 })
    gsap.set(section.querySelector('.blog-heading'), { x: 120, y: 88, scale: 0.82, rotation: -3 })
    gsap.set(section.querySelector('.blog-window'), { x: -96, y: 56, scale: 0.92 })
    gsap.set(cardTargets, { x: -48, y: 42, autoAlpha: 0.72 })
    gsap.set(canvas, { autoAlpha: 1, scale: 1.14, rotation: 1.5 })

    const introTimeline = gsap.timeline({ paused: true })

    introTimeline
      .to(canvas, {
        scale: 1,
        rotation: 0,
        duration: 1.12,
        ease: 'steps(7)',
      }, 0)
      .to(contentTargets, {
        y: 0,
        x: 0,
        scale: 1,
        rotation: 0,
        duration: 1.18,
        stagger: 0.12,
        ease: 'back.out(1.8)',
      }, 0.12)
      .to(cardTargets, {
        x: 0,
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.16,
        ease: 'back.out(1.65)',
      }, 0.36)

    // 页面滚动只改变整张像素场的重组程度，不产生层间错位。
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (trigger) => {
        fieldState.scroll = trigger.progress
        drawField(context)
      },
      onEnter: () => introTimeline.play(0),
      onEnterBack: () => introTimeline.play(0),
    })

    // 只在 Canvas 进入视口时推进循环动画。
    visibilityObserver = new IntersectionObserver(([entry]) => {
      const visible = Boolean(entry?.isIntersecting)
      phaseTween.paused(!visible)
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
  display: block;
  width: min(100%, 580px);
  font-size: clamp(92px, 10vw, 168px);
  line-height: 0.86;
}

.blog-heading__title :deep(canvas) {
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

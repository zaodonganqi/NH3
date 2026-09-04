<template>
  <section
    :id="homeSections.project.id"
    ref="sectionRef"
    class="content-section project-section"
  >
    <div class="project-backdrop" aria-hidden="true">
      <i v-for="index in 18" :key="index"></i>
    </div>

    <div ref="trackRef" class="project-track">
      <div class="project-intro">
        <PixelSectionHeading
          class="project-heading"
          :title="homeSections.project.title"
          :density="14"
        />
      </div>

      <article
        v-for="(item, index) in projectItems"
        :key="item.id"
        class="project-slide"
        :class="{ 'project-slide--first': index === 0 }"
        :style="{
          '--project-accent': item.accent,
          '--project-secondary': item.secondary,
        }"
      >
        <PixelText
          class="project-slide__number"
          :text="item.index"
          :density="10"
          :color="item.secondary"
        />

        <PixelLinkCard
          class="project-window"
          :item="item"
        />

        <div class="project-slide__pixels" aria-hidden="true">
          <i v-for="pixel in 7" :key="pixel"></i>
        </div>
      </article>

      <div class="project-end" aria-hidden="true">
        <span></span>
        <span>{{ homeSections.project.nextLabel }}</span>
        <span>{{ homeSections.tool.title }}</span>
      </div>
    </div>

    <div class="project-progress" aria-hidden="true">
      <i><b ref="progressRef"></b></i>
      <span>项目 {{ String(currentProjectIndex + 1).padStart(2, '0') }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { homeSections, projectItems } from '../../../config/home'
import { PixelText } from '../../base/pixel'
import PixelLinkCard from './PixelLinkCard.vue'
import PixelSectionHeading from './PixelSectionHeading.vue'

gsap.registerPlugin(ScrollTrigger)

// 横向场景至少推进到该比例后，反向滚动才会被识别为真实回看操作。
const PROJECT_REVIEW_PROGRESS_THRESHOLD = 0.015
// 连续反向滚动累计达到该距离后才跳过入场动画，过滤 pin 校正和触控板回弹。
const PROJECT_REVIEW_DISTANCE_THRESHOLD = 12

// Project 根节点既是固定场景，也是横向滚动距离的测量边界。
const sectionRef = ref<HTMLElement | null>(null)
// 横向轨道承载标题、项目卡和结束标记，并由滚动进度统一移动。
const trackRef = ref<HTMLElement | null>(null)
// 底部像素进度条显示整个横向项目流的推进比例。
const progressRef = ref<HTMLElement | null>(null)
// 当前项目索引与横向轨道中最接近视口中心的卡片保持一致。
const currentProjectIndex = ref(0)
// GSAP 媒体查询负责在桌面、移动端和减少动态模式之间正确回收状态。
let projectMedia: ReturnType<typeof gsap.matchMedia> | undefined

// 组件挂载后只为桌面且允许动态效果的环境创建横向固定场景。
onMounted(async () => {
  await nextTick()

  projectMedia = gsap.matchMedia()
  projectMedia.add(
    {
      desktop: '(min-width: 821px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      // 当前媒体条件决定是否启用需要 pin 的完整横向叙事。
      const conditions = context.conditions as {
        desktop: boolean
        reduceMotion: boolean
      }
      // 场景元素必须完整存在后才能测量轨道并建立 ScrollTrigger。
      const section = sectionRef.value
      // 轨道宽度决定纵向滚动需要映射的水平距离。
      const track = trackRef.value
      // 进度条与主轨道共享同一条 GSAP 时间线。
      const progress = progressRef.value

      if (!conditions.desktop || conditions.reduceMotion || !section || !track || !progress) {
        return
      }

      // 每张项目幻灯片在进入视口时拥有独立的像素阶梯入场过程。
      const slides = gsap.utils.toArray<HTMLElement>('.project-slide', section)
      // 背景方块使用较慢位移制造与项目轨道不同速的空间层次。
      const backdropPixels = gsap.utils.toArray<HTMLElement>('.project-backdrop i', section)
      // 背景网格作为单一合成层参与轻微视差，不逐帧改写十八个像素节点。
      const projectBackdrop = section.querySelector<HTMLElement>('.project-backdrop')
      // 一次性入场动画在用户开始回看时会立即完成，避免继续占用回滚时长。
      const forwardOnlyAnimations: gsap.core.Animation[] = []
      // 每张项目卡对应的装配动画由主横向进度统一调度，不再维护独立 ScrollTrigger 状态。
      const slideAnimationMap = new Map<HTMLElement, gsap.core.Animation[]>()
      // 刷新时缓存每张卡的进入阈值，滚动更新不再读取 offsetLeft 触发布局测量。
      const slideEntryProgressMap = new Map<HTMLElement, number>()
      // 已启动卡片集合避免每帧查询多条子时间线的 progress 状态。
      const activatedSlides = new Set<HTMLElement>()
      // 上一次真实页面滚动坐标用于区分用户回滚与 ScrollTrigger 内部状态刷新。
      let lastHorizontalScroll = window.scrollY
      // 连续反向滚动距离只有达到阈值后才进入回看模式。
      let pendingReverseDistance = 0
      // 回看模式下所有卡片保持完成态，直到 Project 完全离开视口后才解除。
      let isReviewing = false
      // 缓存的横向移动距离只在 ScrollTrigger 刷新时重算。
      let cachedTravelDistance = 1
      // 缓存的纵向映射距离避免 onUpdate 期间触发布局读取。
      let cachedScrollDistance = window.innerHeight * 2.8
      // 每张卡片进入视口中心时对应的主时间线进度只在刷新阶段测量。
      let slideFocusProgress: number[] = []
      // 滚动停止计时器用于恢复卡片 hover，运动期间避免阴影反复重绘。
      let hoverResumeCall: gsap.core.Tween | undefined

      /**
       * 在创建或刷新 ScrollTrigger 时一次性缓存轨道宽度与卡片进入阈值。
       */
      const measureProjectGeometry = () => {
        cachedTravelDistance = Math.max(1, track.scrollWidth - window.innerWidth)
        cachedScrollDistance = Math.max(
          window.innerHeight * 2.8,
          cachedTravelDistance * 1.22,
        )
        slideFocusProgress = slides.map((slide) => gsap.utils.clamp(
          0,
          1,
          (slide.offsetLeft + slide.offsetWidth / 2 - window.innerWidth / 2)
            / cachedTravelDistance,
        ))

        for (const slide of slides) {
          slideEntryProgressMap.set(
            slide,
            gsap.utils.clamp(
              0,
              1,
              (slide.offsetLeft - window.innerWidth * 0.88) / cachedTravelDistance,
            ),
          )
        }
      }

      /**
       * 标记横向场景正在滚动，并在输入停止后恢复全部 hover 反馈。
       */
      const markProjectScrolling = () => {
        section.classList.add('project-section--scrolling')

        if (hoverResumeCall) {
          hoverResumeCall.restart(true)
          return
        }

        hoverResumeCall = gsap.delayedCall(0.16, () => {
          section.classList.remove('project-section--scrolling')
        })
      }

      /**
       * 只在 Project 固定场景活动时运行背景像素的局部信号动画。
       */
      const syncProjectActivity = (trigger: ScrollTrigger) => {
        section.classList.toggle('project-section--active', trigger.isActive)
      }

      /**
       * 把卡片的外框、内容和碎片动画登记到同一个项目节点下。
       */
      const registerSlideAnimation = (
        slide: HTMLElement,
        animation: gsap.core.Animation,
      ) => {
        const animations = slideAnimationMap.get(slide) ?? []
        animations.push(animation)
        slideAnimationMap.set(slide, animations)
      }

      /**
       * 首次检测到明确的反向滚动后立即完成入场动画，后续回看只更新横向位置。
       */
      const handleHorizontalUpdate = (trigger: ScrollTrigger) => {
        // 当前真实滚动坐标用于排除 pin 建立过程中产生的方向抖动。
        const currentScroll = trigger.scroll()
        // 与上一帧的滚动差值决定本轮属于前进、静止还是反向。
        const scrollDelta = currentScroll - lastHorizontalScroll
        // 与当前横向进度最接近的卡片决定底部真实索引。
        const activeIndex = slideFocusProgress.reduce((closestIndex, focusProgress, index) => (
          Math.abs(focusProgress - trigger.progress)
            < Math.abs((slideFocusProgress[closestIndex] ?? 0) - trigger.progress)
            ? index
            : closestIndex
        ), 0)

        currentProjectIndex.value = activeIndex

        if (scrollDelta < 0) {
          pendingReverseDistance += Math.abs(scrollDelta)
        } else if (scrollDelta > 0) {
          pendingReverseDistance = 0
        }

        if (scrollDelta !== 0) {
          markProjectScrolling()
        }

        // 只有进入场景并形成明确反向距离后，才立即完成动画进入回看状态。
        const shouldEnterReview = !isReviewing
          && trigger.progress >= PROJECT_REVIEW_PROGRESS_THRESHOLD
          && pendingReverseDistance >= PROJECT_REVIEW_DISTANCE_THRESHOLD

        if (shouldEnterReview) {
          for (const animation of forwardOnlyAnimations) {
            animation.progress(1).pause()
          }

          slides.forEach((slide) => activatedSlides.add(slide))
          isReviewing = true
        }

        if (scrollDelta > 0 && !isReviewing) {
          for (const slide of slides) {
            if (activatedSlides.has(slide)) {
              continue
            }

            // 刷新阶段缓存的阈值让当前分支只做数值比较，不触发布局。
            const entryProgress = slideEntryProgressMap.get(slide) ?? 1

            if (trigger.progress < entryProgress) {
              continue
            }

            for (const animation of slideAnimationMap.get(slide) ?? []) {
              animation.play()
            }

            activatedSlides.add(slide)
          }
        }

        lastHorizontalScroll = currentScroll
      }

      /**
       * Project 完全离开上边界后统一归零，下次向前进入时重新播放全部入场动画。
       */
      const resetForwardAnimations = () => {
        for (const animation of forwardOnlyAnimations) {
          animation.progress(0).pause()
        }

        // 下一次正向进入从当前真实滚动坐标重新采样，不继承上一轮回看距离。
        lastHorizontalScroll = window.scrollY
        pendingReverseDistance = 0
        isReviewing = false
        activatedSlides.clear()
      }

      // 大标题 Canvas 在 Project 接近视口时执行独立的像素切入。
      const introTitle = section.querySelector<HTMLElement>('.project-heading h2')
      // 标题下方彩色像素轨依次装配，而不是随标题整体淡入。
      const introRailPixels = gsap.utils.toArray<HTMLElement>('.project-heading span i', section)

      if (introTitle) {
        // 标题节点在进入视口前就固定为起始态，避免首次触发时从默认可见状态闪回。
        gsap.set(introTitle, {
          autoAlpha: 0,
          x: -280,
          y: 104,
        })
        gsap.set(introRailPixels, {
          autoAlpha: 0,
          y: 52,
          scale: 0,
        })

        // 标题时间线发生在 pin 之前，把 Hero 到 Project 的过渡变成完整入场段落。
        const introTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 52%',
            end: 'top top',
            toggleActions: 'play none none none',
            fastScrollEnd: true,
          },
        })

        introTimeline
          .to(introTitle, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: 'expo.out',
          }, 0.08)
          .to(introRailPixels, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.055,
            ease: 'power3.out',
          }, 0.46)

        forwardOnlyAnimations.push(introTimeline)
      }

      /**
       * 计算轨道超出视口的真实宽度，窗口变化后由 ScrollTrigger 重新读取。
       */
      const getTravelDistance = () => cachedTravelDistance

      /**
       * 给卡片入场留出足够滚动距离，同时避免超宽屏下横向移动过快。
       */
      const getScrollDistance = () => cachedScrollDistance

      measureProjectGeometry()

      // 主时间线把纵向滚动映射为横向轨道、进度条和背景像素的同步变化。
      const horizontalTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          pin: true,
          scrub: 0.22,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measureProjectGeometry,
          onRefresh: measureProjectGeometry,
          onEnter: handleHorizontalUpdate,
          onUpdate: handleHorizontalUpdate,
          onToggle: syncProjectActivity,
        },
      })

      horizontalTimeline
        .to(track, {
          x: () => -getTravelDistance(),
          duration: 1,
          ease: 'none',
        }, 0)
        .fromTo(progress, {
          scaleX: 0,
        }, {
          scaleX: 1,
          duration: 1,
          ease: 'none',
          transformOrigin: 'left center',
        }, 0)

      if (projectBackdrop) {
        horizontalTimeline.to(projectBackdrop, {
          xPercent: -2.2,
          yPercent: -1.2,
          scale: 1.035,
          force3D: true,
          duration: 1,
          ease: 'none',
        }, 0)
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        onLeaveBack: resetForwardAnimations,
      })
      // 背景像素只在进入时播放一次，不再跟随每一帧滚动重新计算。
      const backdropAnimation = gsap.fromTo(backdropPixels, {
        x: 0,
        y: 0,
      }, {
        x: 72,
        y: -36,
        duration: 0.82,
        ease: 'power3.out',
        stagger: {
          each: 0.016,
          from: 'end',
        },
        scrollTrigger: {
          trigger: section,
          start: 'top 92%',
          end: 'bottom top',
          toggleActions: 'play none none none',
          fastScrollEnd: true,
        },
      })

      forwardOnlyAnimations.push(backdropAnimation)

      for (const [index, slide] of slides.entries()) {
        // 相邻卡片使用相反的水平轨迹，避免三组装配动画只是在重复同一方向。
        const horizontalDirection = index % 2 === 0 ? 1 : -1
        // 第二张卡从上方压入，第一和第三张从下方托入。
        const verticalDirection = index === 1 ? -1 : 1
        // 超大编号、卡体、图标和文本分别拥有独立的装配轨迹。
        const slideNumber = slide.querySelector<HTMLElement>('.project-slide__number')
        // 实际项目入口卡片在外层框体到位后展开。
        const slideWindow = slide.querySelector<HTMLElement>('.project-window')
        // 卡片图标从标题的反方向撞入，形成两股运动交汇。
        const slideIcon = slide.querySelector<HTMLElement>('.pixel-link-card__icon')
        // 项目名称是卡片内部最后稳定的主要标签。
        const slideTitle = slide.querySelector<HTMLElement>('.pixel-link-card__body strong')
        // 项目摘要与标题使用相邻节奏进入，避免卡体中只剩孤立文本。
        const slideSummary = slide.querySelector<HTMLElement>('.pixel-link-card__body p')
        // 卡片周围的小像素在卡片稳定后向外展开，强化纯像素冲击感。
        const slidePixels = gsap.utils.toArray<HTMLElement>('.project-slide__pixels i', slide)
        // 每张卡都拥有编号、卡体、图标和标题装配时间线。
        const detailTimeline = gsap.timeline({
          paused: true,
          defaults: { force3D: true },
        })

        if (slideNumber) {
          gsap.set(slideNumber, {
            autoAlpha: 0,
            x: 380 * horizontalDirection,
            y: index === 2 ? 280 : -280,
          })
          detailTimeline.to(slideNumber, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.95,
            ease: 'expo.out',
          }, 0)
        }

        if (slideWindow) {
          gsap.set(slideWindow, {
            autoAlpha: 0,
            x: 120 * horizontalDirection,
            y: 72 * verticalDirection,
          })
          detailTimeline.to(slideWindow, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.74,
            ease: 'power4.out',
          }, 0.08)
        }

        if (slideIcon) {
          gsap.set(slideIcon, {
            autoAlpha: 0,
            x: -150 * horizontalDirection,
            y: 90 * verticalDirection,
            scale: 0.35,
          })
          detailTimeline.to(slideIcon, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: 'power4.out',
          }, 0.12)
        }

        if (slideTitle) {
          gsap.set(slideTitle, {
            autoAlpha: 0,
            x: 180 * horizontalDirection,
          })
          detailTimeline.to(slideTitle, {
            autoAlpha: 1,
            x: 0,
            duration: 0.54,
            ease: 'power3.out',
          }, 0.18)
        }

        if (slideSummary) {
          gsap.set(slideSummary, {
            autoAlpha: 0,
            x: 120 * horizontalDirection,
          })
          detailTimeline.to(slideSummary, {
            autoAlpha: 1,
            x: 0,
            duration: 0.48,
            ease: 'power3.out',
          }, 0.23)
        }

        // 卡片与碎片在 ScrollTrigger 建立前先写入起始态，首次播放不会闪回默认布局。
        gsap.set(slide, {
          autoAlpha: 0,
          y: 220 * verticalDirection,
        })
        gsap.set(slidePixels, {
          autoAlpha: 0,
          x: 0,
          y: 0,
          scale: 0,
        })

        // 卡片主体只向前播放；反向时由主触发器直接完成并冻结。
        const slideAnimation = gsap.to(slide, {
          autoAlpha: 1,
          y: 0,
          duration: 0.74,
          ease: 'power4.out',
          paused: true,
          onStart: () => gsap.set(slide, { willChange: 'transform,opacity' }),
          onComplete: () => gsap.set(slide, { willChange: 'auto' }),
        })

        // 卡片碎片使用独立动画，便于反向时与卡体一起立即结束。
        const pixelAnimation = gsap.to(slidePixels, {
          autoAlpha: 1,
          x: 64 * horizontalDirection,
          y: -40 * verticalDirection,
          scale: 1,
          duration: 0.56,
          stagger: 0.045,
          ease: 'power3.out',
          paused: true,
        })

        forwardOnlyAnimations.push(detailTimeline, slideAnimation, pixelAnimation)
        registerSlideAnimation(slide, detailTimeline)
        registerSlideAnimation(slide, slideAnimation)
        registerSlideAnimation(slide, pixelAnimation)
      }

      return () => {
        hoverResumeCall?.kill()
        section.classList.remove('project-section--active')
        section.classList.remove('project-section--scrolling')
      }
    },
  )
})

// 组件离开页面时恢复 pin、transform 和媒体查询创建的全部动画状态。
onUnmounted(() => {
  projectMedia?.revert()
})
</script>

<style scoped>
.project-section {
  height: 100vh;
  min-height: 100vh;
  padding: 0;
  isolation: isolate;
  overflow: hidden;
  background: #ffffff;
}

.project-backdrop {
  position: absolute;
  z-index: -1;
  inset: -4%;
  overflow: hidden;
  background:
    repeating-linear-gradient(90deg, transparent 0 47px, #f1f4fb 47px 48px),
    repeating-linear-gradient(180deg, transparent 0 47px, #f1f4fb 47px 48px);
  will-change: transform;
}

.project-backdrop i {
  position: absolute;
  width: clamp(18px, 1.5vw, 28px);
  aspect-ratio: 1;
  background: #dfe7f8;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.project-backdrop i::before,
.project-backdrop i::after {
  position: absolute;
  content: '';
  pointer-events: none;
}

.project-backdrop i::before {
  inset: 4px;
  border: 2px solid rgb(255 255 255 / 72%);
  box-shadow: inset 3px 3px 0 rgb(255 255 255 / 26%);
}

.project-backdrop i::after {
  right: 3px;
  bottom: 3px;
  width: 6px;
  height: 6px;
  background: #ffffff;
  opacity: 0.42;
  scale: 0.72;
}

.project-section--active .project-backdrop i::after {
  animation: project-backdrop-signal 1.8s steps(4, end) infinite;
}

.project-section--active .project-backdrop i:nth-child(3n + 2)::after {
  animation-delay: -0.6s;
  animation-duration: 2.2s;
}

.project-section--active .project-backdrop i:nth-child(3n)::after {
  animation-delay: -1.2s;
  animation-duration: 2.6s;
}

@keyframes project-backdrop-signal {
  0%,
  100% { opacity: 0.26; scale: 0.62; translate: 0 0; }
  50% { opacity: 0.82; scale: 1; translate: -4px -4px; }
}

.project-backdrop i:nth-child(4n + 1) { background: #b7e4e6; }
.project-backdrop i:nth-child(4n + 2) { background: #f3cfad; }
.project-backdrop i:nth-child(4n + 3) { background: #e8c3dd; }
.project-backdrop i:nth-child(1) { top: 12%; left: 8%; }
.project-backdrop i:nth-child(2) { top: 78%; left: 13%; }
.project-backdrop i:nth-child(3) { top: 22%; left: 23%; }
.project-backdrop i:nth-child(4) { top: 64%; left: 31%; }
.project-backdrop i:nth-child(5) { top: 9%; left: 39%; }
.project-backdrop i:nth-child(6) { top: 84%; left: 47%; }
.project-backdrop i:nth-child(7) { top: 29%; left: 55%; }
.project-backdrop i:nth-child(8) { top: 69%; left: 63%; }
.project-backdrop i:nth-child(9) { top: 15%; left: 72%; }
.project-backdrop i:nth-child(10) { top: 83%; left: 80%; }
.project-backdrop i:nth-child(11) { top: 34%; left: 88%; }
.project-backdrop i:nth-child(12) { top: 57%; left: 94%; }
.project-backdrop i:nth-child(13) { top: 43%; left: 17%; }
.project-backdrop i:nth-child(14) { top: 73%; left: 39%; }
.project-backdrop i:nth-child(15) { top: 18%; left: 61%; }
.project-backdrop i:nth-child(16) { top: 52%; left: 76%; }
.project-backdrop i:nth-child(17) { top: 38%; left: 48%; }
.project-backdrop i:nth-child(18) { top: 61%; left: 5%; }

.project-track {
  display: flex;
  width: max-content;
  height: 100%;
  padding: 0 max(56px, 8vw);
  gap: clamp(88px, 9vw, 180px);
  align-items: center;
  will-change: transform;
}

.project-intro {
  width: clamp(420px, 41vw, 760px);
  flex: none;
}

.project-heading {
  width: min(100%, 680px);
}

.project-slide {
  position: relative;
  display: grid;
  width: clamp(620px, 58vw, 1040px);
  height: min(68vh, 720px);
  min-height: 500px;
  flex: none;
  padding: clamp(54px, 6vw, 94px);
  place-items: center;
  border: 1px solid #c7d3ea;
  background: #ffffff;
  box-shadow: 20px 20px 0 #e9eef9;
  transition:
    border-color var(--motion-fast) ease,
    box-shadow var(--motion-medium) var(--motion-step);
}

.project-section--scrolling .project-slide,
.project-section--scrolling .pixel-link-card {
  pointer-events: none;
}

.project-section--scrolling .project-slide,
.project-section--scrolling .project-slide::before,
.project-section--scrolling .project-slide::after,
.project-section--scrolling .pixel-link-card,
.project-section--scrolling .pixel-link-card__icon,
.project-section--scrolling .pixel-link-card__arrow {
  transition: none !important;
}

.project-slide::before,
.project-slide::after {
  position: absolute;
  width: 22%;
  height: 12px;
  content: "";
  background: repeating-linear-gradient(90deg, var(--project-accent) 0 12px, color-mix(in srgb, var(--project-accent) 38%, #ffffff) 12px 18px);
  background-position: 0 0;
  box-shadow: inset 0 0 0 1px #ffffff;
  transition: background-position var(--motion-medium) var(--motion-step);
}

.project-slide::before {
  top: -6px;
  left: 8%;
}

.project-slide::after {
  right: 8%;
  bottom: -6px;
}

.project-slide__number {
  position: absolute;
  top: -8%;
  right: 4%;
  width: clamp(190px, 19vw, 340px);
  color: #dfe7f8;
  font-size: clamp(120px, 15vw, 260px);
  line-height: 1;
  pointer-events: none;
}

.project-window {
  z-index: 1;
  width: min(100%, 760px);
  min-height: 320px;
}

.project-window :deep(.pixel-link-card__body) {
  padding: clamp(28px, 4vw, 54px);
  grid-template-columns: clamp(92px, 9vw, 142px) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 54px);
}

.project-window :deep(.pixel-link-card__icon) {
  width: clamp(92px, 9vw, 142px);
}

.project-window :deep(.pixel-link-card__body strong) {
  font-size: clamp(18px, 1.7vw, 28px);
}

.project-window :deep(.pixel-link-card__body p) {
  font-size: clamp(11px, 0.9vw, 15px);
}

.project-slide__pixels {
  position: absolute;
  right: 8%;
  bottom: 8%;
  display: grid;
  grid-template-columns: repeat(4, 14px);
  gap: 4px;
  transition: filter var(--motion-fast) ease;
}

.project-slide__pixels i {
  position: relative;
  width: 14px;
  aspect-ratio: 1;
  background: #657fe2;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.project-slide__pixels i::before {
  position: absolute;
  inset: 3px;
  content: '';
  background: rgb(255 255 255 / 72%);
  opacity: 0.56;
  scale: 0.64;
}

.project-section--active .project-slide__pixels i::before {
  animation: project-fragment-signal 1.5s steps(3, end) infinite;
}

.project-section--active .project-slide__pixels i:nth-child(3n + 2)::before {
  animation-delay: -0.5s;
}

.project-section--active .project-slide__pixels i:nth-child(3n)::before {
  animation-delay: -1s;
}

@keyframes project-fragment-signal {
  0%,
  100% { opacity: 0.34; scale: 0.48; }
  50% { opacity: 0.88; scale: 1; }
}

.project-slide__pixels i:nth-child(3n + 2) { background: #65c9c4; }
.project-slide__pixels i:nth-child(3n) { background: #eda5cb; }

.project-end {
  display: grid;
  width: clamp(220px, 20vw, 360px);
  flex: none;
  gap: 14px;
  color: #657fe2;
  font-size: clamp(28px, 4vw, 68px);
  font-weight: 800;
}

.project-end span:first-child {
  width: 96px;
  height: 12px;
  background: repeating-linear-gradient(90deg, #657fe2 0 8px, transparent 8px 12px);
}

.project-progress {
  position: absolute;
  z-index: 4;
  right: max(28px, 4vw);
  bottom: 28px;
  left: max(28px, 4vw);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  color: #68799e;
  font-size: 10px;
  font-weight: 800;
}

.project-progress > i {
  position: relative;
  height: 10px;
  padding: 2px;
  border: 1px solid #bac8e4;
  background: #ffffff;
}

.project-progress b {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(90deg, #657fe2 0 8px, #65c9c4 8px 16px, #eda5cb 16px 24px);
  transform: scaleX(0);
  transform-origin: left center;
}

.project-progress b::after {
  position: absolute;
  top: -4px;
  right: -5px;
  width: 7px;
  height: 14px;
  content: '';
  background: #ffffff;
  border: 2px solid #657fe2;
  box-shadow: 4px 4px 0 rgb(101 127 226 / 16%);
}

.project-end span:first-child {
  transition: background-position var(--motion-medium) var(--motion-step);
}

.project-end:hover span:first-child {
  background-position: 12px 0;
}

@media (hover: hover) and (pointer: fine) {
  .project-slide:hover {
    border-color: color-mix(in srgb, var(--project-accent) 58%, #c7d3ea);
    box-shadow: 24px 24px 0 #e5ebf8;
  }

  .project-slide:hover::before,
  .project-slide:hover::after {
    background-position: 18px 0;
  }

  .project-slide:hover .project-slide__pixels {
    filter: drop-shadow(5px 5px 0 rgb(101 127 226 / 12%));
  }
}

@media (max-width: 1100px) {
  .project-slide {
    width: 68vw;
    min-width: 600px;
  }
}

@media (max-width: 820px), (prefers-reduced-motion: reduce) {
  .project-section {
    height: auto;
    min-height: 100vh;
    padding: 78px 28px;
    overflow: hidden;
  }

  .project-track {
    display: grid;
    width: 100%;
    height: auto;
    padding: 0;
    gap: 42px;
    transform: none !important;
  }

  .project-intro,
  .project-slide,
  .project-end {
    width: 100%;
    min-width: 0;
  }

  .project-slide {
    height: auto;
    min-height: 420px;
    padding: 64px 28px 40px;
    opacity: 1 !important;
    transform: none !important;
  }

  .project-slide__number {
    top: 2%;
    width: 160px;
    font-size: 112px;
  }

  .project-slide__pixels,
  .project-end,
  .project-progress {
    display: none;
  }
}

@media (max-width: 480px) {
  .project-section {
    padding: 68px 22px;
  }

  .project-slide {
    min-height: 360px;
    padding: 54px 14px 28px;
    box-shadow: 10px 10px 0 #e9eef9;
  }

  .project-window {
    min-height: 240px;
  }

  .project-window :deep(.pixel-link-card__body) {
    padding: 20px;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 16px;
  }

  .project-window :deep(.pixel-link-card__icon) {
    width: 64px;
  }

  .project-window :deep(.pixel-link-card__body strong) {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-backdrop i::after,
  .project-slide__pixels i::before {
    animation: none;
  }

  .project-slide,
  .project-slide::before,
  .project-slide::after,
  .project-slide__pixels {
    transition: none;
  }
}
</style>

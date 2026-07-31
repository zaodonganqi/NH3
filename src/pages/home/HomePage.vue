<template>
  <main class="site-frame">
    <SiteHeader
      :active-section="activeSection"
      @navigate="scrollToSection"
    />
    <HeroSection @navigate="scrollToSection" />
    <ProjectSection />
    <ToolSection
      @activate="activateToolSection"
      @leave-forward="activateBlogSection"
    />
    <BlogSection />
    <AboutSection />
    <SiteFooter />
  </main>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  AboutSection,
  BlogSection,
  HeroSection,
  ProjectSection,
  ToolSection,
} from '../../components/home'
import { SiteFooter, SiteHeader } from '../../components/site'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// 首页导航对应的真实章节顺序，也是 ScrollTrigger 建立判定区间的稳定来源。
const sectionIds = ['home', 'project', 'tool', 'blog', 'about'] as const

/**
 * 限制首页滚动状态只能指向实际存在的章节。
 */
type HomeSectionId = (typeof sectionIds)[number]

// 当前越过视口判定线的章节决定 Header 选中项。
const activeSection = ref<HomeSectionId>('home')

// 保存首页 GSAP 上下文，页面卸载时统一回收动画和 ScrollTrigger。
let animationContext: gsap.Context | undefined

// 页面挂载后建立 GSAP 章节判定与内容入场动效。
onMounted(async () => {
  await nextTick()

  // GSAP 上下文统一管理章节判定、入场动画和内部 ScrollTrigger。
  animationContext = gsap.context(() => {
    createSectionScrollTracking()
    createScrollCueFade()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    // 首屏时间线只负责真实页面内容的统一入场。
    const intro = gsap.timeline({ defaults: { ease: 'steps(6)' } })

    intro
      .set('.site-frame', { autoAlpha: 1 })
      .fromTo(
        '.intro-piece',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08, snap: { y: 4 } },
      )

    // 章节集合包含所有需要滚动触发入场效果的首页区域。
    const sections = gsap.utils.toArray<HTMLElement>('.reveal-section')

    // 章节回调只选择当前区域内部需要入场的直接视觉内容。
    sections.forEach((section) => {
      // 当前章节参与滚动入场的直接视觉节点。
      const targets = section.querySelectorAll(
        '.blog-heading, .blog-row, .about-heading, .about-entry',
      )

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.09,
          ease: 'steps(7)',
          snap: { y: 4 },
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: 'bottom 18%',
            toggleActions: 'play reverse play reverse',
          },
        },
      )
    })
  }, document.body)

  ScrollTrigger.refresh()
})

// 页面卸载时恢复 GSAP 状态并销毁章节判定触发器。
onUnmounted(() => {
  animationContext?.revert()
})

/**
 * 使用 GSAP ScrollTrigger 在固定视口判定线上同步当前章节。
 */
function createSectionScrollTracking() {
  for (const sectionId of sectionIds) {
    // 当前标识对应的真实章节节点用于建立独立滚动区间。
    const section = document.getElementById(sectionId)

    if (!section) {
      continue
    }

    /**
     * 当前章节进入判定区间时同步 Header 状态和颜色。
     */
    const activateSection = () => {
      activeSection.value = sectionId
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onEnter: activateSection,
      onEnterBack: activateSection,
    })
  }
}

/**
 * 让 Scroll Down 在离开首屏顶部后随滚动逐渐隐藏。
 */
function createScrollCueFade() {
  // 独立内层避免滚动渐隐覆盖首屏入场写入的根节点 transform。
  const cue = document.querySelector<HTMLElement>('.scroll-cue__motion')
  // 首页 section 为渐隐 ScrollTrigger 提供稳定的滚动起点。
  const hero = document.getElementById('home')

  if (!cue || !hero) {
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 95%',
      end: 'max',
      toggleClass: {
        targets: cue,
        className: 'scroll-cue__motion--hidden',
      },
    })
    return
  }

  gsap.to(cue, {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom 35%',
      scrub: 0.6,
    },
  })
}

/**
 * TOOL 固定滚动场景活动时保持顶部导航选中项正确。
 */
function activateToolSection() {
  activeSection.value = 'tool'
}

/**
 * TOOL 正向离开固定场景后立即切换到 BLOG 导航状态。
 */
function activateBlogSection() {
  activeSection.value = 'blog'
}

/**
 * 使用连续 GSAP 缓动滚动到首页锚点，并立即同步 Header 选中项。
 */
function scrollToSection(event: MouseEvent, sectionId?: string) {
  // 当前触发导航的锚点提供目标 hash。
  const anchor = event.currentTarget as HTMLAnchorElement
  // 目标章节缺失时保留浏览器默认行为。
  const target = document.querySelector<HTMLElement>(anchor.hash)

  if (!target) {
    return
  }

  // 请求标识必须匹配首页真实章节，外部入口不会进入该分支。
  const requestedSectionId = sectionId ?? target.id
  // 查找到的稳定标识用于更新受限的首页章节状态。
  const resolvedSectionId = sectionIds.find(
    (candidate) => candidate === requestedSectionId,
  )

  event.preventDefault()

  if (resolvedSectionId) {
    activeSection.value = resolvedSectionId
  }

  // 固定章节需要把导航目标换算为动画场景的起点或终点。
  const targetScrollY = resolveSectionScrollPosition(target, resolvedSectionId)

  gsap.killTweensOf(window)
  gsap.to(window, {
    duration: 0.72,
    scrollTo: { y: targetScrollY, offsetY: 0 },
    ease: 'power3.inOut',
    overwrite: true,
  })
}

/**
 * 根据章节是否被 ScrollTrigger 固定，解析导航应到达的真实滚动位置。
 * PROJECT 需要回到横向轨道起点，TOOL 需要直接落到四卡完整呈现的终点。
 */
function resolveSectionScrollPosition(target: HTMLElement, sectionId?: HomeSectionId) {
  // 固定章节的父级 spacer 保存了完整的 pin 滚动区间。
  const pinSpacer = target.parentElement

  if (!pinSpacer?.classList.contains('pin-spacer')) {
    return target
  }

  // spacer 顶部是固定场景的起点，不受 section 内部 transform 影响。
  const spacerTop = pinSpacer.getBoundingClientRect().top + window.scrollY

  if (sectionId === 'tool') {
    // TOOL 终点需要扣除视口高度，让固定场景仍保持完整占据视口。
    return spacerTop + pinSpacer.offsetHeight - target.offsetHeight
  }

  return spacerTop
}
</script>

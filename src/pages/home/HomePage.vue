<template>
  <main class="site-frame">
    <SiteHeader
      :active-section="activeSection"
      @navigate="scrollToSection"
    />
    <HeroSection @navigate="scrollToSection" />
    <ProjectSection />
    <ToolSection />
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

// 当前进入主要视区的章节决定 Header 选中项。
const activeSection = ref('home')

// 首页导航对应的真实章节顺序。
const sectionIds = ['home', 'project', 'tool', 'blog', 'about']

// 章节可见性监听器在页面卸载时统一断开。
let sectionObserver: IntersectionObserver | undefined

// 保存首页 GSAP 上下文，页面卸载时统一回收动画和 ScrollTrigger。
let animationContext: gsap.Context | undefined

// 页面挂载后建立章节监听并创建内容入场动效。
onMounted(async () => {
  await nextTick()
  observeHomeSections()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  // GSAP 上下文回调集中创建并管理首页范围内的动画。
  animationContext = gsap.context(() => {
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
        '.project-heading, .project-window, .tool-heading, .tool-entry, .blog-heading, .blog-window, .about-heading, .about-space',
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
})

// 页面卸载时恢复 GSAP 状态并断开章节可见性监听。
onUnmounted(() => {
  animationContext?.revert()
  sectionObserver?.disconnect()
})

/**
 * 创建首页章节的可见性监听，并同步 Header 当前项。
 */
function observeHomeSections() {
  // 页面中实际存在的首页章节节点。
  const sections: HTMLElement[] = []

  // 章节标识循环负责解析真实 DOM 节点。
  for (const sectionId of sectionIds) {
    // 当前标识对应的章节节点可能尚未存在。
    const section = document.getElementById(sectionId)

    if (section) {
      sections.push(section)
    }
  }

  sectionObserver = new IntersectionObserver(handleSectionIntersections, {
    rootMargin: '-28% 0px -58% 0px',
    threshold: [0, 0.1, 0.4],
  })

  // 每个真实章节都加入同一个观察器。
  sections.forEach((section) => sectionObserver?.observe(section))
}

/**
 * 从当前相交章节中选择最靠近视区上方的一个作为活动项。
 */
function handleSectionIntersections(entries: IntersectionObserverEntry[]) {
  // 当前最接近导航判定区域上边缘的章节。
  let selectedEntry: IntersectionObserverEntry | undefined

  // 相交项循环排除不可见章节并比较纵向位置。
  for (const entry of entries) {
    if (
      entry.isIntersecting
      && (!selectedEntry || entry.boundingClientRect.top < selectedEntry.boundingClientRect.top)
    ) {
      selectedEntry = entry
    }
  }

  if (selectedEntry?.target.id) {
    activeSection.value = selectedEntry.target.id
  }
}

/**
 * 使用 GSAP 滚动到首页锚点，并立即同步 Header 选中项。
 */
function scrollToSection(event: MouseEvent, sectionId?: string) {
  // 当前触发导航的锚点提供目标 hash。
  const anchor = event.currentTarget as HTMLAnchorElement
  // 目标章节缺失时保留浏览器默认行为。
  const target = document.querySelector(anchor.hash)

  if (!target) {
    return
  }

  event.preventDefault()
  activeSection.value = sectionId ?? target.id
  gsap.to(window, {
    duration: 0.72,
    scrollTo: { y: target, offsetY: 0 },
    ease: 'steps(12)',
  })
}
</script>
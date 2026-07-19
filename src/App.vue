<template>
  <main class="site-frame">
    <HeroSection
      @navigate="scrollToSection"
      @hover="animateHover"
      @leave="animateLeave"
    />
    <AboutSection />
    <ProjectsSection />
    <BlogSection @navigate="scrollToSection" />
    <ContactSection @hover="animateHover" @leave="animateLeave" />
  </main>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  AboutSection,
  BlogSection,
  ContactSection,
  HeroSection,
  ProjectsSection,
} from './components'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// 保存应用级 GSAP 上下文，卸载时统一回收动画和 ScrollTrigger。
let animationContext: gsap.Context | undefined

// 页面挂载后创建首屏和滚动章节的像素化动效。
onMounted(async () => {
  await nextTick()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  animationContext = gsap.context(() => {
    // 首屏时间线依次显示主文案、装饰和分子结构。
    const intro = gsap.timeline({ defaults: { ease: 'steps(6)' } })

    intro
      .set('.site-frame', { autoAlpha: 1 })
      .fromTo(
        '.intro-piece',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.08, snap: { y: 4 } },
      )
      .fromTo(
        '.molecule .pixel--filled',
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.01,
          stagger: { amount: 0.72, from: 'random' },
          ease: 'steps(1)',
        },
        '-=0.35',
      )

    gsap.to('.molecule', {
      y: -8,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'steps(2)',
      snap: { y: 4 },
    })

    gsap.to('.decor-pixel', {
      autoAlpha: 0.25,
      duration: 0.01,
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.6,
      stagger: { each: 0.08, from: 'random' },
      ease: 'steps(1)',
    })

    gsap.to('.equalizer i', {
      autoAlpha: 0.15,
      duration: 0.01,
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.38,
      stagger: { each: 0.045, from: 'random' },
      ease: 'steps(1)',
    })

    gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((section) => {
      // 每个章节只选择需要参与滚动入场的直接视觉内容。
      const targets = section.querySelectorAll(
        '.section-copy, .section-heading, .section-art, .project-item, .post-list, .contact-art, .pixel-link, .copyright',
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

// 应用卸载时恢复 GSAP 修改过的行内状态并移除触发器。
onUnmounted(() => {
  animationContext?.revert()
})

/**
 * 使用 GSAP 滚动到站内锚点，并保持像素步进缓动。
 */
function scrollToSection(event: MouseEvent) {
  // 当前触发导航的锚点提供目标 hash。
  const anchor = event.currentTarget as HTMLAnchorElement
  // 目标章节缺失时保留浏览器默认行为。
  const target = document.querySelector(anchor.hash)

  if (!target) {
    return
  }

  event.preventDefault()
  gsap.to(window, {
    duration: 0.72,
    scrollTo: { y: target, offsetY: 0 },
    ease: 'steps(12)',
  })
}

/**
 * 为可交互链接提供一个方块单位的悬停抬升。
 */
function animateHover(event: MouseEvent) {
  gsap.to(event.currentTarget, { y: -4, duration: 0.12, ease: 'steps(1)' })
}

/**
 * 在指针离开后恢复链接的原始位置。
 */
function animateLeave(event: MouseEvent) {
  gsap.to(event.currentTarget, { y: 0, duration: 0.12, ease: 'steps(1)' })
}
</script>

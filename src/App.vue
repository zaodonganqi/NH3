<template>
  <main class="page" @click="handleMarkdownClick">
    <div
      v-if="!pixelBrandError"
      class="pixel-brand"
      role="img"
      aria-label="躁动的氨气 NH3"
    >
      <canvas
        ref="pixelBrandTitleRef"
        class="pixel-brand__canvas pixel-brand__canvas--title"
        aria-hidden="true"
      ></canvas>
      <canvas
        ref="pixelBrandFormulaRef"
        class="pixel-brand__canvas pixel-brand__canvas--formula"
        aria-hidden="true"
      ></canvas>
    </div>
    <article ref="articleRef" class="markdown-body" v-html="html"></article>
    <aside ref="profileRef" class="profile-panel">
      <section class="profile-body" v-html="profileHtml"></section>
    </aside>
    <div v-if="previewImage" class="image-preview" role="dialog" aria-modal="true" @click.self="closePreview">
      <figure class="image-preview__frame">
        <button class="image-preview__close" type="button" aria-label="关闭图片预览" @click="closePreview">
          ×
        </button>
        <img :src="previewImage.src" :alt="previewImage.alt" />
      </figure>
    </div>
  </main>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MarkdownIt from 'markdown-it'
import plan from './assets/plan.md?raw'
import profile from './assets/profile.md?raw'
import { pixelateText } from './utils'

gsap.registerPlugin(ScrollTrigger)

const assetUrls = import.meta.glob('./assets/**/*.{avif,gif,jpeg,jpg,png,svg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const defaultImageRenderer =
  md.renderer.rules.image ??
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const srcIndex = token.attrIndex('src')

  if (srcIndex >= 0) {
    const rawSrc = token.attrs?.[srcIndex]?.[1]
    const resolvedSrc = resolveAssetUrl(rawSrc)

    if (resolvedSrc && token.attrs) {
      token.attrs[srcIndex][1] = resolvedSrc
    }
  }

  return defaultImageRenderer(tokens, idx, options, env, self)
}

function resolveAssetUrl(src?: string) {
  if (!src || /^(?:[a-z]+:|\/|#)/i.test(src)) {
    return src
  }

  const cleanSrc = decodeURI(src).replace(/\\/g, '/').replace(/^\.\//, '')
  const directPath = `./assets/${cleanSrc}`

  if (assetUrls[directPath]) {
    return assetUrls[directPath]
  }

  const matchedAsset = Object.entries(assetUrls).find(([assetPath]) =>
    assetPath.endsWith(`/${cleanSrc}`),
  )

  return matchedAsset?.[1] ?? src
}

const html = md.render(plan)
const profileHtml = md.render(profile)
const articleRef = ref<HTMLElement | null>(null)
const profileRef = ref<HTMLElement | null>(null)
const pixelBrandTitleRef = ref<HTMLCanvasElement | null>(null)
const pixelBrandFormulaRef = ref<HTMLCanvasElement | null>(null)
const pixelBrandError = ref(false)
const previewImage = ref<{ src: string; alt: string } | null>(null)

let animationContext: gsap.Context | undefined

onMounted(async () => {
  await nextTick()
  void renderPixelBrand()

  const article = articleRef.value
  const profilePanel = profileRef.value

  window.addEventListener('keydown', handleKeydown)

  if (!article || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  animationContext = gsap.context(() => {
    const articleBlocks = gsap.utils.toArray<HTMLElement>(
      'h1, h2, h3, p, ul, ol, blockquote, img',
      article,
    )
    const introCutoff = window.innerHeight * 0.98
    const topBlocks = articleBlocks.filter((block) => {
      const rect = block.getBoundingClientRect()

      return rect.top < introCutoff && rect.bottom > 0
    })
    const topBlockSet = new Set(topBlocks)
    const scrollBlocks = articleBlocks.filter((block) => !topBlockSet.has(block))

    const introTimeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
    })

    introTimeline.fromTo(
      article,
      { autoAlpha: 0, y: 26, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.78 },
    )

    if (topBlocks.length > 0) {
      introTimeline.fromTo(
        topBlocks,
        { autoAlpha: 0, y: 20, filter: 'blur(5px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.62,
          stagger: 0.08,
        },
        '-=0.44',
      )
    }

    if (profilePanel) {
      introTimeline.fromTo(
        profilePanel,
        { autoAlpha: 0, x: 20, y: 8 },
        { autoAlpha: 1, x: 0, y: 0, duration: 0.68 },
        '-=0.5',
      )
    }

    scrollBlocks.forEach((block) => {
      const hiddenState = { autoAlpha: 0, y: 18 }
      const revealTween = gsap.to(block, {
        autoAlpha: 1,
        y: 0,
        duration: 0.58,
        ease: 'power2.out',
        paused: true,
      })
      const resetBlock = () => {
        revealTween.pause(0)
        gsap.set(block, hiddenState)
      }

      gsap.set(block, hiddenState)

      ScrollTrigger.create({
        trigger: block,
        start: 'top 88%',
        end: 'bottom 18%',
        invalidateOnRefresh: true,
        onEnter: () => revealTween.restart(true),
        onEnterBack: () => revealTween.restart(true),
        onLeave: resetBlock,
        onLeaveBack: resetBlock,
      })
    })
  }, document.body)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  animationContext?.revert()
})

/**
 * 渲染用于检查文本栅格效果的临时像素品牌。
 */
async function renderPixelBrand() {
  try {
    const [titleArt, formulaArt] = await Promise.all([
      pixelateText('躁动的氨气'),
      pixelateText('NH3'),
    ])
    const titleCanvas = pixelBrandTitleRef.value
    const formulaCanvas = pixelBrandFormulaRef.value

    if (!titleCanvas || !formulaCanvas) {
      return
    }

    titleCanvas.dataset.pixelSize = String(titleArt.sourcePixelSize)
    formulaCanvas.dataset.pixelSize = String(formulaArt.sourcePixelSize)
    titleArt.render(titleCanvas)
    formulaArt.render(formulaCanvas)
  } catch (error) {
    pixelBrandError.value = true
    console.error('Pixel brand rendering failed.', error)
  }
}

function handleMarkdownClick(event: MouseEvent) {
  const target = event.target

  if (!(target instanceof HTMLImageElement)) {
    return
  }

  if (!target.closest('.markdown-body, .profile-body')) {
    return
  }

  previewImage.value = {
    src: target.currentSrc || target.src,
    alt: target.alt || '图片预览',
  }
}

function closePreview() {
  previewImage.value = null
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePreview()
  }
}
</script>

<style>
:root {
  color: #24313d;
  background: #eef2f3;
  font-family:
    Inter, "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background:
    linear-gradient(120deg, rgba(35, 87, 111, 0.08), transparent 34%),
    linear-gradient(180deg, #f6f8f7 0%, #e8eef0 48%, #f8f6ef 100%);
}

#app {
  min-height: 100vh;
}

.pixel-brand {
  position: fixed;
  z-index: 10;
  top: 20px;
  left: 20px;
  display: grid;
  max-width: min(280px, calc(100vw - 40px));
  gap: 4px;
  justify-items: start;
  pointer-events: none;
  filter: drop-shadow(0 8px 12px rgba(17, 32, 43, 0.18));
}

.pixel-brand__canvas {
  display: block;
  max-width: 100%;
  height: auto;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
}

.pixel-brand__canvas--formula {
  margin-left: 2px;
}

.page {
  box-sizing: border-box;
  width: min(100%, 980px);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(28px, 6vw, 72px) clamp(18px, 5vw, 56px)
    clamp(64px, 9vw, 112px);
}

.markdown-body {
  position: relative;
  box-sizing: border-box;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: clamp(36px, 7vw, 72px) clamp(24px, 6vw, 72px);
  overflow: hidden;
  color: #27313c;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92)),
    #ffffff;
  border: 1px solid rgba(68, 85, 92, 0.14);
  border-radius: 8px;
  box-shadow:
    0 30px 70px rgba(34, 43, 52, 0.12),
    0 2px 8px rgba(34, 43, 52, 0.05);
  line-height: 1.86;
  font-size: 17px;
}

.markdown-body::after {
  position: absolute;
  inset: 0 auto 0 0;
  width: 1px;
  content: "";
  background: linear-gradient(180deg, rgba(35, 87, 111, 0.28), transparent 72%);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: #17212b;
  line-height: 1.35;
  letter-spacing: 0;
}

.markdown-body h1 {
  margin: 0 0 30px;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(34, 49, 63, 0.12);
  font-size: clamp(32px, 5vw, 46px);
  font-weight: 780;
  line-height: 1.16;
}

.markdown-body h2 {
  position: relative;
  margin: 48px 0 16px;
  padding-top: 8px;
  padding-left: 18px;
  font-size: clamp(21px, 3vw, 26px);
  font-weight: 760;
}

.markdown-body h2::before {
  position: absolute;
  top: 17px;
  left: 0;
  width: 5px;
  height: 22px;
  border-radius: 999px;
  content: "";
  background: #23576f;
  box-shadow: 0 12px 28px rgba(35, 87, 111, 0.22);
}

.markdown-body h3 {
  margin: 30px 0 12px;
  color: #2c4452;
  font-size: 19px;
  font-weight: 720;
}

.markdown-body p {
  margin: 0 0 19px;
}

.markdown-body ul,
.markdown-body ol {
  margin: 2px 0 24px;
  padding-left: 1.25em;
}

.markdown-body li {
  margin: 10px 0;
  padding-left: 0.2em;
}

.markdown-body li::marker {
  color: #b45f43;
  font-weight: 700;
}

.markdown-body a {
  padding: 0 0.08em 0.08em;
  color: #1f6478;
  background:
    linear-gradient(rgba(180, 95, 67, 0.14), rgba(180, 95, 67, 0.14)) 0 100% /
      100% 0.38em no-repeat;
  border-radius: 3px;
  text-decoration: none;
  transition:
    background-size 180ms ease,
    color 160ms ease,
    background-color 160ms ease;
}

.markdown-body a:hover {
  color: #9c4933;
  background-color: rgba(180, 95, 67, 0.08);
  background-size: 100% 100%;
}

.markdown-body a:focus-visible {
  outline: 2px solid rgba(31, 100, 120, 0.34);
  outline-offset: 3px;
}

.profile-body a {
  color: #1f6478;
  text-decoration: none;
  border-bottom: 1px solid rgba(31, 100, 120, 0.28);
  transition:
    color 160ms ease,
    border-color 160ms ease;
}

.profile-body a:hover {
  color: #9c4933;
  border-color: rgba(156, 73, 51, 0.42);
}

.profile-body a:focus-visible {
  outline: 2px solid rgba(31, 100, 120, 0.34);
  outline-offset: 3px;
}

.markdown-body blockquote {
  margin: 26px 0 34px;
  padding: 18px 22px 18px 24px;
  color: #344652;
  background: #f5f3ed;
  border-left: 4px solid #b38b44;
  border-radius: 0 8px 8px 0;
  box-shadow: inset 0 0 0 1px rgba(179, 139, 68, 0.1);
}

.markdown-body blockquote p {
  margin-bottom: 0;
}

.markdown-body code {
  padding: 0.16em 0.4em;
  border-radius: 4px;
  color: #7c3f2b;
  background: #f2e9df;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.92em;
}

.markdown-body > *:last-child {
  margin-bottom: 0;
}

.profile-panel {
  --profile-width: clamp(220px, 20vw, 300px);

  position: fixed;
  z-index: 5;
  top: clamp(32px, 8vh, 76px);
  right: max(18px, calc((100vw - 760px) / 2 - var(--profile-width) - 28px));
  box-sizing: border-box;
  width: var(--profile-width);
  max-height: calc(100vh - clamp(32px, 8vh, 76px) * 2);
  margin: 0;
  padding: 22px 24px;
  overflow: auto;
  color: #26333e;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(68, 85, 92, 0.14);
  border-radius: 8px;
  box-shadow:
    0 22px 48px rgba(34, 43, 52, 0.1),
    0 1px 4px rgba(34, 43, 52, 0.04);
  backdrop-filter: blur(16px);
}

.profile-body {
  font-size: 15px;
  line-height: 1.72;
}

.profile-body h2 {
  margin: 0 0 14px;
  color: #17212b;
  font-size: 20px;
  line-height: 1.25;
}

.profile-body p {
  margin: 0 0 14px;
}

.profile-body ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.profile-body li {
  position: relative;
  margin: 0;
  padding-left: 18px;
}

.profile-body li::before {
  position: absolute;
  top: 0.72em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  content: "";
  background: #b45f43;
}

.profile-body strong {
  color: #1f4d5f;
  font-weight: 760;
}

.markdown-body img,
.profile-body img {
  display: block;
  width: 100%;
  height: auto;
  margin: 16px 0 0;
  border-radius: 8px;
  cursor: zoom-in;
  box-shadow: 0 12px 26px rgba(34, 43, 52, 0.12);
}

.image-preview {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 48px);
  background: rgba(17, 24, 32, 0.72);
  backdrop-filter: blur(12px);
}

.image-preview__frame {
  position: relative;
  display: grid;
  max-width: min(1120px, calc(100vw - 64px));
  max-height: calc(100vh - 64px);
  margin: 0;
}

.image-preview__frame img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 64px);
  width: auto;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  background: #ffffff;
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.36);
}

.image-preview__close {
  position: absolute;
  top: -18px;
  right: -18px;
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  place-items: center;
  color: #17212b;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(68, 85, 92, 0.16);
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  font: 26px/1 Arial, sans-serif;
}

.image-preview__close:hover {
  color: #b45f43;
}

::selection {
  color: #17212b;
  background: rgba(179, 139, 68, 0.28);
}

@media (max-width: 1160px) {
  .page {
    padding-top: 220px;
  }

  .pixel-brand {
    position: absolute;
  }

  .profile-panel {
    top: auto;
    right: 18px;
    bottom: 18px;
    width: min(360px, calc(100vw - 36px));
    max-height: 34vh;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 206px 0 0;
  }

  .pixel-brand {
    top: 14px;
    left: 14px;
    max-width: calc(100vw - 28px);
  }

  .markdown-body {
    min-height: 100vh;
    border-width: 0;
    border-radius: 0;
    box-shadow: none;
    font-size: 16px;
  }

  .profile-panel {
    right: 12px;
    bottom: 12px;
    width: min(320px, calc(100vw - 24px));
    max-height: 32vh;
    padding: 16px 18px;
  }

  .markdown-body h1 {
    margin-bottom: 26px;
  }

  .markdown-body h2 {
    margin-top: 40px;
  }

  .image-preview {
    padding: 18px;
  }

  .image-preview__frame {
    max-width: calc(100vw - 36px);
    max-height: calc(100vh - 36px);
  }

  .image-preview__frame img {
    max-height: calc(100vh - 36px);
  }

  .image-preview__close {
    top: 10px;
    right: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
</style>

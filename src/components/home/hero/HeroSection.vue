<template>
  <section
    :id="heroContent.id"
    class="hero"
    :style="heroTitleStyle"
    aria-labelledby="hero-title"
  >
    <HomeThreeBackground ref="backgroundRef" />

    <div class="hero-signature intro-piece" aria-hidden="true">
      <PixelPattern :pattern="signaturePattern" :palette="signaturePalette" />
    </div>

    <div class="hero-copy intro-piece">
      <h1 id="hero-title" :aria-label="heroContent.title.replace('\n', ' ')">
        <span class="hero-title-stage">
          <span class="hero-title-underlay" aria-hidden="true">
            <PixelPattern
              :pattern="heroTitleUnderlayPattern"
              :palette="heroTitleUnderlayPalette"
            />
          </span>
          <PixelText
            class="hero-title hero-title--shadow"
            :text="heroContent.title"
            :density="27"
            :color="heroTitlePalette.indigo"
            aria-hidden="true"
          />
          <PixelText
            class="hero-title hero-title--echo hero-title--echo-pink"
            :text="heroContent.title"
            :density="27"
            :color="heroTitlePalette.pink"
            aria-hidden="true"
          />
          <PixelText
            class="hero-title hero-title--echo hero-title--echo-mint"
            :text="heroContent.title"
            :density="27"
            :color="heroTitlePalette.mint"
            aria-hidden="true"
          />
          <PixelText
            class="hero-title hero-title--main"
            :text="heroContent.title"
            :density="27"
            :color="heroTitlePalette.blue"
            :cell-color="heroTitleCellColor"
            aria-hidden="true"
          />
          <span
            class="hero-title-compact"
            :data-text="heroContent.title"
            aria-hidden="true"
          >{{ heroContent.title }}</span>
        </span>
      </h1>
      <p class="hero-copy__line">
        <span aria-hidden="true">{{ heroContent.taglineSymbol }}</span>
        {{ heroContent.tagline }}
      </p>
      <a
        class="pixel-link"
        :href="heroContent.cta.href"
        @click="emit('navigate', $event)"
      >{{ heroContent.cta.label }}</a>
    </div>

    <PixelMolecule @transition-progress="syncMoleculeField" />

    <div class="code-note intro-piece" :aria-label="heroContent.code.ariaLabel">
      <span class="code-note__lines" aria-hidden="true">
        <span
          v-for="line in heroContent.code.entries.length + 2"
          :key="line"
        >{{ line }}</span>
      </span>
      <code>
        <span class="code-line">
          <span class="code-keyword">{{ heroContent.code.keyword }}</span>&nbsp;<span class="code-name">{{ heroContent.code.variableName }}</span>&nbsp;<span class="code-punctuation">= {</span>
        </span>
        <span
          v-for="(entry, index) in heroContent.code.entries"
          :key="entry.key"
          class="code-line code-line--entry"
        >
          <span class="code-property">{{ entry.key }}</span><span class="code-punctuation">:</span>&nbsp;<span class="code-string">"{{ entry.value }}"</span><span v-if="index < heroContent.code.entries.length - 1" class="code-punctuation">,</span>
        </span>
        <span class="code-line"><span class="code-punctuation">}</span></span>
      </code>
    </div>

    <div class="terminal intro-piece" :aria-label="heroContent.terminal.ariaLabel">
      <i v-for="edge in terminalEdges" :key="edge" class="terminal__edge" :class="edge"></i>
      <span>{{ heroContent.terminal.prompt }}</span>
      <strong>{{ heroContent.terminal.greeting }}</strong>
      <PixelPattern :pattern="patterns.smile" :palette="palettes.hydrogen" />
    </div>

    <div class="scroll-cue intro-piece" aria-hidden="true">
      <div class="scroll-cue__motion">
        <span class="scroll-cue__pixels">
          <i v-for="pixel in 6" :key="pixel"></i>
        </span>
        <PixelPattern :pattern="patterns.chevron" :palette="palettes.primary" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { heroContent, heroTitlePalette, palettes, patterns } from '@/config'
import type { PixelCellColor } from '@/utils'
import { PixelPattern, PixelText } from '../../base/pixel'
import PixelMolecule from './PixelMolecule.vue'

/**
 * 异步加载 WebGL 像素背景，避免 Three.js 阻塞首屏正文脚本解析。
 */
function loadHomeThreeBackground() {
  return import('./HomeThreeBackground.vue')
}

/**
 * 描述 WebGL 背景向 Hero 暴露的滚动同步能力。
 */
interface HomeThreeBackgroundExpose {
  // 主分子进度用于驱动副元素在外圈挤压和中心填充之间切换。
  syncAttraction: (progress: number) => void
}

// Three.js 背景使用独立异步代码块加载。
const HomeThreeBackground = defineAsyncComponent(loadHomeThreeBackground)

// 从顶部导航移入首屏的装饰信号使用紧凑十字像素图案。
const signaturePattern = ['..1..', '.111.', '11111', '.111.', '..1..']

// 首屏签名信号沿用淡蓝色，避免与主标题争夺层级。
const signaturePalette = { '1': '#8fc5f3' }

// 标题底部的阶梯装配图案使用连续块面和双排校准轨，不向字面继续叠色。
const heroTitleUnderlayPattern = [
  '................................',
  '............11..................',
  '..........1111......22..........',
  '...33....111111....2222.........',
  '....331111111122222222..........',
  '..333...1111....222...444.......',
  '1111111111111111111111111111....',
  '1122112211221122112211221122....',
]

// 底板颜色来自主标题色谱，低透明度下只承担空间层次。
const heroTitleUnderlayPalette = {
  '1': heroTitlePalette.mint,
  '2': heroTitlePalette.lilac,
  '3': heroTitlePalette.pink,
  '4': heroTitlePalette.blue,
}

// 标题配色通过 CSS 变量同步给移动端原生文字和离散残影。
const heroTitleStyle = {
  '--hero-title-blue': heroTitlePalette.blue,
  '--hero-title-indigo': heroTitlePalette.indigo,
  '--hero-title-teal': heroTitlePalette.teal,
  '--hero-title-mint': heroTitlePalette.mint,
  '--hero-title-pink': heroTitlePalette.pink,
  '--hero-title-lilac': heroTitlePalette.lilac,
}

// 标题用宽像素带、阶梯分区和少量色岛组织实色块，不使用连续渐变或随机散点。
const heroTitleCellColor: PixelCellColor = ({ x, y, columns, rows }) => {
  // 归一化横坐标用于定位少量固定色岛。
  const normalizedX = x / Math.max(columns - 1, 1)
  // 归一化纵坐标用于区分两行标题和固定色岛。
  const normalizedY = y / Math.max(rows - 1, 1)
  // 第一条青色像素带以低频波形横穿上半区。
  const primaryRibbonCenter = rows * (0.22 + Math.sin((x + 2) * 0.16) * 0.065)
  // 第二条薄荷像素带在下半区使用不同周期，避免机械平行。
  const secondaryRibbonCenter = rows * (0.69 + Math.sin((x - 4) * 0.11) * 0.05)
  // 上排右侧使用逐级推进的靛蓝块面。
  const upperStepBoundary = 0.54 + Math.floor(normalizedY * 10) * 0.012
  // 下排左侧使用反向阶梯，保持两行视觉重量错开。
  const lowerStepBoundary = 0.3 + Math.floor((normalizedY - 0.5) * 10) * 0.016
  // 粉色只占四个固定的小型块面，承担视觉停顿而不是铺满字面。
  const isPinkIsland =
    (normalizedX > 0.12 && normalizedX < 0.23 && normalizedY > 0.06 && normalizedY < 0.18) ||
    (normalizedX > 0.72 && normalizedX < 0.82 && normalizedY > 0.28 && normalizedY < 0.4) ||
    (normalizedX > 0.18 && normalizedX < 0.3 && normalizedY > 0.58 && normalizedY < 0.7) ||
    (normalizedX > 0.55 && normalizedX < 0.65 && normalizedY > 0.78 && normalizedY < 0.9)
  // 淡紫色岛与粉色错位出现，避免形成直线色带。
  const isLilacIsland =
    (normalizedX > 0.36 && normalizedX < 0.46 && normalizedY > 0.14 && normalizedY < 0.28) ||
    (normalizedX > 0.78 && normalizedX < 0.9 && normalizedY > 0.06 && normalizedY < 0.2) ||
    (normalizedX > 0.36 && normalizedX < 0.48 && normalizedY > 0.62 && normalizedY < 0.76)

  if (isPinkIsland) {
    return heroTitlePalette.pink
  }

  if (isLilacIsland) {
    return heroTitlePalette.lilac
  }

  if (Math.abs(y - primaryRibbonCenter) <= 2) {
    return heroTitlePalette.teal
  }

  if (Math.abs(y - secondaryRibbonCenter) <= 1.5) {
    return heroTitlePalette.mint
  }

  if (
    (normalizedY < 0.5 && normalizedX > upperStepBoundary) ||
    (normalizedY >= 0.5 && normalizedX < lowerStepBoundary)
  ) {
    return heroTitlePalette.indigo
  }

  return heroTitlePalette.blue
}

// 终端装饰框的四条像素虚线边。
const terminalEdges = ['terminal__edge--top', 'terminal__edge--right', 'terminal__edge--bottom', 'terminal__edge--left']

// WebGL 背景实例接收主分子的滚动进度并驱动引力场反馈。
const backgroundRef = ref<HomeThreeBackgroundExpose | null>(null)

// 首屏只把主行动链接交给首页页面级滚动控制器。
const emit = defineEmits<{
  /**
   * 请求首页滚动控制器处理“探索更多”链接的站内导航。
   */
  navigate: [event: MouseEvent]
}>()

/**
 * 把主分子的滚动过渡进度同步给 WebGL 引力场。
 */
function syncMoleculeField(progress: number) {
  backgroundRef.value?.syncAttraction(progress)
}
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
  isolation: auto;
}

.hero-copy {
  position: absolute;
  z-index: 3;
  top: 29%;
  left: 7.5%;
  width: 35%;
}

.hero-signature {
  position: absolute;
  z-index: 3;
  top: 14%;
  left: 7.5%;
  display: grid;
  grid-template-columns: 26px auto;
  gap: 4px 12px;
  align-items: center;
  color: #a7b5dc;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
  transform-origin: left center;
  transition:
    filter var(--motion-fast) ease,
    transform var(--motion-medium) var(--motion-step);
}

.hero-signature :deep(.pixel-pattern) {
  width: 24px;
  grid-row: 1 / 3;
}

.hero-signature strong {
  font-weight: 800;
}

.hero-copy h1 {
  margin: 0;
  color: #5275e6;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: clamp(64px, 7.1vw, 112px);
  font-weight: 400;
  line-height: 1.22;
}

.hero-title-stage {
  position: relative;
  display: block;
  width: 100%;
  isolation: isolate;
}

.hero-title-underlay {
  position: absolute;
  z-index: 0;
  bottom: -4%;
  left: -4%;
  width: 92%;
  opacity: 0.28;
  pointer-events: none;
  animation: hero-title-underlay-shift 4.2s steps(4, end) infinite;
  filter: drop-shadow(4px 4px 0 rgb(73 103 220 / 8%));
  will-change: opacity, transform;
}

.hero-title { width: 100%; }

.hero-title--main {
  position: relative;
  z-index: 4;
}

.hero-title--shadow {
  position: absolute;
  z-index: 1;
  inset: 0;
  opacity: 0.28;
  pointer-events: none;
  animation: hero-title-shadow-shift 5.6s steps(1, end) infinite;
  transform: translate(8px, 8px);
  will-change: opacity, transform;
}

.hero-title--echo {
  position: absolute;
  z-index: 2;
  inset: 0;
  opacity: 0.04;
  pointer-events: none;
  clip-path: polygon(
    0 18%,
    100% 18%,
    100% 24%,
    0 24%,
    0 62%,
    100% 62%,
    100% 68%,
    0 68%
  );
  will-change: opacity, transform;
}

.hero-title--echo-pink {
  animation: hero-title-echo-pink 5.6s steps(1, end) infinite;
}

.hero-title--echo-mint {
  z-index: 3;
  animation: hero-title-echo-mint 5.6s steps(1, end) infinite;
}

.hero-title-compact {
  display: none;
  white-space: pre-line;
}

@keyframes hero-title-echo-pink {
  0%,
  80%,
  100% { opacity: 0; transform: translate(0, 0); }
  84% { opacity: 0.38; transform: translate(-8px, 4px); }
  88% { opacity: 0.14; transform: translate(4px, -4px); }
  92% { opacity: 0; transform: translate(0, 0); }
}

@keyframes hero-title-echo-mint {
  0%,
  80%,
  100% { opacity: 0; transform: translate(0, 0); }
  84% { opacity: 0.42; transform: translate(8px, -4px); }
  88% { opacity: 0.16; transform: translate(-4px, 4px); }
  92% { opacity: 0; transform: translate(0, 0); }
}

@keyframes hero-title-shadow-shift {
  0%,
  80%,
  100% { opacity: 0.28; transform: translate(8px, 8px); }
  84% { opacity: 0.34; transform: translate(12px, 4px); }
  88% { opacity: 0.3; transform: translate(4px, 12px); }
  92% { opacity: 0.28; transform: translate(8px, 8px); }
}

@keyframes hero-title-underlay-shift {
  0%,
  100% { opacity: 0.24; transform: translate(0, 0); }
  42% { opacity: 0.34; transform: translate(4px, -4px); }
  68% { opacity: 0.28; transform: translate(-4px, 0); }
}

.hero-copy__line {
  margin: 26px 0 46px;
  color: #637695;
  font-size: clamp(14px, 1.3vw, 20px);
  font-weight: 700;
}

.hero-copy__line span {
  color: var(--hero-title-pink);
  text-shadow: 2px 2px 0 color-mix(in srgb, var(--hero-title-lilac) 36%, transparent);
}

.hero-copy .pixel-link { color: var(--hero-title-blue); }

.code-note {
  position: absolute;
  z-index: 3;
  top: 48%;
  right: 2.5%;
  display: flex;
  align-items: stretch;
  color: #8997cc;
  font-size: clamp(10px, 0.9vw, 14px);
  line-height: 1.9;
  transform-origin: right center;
  transition:
    filter var(--motion-fast) ease,
    transform var(--motion-medium) var(--motion-step);
}

.code-note__lines {
  position: relative;
  display: grid;
  min-width: 2.5em;
  margin-right: 0.9em;
  padding-right: 0.8em;
  color: #aab5cf;
  text-align: right;
  line-height: inherit;
  flex: 0 0 auto;
}

.code-note__lines::after {
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: repeating-linear-gradient(to bottom, #dce3f2 0 2px, transparent 2px 4px);
  content: '';
}

.code-note__lines > span {
  display: block;
}

.code-note code {
  display: grid;
  font-family: inherit;
}

.code-line {
  display: block;
  white-space: nowrap;
  transition:
    filter var(--motion-fast) ease,
    translate var(--motion-fast) var(--motion-step);
}

.code-line--entry {
  padding-left: 2em;
}

.code-keyword { color: #6078ec; }
.code-name { color: #3f72c9; }
.code-property { color: #36aaa3; }
.code-string { color: #d96b9e; }
.code-punctuation { color: #91a0c4; }

.terminal {
  position: absolute;
  z-index: 3;
  bottom: 8%;
  left: 5%;
  display: grid;
  width: clamp(230px, 19vw, 310px);
  min-height: 126px;
  padding: 22px;
  align-content: start;
  gap: 18px;
  color: #5f78ed;
  font-size: 13px;
  transition:
    background-color var(--motion-fast) ease,
    filter var(--motion-fast) ease,
    transform var(--motion-medium) var(--motion-step);
}

.terminal::before {
  position: absolute;
  inset: 8px;
  content: "";
  background: linear-gradient(180deg, transparent 0 46%, rgb(101 128 236 / 8%) 46% 54%, transparent 54%);
  background-size: 100% 18px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
  transition:
    opacity var(--motion-fast) ease,
    transform var(--motion-medium) var(--motion-step);
}

.terminal strong { color: #4fcdbf; font-weight: 700; }

.terminal strong::after {
  display: inline-block;
  width: 7px;
  height: 11px;
  margin-left: 6px;
  content: "";
  background: currentColor;
  animation: terminal-cursor 920ms steps(2, end) infinite;
  opacity: 0.82;
  vertical-align: -1px;
}
.terminal :deep(.pixel-pattern) { position: absolute; right: 24px; bottom: 18px; width: 28px; }

.terminal__edge {
  position: absolute;
  background: repeating-linear-gradient(90deg, #c7d5f5 0 4px, transparent 4px 8px);
  transition: background-position var(--motion-medium) var(--motion-step);
}

.terminal__edge--top,
.terminal__edge--bottom { left: 0; width: 100%; height: 4px; }
.terminal__edge--top { top: 0; }
.terminal__edge--bottom { bottom: 0; }
.terminal__edge--left,
.terminal__edge--right { top: 0; width: 4px; height: 100%; background: repeating-linear-gradient(180deg, #c7d5f5 0 4px, transparent 4px 8px); }
.terminal__edge--left { left: 0; }
.terminal__edge--right { right: 0; }

.scroll-cue {
  position: absolute;
  z-index: 3;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
}

.scroll-cue__motion {
  position: relative;
  display: grid;
  width: 76px;
  min-height: 96px;
  padding: 12px 10px 10px;
  justify-items: center;
  align-content: center;
  gap: 8px;
  animation: scroll-cue-step 1.8s steps(4, end) infinite;
  background:
    linear-gradient(#cbd7ff, #cbd7ff) 0 0 / 20px 4px no-repeat,
    linear-gradient(#cbd7ff, #cbd7ff) 100% 0 / 20px 4px no-repeat,
    linear-gradient(#cbd7ff, #cbd7ff) 0 100% / 20px 4px no-repeat,
    linear-gradient(#cbd7ff, #cbd7ff) 100% 100% / 20px 4px no-repeat;
  will-change: opacity;
}

.scroll-cue__pixels {
  display: grid;
  grid-template-columns: repeat(3, 8px);
  gap: 4px;
}

.scroll-cue__pixels i {
  width: 8px;
  height: 8px;
  background: #6179e9;
  box-shadow: inset 0 0 0 1px #ffffff;
  animation: scroll-cue-pixels 1.2s steps(3, end) infinite;
}

.scroll-cue__pixels i:nth-child(3n + 2) { background: #65c9c4; animation-delay: -0.4s; }
.scroll-cue__pixels i:nth-child(3n) { background: #eda5cb; animation-delay: -0.8s; }

.scroll-cue__motion--hidden {
  visibility: hidden;
  opacity: 0;
}

.scroll-cue :deep(.pixel-pattern) { width: 64px; }

@media (hover: hover) and (pointer: fine) {
  .hero-signature:hover {
    filter: drop-shadow(4px 4px 0 rgb(143 197 243 / 18%));
    transform: translate(4px, -4px);
  }

  .code-note:hover {
    filter: drop-shadow(5px 5px 0 rgb(95 120 237 / 10%));
    transform: translate(-4px, -3px);
  }

  .code-note:hover .code-line--entry:nth-child(2n) {
    filter: drop-shadow(3px 3px 0 rgb(95 120 237 / 8%));
    translate: 5px 0;
  }

  .code-note:hover .code-line--entry:nth-child(2n + 1) {
    translate: -2px 0;
  }

  .terminal:hover {
    background-color: rgb(248 251 255 / 86%);
    filter: drop-shadow(7px 7px 0 rgb(95 120 237 / 8%));
    transform: translateY(-4px);
  }

  .terminal:hover::before {
    opacity: 1;
    transform: translateY(0);
  }

  .terminal:hover strong::after {
    animation-duration: 680ms;
    opacity: 1;
  }

  .terminal:hover .terminal__edge--top,
  .terminal:hover .terminal__edge--bottom {
    background-position: 12px 0;
  }

  .terminal:hover .terminal__edge--left,
  .terminal:hover .terminal__edge--right {
    background-position: 0 12px;
  }
}

@keyframes scroll-cue-step {
  0%,
  100% { transform: translateY(0); }
  50% { transform: translateY(12px); }
}

@keyframes scroll-cue-pixels {
  0%,
  100% { opacity: 0.34; transform: translateY(-4px); }
  50% { opacity: 1; transform: translateY(4px); }
}

@keyframes terminal-cursor {
  0%,
  44% { opacity: 1; }
  45%,
  100% { opacity: 0; }
}

@media (max-width: 1100px) {
  .hero-copy { top: 31%; left: 6%; }
  .code-note { right: 2.5%; }
}

@media (min-width: 1800px) {
  .hero-copy { width: 38%; }
  .hero-copy h1 { font-size: clamp(112px, 5.4vw, 138px); }
}

@media (max-width: 820px) {
  .hero { min-height: 980px; }
  .hero-signature { top: 28px; left: 7%; }
  .hero-copy { top: 250px; left: 7%; width: 57%; }
  .hero-copy h1 { font-size: clamp(54px, 13vw, 82px); }
  .hero-copy__line { margin: 18px 0 30px; }
  .code-note { top: 720px; right: 5%; }
  .terminal { bottom: 4%; left: 5%; min-height: 108px; }
  .scroll-cue { display: none; }
}

@media (max-width: 560px) {
  .hero { min-height: 900px; }
  .hero-signature { top: 22px; left: 8%; font-size: 10px; }
  .hero-copy { top: 235px; left: 8%; width: 80%; }
  .hero-copy h1 { font-size: 58px; }
  .hero-title { display: none; }
  .hero-title-compact {
    position: relative;
    isolation: isolate;
    display: block;
    width: max-content;
    max-width: 100%;
    color: var(--hero-title-blue);
    font-family: "Zpix", "Microsoft YaHei", monospace;
    line-height: 1.15;
    white-space: pre-line;
    text-shadow:
      2px 2px 0 #ffffff,
      5px 5px 0 color-mix(in srgb, var(--hero-title-indigo) 38%, transparent);
  }

  .hero-title-compact::before,
  .hero-title-compact::after {
    position: absolute;
    z-index: 1;
    inset: 0;
    white-space: pre-line;
    content: attr(data-text);
    pointer-events: none;
  }

  .hero-title-compact::before {
    color: var(--hero-title-teal);
    clip-path: polygon(
      0 10%,
      52% 10%,
      52% 26%,
      34% 26%,
      34% 48%,
      72% 48%,
      72% 60%,
      44% 60%,
      44% 80%,
      0 80%
    );
  }

  .hero-title-underlay {
    bottom: -6%;
    left: -2%;
    width: 76%;
    opacity: 0.18;
  }

  .hero-title-compact::after {
    color: var(--hero-title-pink);
    clip-path: polygon(
      62% 0,
      100% 0,
      100% 36%,
      80% 36%,
      80% 52%,
      58% 52%,
      58% 100%,
      34% 100%,
      34% 82%,
      48% 82%,
      48% 58%,
      62% 58%
    );
  }

  .hero-copy__line { font-size: 13px; }
  .code-note { display: none; }
  .terminal { bottom: 4%; left: 8%; width: 62%; min-height: 94px; padding: 16px; gap: 12px; font-size: 10px; }
  .terminal :deep(.pixel-pattern) { width: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-signature,
  .code-note,
  .terminal,
  .terminal::before,
  .terminal__edge,
  .terminal strong::after,
  .code-line,
  .hero-title--echo,
  .hero-title--shadow,
  .hero-title-underlay,
  .scroll-cue__pixels i,
  .scroll-cue__motion {
    animation: none;
    transition: none;
  }

  .hero-title--echo { display: none; }

}
</style>

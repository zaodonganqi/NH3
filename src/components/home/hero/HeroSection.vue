<template>
  <section id="home" class="hero" aria-labelledby="hero-title">
    <HomeThreeBackground ref="backgroundRef" />

    <div class="hero-signature intro-piece" aria-hidden="true">
      <PixelPattern :pattern="signaturePattern" :palette="signaturePalette" />
      <span>// AMMONIA</span>
      <strong>{ NH3 }</strong>
    </div>

    <div class="hero-copy intro-piece">
      <p class="hero-copy__eyebrow">CREATIVE DEVELOPER / 2026</p>
      <h1 id="hero-title">
        <PixelText
          class="hero-title"
          :text="'躁动的\n氨气'"
          :density="27"
          color="linear-gradient(135deg, #3557d5 0%, #159f9a 58%, #d65a9e 100%)"
        />
      </h1>
      <p class="hero-copy__line"><span aria-hidden="true">♥</span> 用代码探索无限可能</p>
      <a class="pixel-link" href="#project" @click="emit('navigate', $event)">探索更多</a>
    </div>

    <PixelMolecule @transition-progress="syncMoleculeField" />

    <div class="code-note intro-piece" aria-label="代码简介">
      <span class="code-note__brace">{</span>
      <code>
        <span class="code-blue">const nh3</span> = {<br />
        &nbsp;&nbsp;<span class="code-cyan">name</span>: "Ammonia",<br />
        &nbsp;&nbsp;<span class="code-cyan">formula</span>: "NH3",<br />
        &nbsp;&nbsp;<span class="code-cyan">mood</span>: "excited",<br />
        &nbsp;&nbsp;<span class="code-cyan">energy</span>: Infinity<br />
        }
      </code>
    </div>

    <div class="terminal intro-piece" aria-label="终端问候">
      <i v-for="edge in terminalEdges" :key="edge" class="terminal__edge" :class="edge"></i>
      <span>&gt;_</span>
      <strong>&gt; Hello, World!</strong>
      <PixelPattern :pattern="patterns.smile" :palette="palettes.hydrogen" />
    </div>

    <PixelPattern class="hero-cursor intro-piece" :pattern="patterns.cursor" :palette="palettes.ink" />

    <div class="scroll-cue intro-piece" aria-hidden="true">
      <div class="scroll-cue__motion">
        <span>SCROLL DOWN</span>
        <PixelPattern :pattern="patterns.chevron" :palette="palettes.primary" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { palettes, patterns } from '../../../config/site'
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
  // 主分子进度用于驱动引力节点脱离和碰撞反馈。
  syncAttraction: (progress: number) => void
}

// Three.js 背景使用独立异步代码块加载。
const HomeThreeBackground = defineAsyncComponent(loadHomeThreeBackground)

// 从顶部导航移入首屏的装饰信号使用紧凑十字像素图案。
const signaturePattern = ['..1..', '.111.', '11111', '.111.', '..1..']

// 首屏签名信号沿用淡蓝色，避免与主标题争夺层级。
const signaturePalette = { '1': '#8fc5f3' }

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
}

.hero-signature :deep(.pixel-pattern) {
  width: 24px;
  grid-row: 1 / 3;
}

.hero-signature strong {
  font-weight: 800;
}

.hero-copy__eyebrow {
  margin: 0 0 20px;
  color: #95a5c7;
  font-size: 12px;
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

.hero-title {
  width: 100%;
}

.hero-copy__line {
  margin: 26px 0 46px;
  color: #637695;
  font-size: clamp(14px, 1.3vw, 20px);
  font-weight: 700;
}

.hero-copy__line span { color: #f3a3ce; }

.code-note {
  position: absolute;
  z-index: 3;
  top: 48%;
  right: 4.7%;
  display: flex;
  color: #8997cc;
  font-size: clamp(10px, 0.9vw, 14px);
  line-height: 1.9;
}

.code-note__brace {
  margin-right: 12px;
  color: #83d3e5;
  font-size: 54px;
  font-weight: 200;
  line-height: 3;
  transform: scaleX(0.45);
}

.code-note code { font-family: inherit; }
.code-blue { color: #6078ec; }
.code-cyan { color: #58cfc0; }

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
}

.terminal strong { color: #4fcdbf; font-weight: 700; }
.terminal :deep(.pixel-pattern) { position: absolute; right: 24px; bottom: 18px; width: 28px; }

.terminal__edge {
  position: absolute;
  background: repeating-linear-gradient(90deg, #c7d5f5 0 4px, transparent 4px 8px);
}

.terminal__edge--top,
.terminal__edge--bottom { left: 0; width: 100%; height: 4px; }
.terminal__edge--top { top: 0; }
.terminal__edge--bottom { bottom: 0; }
.terminal__edge--left,
.terminal__edge--right { top: 0; width: 4px; height: 100%; background: repeating-linear-gradient(180deg, #c7d5f5 0 4px, transparent 4px 8px); }
.terminal__edge--left { left: 0; }
.terminal__edge--right { right: 0; }

.hero-cursor { position: absolute; z-index: 4; right: 38%; bottom: 12%; width: 38px; }

.scroll-cue {
  position: absolute;
  z-index: 3;
  bottom: 5%;
  left: 47%;
  color: #6179e9;
  font-size: 12px;
  font-weight: 800;
}

.scroll-cue__motion {
  display: grid;
  justify-items: center;
  gap: 13px;
  will-change: transform, opacity;
}

.scroll-cue__motion--hidden {
  visibility: hidden;
  opacity: 0;
}

.scroll-cue :deep(.pixel-pattern) { width: 42px; }

@media (max-width: 1100px) {
  .hero-copy { top: 31%; left: 6%; }
  .code-note { right: 2.5%; }
}

@media (max-width: 820px) {
  .hero { min-height: 980px; }
  .hero-signature { top: 28px; left: 7%; }
  .hero-copy { top: 250px; left: 7%; width: 57%; }
  .hero-copy h1 { font-size: clamp(54px, 13vw, 82px); }
  .hero-copy__eyebrow { display: none; }
  .hero-copy__line { margin: 18px 0 30px; }
  .code-note { top: 720px; right: 5%; }
  .terminal { bottom: 4%; left: 5%; min-height: 108px; }
  .scroll-cue, .hero-cursor { display: none; }
}

@media (max-width: 560px) {
  .hero { min-height: 900px; }
  .hero-signature { top: 22px; left: 8%; font-size: 10px; }
  .hero-copy { top: 235px; left: 8%; width: 80%; }
  .hero-copy h1 { font-size: 58px; }
  .hero-copy__line { font-size: 13px; }
  .code-note { display: none; }
  .terminal { bottom: 4%; left: 8%; width: 62%; min-height: 94px; padding: 16px; gap: 12px; font-size: 10px; }
  .terminal :deep(.pixel-pattern) { width: 22px; }
}
</style>

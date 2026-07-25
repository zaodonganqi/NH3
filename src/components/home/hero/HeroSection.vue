<template>
  <section id="home" class="hero" aria-labelledby="hero-title">
    <HomeThreeBackground ref="backgroundRef" />

    <div class="hero-signature intro-piece" aria-hidden="true">
      <PixelPattern :pattern="signaturePattern" :palette="signaturePalette" />
    </div>

    <div class="hero-copy intro-piece">
      <p class="hero-copy__eyebrow">SOFTWARE ENGINEER / EXPLORER</p>
      <h1 id="hero-title">
        <PixelText
          class="hero-title"
          :text="'躁动的\n氨气'"
          :density="27"
          color="linear-gradient(135deg, #3557d5 0%, #159f9a 58%, #d65a9e 100%)"
        />
      </h1>
      <p class="hero-copy__line"><span aria-hidden="true">♥</span> Learn. Create. Repeat.</p>
      <a class="pixel-link" href="#project" @click="emit('navigate', $event)">探索更多</a>
    </div>

    <PixelMolecule @transition-progress="syncMoleculeField" />

    <div class="code-note intro-piece" aria-label="代码简介">
      <span class="code-note__lines" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
      </span>
      <code>
        <span class="code-keyword">const</span> <span class="code-name">nh3</span> <span class="code-punctuation">= {</span><br />
        &nbsp;&nbsp;<span class="code-property">identity</span><span class="code-punctuation">:</span> <span class="code-string">"NH3"</span><span class="code-punctuation">,</span><br />
        &nbsp;&nbsp;<span class="code-property">nature</span><span class="code-punctuation">:</span> <span class="code-string">"curious"</span><span class="code-punctuation">,</span><br />
        &nbsp;&nbsp;<span class="code-property">passion</span><span class="code-punctuation">:</span> <span class="code-string">"building"</span><span class="code-punctuation">,</span><br />
        &nbsp;&nbsp;<span class="code-property">energy</span><span class="code-punctuation">:</span> <span class="code-string">"unlimited"</span><br />
        <span class="code-punctuation">}</span>
      </code>
    </div>

    <div class="terminal intro-piece" aria-label="终端问候">
      <i v-for="edge in terminalEdges" :key="edge" class="terminal__edge" :class="edge"></i>
      <span>&gt;_</span>
      <strong>&gt; Hello, World!</strong>
      <PixelPattern :pattern="patterns.smile" :palette="palettes.hydrogen" />
    </div>

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
import { palettes, patterns } from '@/config'
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
  right: 2.5%;
  display: flex;
  align-items: stretch;
  color: #8997cc;
  font-size: clamp(10px, 0.9vw, 14px);
  line-height: 1.9;
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
  display: block;
  font-family: inherit;
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
  will-change: opacity;
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
  .scroll-cue { display: none; }
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

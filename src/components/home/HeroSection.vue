<template>
  <section id="home" class="hero" aria-labelledby="hero-title">
    <SiteHeader
      @navigate="emit('navigate', $event)"
      @hover="emit('hover', $event)"
      @leave="emit('leave', $event)"
    />

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
      <a class="pixel-link" href="#projects" @click="emit('navigate', $event)">探索更多</a>
    </div>

    <PixelMolecule class="intro-piece" />

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
      <PixelArt :pattern="patterns.smile" :palette="palettes.hydrogen" />
    </div>

    <PixelArt class="hero-cursor intro-piece" :pattern="patterns.cursor" :palette="palettes.ink" />

    <div class="scroll-cue intro-piece" aria-hidden="true">
      <span>SCROLL DOWN</span>
      <PixelArt :pattern="patterns.chevron" :palette="palettes.primary" />
    </div>

    <div class="equalizer intro-piece" aria-hidden="true">
      <span v-for="(height, index) in equalizer" :key="index">
        <i v-for="block in height" :key="block"></i>
      </span>
    </div>

    <i
      v-for="(dot, index) in decorativePixels"
      :key="index"
      class="decor-pixel"
      :class="`decor-pixel--${dot.color}`"
      :style="{ left: `${dot.x}%`, top: `${dot.y}%`, '--pixel-size': `${dot.size}px` }"
      aria-hidden="true"
    ></i>

    <i
      v-for="(point, index) in circuitPoints"
      :key="`circuit-${index}`"
      class="circuit-pixel"
      :style="{ left: `${point.x}%`, top: `${point.y}%` }"
      aria-hidden="true"
    ></i>
  </section>
</template>

<script setup lang="ts">
import { circuitPoints, decorativePixels, equalizer, palettes, patterns } from '../../config/site'
import PixelArt from '../pixel/PixelArt.vue'
import PixelText from '../pixel/PixelText.vue'
import PixelMolecule from './PixelMolecule.vue'
import SiteHeader from './SiteHeader.vue'

// 终端装饰框的四条像素虚线边。
const terminalEdges = ['terminal__edge--top', 'terminal__edge--right', 'terminal__edge--bottom', 'terminal__edge--left']

// 首屏把导航和悬停事件交给应用级 GSAP 控制器。
const emit = defineEmits<{
  navigate: [event: MouseEvent]
  hover: [event: MouseEvent]
  leave: [event: MouseEvent]
}>()
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
  isolation: isolate;
}

.hero-copy {
  position: absolute;
  z-index: 3;
  top: 29%;
  left: 7.5%;
  width: 35%;
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
.terminal :deep(.pixel-art) { position: absolute; right: 24px; bottom: 18px; width: 28px; }

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
  display: grid;
  justify-items: center;
  gap: 13px;
  color: #6179e9;
  font-size: 12px;
  font-weight: 800;
}

.scroll-cue :deep(.pixel-art) { width: 42px; }

.equalizer {
  position: absolute;
  right: 13%;
  bottom: 5%;
  display: flex;
  height: 76px;
  align-items: end;
}

.equalizer span { display: flex; flex-direction: column-reverse; }
.equalizer i { display: block; width: 8px; height: 8px; background: #78cbed; border: 1px solid #ffffff; }
.equalizer span:nth-child(3n) i { background: #7f8cf1; }
.equalizer span:nth-child(4n) i { background: #ef9dcb; }

.decor-pixel,
.circuit-pixel {
  position: absolute;
  z-index: 1;
  display: block;
  aspect-ratio: 1 / 1;
  background: currentColor;
  border: 1px solid #ffffff;
}

.decor-pixel { width: var(--pixel-size); }
.decor-pixel--cyan { color: #82d1e7; }
.decor-pixel--pink { color: #f29dcc; }
.decor-pixel--blue { color: #7794ee; }
.decor-pixel--purple { color: #c49ae9; }
.circuit-pixel { width: 5px; color: #a3dff0; }

@media (max-width: 1100px) {
  .hero-copy { top: 31%; left: 6%; }
  .code-note { right: 2.5%; }
}

@media (max-width: 820px) {
  .hero { min-height: 980px; }
  .hero-copy { top: 250px; left: 7%; width: 57%; }
  .hero-copy h1 { font-size: clamp(54px, 13vw, 82px); }
  .hero-copy__eyebrow { display: none; }
  .hero-copy__line { margin: 18px 0 30px; }
  .code-note { top: 720px; right: 5%; }
  .terminal { bottom: 4%; left: 5%; min-height: 108px; }
  .scroll-cue, .hero-cursor, .equalizer { display: none; }
}

@media (max-width: 560px) {
  .hero { min-height: 900px; }
  .hero-copy { top: 235px; left: 8%; width: 80%; }
  .hero-copy h1 { font-size: 58px; }
  .hero-copy__line { font-size: 13px; }
  .code-note { display: none; }
  .terminal { bottom: 4%; left: 8%; width: 62%; min-height: 94px; padding: 16px; gap: 12px; font-size: 10px; }
  .terminal :deep(.pixel-art) { width: 22px; }
}
</style>

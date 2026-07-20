<template>
  <div class="molecule" aria-label="NH3 分子像素图形">
    <div class="molecule__stage">
      <div v-for="bond in bonds" :key="bond" class="bond" :class="bond">
        <i
          v-for="index in 9"
          :key="index"
          :style="{ '--offset': `${(index - 1) * 3.05}%` }"
        ></i>
      </div>

      <PixelAtom class="atom atom--n" element="N" />
      <PixelAtom class="atom atom--h atom--top" element="H" />
      <PixelAtom class="atom atom--h atom--left" element="H" />
      <PixelAtom class="atom atom--h atom--bottom" element="H" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PixelAtom from './PixelAtom.vue'

// 三组真实 DOM 像素键分别连接氮原子与三个氢原子。
const bonds = ['bond--top', 'bond--left', 'bond--bottom']
</script>

<style scoped>
.molecule {
  position: absolute;
  z-index: 4;
  top: 27%;
  left: 42%;
  width: clamp(410px, 38vw, 610px);
  aspect-ratio: 1 / 1;
  filter: drop-shadow(0 18px 28px rgb(91 112 188 / 9%));
}

.molecule__stage {
  position: absolute;
  inset: 0;
  animation: molecule-idle 8.5s ease-in-out infinite;
  transform-origin: 50% 52%;
  will-change: transform;
}

.atom {
  position: absolute;
  z-index: 4;
}

.atom--n {
  top: 25%;
  left: 25%;
  width: 48%;
}

.atom--h {
  width: 24%;
}

.atom--top {
  top: 0;
  left: 66%;
}

.atom--left {
  top: 57%;
  left: 0;
}

.atom--bottom {
  right: 0;
  bottom: 0;
}

.bond {
  position: absolute;
  z-index: 2;
  inset: 0;
}

.bond i {
  position: absolute;
  width: 4.8%;
  aspect-ratio: 1 / 1;
  background: #cbd7ff;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.bond i:nth-child(3n) {
  background: #c4e6eb;
}

.bond--top i {
  left: calc(56% + var(--offset));
  top: calc(28% - var(--offset));
}

.bond--left i {
  left: calc(30% - var(--offset));
  top: calc(55% + var(--offset));
}

.bond--bottom i {
  left: calc(64% + var(--offset));
  top: calc(64% + var(--offset));
}

@keyframes molecule-idle {
  0%,
  100% {
    transform: translate3d(0, 5px, 0) rotate(-0.35deg);
  }

  50% {
    transform: translate3d(0, -7px, 0) rotate(0.35deg);
  }
}

@media (max-width: 1100px) {
  .molecule {
    left: 40%;
    width: 46vw;
  }
}

@media (max-width: 820px) {
  .molecule {
    top: 455px;
    left: 20%;
    width: min(70vw, 500px);
  }
}

@media (max-width: 560px) {
  .molecule {
    top: 445px;
    left: 9%;
    width: 82vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .molecule__stage {
    animation: none;
  }
}
</style>

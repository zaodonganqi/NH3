<template>
  <div class="molecule" aria-label="NH3 分子像素图形">
    <div v-for="bond in bonds" :key="bond" class="bond" :class="bond">
      <i v-for="index in 9" :key="index" :style="{ '--offset': `${(index - 1) * 3.05}%` }"></i>
    </div>

    <PixelAtom class="atom atom--n" element="N" />
    <PixelAtom class="atom atom--h atom--top" element="H" />
    <PixelAtom class="atom atom--h atom--left" element="H" />
    <PixelAtom class="atom atom--h atom--bottom" element="H" />
  </div>
</template>

<script setup lang="ts">
import PixelAtom from '../pixel/PixelAtom.vue'

const bonds = ['bond--top', 'bond--left', 'bond--bottom']
</script>

<style scoped>
.molecule {
  position: absolute;
  z-index: 4;
  top: 30%;
  left: 43%;
  width: clamp(380px, 36vw, 580px);
  aspect-ratio: 1 / 1;
}

.atom {
  position: absolute;
  z-index: 3;
}

.atom--n {
  top: 25%;
  left: 25%;
  width: 48%;
}

.atom--h {
  width: 24%;
}

.atom--top { top: 0; left: 66%; }
.atom--left { top: 57%; left: 0; }
.atom--bottom { right: 0; bottom: 0; }

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
  border: 1px solid #ffffff;
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

@media (max-width: 1100px) {
  .molecule {
    left: 41%;
    width: 44vw;
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
</style>

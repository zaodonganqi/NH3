<template>
  <span class="pixel-atom" :class="`pixel-atom--${element.toLowerCase()}`">
    <PixelArt class="pixel-atom__body" :pattern="bodyPattern" :palette="bodyPalette" />
    <PixelArt class="pixel-atom__letter" :pattern="letterPattern" :palette="palettes.white" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { palettes } from '../../config/site'
import PixelArt from './PixelArt.vue'

const props = defineProps<{
  element: 'N' | 'H'
}>()

const createCircle = (size: number) => {
  const center = (size - 1) / 2
  const radius = center - 0.25

  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      if (Math.hypot(x - center, y - center) > radius) {
        return '.'
      }

      return y < center ? '2' : '1'
    }).join(''),
  )
}

const hydrogenBody = createCircle(15)
const nitrogenBody = createCircle(21)
const hydrogenLetter = [
  '11...11',
  '11...11',
  '11...11',
  '1111111',
  '1111111',
  '11...11',
  '11...11',
  '11...11',
  '11...11',
]
const nitrogenLetter = [
  '11.....11',
  '111....11',
  '1111...11',
  '11.11..11',
  '11..11.11',
  '11...1111',
  '11....111',
  '11.....11',
  '11.....11',
]

const bodyPattern = computed(() => props.element === 'N' ? nitrogenBody : hydrogenBody)
const letterPattern = computed(() => props.element === 'N' ? nitrogenLetter : hydrogenLetter)
const bodyPalette = computed(() => props.element === 'N' ? palettes.nitrogen : palettes.hydrogen)
</script>

<style scoped>
.pixel-atom {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
}

.pixel-atom__body,
.pixel-atom__letter {
  position: absolute;
}

.pixel-atom__body {
  inset: 0;
}

.pixel-atom--h .pixel-atom__letter {
  top: 20%;
  left: 27%;
  width: 46%;
}

.pixel-atom--n .pixel-atom__letter {
  top: 28%;
  left: 29%;
  width: 42%;
}
</style>

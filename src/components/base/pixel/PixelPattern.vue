<template>
  <span class="pixel-pattern" :style="{ '--columns': pattern[0]?.length ?? 1 }" aria-hidden="true">
    <template v-for="(row, rowIndex) in pattern" :key="rowIndex">
      <i
        v-for="(cell, columnIndex) in [...row]"
        :key="`${rowIndex}-${columnIndex}`"
        :class="{ 'pixel--filled': cell !== '.' }"
        :style="cell === '.' ? undefined : { backgroundColor: palette[cell] }"
      ></i>
    </template>
  </span>
</template>

<script setup lang="ts">
import type { PixelPalette } from '../../../types'

// 字符图案和调色板共同决定每个方格是否填充及其颜色。
defineProps<{
  pattern: string[]
  palette: PixelPalette
}>()
</script>

<style scoped>
.pixel-pattern {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  image-rendering: pixelated;
}

i {
  display: block;
  aspect-ratio: 1 / 1;
}

.pixel--filled {
  border: 1px solid #ffffff;
}
</style>
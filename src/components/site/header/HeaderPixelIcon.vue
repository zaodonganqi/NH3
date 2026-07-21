<template>
  <span
    class="header-pixel-icon"
    :style="{
      '--columns': pattern[0]?.length ?? 1,
      '--rows': pattern.length,
    }"
    aria-hidden="true"
  >
    <template v-for="(row, rowIndex) in pattern" :key="rowIndex">
      <i
        v-for="(cell, columnIndex) in [...row]"
        :key="[rowIndex, columnIndex].join('-')"
        :class="{
          'pixel--filled': cell !== '.',
          'pixel--right': cell !== '.' && row[columnIndex + 1] !== '.',
          'pixel--bottom':
            cell !== '.' && pattern[rowIndex + 1]?.[columnIndex] !== '.',
        }"
      ></i>
    </template>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  /**
   * 固定像素图标的字符矩阵；点号表示透明格，其他字符表示填充格。
   */
  pattern: readonly string[]
}>()
</script>

<style scoped>
.header-pixel-icon {
  --pixel-size: 4px;
  display: grid;
  width: 40px;
  height: 40px;
  grid-template-columns: repeat(var(--columns), var(--pixel-size));
  grid-template-rows: repeat(var(--rows), var(--pixel-size));
  place-content: center;
  color: inherit;
  image-rendering: pixelated;
}

i {
  position: relative;
  display: block;
  width: var(--pixel-size);
  height: var(--pixel-size);
}

.pixel--filled {
  background: currentColor;
}

.pixel--right::before,
.pixel--bottom::after {
  position: absolute;
  z-index: 1;
  display: block;
  content: "";
  background: #ffffff;
  pointer-events: none;
}

.pixel--right::before {
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
}

.pixel--bottom::after {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
}
</style>
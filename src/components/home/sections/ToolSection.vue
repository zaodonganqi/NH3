<template>
  <section id="tool" class="content-section tool-section reveal-section">
    <div class="tool-heading">
      <p class="section-kicker">TOOL / 前端工具</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="TOOL"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>

    <div class="tool-entry-list" aria-label="工具入口预留区域">
      <button
        v-for="slot in toolSlots"
        :key="slot"
        class="tool-entry"
        type="button"
        disabled
      >
        <span class="tool-entry__index">{{ slot }}</span>
        <span class="tool-entry__mark" aria-hidden="true">+</span>
        <strong>TOOL ENTRY</strong>
        <small>UNASSIGNED</small>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PixelText } from '../../base/pixel'

// 四个禁用入口只保留未来工具位置，不预设工具名称和功能。
const toolSlots = ['01', '02', '03', '04']
</script>

<style scoped>
.tool-section {
  display: grid;
  min-height: 760px;
  grid-template-columns: minmax(320px, 0.8fr) minmax(560px, 1.2fr);
  gap: 8vw;
  align-items: center;
}

.tool-heading {
  min-width: 0;
}

.tool-entry-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(230px, 1fr));
  border-top: 1px solid #d9e2f5;
  border-left: 1px solid #d9e2f5;
}

.tool-entry {
  position: relative;
  display: grid;
  min-height: 190px;
  padding: 24px;
  border: 0;
  border-right: 1px solid #d9e2f5;
  border-bottom: 1px solid #d9e2f5;
  align-content: end;
  justify-items: start;
  color: #8898b7;
  background: #ffffff;
  cursor: not-allowed;
  text-align: left;
}

.tool-entry__index {
  position: absolute;
  top: 20px;
  left: 22px;
  color: #b2bfd8;
  font-size: 11px;
}

.tool-entry__mark {
  position: absolute;
  top: 18px;
  right: 22px;
  color: #7ccfca;
  font-size: 24px;
  line-height: 1;
}

.tool-entry strong {
  color: #6076ad;
  font-size: 16px;
}

.tool-entry small {
  margin-top: 8px;
  font-size: 10px;
}
</style>
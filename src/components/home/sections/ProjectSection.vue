<template>
  <section id="project" class="content-section project-section reveal-section">
    <div class="project-heading">
      <p class="section-kicker">PROJECT / 关联项目</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="PROJECT"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>

    <div class="project-field" aria-label="项目链接预留区域">
      <article
        v-for="slot in projectSlots"
        :key="slot"
        class="project-window"
      >
        <header>
          <span>CONNECTION {{ slot }}</span>
          <i aria-hidden="true"></i>
        </header>
        <div class="project-window__body">
          <span>EMPTY WINDOW</span>
        </div>
        <footer>NO LINK ASSIGNED</footer>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PixelText } from '../../base/pixel'

// 三个错位窗口为未来关联项目保留独立展示位置。
const projectSlots = ['01', '02', '03']
</script>

<style scoped>
.project-section {
  min-height: 880px;
}

.project-heading {
  position: relative;
  z-index: 2;
  width: min(42%, 560px);
}

.project-field {
  position: absolute;
  top: 112px;
  right: 7%;
  bottom: 92px;
  width: 53%;
}

.project-window {
  position: absolute;
  display: grid;
  width: min(58%, 360px);
  min-height: 230px;
  grid-template-rows: 34px 1fr 32px;
  border: 1px solid #cbd7f2;
  background:
    linear-gradient(#ffffffeb, #ffffffeb),
    repeating-linear-gradient(0deg, #e9eef9 0 1px, transparent 1px 16px),
    repeating-linear-gradient(90deg, #e9eef9 0 1px, transparent 1px 16px);
  box-shadow: 12px 12px 0 #f1f4fb;
}

.project-window:nth-child(1) {
  top: 2%;
  left: 4%;
}

.project-window:nth-child(2) {
  top: 34%;
  right: 0;
  width: min(62%, 390px);
}

.project-window:nth-child(3) {
  bottom: 0;
  left: 12%;
  width: min(52%, 330px);
}

.project-window header,
.project-window footer {
  display: flex;
  padding: 0 12px;
  align-items: center;
  color: #7c8daf;
  font-size: 10px;
  font-weight: 800;
}

.project-window header {
  justify-content: space-between;
  border-bottom: 1px solid #dce4f6;
}

.project-window header i {
  width: 7px;
  aspect-ratio: 1;
  background: #8dd5d1;
  box-shadow: 11px 0 #96a7ed, 22px 0 #efacd0;
}

.project-window footer {
  border-top: 1px solid #dce4f6;
}

.project-window__body {
  display: grid;
  place-items: center;
}

.project-window__body span {
  color: #c0cbe1;
  font-size: 12px;
  font-weight: 800;
}
</style>
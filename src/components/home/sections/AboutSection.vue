<template>
  <section id="about" class="content-section about-section reveal-section">
    <div class="about-heading">
      <p class="section-kicker">ABOUT / 关于</p>
      <h2>
        <PixelText
          class="section-pixel-title"
          text="ABOUT"
          :density="18"
          color="linear-gradient(100deg, #3d5dcc 0%, #5977e0 54%, #2da7a1 100%)"
        />
      </h2>
    </div>

    <div class="about-space" aria-label="关于页面预留设计区域">
      <i aria-hidden="true"></i>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PixelText } from '../../base/pixel'
</script>

<style scoped>
.about-section {
  min-height: 820px;
}

.about-heading {
  position: relative;
  z-index: 2;
  width: min(46%, 620px);
}

.about-space {
  position: absolute;
  top: 96px;
  right: 7%;
  bottom: 82px;
  left: 38%;
  border: 1px dashed #ccd7ee;
  background:
    linear-gradient(90deg, transparent 49.9%, #edf1f8 50%, transparent 50.1%),
    linear-gradient(transparent 49.9%, #edf1f8 50%, transparent 50.1%);
  background-size: 32px 32px;
}


.about-space i {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 10px;
  aspect-ratio: 1;
  background: #7bcfca;
  box-shadow: -16px 0 #91a3ec, 0 -16px #efafd1;
}
</style>
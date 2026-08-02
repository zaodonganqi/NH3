<template>
  <section
    :id="homeSections.about.id"
    class="about-section"
    aria-hidden="true"
  ></section>
</template>

<script setup lang="ts">
import { homeSections } from '../../../config/home'
</script>

<style scoped>
.about-section {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
}
</style>

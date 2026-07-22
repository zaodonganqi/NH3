<template>
  <footer class="site-footer">
    <span class="site-footer__rail" aria-hidden="true">
      <i v-for="index in 9" :key="`left-${index}`"></i>
    </span>
    <p>CREATED BY NH3 · BUILT WITH VUE · 2026</p>
    <span class="site-footer__rail" aria-hidden="true">
      <i v-for="index in 9" :key="`right-${index}`"></i>
    </span>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  min-height: 132px;
  padding: 24px;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border-top: 1px solid #e8edf8;
  color: #8c9bb9;
  background: #ffffff;
  text-align: center;
}

.site-footer p {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
}

.site-footer__rail {
  display: flex;
  gap: 3px;
}

.site-footer__rail i {
  width: 6px;
  aspect-ratio: 1;
  background: #8196ed;
  box-shadow: inset 0 0 0 1px #ffffff;
}

.site-footer__rail i:nth-child(3n + 2) {
  background: #68c9c4;
}

.site-footer__rail i:nth-child(3n) {
  background: #eaa4ca;
}

@media (max-width: 560px) {
  .site-footer {
    gap: 12px;
  }

  .site-footer__rail i:nth-child(n + 6) {
    display: none;
  }
}
</style>

<template>
  <main class="page">
    <article class="markdown-body" v-html="html"></article>
  </main>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import plan from './assets/plan.md?raw'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const html = md.render(plan)
</script>

<style>
:root {
  color: #1f2933;
  background: #f7f6f2;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

#app {
  min-height: 100vh;
}

.page {
  box-sizing: border-box;
  width: 600px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 64px 0 96px;
}

.markdown-body {
  line-height: 1.78;
  font-size: 16px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: #111827;
  line-height: 1.35;
  letter-spacing: 0;
}

.markdown-body h1 {
  margin: 0 0 32px;
  font-size: 34px;
  font-weight: 750;
}

.markdown-body h2 {
  margin: 40px 0 14px;
  padding-top: 4px;
  font-size: 22px;
  font-weight: 700;
}

.markdown-body h3 {
  margin: 28px 0 12px;
  font-size: 18px;
}

.markdown-body p {
  margin: 0 0 18px;
}

.markdown-body ul,
.markdown-body ol {
  margin: 0 0 20px;
  padding-left: 1.4em;
}

.markdown-body li {
  margin: 8px 0;
}

.markdown-body a {
  color: #2563eb;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.markdown-body blockquote {
  margin: 24px 0;
  padding: 2px 0 2px 18px;
  color: #4b5563;
  border-left: 3px solid #c6a15b;
}

.markdown-body code {
  padding: 0.15em 0.35em;
  border-radius: 4px;
  background: #ece7dd;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.92em;
}
</style>

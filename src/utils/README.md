# 像素画工具

这个工具按统一默认规则把文本或图片转换为硬边正方形像素网格。正常页面不需要配置像素尺寸、阈值、颜色或白色边线。

## 文本

```ts
import { pixelateText } from '@/utils'

const art = await pixelateText('躁动的氨气')
art.render(canvas)
```

Vue 3 中只需要准备一个 Canvas：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { pixelateText } from '@/utils'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  const art = await pixelateText('躁动的氨气')

  if (canvasRef.value) {
    art.render(canvasRef.value)
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="pixel-canvas"></canvas>
</template>

<style scoped>
.pixel-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  image-rendering: pixelated;
}
</style>
```

## 图片

```ts
import imageUrl from '@/assets/img/personal.png?url'
import { pixelateImage } from '@/utils'

const art = await pixelateImage(imageUrl)
art.render(canvas)
```

外部图片必须允许跨域 Canvas 读取。浏览器能够显示图片，不代表 Canvas 有权读取其像素；来源服务器需要提供正确的 CORS 响应头。

## 统一默认行为

- 自动像素尺寸只根据前景笔画的稳定厚度确定，不会被更窄的内部空隙压小。
- 文本只执行统一覆盖率采样，生成后不会再删除任何前景格；空白通道修复只用于图片。
- `pixelSize` 始终表示彩色像素块自身的边长，边线不会占用或缩小这个尺寸。
- 文本默认使用项目统一的红、黄、绿色渐变。
- 图片默认保留来源颜色。
- 白线只显示在相邻前景像素的共享边上，最外圈接触背景的边默认不显示。
- 自动裁掉外围空白并保留一格安全距离。

## 输出对象

```ts
const art = await pixelateText('NH3')

art.render(existingCanvas)
const canvas = art.toCanvas()
const pngDataUrl = art.toDataURL('image/png')

console.log(art.columns)
console.log(art.rows)
console.log(art.sourcePixelSize)
```

## 特殊情况

公开函数仍接受第二个可选参数，但它只作为特殊图片、字体或导出需求的逃生口。常规页面应先使用零配置调用，不要为每段文字重复设置阈值和视觉样式。

```ts
const art = await pixelateText('小字号文本', {
  fontSize: 36,
})
```

统一默认值集中在 `pixel-art.ts` 内部，调整站点整体像素风格时只修改一处。

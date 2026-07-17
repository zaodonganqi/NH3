# 像素画工具

这个工具按统一默认规则把文本或图片转换为硬边正方形像素网格。正常页面不需要配置像素尺寸、阈值、颜色、描边或分隔线。

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

- 自动识别前景笔画的稳定厚度。
- 自动检测被前景夹住的背景间隙，并在生成网格时强制保留，避免字孔和笔画间距粘连。
- 每个输出像素都是完整正方形，不保留抗锯齿过渡。
- 文本默认使用项目统一的红、黄、绿色渐变。
- 图片默认保留来源颜色。
- 图形默认使用一格深色外轮廓。
- 相邻前景像素默认使用单条白色共享边界，不会把每格包成独立小点。
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

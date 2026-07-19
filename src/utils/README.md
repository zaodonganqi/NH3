# 像素画工具

文本工具使用固定的 400 字重，并根据 `fontSize / density` 推导来源网格。常规调用不需要接触方块尺寸、采样阈值或 DPR 参数。

## 基础用法

```ts
import { pixelateText } from '@/utils'

const art = await pixelateText('躁动的氨气')
art.render(canvas)
```

Canvas 的最终区域由外部 CSS 决定，工具会按当前 DPR 使用整数方块完整放入并居中：

```css
.pixel-canvas {
  display: block;
  width: 100%;
  height: 240px;
  color: #617cf4;
  image-rendering: pixelated;
}
```

当 Canvas 尺寸变化时再次执行 `art.render(canvas)` 即可。Vue 页面可以在 `ResizeObserver` 或窗口 resize 回调中重绘。

## 文本样式

文本函数只保留与普通文字样式相同的参数；字重固定为 400，不再暴露无效的 `fontWeight`：

```ts
const art = await pixelateText('PIXEL TYPE', {
  fontFamily: 'SimSun, serif',
  fontSize: 92,
  fontStyle: 'normal',
  letterSpacing: -2,
  lineHeight: 108,
  textAlign: 'center',
  color: '#617cf4',
  density: 16,
})
```

`fontSize` 表示与普通文字一致的最终字号，`density` 表示每个 em 沿单轴采样的逻辑格数量。密度越高，方块越小且数量越多；密度越低，方块越大且数量越少。方块尺寸由这两个参数推导，不作为公开配置。

Canvas 空间不足时只会按比例缩小以避免溢出，不会改变文字掩码。

## 输出

```ts
art.render(existingCanvas)
const outputCanvas = art.toCanvas()
const pngDataUrl = art.toDataURL('image/png')
const pattern = art.toPattern()
```

离屏 Canvas 和 PNG 使用紧凑的原始整数尺寸，不受页面 CSS 或浏览器缩放影响。

## 图片

```ts
import { pixelateImage } from '@/utils'

const art = await pixelateImage(imageUrl)
art.render(canvas)
```

图片默认保留来源颜色。外部图片服务器必须允许跨域 Canvas 读取。

## 固定视觉规则

- 文本网格由 `fontSize / density` 推导，覆盖率阈值固定为 `0.16`。
- 每个彩色像素块都是正方形。
- 文本内部白线默认使用 `0.5px` 逻辑宽度，只绘制在相邻前景方块之间，不绘制字符外轮廓。
- 白线按 DPR 量化为完整物理像素；DPR 1 下最细只能稳定显示为 1 个物理像素。
- 浏览器缩放时按物理像素量化方块和内部白线。
- 外围空白会被裁掉，并保留一格安全距离。

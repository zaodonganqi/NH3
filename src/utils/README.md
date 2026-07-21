# 像素画工具

文本工具使用固定的 400 字重，并根据真实 `fontSize` 和密度上限推导来源网格。常规调用不需要接触方块尺寸、采样阈值或 DPR 参数。

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
  fontSize: 20,
  fontStyle: 'normal',
  letterSpacing: 0,
  lineHeight: 24,
  textAlign: 'center',
  color: '#617cf4',
  density: 16,
})
```

`fontSize` 表示与普通文字一致的真实字号。`density` 是每个 em 沿单轴允许使用的最大逻辑格数，不是固定格数；来源格默认不会小于 `3px`，因此小字号会自动降低实际密度，保持清晰的像素颗粒。方块尺寸由这两个参数推导，不作为公开配置。

Canvas 空间不足时只会按比例缩小以避免溢出，不会改变文字掩码。

### 文本专用参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fontFamily` | `string` | `SimSun, "Songti SC", serif` | 绘制来源文字使用的 CSS 字体族。 |
| `fontSize` | `number` | `16` | 来源文字字号，单位为 CSS 像素，必须大于 0。 |
| `fontStyle` | `'normal' \| 'italic' \| 'oblique'` | `'normal'` | 来源文字字形样式。 |
| `letterSpacing` | `number` | `0` | 字符之间追加的 CSS 像素间距。 |
| `lineHeight` | `number` | 字号的 `1.2` 倍 | 多行文字的基线间距，单位为 CSS 像素。 |
| `textAlign` | `'left' \| 'center' \| 'right'` | `'center'` | 多行宽度不一致时在来源画布内采用的水平对齐方式。 |
| `color` | `PixelPaint` | `#617cf4` | 文字像素填充，支持纯色及受支持的 CSS 渐变。 |
| `density` | `number` | `16` | 每个 em 沿单轴允许的最大逻辑格数量；越大采样越细。 |
| `signal` | `AbortSignal` | 无 | 取消字体加载和文本栅格化任务。 |

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

### 共享网格参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pixelSize` | `number \| 'auto'` | `'auto'` | 每个逻辑格覆盖的来源正方形边长，单位为来源像素；它控制采样粗细，不等于组件最终 CSS 尺寸。 |
| `minPixelSize` | `number` | `2` | 自动估算允许的最小来源格边长，必须为正整数。 |
| `maxPixelSize` | `number` | `12` | 自动估算允许的最大来源格边长，必须为正整数且不小于 `minPixelSize`。 |
| `coverageThreshold` | `number` | 图片 `0.42`，文本 `0.16` | 一个来源格被保留所需的前景覆盖比例，范围为 0 至 1；越低越容易保留细节和噪点。 |
| `alphaThreshold` | `number` | `0.5` | 来源像素进入前景检测所需的最小透明度，范围为 0 至 1。 |
| `padding` | `number` | 图片 `1`，文本 `0` | 裁剪后四周保留的空白逻辑格数量，必须为非负整数。 |
| `trim` | `boolean` | `true` | 是否裁掉来源位图外围的空白区域。 |
| `color` | `PixelPaint \| 'source'` | 图片 `'source'` | 前景填充；图片可保留逐格来源色，也可使用纯色或受支持的 CSS 渐变覆盖。 |
| `background` | `PixelPaint \| null` | `null` | 完整逻辑网格的背景填充，省略或传入 `null` 时保持透明。 |
| `pixelBorder` | `false \| PixelBorderOptions` | 图片 `1px` 白线 | 相邻前景格之间的共享分隔线；`false` 表示关闭。 |
| `pixelBorder.width` | `number` | 图片 `1`，文本 `0.5` | 分隔线逻辑宽度，必须大于 0。 |
| `pixelBorder.color` | `PixelPaint` | `#ffffff` | 分隔线颜色，支持纯色及受支持的 CSS 渐变。 |

### 图片专用参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sourceBackground` | `'auto' \| 'transparent' \| string` | `'auto'` | 自动从四边推断背景、仅按透明度识别，或使用明确的 CSS 背景色。 |
| `backgroundThreshold` | `number` | `0.08` | 来源颜色与背景色之间被视为前景所需的最小归一化色差，范围为 0 至 1。 |
| `crossOrigin` | `'' \| 'anonymous' \| 'use-credentials'` | `'anonymous'` | 图片元素的 CORS 模式；服务器仍需返回允许 Canvas 读取的响应头。 |
| `maxWidth` | `number` | `2048` | 采样前允许的最大来源位图宽度，只缩小不放大。 |
| `maxHeight` | `number` | `2048` | 采样前允许的最大来源位图高度，只缩小不放大。 |
| `signal` | `AbortSignal` | 无 | 取消图片加载、解码和栅格化任务。 |

## 固定视觉规则

- 文本网格由真实字号和密度上限推导，来源格默认至少为 `3px`，覆盖率阈值固定为 `0.16`。
- 每个彩色像素块都是正方形。
- 文本内部白线默认使用 `0.5px` 逻辑宽度，只绘制在相邻前景方块之间，不绘制字符外轮廓。
- 白线按 DPR 量化为完整物理像素；DPR 1 下最细只能稳定显示为 1 个物理像素。
- 浏览器缩放时按物理像素量化方块和内部白线。
- 外围空白会被裁掉，并保留一格安全距离。

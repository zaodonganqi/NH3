/**
 * 文本与图片的像素画生成、颜色覆盖和 Canvas 渲染工具。
 *
 * 本模块把浏览器可绘制内容转为硬边正方形网格；调用示例见同目录 README.md。
 */
/**
 * 描述像素填充、背景或描边使用的 CSS 颜色字符串。
 */
export type PixelPaint = string
/**
 * 限定像素描边相对前景网格的位置。
 */
export type PixelOutlinePosition = 'inside' | 'outside' | 'center'
/**
 * 描述图片前景识别采用的背景来源。
 */
export type PixelSourceBackground = SourceBackground

/**
 * 配置像素画的硬边描边。
 */
export interface PixelOutlineOptions {
  width?: number
  color?: PixelPaint
  position?: PixelOutlinePosition
}

/**
 * 配置每个前景像素内部使用的分隔边线。
 */
export interface PixelBorderOptions {
  width?: number
  color?: PixelPaint
}

/**
 * 收集生成和渲染阶段共享的颜色配置。
 */
interface PixelStyleOptions {
  color?: PixelPaint | 'source'
  background?: PixelPaint | null
  outline?: false | PixelOutlineOptions
  pixelBorder?: false | PixelBorderOptions
}

/**
 * 配置 PixelArt 对象当前一次的 Canvas 渲染。
 */
export interface PixelRenderOptions extends PixelStyleOptions {
  pixelSize?: number
}

/**
 * 配置前景检测和正方形网格生成。
 */
export interface PixelGridOptions extends PixelStyleOptions {
  pixelSize?: number | 'auto'
  minPixelSize?: number
  maxPixelSize?: number
  coverageThreshold?: number
  alphaThreshold?: number
  padding?: number
  trim?: boolean
}

/**
 * 配置文本源的字体测量和像素化过程。
 */
export interface PixelTextOptions extends PixelGridOptions {
  fontFamily?: string
  fontSize?: number
  fontStyle?: 'normal' | 'italic' | 'oblique'
  fontWeight?: number | string
  letterSpacing?: number
  lineHeight?: number
  awaitFont?: boolean
  signal?: AbortSignal
}

/**
 * 配置图片加载、背景识别和像素化过程。
 */
export interface PixelImageOptions extends PixelGridOptions {
  sourceBackground?: PixelSourceBackground
  backgroundThreshold?: number
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  maxWidth?: number
  maxHeight?: number
  signal?: AbortSignal
}

/**
 * 文本和图片共享的统一像素视觉默认值。
 */
const DEFAULT_PIXEL_STYLE: PixelGridOptions = {
  pixelSize: 'auto',
  minPixelSize: 2,
  maxPixelSize: 12,
  coverageThreshold: 0.42,
  alphaThreshold: 0.5,
  padding: 1,
  trim: true,
  outline: {
    width: 1,
    position: 'outside',
    color: '#10212b',
  },
  pixelBorder: {
    width: 1,
    color: '#ffffff',
  },
}

/**
 * 普通文本在零配置调用时使用的统一字体和渐变。
 */
const DEFAULT_TEXT_OPTIONS: PixelTextOptions = {
  ...DEFAULT_PIXEL_STYLE,
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  fontSize: 52,
  fontWeight: 900,
  letterSpacing: 1,
  color: 'linear-gradient(90deg, #ff315f 0%, #ffb84d 46%, #39c6a3 100%)',
}

/**
 * 图片在零配置调用时使用的统一来源颜色和背景识别方式。
 */
const DEFAULT_IMAGE_OPTIONS: PixelImageOptions = {
  ...DEFAULT_PIXEL_STYLE,
  color: 'source',
  sourceBackground: 'auto',
}

/**
 * 描述一个有效前景像素格的位置和来源颜色。
 */
export interface PixelArtCell {
  x: number
  y: number
  color: string
}

/**
 * 描述一次渲染的逻辑网格和实际位图尺寸。
 */
export interface PixelArtDimensions {
  width: number
  height: number
  columns: number
  rows: number
  pixelSize: number
}

/**
 * 保存 PixelArt 对象的默认渲染样式。
 */
interface PixelArtStyle {
  pixelSize: number
  color: PixelPaint | 'source'
  background?: PixelPaint
  outline: false | Required<PixelOutlineOptions>
  pixelBorder: false | Required<PixelBorderOptions>
}

/**
 * 保存经过校验的栅格参数和默认样式。
 */
interface ResolvedGridOptions {
  raster: RasterOptions
  style: Omit<PixelArtStyle, 'pixelSize'>
}

/**
 * 描述加入描边后的输出网格映射。
 */
interface OutlineLayout {
  columns: number
  rows: number
  sourceIndexes: Int32Array
  outlineMask: Uint8Array
}

/**
 * 保存可重复渲染的像素网格对象。
 */
export class PixelArt {
  readonly columns: number
  readonly rows: number
  readonly sourcePixelSize: number

  private readonly mask: Uint8Array
  private readonly colors: string[]
  private readonly style: PixelArtStyle

  /**
   * 复制并校验基础网格和默认样式。
   */
  constructor(data: PixelGridData, style: PixelArtStyle) {
    const expectedLength = data.columns * data.rows

    assertPositiveInteger(data.columns, 'data.columns')
    assertPositiveInteger(data.rows, 'data.rows')
    assertPositiveInteger(data.sourcePixelSize, 'data.sourcePixelSize')

    if (data.mask.length !== expectedLength || data.colors.length !== expectedLength) {
      throw new Error('Pixel grid mask and color data must match its dimensions.')
    }

    this.columns = data.columns
    this.rows = data.rows
    this.sourcePixelSize = data.sourcePixelSize
    this.mask = data.mask.slice()
    this.colors = [...data.colors]
    this.style = {
      ...style,
      outline: style.outline === false ? false : { ...style.outline },
      pixelBorder:
        style.pixelBorder === false ? false : { ...style.pixelBorder },
    }
  }

  /**
   * 返回所有有效前景格的快照。
   */
  get cells(): PixelArtCell[] {
    const cells: PixelArtCell[] = []

    for (let index = 0; index < this.mask.length; index += 1) {
      if (this.mask[index] !== 0) {
        cells.push({
          x: index % this.columns,
          y: Math.floor(index / this.columns),
          color: this.colors[index],
        })
      }
    }

    return cells
  }

  /**
   * 计算指定渲染配置下的最终尺寸。
   */
  getDimensions(options: PixelRenderOptions = {}): PixelArtDimensions {
    const resolved = resolveRenderOptions(this.style, options)
    const outsideWidth = getOutsideWidth(resolved.outline)
    const columns = this.columns + outsideWidth * 2
    const rows = this.rows + outsideWidth * 2

    return {
      width: columns * resolved.pixelSize,
      height: rows * resolved.pixelSize,
      columns,
      rows,
      pixelSize: resolved.pixelSize,
    }
  }

  /**
   * 把当前像素网格绘制到指定 Canvas。
   */
  render(canvas: HTMLCanvasElement, options: PixelRenderOptions = {}): HTMLCanvasElement {
    const resolved = resolveRenderOptions(this.style, options)
    const dimensions = this.getDimensions(resolved)
    const context = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
    })

    if (!context) {
      throw new Error('The browser could not create a 2D canvas context.')
    }

    canvas.width = dimensions.width
    canvas.height = dimensions.height
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false

    const layout = createOutlineLayout(
      this.mask,
      this.columns,
      this.rows,
      resolved.outline,
    )
    const fillPalette =
      resolved.color === 'source'
        ? undefined
        : createPixelPalette(resolved.color, layout.columns, layout.rows)
    const outlinePalette =
      resolved.outline === false
        ? undefined
        : createPixelPalette(resolved.outline.color, layout.columns, layout.rows)
    const backgroundPalette = resolved.background
      ? createPixelPalette(resolved.background, layout.columns, layout.rows)
      : undefined
    const pixelBorderPalette =
      resolved.pixelBorder === false
        ? undefined
        : createPixelPalette(
            resolved.pixelBorder.color,
            layout.columns,
            layout.rows,
          )

    for (let y = 0; y < layout.rows; y += 1) {
      for (let x = 0; x < layout.columns; x += 1) {
        const outputIndex = y * layout.columns + x
        const targetX = x * resolved.pixelSize
        const targetY = y * resolved.pixelSize

        if (backgroundPalette) {
          fillSquare(
            context,
            targetX,
            targetY,
            resolved.pixelSize,
            backgroundPalette[outputIndex],
          )
        }

        if (layout.outlineMask[outputIndex] !== 0 && outlinePalette) {
          fillSquare(
            context,
            targetX,
            targetY,
            resolved.pixelSize,
            outlinePalette[outputIndex],
          )
          continue
        }

        const sourceIndex = layout.sourceIndexes[outputIndex]

        if (sourceIndex < 0 || this.mask[sourceIndex] === 0) {
          continue
        }

        fillSquare(
          context,
          targetX,
          targetY,
          resolved.pixelSize,
          fillPalette?.[outputIndex] ?? this.colors[sourceIndex],
        )
      }
    }

    if (pixelBorderPalette && resolved.pixelBorder !== false) {
      drawPixelBorders(
        context,
        layout,
        this.mask,
        resolved.pixelSize,
        pixelBorderPalette,
        resolved.pixelBorder.width,
      )
    }

    return canvas
  }

  /**
   * 创建并返回已经完成绘制的新 Canvas。
   */
  toCanvas(options: PixelRenderOptions = {}): HTMLCanvasElement {
    if (typeof document === 'undefined') {
      throw new Error('Pixel art rendering requires a browser DOM with Canvas support.')
    }

    return this.render(document.createElement('canvas'), options)
  }

  /**
   * 把当前像素画导出为浏览器 Data URL。
   */
  toDataURL(
    type = 'image/png',
    quality?: number,
    options: PixelRenderOptions = {},
  ): string {
    return this.toCanvas(options).toDataURL(type, quality)
  }
}

/**
 * 集中保存可复用的默认生成配置。
 */
export class PixelArtGenerator {
  private readonly defaults: PixelGridOptions

  /**
   * 创建带默认网格和样式配置的生成器。
   */
  constructor(defaults: PixelGridOptions = {}) {
    this.defaults = { ...defaults }
  }

  /**
   * 把普通字体文本转换为硬边像素画对象。
   */
  async fromText(text: string, options: PixelTextOptions = {}): Promise<PixelArt> {
    const merged = { ...DEFAULT_TEXT_OPTIONS, ...this.defaults, ...options }
    const resolved = resolveGridOptions(merged, '#000000')
    const data = await rasterizeText(text, {
      ...merged,
      ...resolved.raster,
    } as TextRasterOptions)

    return new PixelArt(data, {
      ...resolved.style,
      pixelSize: data.sourcePixelSize,
    })
  }

  /**
   * 加载图片地址并转换为硬边像素画对象。
   */
  async fromImage(source: string, options: PixelImageOptions = {}): Promise<PixelArt> {
    const merged = { ...DEFAULT_IMAGE_OPTIONS, ...this.defaults, ...options }
    const resolved = resolveGridOptions(merged, 'source')
    const data = await rasterizeImage(source, {
      ...merged,
      ...resolved.raster,
    } as ImageRasterOptions)

    return new PixelArt(data, {
      ...resolved.style,
      pixelSize: data.sourcePixelSize,
    })
  }
}

/**
 * 使用临时生成器把文本转换为 PixelArt。
 */
export const pixelateText = (text: string, options?: PixelTextOptions) =>
  new PixelArtGenerator().fromText(text, options)

/**
 * 使用临时生成器把图片地址转换为 PixelArt。
 */
export const pixelateImage = (source: string, options?: PixelImageOptions) =>
  new PixelArtGenerator().fromImage(source, options)

/**
 * 校验并补全外部网格配置。
 */
function resolveGridOptions(
  options: PixelGridOptions,
  defaultColor: PixelPaint | 'source',
): ResolvedGridOptions {
  const pixelSize = options.pixelSize ?? 'auto'
  const minPixelSize = options.minPixelSize ?? 1
  const maxPixelSize = options.maxPixelSize ?? 64
  const padding = options.padding ?? 0

  if (pixelSize !== 'auto') {
    assertPositiveInteger(pixelSize, 'pixelSize')
  }

  assertPositiveInteger(minPixelSize, 'minPixelSize')
  assertPositiveInteger(maxPixelSize, 'maxPixelSize')
  assertNonNegativeInteger(padding, 'padding')

  if (minPixelSize > maxPixelSize) {
    throw new Error('minPixelSize cannot be greater than maxPixelSize.')
  }

  return {
    raster: {
      pixelSize,
      minPixelSize,
      maxPixelSize,
      coverageThreshold: clamp(options.coverageThreshold ?? 0.35, 0.01, 1),
      alphaThreshold: clamp(options.alphaThreshold ?? 0.5, 0.01, 1),
      padding,
      trim: options.trim ?? true,
    },
    style: {
      color: options.color ?? defaultColor,
      background: options.background ?? undefined,
      outline: resolveOutline(options.outline),
      pixelBorder: resolvePixelBorder(options.pixelBorder),
    },
  }
}

/**
 * 合并默认样式与单次渲染覆盖项。
 */
function resolveRenderOptions(
  style: PixelArtStyle,
  options: PixelRenderOptions,
): PixelArtStyle {
  const pixelSize = options.pixelSize ?? style.pixelSize
  assertPositiveInteger(pixelSize, 'pixelSize')

  const pixelBorder =
    options.pixelBorder === undefined
      ? style.pixelBorder
      : resolvePixelBorder(options.pixelBorder)

  if (pixelBorder !== false && pixelBorder.width >= pixelSize) {
    throw new Error(
      'pixelBorder.width must be smaller than pixelSize.',
    )
  }

  return {
    pixelSize,
    color: options.color ?? style.color,
    background:
      options.background === undefined
        ? style.background
        : options.background ?? undefined,
    outline:
      options.outline === undefined
        ? style.outline
        : resolveOutline(options.outline),
    pixelBorder,
  }
}

/**
 * 把像素分隔边线配置转换为内部完整结构。
 */
function resolvePixelBorder(
  pixelBorder: false | PixelBorderOptions | undefined,
): false | Required<PixelBorderOptions> {
  if (pixelBorder === false || pixelBorder === undefined) {
    return false
  }

  const width = pixelBorder.width ?? 1
  assertPositiveInteger(width, 'pixelBorder.width')

  return {
    width,
    color: pixelBorder.color ?? '#ffffff',
  }
}

/**
 * 把可选描边配置转换为内部完整结构。
 */
function resolveOutline(
  outline: false | PixelOutlineOptions | undefined,
): false | Required<PixelOutlineOptions> {
  if (outline === false || outline === undefined) {
    return false
  }

  const width = outline.width ?? 1
  assertPositiveInteger(width, 'outline.width')

  return {
    width,
    color: outline.color ?? '#000000',
    position: outline.position ?? 'outside',
  }
}

/**
 * 扩展网格并标记内外侧描边像素。
 */
function createOutlineLayout(
  mask: Uint8Array,
  columns: number,
  rows: number,
  outline: false | Required<PixelOutlineOptions>,
): OutlineLayout {
  const outsideWidth = getOutsideWidth(outline)
  const insideWidth = getInsideWidth(outline)
  const outputColumns = columns + outsideWidth * 2
  const outputRows = rows + outsideWidth * 2
  const sourceIndexes = new Int32Array(outputColumns * outputRows).fill(-1)
  const outputMask = new Uint8Array(outputColumns * outputRows)
  const outlineMask = new Uint8Array(outputColumns * outputRows)

  for (let y = 0; y < outputRows; y += 1) {
    for (let x = 0; x < outputColumns; x += 1) {
      const sourceX = x - outsideWidth
      const sourceY = y - outsideWidth
      const outputIndex = y * outputColumns + x

      if (sourceX >= 0 && sourceY >= 0 && sourceX < columns && sourceY < rows) {
        const sourceIndex = sourceY * columns + sourceX
        sourceIndexes[outputIndex] = sourceIndex
        outputMask[outputIndex] = mask[sourceIndex]
      }
    }
  }

  if (outline !== false) {
    for (let y = 0; y < outputRows; y += 1) {
      for (let x = 0; x < outputColumns; x += 1) {
        const index = y * outputColumns + x

        if (
          outputMask[index] === 0 &&
          outsideWidth > 0 &&
          hasNearbyValue(
            outputMask,
            outputColumns,
            outputRows,
            x,
            y,
            outsideWidth,
            1,
          )
        ) {
          outlineMask[index] = 1
          continue
        }

        if (
          outputMask[index] !== 0 &&
          insideWidth > 0 &&
          hasNearbyValue(
            outputMask,
            outputColumns,
            outputRows,
            x,
            y,
            insideWidth,
            0,
          )
        ) {
          outlineMask[index] = 1
        }
      }
    }
  }

  return {
    columns: outputColumns,
    rows: outputRows,
    sourceIndexes,
    outlineMask,
  }
}

/**
 * 检查指定半径内是否存在目标掩码值。
 */
function hasNearbyValue(
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
  target: 0 | 1,
): boolean {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const sampleX = x + offsetX
      const sampleY = y + offsetY

      if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) {
        if (target === 0) {
          return true
        }

        continue
      }

      if (mask[sampleY * width + sampleX] === target) {
        return true
      }
    }
  }

  return false
}

/**
 * 计算描边向外扩展的逻辑格数。
 */
function getOutsideWidth(
  outline: false | Required<PixelOutlineOptions>,
): number {
  if (outline === false || outline.position === 'inside') {
    return 0
  }

  return outline.position === 'outside'
    ? outline.width
    : Math.ceil(outline.width / 2)
}

/**
 * 计算描边覆盖前景内部的逻辑格数。
 */
function getInsideWidth(
  outline: false | Required<PixelOutlineOptions>,
): number {
  if (outline === false || outline.position === 'outside') {
    return 0
  }

  return outline.position === 'inside'
    ? outline.width
    : Math.floor(outline.width / 2)
}

/**
 * 使用单一颜色绘制完整正方形像素。
 */
function fillSquare(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  context.fillStyle = color
  context.fillRect(x, y, size, size)
}

/**
 * 在相邻前景像素共享的边界上绘制单条分隔线。
 */
function drawPixelBorders(
  context: CanvasRenderingContext2D,
  layout: OutlineLayout,
  sourceMask: Uint8Array,
  pixelSize: number,
  palette: string[],
  width: number,
) {
  for (let y = 0; y < layout.rows; y += 1) {
    for (let x = 0; x < layout.columns; x += 1) {
      const outputIndex = y * layout.columns + x
      const sourceIndex = layout.sourceIndexes[outputIndex]

      if (sourceIndex < 0 || sourceMask[sourceIndex] === 0) {
        continue
      }

      context.fillStyle = palette[outputIndex]

      const rightIndex = outputIndex + 1
      const rightSourceIndex = layout.sourceIndexes[rightIndex]

      if (
        x + 1 < layout.columns &&
        rightSourceIndex >= 0 &&
        sourceMask[rightSourceIndex] !== 0
      ) {
        context.fillRect(
          (x + 1) * pixelSize - width,
          y * pixelSize,
          width,
          pixelSize,
        )
      }

      const bottomIndex = outputIndex + layout.columns
      const bottomSourceIndex = layout.sourceIndexes[bottomIndex]

      if (
        y + 1 < layout.rows &&
        bottomSourceIndex >= 0 &&
        sourceMask[bottomSourceIndex] !== 0
      ) {
        context.fillRect(
          x * pixelSize,
          (y + 1) * pixelSize - width,
          pixelSize,
          width,
        )
      }
    }
  }
}

/**
 * 断言配置值为正整数。
 */
function assertPositiveInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(name + ' must be a positive integer.')
  }
}

/**
 * 断言配置值为非负整数。
 */
function assertNonNegativeInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(name + ' must be a non-negative integer.')
  }
}

/**
 * 把数值限制在给定闭区间内。
 */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

/**
 * 保存硬阈值采样后的基础像素网格。
 */
interface PixelGridData {
  columns: number
  rows: number
  sourcePixelSize: number
  mask: Uint8Array
  colors: string[]
}

/**
 * 保存栅格算法需要的完整参数。
 */
interface RasterOptions {
  pixelSize: number | 'auto'
  minPixelSize: number
  maxPixelSize: number
  coverageThreshold: number
  alphaThreshold: number
  padding: number
  trim: boolean
}

/**
 * 扩展文本绘制需要的字体和取消参数。
 */
interface TextRasterOptions extends RasterOptions {
  fontFamily?: string
  fontSize?: number
  fontStyle?: 'normal' | 'italic' | 'oblique'
  fontWeight?: number | string
  letterSpacing?: number
  lineHeight?: number
  awaitFont?: boolean
  signal?: AbortSignal
}

/**
 * 描述内部图片背景识别模式。
 */
type SourceBackground = 'auto' | 'transparent' | string

/**
 * 扩展图片加载和背景分析需要的参数。
 */
interface ImageRasterOptions extends RasterOptions {
  sourceBackground?: SourceBackground
  backgroundThreshold?: number
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  maxWidth?: number
  maxHeight?: number
  signal?: AbortSignal
}

/**
 * 表示内部颜色计算使用的 RGBA 通道。
 */
interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

/**
 * 描述前景在位图或逻辑网格中的整数边界。
 */
interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_MAX_SOURCE_SIZE = 2048

/**
 * 把文本源绘制并采样为基础像素网格。
 */
async function rasterizeText(
  text: string,
  options: TextRasterOptions,
): Promise<PixelGridData> {
  if (!text.trim()) {
    throw new Error('Pixel text cannot be empty.')
  }

  const canvas = await createTextCanvas(text, options)
  throwIfAborted(options.signal)

  return rasterizeCanvas(canvas, options, 'transparent')
}

/**
 * 把外部图片加载并采样为基础像素网格。
 */
async function rasterizeImage(
  source: string,
  options: ImageRasterOptions,
): Promise<PixelGridData> {
  if (!source.trim()) {
    throw new Error('The image URL cannot be empty.')
  }

  const image = await loadImage(source, options)
  throwIfAborted(options.signal)

  return rasterizeCanvas(
    drawImageToCanvas(image, options),
    options,
    options.sourceBackground ?? 'auto',
    clamp(options.backgroundThreshold ?? 0.08, 0, 1),
  )
}

/**
 * 使用普通浏览器字体把文本绘制到透明 Canvas。
 */
async function createTextCanvas(
  text: string,
  options: TextRasterOptions,
): Promise<HTMLCanvasElement> {
  const fontSize = options.fontSize ?? 64
  const lineHeight = options.lineHeight ?? fontSize * 1.2
  const letterSpacing = options.letterSpacing ?? 0
  const font =
    (options.fontStyle ?? 'normal') +
    ' ' +
    (options.fontWeight ?? 700) +
    ' ' +
    fontSize +
    'px ' +
    (options.fontFamily ?? 'sans-serif')

  assertPositiveNumber(fontSize, 'fontSize')
  assertPositiveNumber(lineHeight, 'lineHeight')

  if (!Number.isFinite(letterSpacing)) {
    throw new Error('letterSpacing must be a finite number.')
  }

  ensureBrowser()

  if (options.awaitFont !== false && 'fonts' in document) {
    await document.fonts.load(font, text)
  }

  throwIfAborted(options.signal)

  const measureCanvas = document.createElement('canvas')
  const measureContext = getContext(measureCanvas)
  const lines = text.split(/\r?\n/)

  measureContext.font = font
  measureContext.textBaseline = 'alphabetic'

  const metrics = lines.map((line) => measureLine(measureContext, line, letterSpacing))
  const maxWidth = Math.max(...metrics.map((line) => line.width), 1)
  const ascent = Math.max(...metrics.map((line) => line.ascent), fontSize * 0.8)
  const descent = Math.max(...metrics.map((line) => line.descent), fontSize * 0.2)
  const padding = Math.ceil(fontSize * 0.25) + 2
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.ceil(maxWidth + padding * 2))
  canvas.height = Math.max(
    1,
    Math.ceil(ascent + descent + lineHeight * (lines.length - 1) + padding * 2),
  )

  const context = getContext(canvas)
  context.font = font
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#000000'

  lines.forEach((line, index) => {
    drawLine(
      context,
      line,
      padding,
      padding + ascent + index * lineHeight,
      letterSpacing,
    )
  })

  return canvas
}

/**
 * 测量单行文本尺寸并计入额外字距。
 */
function measureLine(
  context: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
) {
  const glyphs = Array.from(text)
  const metrics = context.measureText(text || ' ')

  return {
    width: metrics.width + Math.max(0, glyphs.length - 1) * letterSpacing,
    ascent: metrics.actualBoundingBoxAscent || 0,
    descent: metrics.actualBoundingBoxDescent || 0,
  }
}

/**
 * 按指定字距把一行文本绘制到 Canvas。
 */
function drawLine(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
) {
  if (letterSpacing === 0) {
    context.fillText(text, x, y)
    return
  }

  let cursor = x

  Array.from(text).forEach((glyph) => {
    context.fillText(glyph, cursor, y)
    cursor += context.measureText(glyph).width + letterSpacing
  })
}

/**
 * 异步加载可供 Canvas 读取的图片。
 */
function loadImage(
  source: string,
  options: ImageRasterOptions,
): Promise<HTMLImageElement> {
  ensureBrowser()

  return new Promise((resolve, reject) => {
    const image = new Image()
    const abort = () => {
      image.src = ''
      reject(createAbortError())
    }

    if (options.signal?.aborted) {
      abort()
      return
    }

    image.crossOrigin = options.crossOrigin ?? 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      options.signal?.removeEventListener('abort', abort)
      resolve(image)
    }
    image.onerror = () => {
      options.signal?.removeEventListener('abort', abort)
      reject(
        new Error(
          'Unable to load image: ' +
            source +
            ". Check the URL and the server's CORS headers.",
        ),
      )
    }
    options.signal?.addEventListener('abort', abort, { once: true })
    image.src = source
  })
}

/**
 * 在尺寸上限内把图片绘制到源 Canvas。
 */
function drawImageToCanvas(
  image: HTMLImageElement,
  options: ImageRasterOptions,
): HTMLCanvasElement {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_SOURCE_SIZE
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_SOURCE_SIZE

  assertPositiveInteger(maxWidth, 'maxWidth')
  assertPositiveInteger(maxHeight, 'maxHeight')

  const scale = Math.min(
    1,
    maxWidth / image.naturalWidth,
    maxHeight / image.naturalHeight,
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

  const context = getContext(canvas)
  context.imageSmoothingEnabled = scale === 1
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

/**
 * 把源 Canvas 转换为硬边逻辑像素网格。
 */
function rasterizeCanvas(
  canvas: HTMLCanvasElement,
  options: RasterOptions,
  sourceBackground: SourceBackground,
  backgroundThreshold = 0.08,
): PixelGridData {
  const context = getContext(canvas, true)
  let imageData: ImageData

  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  } catch (error) {
    throw new Error(
      'The image canvas cannot be read. The image server must allow cross-origin canvas access.',
      { cause: error },
    )
  }

  const sourceMask = createSourceMask(
    imageData,
    sourceBackground,
    options.alphaThreshold,
    backgroundThreshold,
  )
  const sourceBounds = findBounds(sourceMask, imageData.width, imageData.height)

  if (!sourceBounds) {
    throw new Error('No foreground pixels were found after applying the thresholds.')
  }

  const sourcePixelSize =
    options.pixelSize === 'auto'
      ? estimateFeatureWidth(
          sourceMask,
          imageData.width,
          imageData.height,
          sourceBounds,
          options.minPixelSize,
          options.maxPixelSize,
        )
      : options.pixelSize
  const bounds = options.trim
    ? sourceBounds
    : { x: 0, y: 0, width: imageData.width, height: imageData.height }

  return sampleGrid(
    imageData,
    sourceMask,
    bounds,
    sourcePixelSize,
    options.coverageThreshold,
    options.padding,
    options.trim,
  )
}

/**
 * 根据透明度和背景差异生成二值前景掩码。
 */
function createSourceMask(
  imageData: ImageData,
  sourceBackground: SourceBackground,
  alphaThreshold: number,
  backgroundThreshold: number,
): Uint8Array {
  const mask = new Uint8Array(imageData.width * imageData.height)
  const alphaCutoff = alphaThreshold * 255
  const background = resolveBackground(imageData, sourceBackground)

  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4
    const alpha = imageData.data[offset + 3]

    if (alpha < alphaCutoff) {
      continue
    }

    if (
      !background ||
      colorDistance(
        {
          r: imageData.data[offset],
          g: imageData.data[offset + 1],
          b: imageData.data[offset + 2],
          a: alpha,
        },
        background,
      ) > backgroundThreshold
    ) {
      mask[index] = 1
    }
  }

  return mask
}

/**
 * 解析图片前景识别使用的背景颜色。
 */
function resolveBackground(
  imageData: ImageData,
  sourceBackground: SourceBackground,
): RgbaColor | undefined {
  if (sourceBackground === 'transparent') {
    return undefined
  }

  if (sourceBackground !== 'auto') {
    return parseCssColor(sourceBackground)
  }

  const borderIndexes = getBorderIndexes(imageData.width, imageData.height)
  const transparentCount = borderIndexes.reduce(
    (count, index) => count + (imageData.data[index * 4 + 3] < 250 ? 1 : 0),
    0,
  )

  if (transparentCount / borderIndexes.length >= 0.05) {
    return undefined
  }

  return dominantBorderColor(imageData, borderIndexes)
}

/**
 * 收集图片四条边上的像素索引。
 */
function getBorderIndexes(width: number, height: number): number[] {
  const indexes: number[] = []

  for (let x = 0; x < width; x += 1) {
    indexes.push(x, (height - 1) * width + x)
  }

  for (let y = 1; y < height - 1; y += 1) {
    indexes.push(y * width, y * width + width - 1)
  }

  return indexes
}

/**
 * 从边缘像素中估算稳定的背景颜色。
 */
function dominantBorderColor(imageData: ImageData, indexes: number[]): RgbaColor {
  const buckets = new Map<
    number,
    { count: number; r: number; g: number; b: number; a: number }
  >()

  indexes.forEach((index) => {
    const offset = index * 4
    const r = imageData.data[offset]
    const g = imageData.data[offset + 1]
    const b = imageData.data[offset + 2]
    const a = imageData.data[offset + 3]
    const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4)
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0, a: 0 }

    bucket.count += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    bucket.a += a
    buckets.set(key, bucket)
  })

  const dominant = [...buckets.values()].sort((left, right) => right.count - left.count)[0]

  return {
    r: Math.round(dominant.r / dominant.count),
    g: Math.round(dominant.g / dominant.count),
    b: Math.round(dominant.b / dominant.count),
    a: Math.round(dominant.a / dominant.count),
  }
}

/**
 * 计算两种 RGBA 颜色的归一化感知距离。
 */
function colorDistance(left: RgbaColor, right: RgbaColor): number {
  const redMean = (left.r + right.r) / 2
  const red = left.r - right.r
  const green = left.g - right.g
  const blue = left.b - right.b
  const alpha = left.a - right.a
  const weighted = Math.sqrt(
    (2 + redMean / 256) * red * red +
      4 * green * green +
      (2 + (255 - redMean) / 256) * blue * blue +
      alpha * alpha,
  )

  return weighted / 765
}

/**
 * 估算能同时保留前景笔画和内部背景间隙的像素尺寸。
 */
function estimateFeatureWidth(
  mask: Uint8Array,
  width: number,
  height: number,
  bounds: Bounds,
  minimum: number,
  maximum: number,
): number {
  const distances = new Uint16Array(mask.length)
  const limit = Math.max(width, height) + 1

  for (let index = 0; index < mask.length; index += 1) {
    distances[index] = mask[index] === 0 ? 0 : limit
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x

      if (distances[index] === 0) {
        continue
      }

      distances[index] = Math.min(
        distances[index],
        distanceAt(distances, width, height, x - 1, y) + 1,
        distanceAt(distances, width, height, x, y - 1) + 1,
        distanceAt(distances, width, height, x - 1, y - 1) + 1,
        distanceAt(distances, width, height, x + 1, y - 1) + 1,
      )
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const index = y * width + x

      if (distances[index] === 0) {
        continue
      }

      distances[index] = Math.min(
        distances[index],
        distanceAt(distances, width, height, x + 1, y) + 1,
        distanceAt(distances, width, height, x, y + 1) + 1,
        distanceAt(distances, width, height, x + 1, y + 1) + 1,
        distanceAt(distances, width, height, x - 1, y + 1) + 1,
      )
    }
  }

  const widths: number[] = []

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = distances[y * width + x]

      if (value !== 0 && isLocalMaximum(distances, width, height, x, y, value)) {
        widths.push(value * 2)
      }
    }
  }

  if (widths.length === 0) {
    return minimum
  }

  const meaningful = widths.some((value) => value > 2)
    ? widths.filter((value) => value > 2)
    : widths

  meaningful.sort((left, right) => left - right)

  const strokeWidth = Math.round(
    meaningful[Math.floor((meaningful.length - 1) * 0.2)],
  )
  const gapWidth = estimateInternalGapWidth(mask, width, bounds)

  return clamp(
    Math.min(strokeWidth, gapWidth ?? strokeWidth),
    minimum,
    maximum,
  )
}

/**
 * 估算被前景夹住的最窄稳定背景间隙。
 */
function estimateInternalGapWidth(
  mask: Uint8Array,
  sourceWidth: number,
  bounds: Bounds,
): number | undefined {
  const gaps: number[] = []

  for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
    collectBoundedBackgroundRuns(
      mask,
      bounds.y * sourceWidth + x,
      bounds.height,
      sourceWidth,
      gaps,
    )
  }

  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    collectBoundedBackgroundRuns(
      mask,
      y * sourceWidth + bounds.x,
      bounds.width,
      1,
      gaps,
    )
  }

  const candidates = gaps.filter((value) => value >= 2)

  if (candidates.length === 0) {
    return undefined
  }

  const frequencies = new Map<number, number>()

  candidates.forEach((value) => {
    frequencies.set(value, (frequencies.get(value) ?? 0) + 1)
  })

  const minimumOccurrences = Math.max(
    2,
    Math.floor(Math.min(bounds.width, bounds.height) * 0.03),
  )
  const stable = candidates.filter(
    (value) =>
      (frequencies.get(value - 1) ?? 0) +
        (frequencies.get(value) ?? 0) +
        (frequencies.get(value + 1) ?? 0) >=
      minimumOccurrences,
  )
  const meaningful = stable.length > 0 ? stable : candidates

  meaningful.sort((left, right) => left - right)

  return meaningful[Math.floor((meaningful.length - 1) * 0.15)]
}

/**
 * 收集一条扫描线上被前景包围的背景连续段。
 */
function collectBoundedBackgroundRuns(
  mask: Uint8Array,
  startIndex: number,
  length: number,
  step: number,
  target: number[],
) {
  let hasForegroundBefore = false
  let backgroundLength = 0

  for (let offset = 0; offset < length; offset += 1) {
    const value = mask[startIndex + offset * step]

    if (value !== 0) {
      if (hasForegroundBefore && backgroundLength > 0) {
        target.push(backgroundLength)
      }

      hasForegroundBefore = true
      backgroundLength = 0
      continue
    }

    if (hasForegroundBefore) {
      backgroundLength += 1
    }
  }
}

/**
 * 读取距离图数值并处理越界位置。
 */
function distanceAt(
  distances: Uint16Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return 0
  }

  return distances[y * width + x]
}

/**
 * 判断距离图像素是否属于局部骨架峰值。
 */
function isLocalMaximum(
  distances: Uint16Array,
  width: number,
  height: number,
  x: number,
  y: number,
  value: number,
): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (
        (offsetX !== 0 || offsetY !== 0) &&
        distanceAt(distances, width, height, x + offsetX, y + offsetY) > value
      ) {
        return false
      }
    }
  }

  return true
}

/**
 * 按正方形尺寸和覆盖率硬阈值采样源掩码。
 */
function sampleGrid(
  imageData: ImageData,
  sourceMask: Uint8Array,
  bounds: Bounds,
  pixelSize: number,
  coverageThreshold: number,
  padding: number,
  trim: boolean,
): PixelGridData {
  const columns = Math.ceil(bounds.width / pixelSize)
  const rows = Math.ceil(bounds.height / pixelSize)
  const mask = new Uint8Array(columns * rows)
  const colors = Array<string>(columns * rows).fill('rgba(0, 0, 0, 0)')

  for (let gridY = 0; gridY < rows; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const startX = bounds.x + gridX * pixelSize
      const startY = bounds.y + gridY * pixelSize
      const endX = Math.min(startX + pixelSize, bounds.x + bounds.width)
      const endY = Math.min(startY + pixelSize, bounds.y + bounds.height)
      let count = 0
      let red = 0
      let green = 0
      let blue = 0
      let alpha = 0

      for (let sourceY = startY; sourceY < endY; sourceY += 1) {
        for (let sourceX = startX; sourceX < endX; sourceX += 1) {
          const sourceIndex = sourceY * imageData.width + sourceX

          if (sourceMask[sourceIndex] === 0) {
            continue
          }

          const offset = sourceIndex * 4
          count += 1
          red += imageData.data[offset]
          green += imageData.data[offset + 1]
          blue += imageData.data[offset + 2]
          alpha += imageData.data[offset + 3]
        }
      }

      const area = Math.max(1, (endX - startX) * (endY - startY))

      if (count / area < coverageThreshold) {
        continue
      }

      const targetIndex = gridY * columns + gridX
      mask[targetIndex] = 1
      colors[targetIndex] = toRgbaString({
        r: red / count,
        g: green / count,
        b: blue / count,
        a: alpha / count,
      })
    }
  }

  preserveBoundedBackgroundGaps(
    mask,
    colors,
    sourceMask,
    imageData.width,
    bounds,
    pixelSize,
    columns,
    rows,
  )

  const gridBounds = trim ? findBounds(mask, columns, rows) : undefined

  if (trim && !gridBounds) {
    throw new Error(
      'The selected pixel size and coverage threshold removed all foreground pixels.',
    )
  }

  return cropAndPad(
    mask,
    colors,
    columns,
    rows,
    gridBounds ?? { x: 0, y: 0, width: columns, height: rows },
    padding,
    pixelSize,
  )
}

/**
 * 把源掩码中被前景夹住的背景间隙强制保留到逻辑网格。
 */
function preserveBoundedBackgroundGaps(
  gridMask: Uint8Array,
  gridColors: string[],
  sourceMask: Uint8Array,
  sourceWidth: number,
  bounds: Bounds,
  pixelSize: number,
  columns: number,
  rows: number,
) {
  const clearGridCell = (sourceX: number, sourceY: number) => {
    const gridX = Math.floor((sourceX - bounds.x) / pixelSize)
    const gridY = Math.floor((sourceY - bounds.y) / pixelSize)

    if (gridX < 0 || gridY < 0 || gridX >= columns || gridY >= rows) {
      return
    }

    const gridIndex = gridY * columns + gridX
    gridMask[gridIndex] = 0
    gridColors[gridIndex] = 'rgba(0, 0, 0, 0)'
  }

  for (let sourceX = bounds.x; sourceX < bounds.x + bounds.width; sourceX += 1) {
    let hasForegroundBefore = false
    let gapStart = -1

    for (let sourceY = bounds.y; sourceY < bounds.y + bounds.height; sourceY += 1) {
      const isForeground = sourceMask[sourceY * sourceWidth + sourceX] !== 0

      if (isForeground) {
        if (
          hasForegroundBefore &&
          gapStart >= 0 &&
          sourceY - gapStart >= 2
        ) {
          clearGridCell(sourceX, gapStart + Math.floor((sourceY - gapStart) / 2))
        }

        hasForegroundBefore = true
        gapStart = -1
      } else if (hasForegroundBefore && gapStart < 0) {
        gapStart = sourceY
      }
    }
  }

  for (let sourceY = bounds.y; sourceY < bounds.y + bounds.height; sourceY += 1) {
    let hasForegroundBefore = false
    let gapStart = -1

    for (let sourceX = bounds.x; sourceX < bounds.x + bounds.width; sourceX += 1) {
      const isForeground = sourceMask[sourceY * sourceWidth + sourceX] !== 0

      if (isForeground) {
        if (
          hasForegroundBefore &&
          gapStart >= 0 &&
          sourceX - gapStart >= 2
        ) {
          clearGridCell(gapStart + Math.floor((sourceX - gapStart) / 2), sourceY)
        }

        hasForegroundBefore = true
        gapStart = -1
      } else if (hasForegroundBefore && gapStart < 0) {
        gapStart = sourceX
      }
    }
  }
}

/**
 * 裁剪空白网格并加入指定逻辑留白。
 */
function cropAndPad(
  mask: Uint8Array,
  colors: string[],
  sourceColumns: number,
  sourceRows: number,
  bounds: Bounds,
  padding: number,
  sourcePixelSize: number,
): PixelGridData {
  const columns = bounds.width + padding * 2
  const rows = bounds.height + padding * 2
  const targetMask = new Uint8Array(columns * rows)
  const targetColors = Array<string>(columns * rows).fill('rgba(0, 0, 0, 0)')

  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) {
      const sourceX = bounds.x + x
      const sourceY = bounds.y + y

      if (sourceX >= sourceColumns || sourceY >= sourceRows) {
        continue
      }

      const sourceIndex = sourceY * sourceColumns + sourceX
      const targetIndex = (y + padding) * columns + x + padding
      targetMask[targetIndex] = mask[sourceIndex]
      targetColors[targetIndex] = colors[sourceIndex]
    }
  }

  return {
    columns,
    rows,
    sourcePixelSize,
    mask: targetMask,
    colors: targetColors,
  }
}

/**
 * 查找二值掩码中前景的最小边界。
 */
function findBounds(
  mask: Uint8Array,
  width: number,
  height: number,
): Bounds | undefined {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x] === 0) {
        continue
      }

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) {
    return undefined
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * 获取 Canvas 2D 上下文并处理失败状态。
 */
function getContext(canvas: HTMLCanvasElement, willReadFrequently = false) {
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently })

  if (!context) {
    throw new Error('The browser could not create a 2D canvas context.')
  }

  return context
}

/**
 * 确认当前环境具有浏览器 DOM。
 */
function ensureBrowser() {
  if (typeof document === 'undefined') {
    throw new Error('Pixel art generation requires a browser DOM with Canvas support.')
  }
}

/**
 * 在异步阶段之间响应 AbortSignal。
 */
function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

/**
 * 创建像素画任务使用的标准取消异常。
 */
function createAbortError(): DOMException {
  return new DOMException('Pixel art generation was aborted.', 'AbortError')
}

/**
 * 断言配置值为有限正数。
 */
function assertPositiveNumber(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(name + ' must be greater than zero.')
  }
}

/**
 * 描述渐变色标及其可选归一化位置。
 */
interface ColorStop {
  color: string
  offset?: number
}

/**
 * 把 CSS 颜色或渐变采样为逻辑像素调色板。
 */
function createPixelPalette(paint: string, width: number, height: number): string[] {
  const solid = tryParseCssColor(paint)

  if (solid) {
    return Array<string>(width * height).fill(toRgbaString(solid))
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = getContext(canvas, true)
  context.fillStyle = createGradient(context, paint, width, height)
  context.fillRect(0, 0, width, height)

  const data = context.getImageData(0, 0, width, height).data
  const palette = Array<string>(width * height)

  for (let index = 0; index < palette.length; index += 1) {
    const offset = index * 4
    palette[index] = toRgbaString({
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
      a: data[offset + 3],
    })
  }

  return palette
}

/**
 * 把 CSS 纯色字符串解析为 RGBA 通道。
 */
function parseCssColor(value: string): RgbaColor {
  const color = tryParseCssColor(value)

  if (!color) {
    throw new Error('Unsupported CSS color: ' + value)
  }

  return color
}

/**
 * 把 RGBA 通道转换为 Canvas 颜色字符串。
 */
function toRgbaString(color: RgbaColor): string {
  const alpha = clamp(color.a / 255, 0, 1)

  return (
    'rgba(' +
    Math.round(color.r) +
    ', ' +
    Math.round(color.g) +
    ', ' +
    Math.round(color.b) +
    ', ' +
    Number(alpha.toFixed(4)) +
    ')'
  )
}

/**
 * 根据 CSS 风格字符串创建 CanvasGradient。
 */
function createGradient(
  context: CanvasRenderingContext2D,
  paint: string,
  width: number,
  height: number,
): CanvasGradient {
  const match = paint.trim().match(/^([a-z-]+)\((.*)\)$/is)

  if (!match) {
    throw new Error('Unsupported pixel paint: ' + paint)
  }

  const type = match[1].toLowerCase()
  const parts = splitTopLevel(match[2])

  if (type === 'linear-gradient') {
    return createLinearGradient(context, parts, width, height)
  }

  if (type === 'radial-gradient') {
    return createRadialGradient(context, parts, width, height)
  }

  if (type === 'conic-gradient') {
    return createConicGradient(context, parts, width, height)
  }

  throw new Error(
    'Unsupported pixel gradient "' +
      type +
      '". Use linear-gradient, radial-gradient, or conic-gradient.',
  )
}

/**
 * 解析方向和色标并创建线性渐变。
 */
function createLinearGradient(
  context: CanvasRenderingContext2D,
  parts: string[],
  width: number,
  height: number,
): CanvasGradient {
  let direction = '180deg'
  let stopParts = parts

  if (parts[0] && isGradientDirection(parts[0])) {
    direction = parts[0]
    stopParts = parts.slice(1)
  }

  const angle = parseLinearAngle(direction)
  const directionX = Math.sin(angle)
  const directionY = -Math.cos(angle)
  const span = Math.abs(directionX) * width + Math.abs(directionY) * height
  const centerX = width / 2
  const centerY = height / 2
  const gradient = context.createLinearGradient(
    centerX - (directionX * span) / 2,
    centerY - (directionY * span) / 2,
    centerX + (directionX * span) / 2,
    centerY + (directionY * span) / 2,
  )

  addStops(gradient, stopParts)
  return gradient
}

/**
 * 解析中心位置和色标并创建径向渐变。
 */
function createRadialGradient(
  context: CanvasRenderingContext2D,
  parts: string[],
  width: number,
  height: number,
): CanvasGradient {
  let definition = ''
  let stopParts = parts

  if (parts[0] && !looksLikeColorStop(parts[0])) {
    definition = parts[0]
    stopParts = parts.slice(1)
  }

  const position = parsePosition(definition, width, height)
  const radius = Math.max(
    Math.hypot(position.x, position.y),
    Math.hypot(width - position.x, position.y),
    Math.hypot(position.x, height - position.y),
    Math.hypot(width - position.x, height - position.y),
  )
  const gradient = context.createRadialGradient(
    position.x,
    position.y,
    0,
    position.x,
    position.y,
    Math.max(radius, 1),
  )

  addStops(gradient, stopParts)
  return gradient
}

/**
 * 解析角度、中心和色标并创建锥形渐变。
 */
function createConicGradient(
  context: CanvasRenderingContext2D,
  parts: string[],
  width: number,
  height: number,
): CanvasGradient {
  let definition = ''
  let stopParts = parts

  if (parts[0] && !looksLikeColorStop(parts[0])) {
    definition = parts[0]
    stopParts = parts.slice(1)
  }

  const fromMatch = definition.match(/\bfrom\s+(-?[\d.]+)(deg|rad|turn)?/i)
  const startAngle = fromMatch
    ? parseAngle(fromMatch[1] + (fromMatch[2] ?? 'deg')) - Math.PI / 2
    : -Math.PI / 2
  const position = parsePosition(definition, width, height)
  const gradient = context.createConicGradient(startAngle, position.x, position.y)

  addStops(gradient, stopParts)
  return gradient
}

/**
 * 把规范化色标写入 CanvasGradient。
 */
function addStops(gradient: CanvasGradient, values: string[]) {
  const stops = normalizeStops(values.map(parseColorStop))

  if (stops.length < 2) {
    throw new Error('A pixel gradient requires at least two color stops.')
  }

  stops.forEach((stop) => gradient.addColorStop(stop.offset ?? 0, stop.color))
}

/**
 * 解析单个渐变颜色及可选百分比位置。
 */
function parseColorStop(value: string): ColorStop {
  const trimmed = value.trim()
  const splitIndex = findLastTopLevelWhitespace(trimmed)

  if (splitIndex < 0) {
    return { color: trimmed }
  }

  const possibleOffset = trimmed.slice(splitIndex).trim()

  if (!/^-?[\d.]+%$/.test(possibleOffset)) {
    return { color: trimmed }
  }

  return {
    color: trimmed.slice(0, splitIndex).trim(),
    offset: clamp(Number.parseFloat(possibleOffset) / 100, 0, 1),
  }
}

/**
 * 为省略位置的渐变色标补充分布比例。
 */
function normalizeStops(stops: ColorStop[]): ColorStop[] {
  if (stops.length === 0) {
    return []
  }

  const normalized = stops.map((stop) => ({ ...stop }))
  normalized[0].offset ??= 0
  normalized[normalized.length - 1].offset ??= 1

  let anchorIndex = 0

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].offset === undefined) {
      continue
    }

    const anchorOffset = normalized[anchorIndex].offset ?? 0
    const targetOffset = Math.max(anchorOffset, normalized[index].offset ?? anchorOffset)
    const gap = index - anchorIndex

    for (let fillIndex = anchorIndex + 1; fillIndex < index; fillIndex += 1) {
      normalized[fillIndex].offset =
        anchorOffset + ((targetOffset - anchorOffset) * (fillIndex - anchorIndex)) / gap
    }

    normalized[index].offset = targetOffset
    anchorIndex = index
  }

  return normalized
}

/**
 * 把 CSS 线性渐变方向转换为弧度。
 */
function parseLinearAngle(value: string): number {
  const normalized = value.trim().toLowerCase()

  if (!normalized.startsWith('to ')) {
    return parseAngle(normalized)
  }

  const horizontal = normalized.includes('right')
    ? 1
    : normalized.includes('left')
      ? -1
      : 0
  const vertical = normalized.includes('bottom')
    ? 1
    : normalized.includes('top')
      ? -1
      : 0

  return Math.atan2(horizontal, -vertical)
}

/**
 * 解析 deg、rad 或 turn 表示的角度。
 */
function parseAngle(value: string): number {
  const match = value.trim().match(/^(-?[\d.]+)(deg|rad|turn)?$/i)

  if (!match) {
    throw new Error('Unsupported gradient angle: ' + value)
  }

  const amount = Number.parseFloat(match[1])
  const unit = match[2]?.toLowerCase() ?? 'deg'

  if (unit === 'rad') {
    return amount
  }

  if (unit === 'turn') {
    return amount * Math.PI * 2
  }

  return (amount * Math.PI) / 180
}

/**
 * 解析渐变定义中的 at 位置。
 */
function parsePosition(definition: string, width: number, height: number) {
  const atIndex = definition.toLowerCase().lastIndexOf(' at ')

  if (atIndex < 0) {
    return { x: width / 2, y: height / 2 }
  }

  const tokens = definition.slice(atIndex + 4).trim().split(/\s+/)

  return {
    x: parsePositionToken(tokens[0] ?? 'center', width),
    y: parsePositionToken(tokens[1] ?? 'center', height),
  }
}

/**
 * 把位置关键字、百分比或像素值转换为坐标。
 */
function parsePositionToken(value: string, size: number): number {
  const normalized = value.toLowerCase()

  if (normalized === 'center') {
    return size / 2
  }

  if (normalized === 'left' || normalized === 'top') {
    return 0
  }

  if (normalized === 'right' || normalized === 'bottom') {
    return size
  }

  if (normalized.endsWith('%')) {
    return (Number.parseFloat(normalized) / 100) * size
  }

  if (normalized.endsWith('px')) {
    return Number.parseFloat(normalized)
  }

  throw new Error('Unsupported gradient position: ' + value)
}

/**
 * 尝试使用 Canvas 校验并读取 CSS 纯色。
 */
function tryParseCssColor(value: string): RgbaColor | undefined {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  const context = getContext(canvas, true)
  const normalized = value.trim()

  context.fillStyle = '#010203'
  context.fillStyle = normalized
  const firstAttempt = context.fillStyle

  context.fillStyle = '#040506'
  context.fillStyle = normalized
  const secondAttempt = context.fillStyle

  if (firstAttempt === '#010203' && secondAttempt === '#040506') {
    return undefined
  }

  context.clearRect(0, 0, 1, 1)
  context.fillRect(0, 0, 1, 1)

  const data = context.getImageData(0, 0, 1, 1).data

  return { r: data[0], g: data[1], b: data[2], a: data[3] }
}

/**
 * 判断渐变参数是否可以作为颜色色标。
 */
function looksLikeColorStop(value: string): boolean {
  return tryParseCssColor(parseColorStop(value).color) !== undefined
}

/**
 * 判断线性渐变首项是否为方向声明。
 */
function isGradientDirection(value: string): boolean {
  return /^to\s+/.test(value.trim()) || /^-?[\d.]+(?:deg|rad|turn)?$/i.test(value.trim())
}

/**
 * 按最外层逗号拆分渐变参数。
 */
function splitTopLevel(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1
    } else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }

  parts.push(value.slice(start).trim())
  return parts.filter(Boolean)
}

/**
 * 查找颜色字符串最后一个最外层空白。
 */
function findLastTopLevelWhitespace(value: string): number {
  let depth = 0

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const character = value[index]

    if (character === ')') {
      depth += 1
    } else if (character === '(') {
      depth -= 1
    } else if (/\s/.test(character) && depth === 0) {
      return index
    }
  }

  return -1
}

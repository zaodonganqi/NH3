/**
 * 文本与图片的像素画生成、颜色覆盖和 Canvas 渲染工具。
 *
 * 本模块把浏览器可绘制内容转为硬边正方形网格；调用示例见同目录 README.md。
 */
/**
 * 描述像素填充、背景或边线使用的 CSS 颜色字符串。
 */
export type PixelPaint = string
/**
 * 描述图片前景识别采用的背景来源。
 */
export type PixelSourceBackground = SourceBackground

/**
 * 配置每个前景像素外部使用的四周边线。
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
  pixelBorder?: false | PixelBorderOptions
}

/**
 * 配置 PixelArt 对象当前一次的 Canvas 渲染。
 */
export interface PixelRenderOptions extends PixelStyleOptions {}

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
export interface PixelTextOptions {
  fontFamily?: string
  fontSize?: number
  fontStyle?: 'normal' | 'italic' | 'oblique'
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  color?: PixelPaint
  density?: number
  signal?: AbortSignal
}

/**
 * 合并公开文本 CSS 参数与内部固定采样参数。
 */
type ResolvedTextOptions = PixelTextOptions & PixelGridOptions

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
  pixelBorder: {
    width: 1,
    color: '#ffffff',
  },
}

/**
 * 普通文本在零配置调用时使用的统一字体和像素样式。
 */
const DEFAULT_TEXT_OPTIONS: ResolvedTextOptions = {
  ...DEFAULT_PIXEL_STYLE,
  pixelBorder: {
    width: 0.5,
    color: '#ffffff',
  },
  coverageThreshold: 0.16,
  fontFamily: 'SimSun, "Songti SC", serif',
  fontSize: 92,
  letterSpacing: -2,
  textAlign: 'center',
  color: '#617cf4',
  density: 16,
}

// 文本掩码固定使用已验证的常规字重，避免输出缩放被误解为字形粗细。
const TEXT_MASK_FONT_WEIGHT = 400

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
  pixelBorder: false | Required<PixelBorderOptions>
}

/**
 * 保存一次 Canvas 自适应绘制使用的物理像素布局。
 */
interface CanvasRenderLayout {
  canvasWidth: number
  canvasHeight: number
  pixelSize: number
  borderWidth: number
  cellStride: number
  offsetX: number
  offsetY: number
}

/**
 * 保存经过校验的栅格参数和默认样式。
 */
interface ResolvedGridOptions {
  raster: RasterOptions
  style: Omit<PixelArtStyle, 'pixelSize'>
}

/**
 * 保存可重复渲染的像素网格对象。
 */
export class PixelArt {
  // 裁剪后像素网格的列数。
  readonly columns: number
  // 裁剪后像素网格的行数。
  readonly rows: number
  // 从来源位图采样每个逻辑格时使用的像素边长。
  readonly sourcePixelSize: number

  // 按行存储前景格状态的不可变二值掩码。
  private readonly mask: Uint8Array
  // 与掩码索引一一对应的来源颜色。
  private readonly colors: string[]
  // 当前网格用于后续重复绘制的默认视觉样式。
  private readonly style: PixelArtStyle

  /**
   * 复制并校验基础网格和默认样式。
   */
  constructor(data: PixelGridData, style: PixelArtStyle) {
    // 掩码和颜色数组都必须覆盖完整逻辑网格。
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
      pixelBorder:
        style.pixelBorder === false ? false : { ...style.pixelBorder },
    }
  }

  /**
   * 返回所有有效前景格的快照。
   */
  get cells(): PixelArtCell[] {
    // 对外返回新数组，避免调用方修改内部掩码。
    const cells: PixelArtCell[] = []

    // 单次线性遍历把前景索引还原为二维坐标。
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
    // 合并对象默认样式和当前调用覆盖项。
    const resolved = resolveRenderOptions(this.style, options)
    // 关闭边线时单格步长不再包含额外间隔。
    const borderWidth =
      resolved.pixelBorder === false ? 0 : resolved.pixelBorder.width
    // 单格步长包含彩色方块和共享内部边线。
    const cellStride = resolved.pixelSize + borderWidth

    return {
      width: this.columns * cellStride - borderWidth,
      height: this.rows * cellStride - borderWidth,
      columns: this.columns,
      rows: this.rows,
      pixelSize: resolved.pixelSize,
    }
  }

  /**
   * 把当前像素网格绘制到指定 Canvas。
   */
  render(canvas: HTMLCanvasElement, options: PixelRenderOptions = {}): HTMLCanvasElement {
    // 文本 Canvas 使用普通 CSS color，来源图片仍保留原始颜色。
    const canvasColor =
      this.style.color !== 'source' && canvas.isConnected
        ? window.getComputedStyle(canvas).color
        : undefined
    // 单次参数优先于 Canvas CSS，Canvas CSS 再覆盖文本默认色。
    const resolved = resolveRenderOptions(this.style, {
      ...options,
      color: options.color ?? canvasColor,
    })
    // 自适应布局把外部 CSS 区域换算为物理像素坐标。
    const layout = resolveCanvasRenderLayout(
      canvas,
      this.columns,
      this.rows,
      resolved,
    )
    // 复用目标 Canvas 的二维上下文完成所有硬边绘制。
    const context = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
    })

    if (!context) {
      throw new Error('The browser could not create a 2D canvas context.')
    }

    canvas.width = layout.canvasWidth
    canvas.height = layout.canvasHeight
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false

    // 文本可使用统一 CSS 色，图片则按格保留来源颜色。
    const fillPalette =
      resolved.color === 'source'
        ? undefined
        : createPixelPalette(resolved.color, this.columns, this.rows)
    // 背景色仅在调用方明确配置时生成逐格色板。
    const backgroundPalette = resolved.background
      ? createPixelPalette(resolved.background, this.columns, this.rows)
      : undefined
    // 内部边线可以使用纯色或渐变色板。
    const pixelBorderPalette =
      resolved.pixelBorder === false
        ? undefined
        : createPixelPalette(
            resolved.pixelBorder.color,
            this.columns,
            this.rows,
          )
    // 物理边线宽度可能因可用空间不足降级为零。
    const borderWidth = layout.borderWidth
    // 物理单格步长用于定位所有方块和共享边线。
    const cellStride = layout.cellStride

    if (backgroundPalette) {
      // 背景按完整网格逐行填充。
      for (let y = 0; y < this.rows; y += 1) {
        // 每列背景与对应逻辑格保持相同索引。
        for (let x = 0; x < this.columns; x += 1) {
          // 当前逻辑格在行优先数组中的索引。
          const index = y * this.columns + x
          // 当前格在目标 Canvas 中的物理横坐标。
          const targetX = layout.offsetX + x * cellStride
          // 当前格在目标 Canvas 中的物理纵坐标。
          const targetY = layout.offsetY + y * cellStride

          context.fillStyle = backgroundPalette[index]
          context.fillRect(
            targetX,
            targetY,
            cellStride,
            cellStride,
          )
        }
      }
    }

    // 前景掩码按行绘制彩色正方形。
    for (let y = 0; y < this.rows; y += 1) {
      // 每列仅处理对应掩码中的前景格。
      for (let x = 0; x < this.columns; x += 1) {
        // 当前逻辑格在行优先数组中的索引。
        const index = y * this.columns + x

        if (this.mask[index] === 0) {
          continue
        }

        // 当前前景格在目标 Canvas 中的物理横坐标。
        const targetX = layout.offsetX + x * cellStride
        // 当前前景格在目标 Canvas 中的物理纵坐标。
        const targetY = layout.offsetY + y * cellStride

        fillSquare(
          context,
          targetX,
          targetY,
          layout.pixelSize,
          fillPalette?.[index] ?? this.colors[index],
        )
      }
    }

    if (pixelBorderPalette && borderWidth > 0) {
      drawInternalPixelBorders(
        context,
        this.mask,
        this.columns,
        this.rows,
        layout.pixelSize,
        cellStride,
        pixelBorderPalette,
        borderWidth,
        layout.offsetX,
        layout.offsetY,
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

  /**
   * 把当前掩码转换为可直接交给 DOM 像素组件使用的字符矩阵。
   */
  toPattern(filled = '1', empty = '.'): string[] {
    if (filled.length !== 1 || empty.length !== 1) {
      throw new Error('Pattern symbols must contain exactly one character.')
    }

    return Array.from({ length: this.rows }, (_, y) =>
      Array.from({ length: this.columns }, (_, x) =>
        this.mask[y * this.columns + x] === 0 ? empty : filled,
      ).join(''),
    )
  }
}

/**
 * 集中保存可复用的默认生成配置。
 */
export class PixelArtGenerator {
  // 生成器实例为文本和图片复用的高级网格默认项。
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
    // 文本 CSS 参数覆盖站点默认值，高级生成器默认项保留内部采样能力。
    const merged: ResolvedTextOptions = {
      ...DEFAULT_TEXT_OPTIONS,
      ...this.defaults,
      ...options,
    }
    // 密度必须是有限正数，避免派生出无效采样格。
    const density = merged.density ?? 16
    assertPositiveNumber(density, 'density')
    // CSS 字号和密度共同推导来源采样格，不向调用方暴露方块边长。
    const sourcePixelSize = Math.max(
      1,
      Math.round((merged.fontSize ?? 92) / density),
    )
    // 统一校验采样参数并提取后续渲染样式。
    const resolved = resolveGridOptions(
      { ...merged, pixelSize: sourcePixelSize },
      '#000000',
    )
    // 来源文字在透明 Canvas 中栅格化为可重复使用的紧凑网格。
    const data = await rasterizeText(text, {
      ...merged,
      ...resolved.raster,
    } as TextRasterOptions)

    // 白线和彩色方块共同占据一个来源采样格的最终尺寸。
    const borderWidth =
      resolved.style.pixelBorder === false ? 0 : resolved.style.pixelBorder.width
    // 来源格不足以容纳彩色块和白线时关闭内部边线。
    const pixelBorder =
      borderWidth > 0 && sourcePixelSize >= borderWidth * 2
        ? resolved.style.pixelBorder
        : false

    return new PixelArt(data, {
      ...resolved.style,
      pixelBorder,
      pixelSize: Math.max(1, data.sourcePixelSize - (pixelBorder === false ? 0 : borderWidth)),
    })
  }

  /**
   * 加载图片地址并转换为硬边像素画对象。
   */
  async fromImage(source: string, options: PixelImageOptions = {}): Promise<PixelArt> {
    // 图片调用参数覆盖图片默认值和生成器级高级配置。
    const merged = { ...DEFAULT_IMAGE_OPTIONS, ...this.defaults, ...options }
    // 图片默认保留来源颜色，同时复用统一网格校验。
    const resolved = resolveGridOptions(merged, 'source')
    // 加载后的图片被采样为带来源颜色的紧凑网格。
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
 * 使用 JS 文本参数生成像素网格，并直接绘制到外部 Canvas。
 */
export async function renderPixelText(
  canvas: HTMLCanvasElement,
  text: string,
  options: PixelTextOptions = {},
): Promise<HTMLCanvasElement> {
  // 生成与绘制共享同一份颜色和文本参数。
  const art = await pixelateText(text, options)

  return art.render(canvas, { color: options.color })
}

/**
 * 读取普通 DOM 文本的浏览器行盒，并还原为显式换行字符串。
 */
export function readPixelTextLayout(layout: HTMLElement): string {
  // Vue 或普通 DOM 文本节点提供需要还原的原始字符序列。
  const textNode = layout.firstChild

  if (!(textNode instanceof Text)) {
    return layout.textContent ?? ''
  }

  // 每个数组项对应浏览器最终排版的一条可见文本行。
  const lines: string[] = ['']
  // 浏览器计算行高用于区分真实换行和标点字形的垂直偏移。
  const style = window.getComputedStyle(layout)
  // normal 行高回退到常规的 1.2 倍字号。
  const lineHeight =
    style.lineHeight === 'normal'
      ? (Number.parseFloat(style.fontSize) || 16) * 1.2
      : Number.parseFloat(style.lineHeight) || 19.2
  // 最近一个可见字符的行盒顶部用于识别自动换行。
  let currentTop: number | undefined

  Array.from(textNode.data).forEach((glyph, index) => {
    if (glyph === '\n') {
      lines.push('')
      currentTop = undefined
      return
    }

    // 单字符 Range 提供浏览器排版后的真实行盒位置。
    const range = document.createRange()
    range.setStart(textNode, index)
    range.setEnd(textNode, index + 1)
    // 字符矩形顶部变化表示浏览器已经开始新行。
    const top = range.getBoundingClientRect().top

    if (
      currentTop !== undefined &&
      Math.abs(top - currentTop) > lineHeight * 0.75
    ) {
      lines.push('')
      currentTop = top
    }

    lines[lines.length - 1] += glyph
    currentTop ??= top
  })

  return lines.join('\n')
}

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
  // 自动模式允许栅格化阶段根据来源笔画估算采样格。
  const pixelSize = options.pixelSize ?? 'auto'
  // 自动采样允许使用的最小来源格尺寸。
  const minPixelSize = options.minPixelSize ?? 1
  // 自动采样允许使用的最大来源格尺寸。
  const maxPixelSize = options.maxPixelSize ?? 64
  // 裁剪后在逻辑网格外围保留的安全格数。
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
  // 方块尺寸由文本字号与密度或图片采样结果确定，不接受单次覆盖。
  const pixelSize = style.pixelSize
  assertPositiveNumber(pixelSize, 'pixelSize')

  // 未传边线配置时沿用像素对象生成时保存的默认值。
  const pixelBorder =
    options.pixelBorder === undefined
      ? style.pixelBorder
      : resolvePixelBorder(options.pixelBorder)

  if (pixelBorder !== false && pixelBorder.width > pixelSize) {
    throw new Error(
      'pixelBorder.width cannot be greater than pixelSize.',
    )
  }

  return {
    pixelSize,
    color: options.color ?? style.color,
    background:
      options.background === undefined
        ? style.background
        : options.background ?? undefined,
    pixelBorder,
  }
}

/**
 * 根据 Canvas 的 CSS 尺寸计算居中的整数像素布局，未挂载 Canvas 则保留原始输出尺寸。
 */
function resolveCanvasRenderLayout(
  canvas: HTMLCanvasElement,
  columns: number,
  rows: number,
  style: PixelArtStyle,
): CanvasRenderLayout {
  // 已挂载 Canvas 的 CSS 尺寸是最终布局边界。
  const cssWidth = canvas.isConnected ? canvas.clientWidth : 0
  // 高度与宽度独立读取，避免仅按宽度缩放后越过外部区域。
  const cssHeight = canvas.isConnected ? canvas.clientHeight : 0
  // 物理像素倍率保证浏览器缩放后方块和内部边线仍落在整数坐标上。
  const pixelRatio =
    typeof window === 'undefined' ? 1 : Math.max(0.5, window.devicePixelRatio || 1)
  // 逻辑单格步长由彩色块和可为小数的 CSS 内线共同组成。
  const desiredStride =
    style.pixelSize + (style.pixelBorder === false ? 0 : style.pixelBorder.width)
  // 配置中的边线宽度先换算到物理像素。
  const configuredBorderWidth =
    style.pixelBorder === false
      ? 0
      : Math.max(1, Math.round(style.pixelBorder.width * pixelRatio))

  if (cssWidth <= 0 || cssHeight <= 0) {
    // 离屏输出把逻辑步长量化到 DPR 1 的完整物理像素。
    const cellStride = Math.max(1, Math.round(desiredStride))
    // 小数内线在离屏位图中至少占据一个物理像素。
    const borderWidth =
      style.pixelBorder !== false && cellStride > 1
        ? Math.min(cellStride - 1, Math.max(1, Math.round(style.pixelBorder.width)))
        : 0
    // 彩色方块占据离屏步长扣除内线后的剩余像素。
    const pixelSize = Math.max(1, cellStride - borderWidth)

    return {
      canvasWidth: columns * cellStride - borderWidth,
      canvasHeight: rows * cellStride - borderWidth,
      pixelSize,
      borderWidth,
      cellStride,
      offsetX: 0,
      offsetY: 0,
    }
  }

  // Canvas backing store 与 CSS 区域按当前 DPR 对齐。
  const canvasWidth = Math.max(1, Math.round(cssWidth * pixelRatio))
  // 高度同样量化为物理整数，避免浏览器缩放产生半像素。
  const canvasHeight = Math.max(1, Math.round(cssHeight * pixelRatio))
  // 当前区域能够容纳的最大完整单格步长。
  const fittedStride = Math.max(
    1,
    Math.floor(
      Math.min(
        (canvasWidth + configuredBorderWidth) / columns,
        (canvasHeight + configuredBorderWidth) / rows,
      ),
    ),
  )
  // 字号和密度推导出的方块尺寸作为期望上限，空间不足时才缩小。
  const requestedStride = Math.max(
    1,
    Math.round(desiredStride * pixelRatio),
  )
  // 最终步长始终取可放入 Canvas 的整数值。
  const cellStride = Math.min(fittedStride, requestedStride)
  // 至少保留 1px 彩色块，允许最小的 1px 方块与 1px 内线组合。
  const borderWidth =
    configuredBorderWidth > 0 && cellStride - configuredBorderWidth >= 1
      ? configuredBorderWidth
      : 0
  // 彩色像素块占据步长扣除共享边线后的剩余区域。
  const pixelSize = Math.max(1, cellStride - borderWidth)
  // 实际文字网格宽度用于计算 CSS text-align 对应的水平留白。
  const artWidth = columns * cellStride - borderWidth
  // 实际文字网格高度用于垂直居中。
  const artHeight = rows * cellStride - borderWidth
  // Canvas 继承的 text-align 决定文字在外部 CSS 区域中的水平位置。
  const textAlign = window.getComputedStyle(canvas).textAlign
  // 文字区域扣除实际网格后的剩余水平空间。
  const horizontalSpace = Math.max(0, canvasWidth - artWidth)
  // left/start、center 和 right/end 分别映射到普通文本的水平对齐行为。
  const offsetX =
    textAlign === 'center'
      ? Math.floor(horizontalSpace / 2)
      : textAlign === 'right' || textAlign === 'end'
        ? horizontalSpace
        : 0

  return {
    canvasWidth,
    canvasHeight,
    pixelSize,
    borderWidth,
    cellStride,
    offsetX,
    offsetY: Math.max(0, Math.floor((canvasHeight - artHeight) / 2)),
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

  // 内部共享边线默认使用一个逻辑像素宽度，也允许 CSS 小数宽度。
  const width = pixelBorder.width ?? 1
  assertPositiveNumber(width, 'pixelBorder.width')

  return {
    width,
    color: pixelBorder.color ?? '#ffffff',
  }
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
 * 只绘制相邻前景方块之间的共享边线，不描绘字符外轮廓。
 */
function drawInternalPixelBorders(
  context: CanvasRenderingContext2D,
  mask: Uint8Array,
  columns: number,
  rows: number,
  pixelSize: number,
  cellStride: number,
  palette: string[],
  width: number,
  offsetX: number,
  offsetY: number,
) {
  // 统一处理边界并判断指定逻辑格是否属于前景。
  const isForeground = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < columns && y < rows && mask[y * columns + x] !== 0

  // 第一遍只绘制向右和向下的共享边，避免同一边重复覆盖。
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      // 当前逻辑格在行优先掩码中的索引。
      const index = y * columns + x

      if (mask[index] === 0) {
        continue
      }

      context.fillStyle = palette[index]

      if (isForeground(x + 1, y)) {
        context.fillRect(
          offsetX + x * cellStride + pixelSize,
          offsetY + y * cellStride,
          width,
          pixelSize,
        )
      }

      if (isForeground(x, y + 1)) {
        context.fillRect(
          offsetX + x * cellStride,
          offsetY + y * cellStride + pixelSize,
          pixelSize,
          width,
        )
      }
    }
  }

  // 第二遍补齐至少连接两条内部边线的交叉点。
  for (let y = 1; y < rows; y += 1) {
    for (let x = 1; x < columns; x += 1) {
      // 交叉点上方是否存在一条连续共享边。
      const hasTopEdge = isForeground(x - 1, y - 1) && isForeground(x, y - 1)
      // 交叉点下方是否存在一条连续共享边。
      const hasBottomEdge = isForeground(x - 1, y) && isForeground(x, y)
      // 交叉点左侧是否存在一条连续共享边。
      const hasLeftEdge = isForeground(x - 1, y - 1) && isForeground(x - 1, y)
      // 交叉点右侧是否存在一条连续共享边。
      const hasRightEdge = isForeground(x, y - 1) && isForeground(x, y)
      // 只有真正的内部连接处才需要补方形交点。
      const connectedEdgeCount =
        Number(hasTopEdge) +
        Number(hasBottomEdge) +
        Number(hasLeftEdge) +
        Number(hasRightEdge)

      if (connectedEdgeCount < 2) {
        continue
      }

      // 交点颜色取右下相邻格，确保纯色和渐变色板都保持连续。
      const paletteIndex = Math.min(y, rows - 1) * columns + Math.min(x, columns - 1)
      context.fillStyle = palette[paletteIndex]
      context.fillRect(
        offsetX + x * cellStride - width,
        offsetY + y * cellStride - width,
        width,
        width,
      )
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
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  signal?: AbortSignal
}

/**
 * 区分普通文本采样和图片空隙修复两种内部路径。
 */
type RasterSourceKind = 'text' | 'image'

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

// 限制来源位图尺寸，避免高分辨率图片占用过多浏览器内存。
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

  // 文本先按普通字体 CSS 绘制为透明来源位图。
  const canvas = await createTextCanvas(text, options)
  throwIfAborted(options.signal)

  // 固定网格直接采样，自动网格则根据字号提高最低采样精度。
  const rasterOptions =
    options.pixelSize === 'auto'
      ? {
          ...options,
          minPixelSize: Math.max(
            options.minPixelSize,
            clamp(
              Math.round((options.fontSize ?? 96) / 16),
              options.minPixelSize,
              options.maxPixelSize,
            ),
          ),
        }
      : options

  return rasterizeCanvas(canvas, rasterOptions, 'transparent', 'text')
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

  // 完成跨域和取消处理后再把图片交给 Canvas。
  const image = await loadImage(source, options)
  throwIfAborted(options.signal)

  return rasterizeCanvas(
    drawImageToCanvas(image, options),
    options,
    options.sourceBackground ?? 'auto',
    'image',
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
  // 来源字号决定浏览器字体测量精度，不直接限制最终 Canvas 区域。
  const fontSize = options.fontSize ?? 64
  // 多行基线间距默认沿用常见的 1.2 倍字号比例。
  const lineHeight = options.lineHeight ?? fontSize * 1.2
  // 额外字距按 CSS 像素参与每行宽度测量。
  const letterSpacing = options.letterSpacing ?? 0
  // 字体简写固定使用已验证的 400 掩码字重。
  const font =
    (options.fontStyle ?? 'normal') +
    ' ' +
    TEXT_MASK_FONT_WEIGHT +
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

  if ('fonts' in document) {
    await document.fonts.load(font, text)
  }

  throwIfAborted(options.signal)

  // 独立测量 Canvas 避免污染最终来源位图状态。
  const measureCanvas = document.createElement('canvas')
  // 文本宽高和字形边界均由同一个二维上下文测量。
  const measureContext = getContext(measureCanvas)
  // 换行符拆分后的每一项对应来源画布中的一条文本行。
  const lines = text.split(/\r?\n/)

  measureContext.font = font
  measureContext.textBaseline = 'alphabetic'

  // 每行测量结果包含额外字距和实际字形上下边界。
  const metrics = lines.map((line) => measureLine(measureContext, line, letterSpacing))
  // 最宽文本行决定来源画布的内容宽度。
  const maxWidth = Math.max(...metrics.map((line) => line.width), 1)
  // 所有行共享最大上升高度，避免不同字符导致基线跳动。
  const ascent = Math.max(...metrics.map((line) => line.ascent), fontSize * 0.8)
  // 所有行共享最大下降高度，确保下探笔画不会被裁掉。
  const descent = Math.max(...metrics.map((line) => line.descent), fontSize * 0.2)
  // 来源位图外围留出抗裁切空间，最终栅格阶段会再次紧凑裁剪。
  const padding = Math.ceil(fontSize * 0.25) + 2
  // 最终来源 Canvas 只承载待采样的黑色文字掩码。
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.ceil(maxWidth + padding * 2))
  canvas.height = Math.max(
    1,
    Math.ceil(ascent + descent + lineHeight * (lines.length - 1) + padding * 2),
  )

  // 绘制上下文复用测量阶段相同的字体简写和基线规则。
  const context = getContext(canvas)
  context.font = font
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#000000'

  lines.forEach((line, index) => {
    // 当前行宽度用于计算相对于最宽行的对齐偏移。
    const lineWidth = metrics[index].width
    // 对齐偏移只改变来源行位置，不改变最终外部 Canvas 布局。
    const alignOffset =
      options.textAlign === 'center'
        ? (maxWidth - lineWidth) / 2
        : options.textAlign === 'right'
          ? maxWidth - lineWidth
          : 0

    drawLine(
      context,
      line,
      padding + alignOffset,
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
  // Unicode 字符数组用于准确计算字符间额外字距数量。
  const glyphs = Array.from(text)
  // 浏览器字体度量提供基础宽度和实际字形上下边界。
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

  // 非零字距模式逐字推进当前绘制横坐标。
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
    // 独立图片元素承载加载、解码和跨域配置。
    const image = new Image()
    // 取消时释放来源地址并以标准 AbortError 结束 Promise。
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
  // 来源图片允许进入采样阶段的最大宽度。
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_SOURCE_SIZE
  // 来源图片允许进入采样阶段的最大高度。
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_SOURCE_SIZE

  assertPositiveInteger(maxWidth, 'maxWidth')
  assertPositiveInteger(maxHeight, 'maxHeight')

  // 仅缩小超出限制的图片，避免无意义放大和插值。
  const scale = Math.min(
    1,
    maxWidth / image.naturalWidth,
    maxHeight / image.naturalHeight,
  )
  // 来源 Canvas 使用限制后的实际位图尺寸。
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

  // 仅原始尺寸绘制允许平滑，缩小时保持来源边界明确。
  const context = getContext(canvas)
  context.imageSmoothingEnabled = scale === 1
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

/**
 * 按文本或图片规则把源 Canvas 转换为硬边逻辑像素网格。
 */
function rasterizeCanvas(
  canvas: HTMLCanvasElement,
  options: RasterOptions,
  sourceBackground: SourceBackground,
  sourceKind: RasterSourceKind,
  backgroundThreshold = 0.08,
): PixelGridData {
  // 频繁读取模式用于一次性提取完整来源位图数据。
  const context = getContext(canvas, true)
  // 来源 RGBA 数据在读取失败时转换为明确的跨域错误。
  let imageData: ImageData

  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  } catch (error) {
    throw new Error(
      'The image canvas cannot be read. The image server must allow cross-origin canvas access.',
      { cause: error },
    )
  }

  // 来源掩码根据透明度和可选背景色区分前景。
  const sourceMask = createSourceMask(
    imageData,
    sourceBackground,
    options.alphaThreshold,
    backgroundThreshold,
  )
  // 前景边界用于裁掉来源位图外围空白。
  const sourceBounds = findBounds(sourceMask, imageData.width, imageData.height)

  if (!sourceBounds) {
    throw new Error('No foreground pixels were found after applying the thresholds.')
  }

  // 最终采样格来自显式网格值或来源笔画宽度估算。
  const sourcePixelSize =
    options.pixelSize === 'auto'
      ? resolveAutomaticPixelSize(
          sourceKind,
          estimateFeatureWidth(
            sourceMask,
            imageData.width,
            imageData.height,
            options.minPixelSize,
            options.maxPixelSize,
          ),
          options.minPixelSize,
          options.maxPixelSize,
        )
      : options.pixelSize
  // 关闭裁剪时保留来源 Canvas 的完整逻辑区域。
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
    sourceKind === 'text',
    sourceKind === 'image',
  )
}

/**
 * 文本使用半笔画左右的采样格，确保主笔画稳定保留两格厚度。
 */
function resolveAutomaticPixelSize(
  sourceKind: RasterSourceKind,
  featureWidth: number,
  minimum: number,
  maximum: number,
): number {
  if (sourceKind === 'image') {
    return featureWidth
  }

  return clamp(Math.round(featureWidth * 0.55), minimum, maximum)
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
  // 二值掩码与来源位图像素一一对应。
  const mask = new Uint8Array(imageData.width * imageData.height)
  // 透明度阈值预先换算为 0 至 255 通道值。
  const alphaCutoff = alphaThreshold * 255
  // 背景可以来自显式颜色、边缘推断或透明模式。
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

  // 自动背景只分析图片四条边上的候选像素。
  const borderIndexes = getBorderIndexes(imageData.width, imageData.height)
  // 边缘存在明显透明区域时不再假设图片拥有实色背景。
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
  // 索引数组覆盖四边且避免重复加入角点。
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
  // 颜色按每通道高四位分桶，降低轻微压缩噪声的影响。
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

  // 像素数量最多的颜色桶代表稳定背景候选。
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
  // 平均红色通道用于调整人眼感知距离中的通道权重。
  const redMean = (left.r + right.r) / 2
  // 红色通道差值。
  const red = left.r - right.r
  // 绿色通道差值。
  const green = left.g - right.g
  // 蓝色通道差值。
  const blue = left.b - right.b
  // 透明度通道差值。
  const alpha = left.a - right.a
  // 加权欧氏距离兼顾颜色和透明度差异。
  const weighted = Math.sqrt(
    (2 + redMean / 256) * red * red +
      4 * green * green +
      (2 + (255 - redMean) / 256) * blue * blue +
      alpha * alpha,
  )

  return weighted / 765
}

/**
 * 根据前景笔画的稳定局部厚度估算像素尺寸。
 */
function estimateFeatureWidth(
  mask: Uint8Array,
  width: number,
  height: number,
  minimum: number,
  maximum: number,
): number {
  // 双向距离变换保存每个前景像素到最近背景的距离。
  const distances = new Uint16Array(mask.length)
  // 初始上限必须大于位图中可能出现的任何有效距离。
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

  // 局部距离峰值的两倍近似代表稳定笔画宽度。
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

  // 存在正常笔画时排除单像素噪声，否则保留细线结果。
  const meaningful = widths.some((value) => value > 2)
    ? widths.filter((value) => value > 2)
    : widths

  meaningful.sort((left, right) => left - right)

  return clamp(
    Math.round(meaningful[Math.floor((meaningful.length - 1) * 0.2)]),
    minimum,
    maximum,
  )
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
 * 按覆盖率阈值采样源掩码，并按来源决定是否修复图片空隙。
 */
function sampleGrid(
  imageData: ImageData,
  sourceMask: Uint8Array,
  bounds: Bounds,
  pixelSize: number,
  coverageThreshold: number,
  padding: number,
  trim: boolean,
  preserveThinFeatures: boolean,
  repairBackgroundGaps: boolean,
): PixelGridData {
  // 采样区域按来源格尺寸切分后的逻辑列数。
  const columns = Math.ceil(bounds.width / pixelSize)
  // 采样区域按来源格尺寸切分后的逻辑行数。
  const rows = Math.ceil(bounds.height / pixelSize)
  // 输出二值掩码记录每个逻辑格是否达到前景条件。
  const mask = new Uint8Array(columns * rows)
  // 输出颜色数组保存每个前景格的来源平均色。
  const colors = Array<string>(columns * rows).fill('rgba(0, 0, 0, 0)')

  for (let gridY = 0; gridY < rows; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const startX = bounds.x + gridX * pixelSize
      const startY = bounds.y + gridY * pixelSize
      const endX = Math.min(startX + pixelSize, bounds.x + bounds.width)
      const endY = Math.min(startY + pixelSize, bounds.y + bounds.height)
      // 当前逻辑格内命中的来源前景像素数量。
      let count = 0
      // 当前逻辑格来源前景的红色通道累加值。
      let red = 0
      // 当前逻辑格来源前景的绿色通道累加值。
      let green = 0
      // 当前逻辑格来源前景的蓝色通道累加值。
      let blue = 0
      // 当前逻辑格来源前景的透明度通道累加值。
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

      // 当前采样格的实际来源像素面积，边缘格可能小于标准尺寸。
      const area = Math.max(1, (endX - startX) * (endY - startY))
      // 采样格中心横坐标用于细笔画保留判断。
      const centerX = Math.min(endX - 1, Math.floor((startX + endX) / 2))
      // 采样格中心纵坐标用于细笔画保留判断。
      const centerY = Math.min(endY - 1, Math.floor((startY + endY) / 2))
      // 穿过采样格中心的来源前景可以保留低覆盖率细笔画。
      const centerIsForeground = sourceMask[centerY * imageData.width + centerX] !== 0
      // 前景覆盖率决定当前逻辑格是否被点亮。
      const coverage = count / area
      // 文本细笔画使用更低阈值，但必须经过采样格中心。
      const keepsThinFeature =
        preserveThinFeatures &&
        centerIsForeground &&
        coverage >= coverageThreshold * 0.45

      if (coverage < coverageThreshold && !keepsThinFeature) {
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

  if (repairBackgroundGaps) {
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
  }

  // 输出裁剪边界来自已经完成阈值采样的逻辑网格。
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
 * 只为图片保留贯穿整个源格且被两侧前景错误桥接的背景通道。
 *
 * 局部空白不会再清除包含真实笔画的整个逻辑格，避免横画和封闭结构断裂。
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
  // 修复判断始终基于采样完成时的原始网格，避免本轮修改互相影响。
  const originalMask = gridMask.slice()

  // 网格范围外的位置始终视为空白。
  const hasGridForeground = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < columns && y < rows && originalMask[y * columns + x] !== 0

  for (let gridY = 0; gridY < rows; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const gridIndex = gridY * columns + gridX

      if (originalMask[gridIndex] === 0) {
        continue
      }

      const startX = bounds.x + gridX * pixelSize
      const startY = bounds.y + gridY * pixelSize
      const endX = Math.min(startX + pixelSize, bounds.x + bounds.width)
      const endY = Math.min(startY + pixelSize, bounds.y + bounds.height)
      // 标记来源格中是否存在一整行背景通道。
      let hasHorizontalBackgroundChannel = false
      // 标记来源格中是否存在一整列背景通道。
      let hasVerticalBackgroundChannel = false

      for (let sourceY = startY; sourceY < endY; sourceY += 1) {
        // 当前来源行只有全部为空白时才构成有效水平通道。
        let rowIsBackground = true

        for (let sourceX = startX; sourceX < endX; sourceX += 1) {
          if (sourceMask[sourceY * sourceWidth + sourceX] !== 0) {
            rowIsBackground = false
            break
          }
        }

        if (rowIsBackground) {
          hasHorizontalBackgroundChannel = true
          break
        }
      }

      for (let sourceX = startX; sourceX < endX; sourceX += 1) {
        // 当前来源列只有全部为空白时才构成有效垂直通道。
        let columnIsBackground = true

        for (let sourceY = startY; sourceY < endY; sourceY += 1) {
          if (sourceMask[sourceY * sourceWidth + sourceX] !== 0) {
            columnIsBackground = false
            break
          }
        }

        if (columnIsBackground) {
          hasVerticalBackgroundChannel = true
          break
        }
      }

      // 水平背景通道且上下均为前景表示采样误桥接了纵向笔画。
      const bridgesVerticalStrokes =
        hasHorizontalBackgroundChannel &&
        hasGridForeground(gridX, gridY - 1) &&
        hasGridForeground(gridX, gridY + 1)
      // 垂直背景通道且左右均为前景表示采样误桥接了横向笔画。
      const bridgesHorizontalStrokes =
        hasVerticalBackgroundChannel &&
        hasGridForeground(gridX - 1, gridY) &&
        hasGridForeground(gridX + 1, gridY)

      if (!bridgesVerticalStrokes && !bridgesHorizontalStrokes) {
        continue
      }

      gridMask[gridIndex] = 0
      gridColors[gridIndex] = 'rgba(0, 0, 0, 0)'
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
  // 输出列数包含裁剪区域和两侧逻辑留白。
  const columns = bounds.width + padding * 2
  // 输出行数包含裁剪区域和上下逻辑留白。
  const rows = bounds.height + padding * 2
  // 新掩码承载裁剪平移后的前景状态。
  const targetMask = new Uint8Array(columns * rows)
  // 新颜色数组与裁剪后的掩码保持相同索引结构。
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
  // 最小横坐标从右边界开始向前景收缩。
  let minX = width
  // 最小纵坐标从下边界开始向前景收缩。
  let minY = height
  // 最大横坐标使用负值表示尚未发现前景。
  let maxX = -1
  // 最大纵坐标使用负值表示尚未发现前景。
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
  // 所有工具路径使用带透明通道的二维上下文。
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
  // 纯色无需创建中间 Canvas，可直接填充完整色板。
  const solid = tryParseCssColor(paint)

  if (solid) {
    return Array<string>(width * height).fill(toRgbaString(solid))
  }

  // 渐变先在逻辑网格尺寸的离屏 Canvas 中完成采样。
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  // 读取渐变像素需要启用频繁读取优化。
  const context = getContext(canvas, true)
  context.fillStyle = createGradient(context, paint, width, height)
  context.fillRect(0, 0, width, height)

  // 渐变位图通道用于生成逐格 Canvas 颜色字符串。
  const data = context.getImageData(0, 0, width, height).data
  // 色板索引与像素网格索引保持一一对应。
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
  // Canvas 解析结果同时承担格式校验和通道归一化。
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
  // Canvas 颜色字符串使用 0 至 1 的透明度范围。
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
  // 顶层正则只提取渐变函数名和参数主体。
  const match = paint.trim().match(/^([a-z-]+)\((.*)\)$/is)

  if (!match) {
    throw new Error('Unsupported pixel paint: ' + paint)
  }

  // 规范化函数名用于选择具体渐变解析路径。
  const type = match[1].toLowerCase()
  // 参数按最外层逗号拆分，保留内部颜色函数结构。
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
  // CSS 线性渐变默认方向为从上到下。
  let direction = '180deg'
  // 未声明方向时所有参数都视为颜色色标。
  let stopParts = parts

  if (parts[0] && isGradientDirection(parts[0])) {
    direction = parts[0]
    stopParts = parts.slice(1)
  }

  // CSS 方向转换为 Canvas 使用的弧度。
  const angle = parseLinearAngle(direction)
  // 渐变方向在横轴上的单位分量。
  const directionX = Math.sin(angle)
  // 渐变方向在纵轴上的单位分量。
  const directionY = -Math.cos(angle)
  // 投影跨度确保渐变覆盖整个逻辑网格。
  const span = Math.abs(directionX) * width + Math.abs(directionY) * height
  // 逻辑网格水平中心作为渐变线中点。
  const centerX = width / 2
  // 逻辑网格垂直中心作为渐变线中点。
  const centerY = height / 2
  // Canvas 线性渐变端点围绕网格中心对称分布。
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
  // 可选形状和中心位置定义，空值表示默认中心。
  let definition = ''
  // 去除定义项后剩余参数均作为颜色色标。
  let stopParts = parts

  if (parts[0] && !looksLikeColorStop(parts[0])) {
    definition = parts[0]
    stopParts = parts.slice(1)
  }

  // 径向渐变中心来自 CSS at 位置或网格中心。
  const position = parsePosition(definition, width, height)
  // 最大角点距离确保最外层颜色覆盖整个网格。
  const radius = Math.max(
    Math.hypot(position.x, position.y),
    Math.hypot(width - position.x, position.y),
    Math.hypot(position.x, height - position.y),
    Math.hypot(width - position.x, height - position.y),
  )
  // 内圆半径为零，外圆半径覆盖最远角点。
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
  // 可选起始角和中心位置定义，空值使用 CSS 默认语义。
  let definition = ''
  // 去除定义项后剩余参数均作为颜色色标。
  let stopParts = parts

  if (parts[0] && !looksLikeColorStop(parts[0])) {
    definition = parts[0]
    stopParts = parts.slice(1)
  }

  // from 子句决定锥形渐变的起始角度。
  const fromMatch = definition.match(/\bfrom\s+(-?[\d.]+)(deg|rad|turn)?/i)
  // Canvas 零角与 CSS 零角相差四分之一圈，需要统一坐标系。
  const startAngle = fromMatch
    ? parseAngle(fromMatch[1] + (fromMatch[2] ?? 'deg')) - Math.PI / 2
    : -Math.PI / 2
  // 锥形渐变中心来自 CSS at 位置或网格中心。
  const position = parsePosition(definition, width, height)
  // Canvas 原生锥形渐变承担最终颜色插值。
  const gradient = context.createConicGradient(startAngle, position.x, position.y)

  addStops(gradient, stopParts)
  return gradient
}

/**
 * 把规范化色标写入 CanvasGradient。
 */
function addStops(gradient: CanvasGradient, values: string[]) {
  // 色标先补齐省略的位置，再写入原生渐变对象。
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
  // 去除外围空白后再定位颜色与位置之间的分隔点。
  const trimmed = value.trim()
  // 仅最外层最后一个空白可能分隔百分比位置。
  const splitIndex = findLastTopLevelWhitespace(trimmed)

  if (splitIndex < 0) {
    return { color: trimmed }
  }

  // 末尾片段只有匹配百分比格式时才作为色标位置。
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

  // 复制色标避免规范化过程修改调用方数组。
  const normalized = stops.map((stop) => ({ ...stop }))
  normalized[0].offset ??= 0
  normalized[normalized.length - 1].offset ??= 1

  // 最近一个已知位置的色标作为后续插值锚点。
  let anchorIndex = 0

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index].offset === undefined) {
      continue
    }

    // 当前插值区间的起始位置。
    const anchorOffset = normalized[anchorIndex].offset ?? 0
    // 当前插值区间的结束位置不得回退到前一个色标之前。
    const targetOffset = Math.max(anchorOffset, normalized[index].offset ?? anchorOffset)
    // 两个已知位置之间需要均匀分配的索引跨度。
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
  // 方向关键字和角度值统一转换为小写形式。
  const normalized = value.trim().toLowerCase()

  if (!normalized.startsWith('to ')) {
    return parseAngle(normalized)
  }

  // 水平方向分量由 left 或 right 关键字决定。
  const horizontal = normalized.includes('right')
    ? 1
    : normalized.includes('left')
      ? -1
      : 0
  // 垂直方向分量由 top 或 bottom 关键字决定。
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
  // 支持 CSS 常用的 deg、rad 和 turn 三种单位。
  const match = value.trim().match(/^(-?[\d.]+)(deg|rad|turn)?$/i)

  if (!match) {
    throw new Error('Unsupported gradient angle: ' + value)
  }

  // 数值部分保留正负方向。
  const amount = Number.parseFloat(match[1])
  // 未声明单位时按 CSS 角度常用的度数处理。
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
  // 最后一个 at 子句用于提取渐变中心位置。
  const atIndex = definition.toLowerCase().lastIndexOf(' at ')

  if (atIndex < 0) {
    return { x: width / 2, y: height / 2 }
  }

  // 位置最多使用横向和纵向两个 CSS 标记。
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
  // 位置关键字统一使用小写比较。
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
  // 单像素 Canvas 用作浏览器原生 CSS 颜色解析器。
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  // 读取最终 RGBA 通道需要频繁读取上下文。
  const context = getContext(canvas, true)
  // 去除输入外围空白，保持两次校验结果稳定。
  const normalized = value.trim()

  context.fillStyle = '#010203'
  context.fillStyle = normalized
  // 第一基准色用于检测浏览器是否拒绝了输入值。
  const firstAttempt = context.fillStyle

  context.fillStyle = '#040506'
  context.fillStyle = normalized
  // 第二基准色排除输入值恰好等于第一基准色的情况。
  const secondAttempt = context.fillStyle

  if (firstAttempt === '#010203' && secondAttempt === '#040506') {
    return undefined
  }

  context.clearRect(0, 0, 1, 1)
  context.fillRect(0, 0, 1, 1)

  // 单像素绘制结果提供规范化后的 RGBA 通道。
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
  // 拆分结果只收集最外层逗号之间的参数片段。
  const parts: string[] = []
  // 括号深度用于忽略颜色函数内部的逗号。
  let depth = 0
  // 当前参数片段在原字符串中的起始位置。
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
  // 反向扫描时使用括号深度忽略颜色函数内部空白。
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

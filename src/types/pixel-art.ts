/**
 * 像素渲染共享类型。
 *
 * 本文件只描述跨组件和工具使用的数据结构，不包含运行时逻辑。
 */

/**
 * 把像素图案中的单字符键映射为 CSS 颜色字符串。
 */
export type PixelPalette = Record<string, string>
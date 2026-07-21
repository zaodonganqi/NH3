import type { PixelPalette } from '../types'

/**
 * 描述顶部导航中的一个可访问入口。
 */
export interface NavItem {
  /**
   * 章节和 Vue 列表复用的稳定标识；站内入口同时对应目标 section 的 id。
   */
  id: string
  /**
   * 导航中直接展示的短标签。
   */
  label: string
  /**
   * 站内锚点或外部页面的完整链接地址。
   */
  href: string
  /**
   * 固定绘制导航图标的方形像素掩码；点号表示透明格，其他字符表示填充格。
   */
  iconPattern: readonly string[]
  /**
   * 标记是否交由浏览器新窗口打开；省略时按站内锚点处理。
   */
  external?: boolean
}

// 站点 GitHub 入口直接指向当前仓库所属账号，不创建中间页面。
export const githubUrl = 'https://github.com/zaodonganqi'

// 全站像素图案使用的稳定调色板集合。
export const palettes = {
  primary: { '1': '#617cf4' },
  ink: { '1': '#243854' },
  hydrogen: { '1': '#62c9c8', '2': '#93dfdc' },
  nitrogen: { '1': '#758af3', '2': '#a8b6ff' },
  white: { '1': '#ffffff' },
  section: { '1': '#617cf4', '2': '#70d3d0', '3': '#f3a3ce', w: '#ffffff' },
} satisfies Record<string, PixelPalette>

// 导航图标使用固定方形掩码，只保留各入口最基础的识别特征。
const navIconPatterns = {
  home: [
    '....1....',
    '...111...',
    '..11.11..',
    '.11...11.',
    '11.....11',
    '.1.....1.',
    '.1..1..1.',
    '.1..1..1.',
    '.1111111.',
  ],
  project: [
    '..111....',
    '.11111...',
    '.1...111.',
    '.1.....1.',
    '.1.....1.',
    '.1.....1.',
    '.1.....1.',
    '.1111111.',
    '.........',
  ],
  tool: [
    '...1..1...',
    '..11..11..',
    '..11..11..',
    '..11..11..',
    '...1111...',
    '....11....',
    '....11....',
    '....11....',
    '....11....',
    '...1111...',
  ],
  blog: [
    '.1111111.',
    '.1.....1.',
    '.1.111.1.',
    '.1.....1.',
    '.1.111.1.',
    '.1.....1.',
    '.1.....1.',
    '.1111111.',
    '.........',
  ],
  about: [
    '...111...',
    '..1...1..',
    '..1...1..',
    '...111...',
    '.........',
    '..11111..',
    '.1.....1.',
    '.1.....1.',
    '.1.....1.',
  ],
  github: [
    '...1111...',
    '.11111111.',
    '111.11.111',
    '111....111',
    '111....111',
    '111....111',
    '111....111',
    '11.1..1111',
    '.1....111.',
    '..11..11..',
  ],
} as const

// 顶部导航按照首页实际章节顺序排列，GitHub 是唯一外部入口。
export const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'HOME',
    href: '#home',
    iconPattern: navIconPatterns.home,
  },
  {
    id: 'project',
    label: 'PROJECT',
    href: '#project',
    iconPattern: navIconPatterns.project,
  },
  {
    id: 'tool',
    label: 'TOOL',
    href: '#tool',
    iconPattern: navIconPatterns.tool,
  },
  {
    id: 'blog',
    label: 'BLOG',
    href: '#blog',
    iconPattern: navIconPatterns.blog,
  },
  {
    id: 'about',
    label: 'ABOUT',
    href: '#about',
    iconPattern: navIconPatterns.about,
  },
  {
    id: 'github',
    label: 'GITHUB',
    href: githubUrl,
    iconPattern: navIconPatterns.github,
    external: true,
  },
]

// Hero 内部继续复用的少量像素图案。
export const patterns = {
  smile: ['.....', '.1.1.', '.....', '1...1', '.111.'],
  cursor: ['1.......', '11......', '1.1.....', '1..1....', '1...1...', '1....1..', '1.1111..', '11..1...', '1....1..'],
  chevron: ['1.....1', '.1...1.', '..1.1..', '...1...'],
}
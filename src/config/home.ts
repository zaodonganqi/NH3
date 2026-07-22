/**
 * 首页索引 section 的纯配置数据。
 *
 * 首页只负责展示和跳转；详情内容由每项 href 指向的新页面承载。
 */

/**
 * 描述首页中一张可跳转的像素索引卡片。
 */
export interface HomeSectionLinkItem {
  // 列表渲染和后续内容映射使用的稳定标识。
  id: string
  // 卡片左上角显示的短索引。
  index: string
  // 卡片的主标题。
  title: string
  // 首页仅展示的一行摘要，不承载详情正文。
  summary: string
  // 卡片右上角显示的分类或状态。
  meta: string
  // 点击后打开的新页面地址；空字符串表示尚未配置。
  href: string
  // 图标和交互边框使用的主题纯色。
  accent: string
  // 像素阴影和次级图案使用的浅色。
  secondary: string
  // Canvas 图标使用的字符矩阵。
  pattern: readonly string[]
}

// 项目 section 的配置项只提供索引信息和目标页面地址。
export const projectItems: HomeSectionLinkItem[] = [
  {
    id: 'project-01',
    index: '01',
    title: 'PROJECT NODE',
    summary: '等待配置关联项目页面',
    meta: 'UNASSIGNED',
    href: '',
    accent: '#c66f2f',
    secondary: '#f3cfad',
    pattern: ['1111111', '1.....1', '1.111.1', '1.1...1', '1.111.1', '1.....1', '1111111'],
  },
  {
    id: 'project-02',
    index: '02',
    title: 'SCRIPT NODE',
    summary: '等待配置脚本项目页面',
    meta: 'UNASSIGNED',
    href: '',
    accent: '#2f8257',
    secondary: '#b7e2ca',
    pattern: ['1.....1', '.1...1.', '..1.1..', '...1...', '..1.1..', '.1...1.', '1.....1'],
  },
  {
    id: 'project-03',
    index: '03',
    title: 'LAB NODE',
    summary: '等待配置实验项目页面',
    meta: 'UNASSIGNED',
    href: '',
    accent: '#247d88',
    secondary: '#b7e4e6',
    pattern: ['..111..', '..1.1..', '.11.11.', '.1...1.', '11...11', '1.....1', '1111111'],
  },
]

// 工具 section 的配置项填入地址后即可作为新页面入口使用。
export const toolItems: HomeSectionLinkItem[] = [
  {
    id: 'tool-01',
    index: '01',
    title: 'TOOL ENTRY',
    summary: '等待配置工具页面',
    meta: 'UTILITY',
    href: '',
    accent: '#aa861f',
    secondary: '#eadba3',
    pattern: ['...1...', '..111..', '.11.11.', '11...11', '...1...', '...1...', '..111..'],
  },
  {
    id: 'tool-02',
    index: '02',
    title: 'PIXEL ENTRY',
    summary: '等待配置像素工具页面',
    meta: 'CANVAS',
    href: '',
    accent: '#247d88',
    secondary: '#b7e4e6',
    pattern: ['1111111', '1.1.1.1', '1111111', '1.1.1.1', '1111111', '1.1.1.1', '1111111'],
  },
  {
    id: 'tool-03',
    index: '03',
    title: 'CODE ENTRY',
    summary: '等待配置代码工具页面',
    meta: 'SOURCE',
    href: '',
    accent: '#2f8257',
    secondary: '#b7e2ca',
    pattern: ['11...11', '.11.11.', '..111..', '...1...', '..111..', '.11.11.', '11...11'],
  },
  {
    id: 'tool-04',
    index: '04',
    title: 'DATA ENTRY',
    summary: '等待配置数据工具页面',
    meta: 'BUFFER',
    href: '',
    accent: '#c83d4b',
    secondary: '#f0b9bf',
    pattern: ['.11111.', '11...11', '1.111.1', '1.1.1.1', '1.111.1', '11...11', '.11111.'],
  },
]

// 博客 section 只展示文章索引，正文始终由目标页面渲染。
export const blogItems: HomeSectionLinkItem[] = [
  {
    id: 'blog-001',
    index: '001',
    title: 'ARTICLE ENTRY',
    summary: '等待配置文章页面与摘要',
    meta: '----.--.--',
    href: '',
    accent: '#2f8257',
    secondary: '#b7e2ca',
    pattern: ['111111.', '1....1.', '1.11.1.', '1....1.', '1.11.1.', '1....1.', '111111.'],
  },
  {
    id: 'blog-002',
    index: '002',
    title: 'NOTE ENTRY',
    summary: '等待配置随笔页面与摘要',
    meta: '----.--.--',
    href: '',
    accent: '#247d88',
    secondary: '#b7e4e6',
    pattern: ['1111111', '1.....1', '1.111.1', '1.....1', '1.111.1', '1.....1', '1111111'],
  },
  {
    id: 'blog-003',
    index: '003',
    title: 'LOG ENTRY',
    summary: '等待配置日志页面与摘要',
    meta: '----.--.--',
    href: '',
    accent: '#c83d4b',
    secondary: '#f0b9bf',
    pattern: ['1.....1', '11...11', '1.1.1.1', '1..1..1', '1.1.1.1', '11...11', '1.....1'],
  },
]

// 关于 section 只提供个人信息相关页面的导航入口。
export const aboutItems: HomeSectionLinkItem[] = [
  {
    id: 'about-profile',
    index: 'A1',
    title: 'PROFILE PAGE',
    summary: '等待配置个人介绍页面',
    meta: 'IDENTITY',
    href: '',
    accent: '#247d88',
    secondary: '#b7e4e6',
    pattern: ['..111..', '.1...1.', '.1...1.', '..111..', '.11111.', '11...11', '1.....1'],
  },
  {
    id: 'about-contact',
    index: 'A2',
    title: 'CONTACT PAGE',
    summary: '等待配置联系方式页面',
    meta: 'CHANNEL',
    href: '',
    accent: '#c83d4b',
    secondary: '#f0b9bf',
    pattern: ['1111111', '1.....1', '.1...1.', '..1.1..', '...1...', '..1.1..', '.1...1.'],
  },
  {
    id: 'about-source',
    index: 'A3',
    title: 'SOURCE PAGE',
    summary: '等待配置代码主页地址',
    meta: 'EXTERNAL',
    href: '',
    accent: '#30343b',
    secondary: '#c5c8cd',
    pattern: ['..111..', '.1...1.', '1.11..1', '1...1.1', '1..11.1', '.1...1.', '..111..'],
  },
]

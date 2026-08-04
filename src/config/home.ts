import aboutAvatar from '../assets/img/about-avatar.png'

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

/**
 * 描述 Hero 代码简介中的一个字符串属性。
 */
export interface HeroCodeEntry {
  // 对象属性名直接展示在代码简介左侧。
  key: string
  // 对象属性值以字符串形式展示在代码简介右侧。
  value: string
}

/**
 * 描述 About 滚动叙事中的一段中心文字。
 */
export interface AboutIntroLine {
  // 稳定标识用于 Vue 渲染和 GSAP 节点映射。
  id: string
  // 当前滚动阶段完整展示的文字。
  text: string
  // 像素文字使用的主色。
  color: string
  // Canvas 像素文字的采样密度。
  density: number
}

/**
 * 描述 About 两侧一根由正方形像素组成的律动柱。
 */
export interface AboutRhythmBar {
  // 稳定标识用于动画状态映射。
  id: string
  // 柱体出现于舞台左侧或右侧。
  side: 'left' | 'right'
  // 像素块使用的纯色。
  color: string
  // 柱体包含的最大像素数量。
  segmentCount: number
  // 窄屏最多保留的像素数量，避免左右柱体完全遮住中心。
  mobileSegmentCount: number
  // 律动收缩时仍需保留的最少像素数量。
  minVisible: number
  // 正弦律动使用的相位偏移。
  phase: number
}

/**
 * 描述最终个人名片两侧的一块碎片化信息。
 */
export interface AboutProfileFragment {
  // 稳定标识用于像素重组目标映射。
  id: string
  // 信息块顶部的短标签。
  label: string
  // 信息块展示的主要内容。
  value: string
  // 信息块位于头像左侧或右侧。
  side: 'left' | 'right'
  // 信息块相对所在列的水平错位量。
  shift: number
  // 标签、外轮廓与硬阴影使用的强调色。
  accent: string
  // 信息块内部使用的浅色纯色背景。
  background: string
}

/**
 * 描述最终个人名片底部的一个联系入口。
 */
export interface AboutContactLink {
  // 稳定标识用于链接渲染和动画交错。
  id: string
  // 联系入口的短标签。
  label: string
  // 页面中直接显示的联系值。
  value: string
  // 点击后打开的真实地址。
  href: string
  // 链接边框和悬停状态使用的主题色。
  accent: string
}

// Hero 的标题、行动入口、代码简介和终端文案集中在此处维护。
export const heroContent = {
  id: 'home',
  eyebrow: 'SOFTWARE ENGINEER / EXPLORER',
  title: '躁动的\n氨气',
  taglineSymbol: '♥',
  tagline: 'Learn. Create. Repeat.',
  cta: {
    label: '探索更多',
    href: '#project',
  },
  code: {
    ariaLabel: '代码简介',
    keyword: 'const',
    variableName: 'nh3',
    entries: [
      { key: 'identity', value: 'NH3' },
      { key: 'nature', value: 'curious' },
      { key: 'passion', value: 'building' },
      { key: 'energy', value: 'unlimited' },
    ] satisfies HeroCodeEntry[],
  },
  terminal: {
    ariaLabel: '终端问候',
    prompt: '>_',
    greeting: '> Hello, World!',
  },
  molecule: {
    ariaLabel: 'NH3 分子像素图形',
    returnAriaLabel: '返回页面顶部',
    returnTitle: '返回顶部',
  },
  scrollCue: 'SCROLL DOWN',
} as const

// 各首页 section 的标题、索引栏和状态文案集中在此处维护。
export const homeSections = {
  project: {
    id: 'project',
    kicker: 'PROJECT / 关联项目',
    title: 'PROJECT',
    nextLabel: 'NEXT',
    progressLabel: 'PROJECT_STREAM',
  },
  tool: {
    id: 'tool',
    kicker: 'TOOL / 前端工具',
    title: 'TOOL',
    ariaLabel: '工具页面入口',
  },
  blog: {
    id: 'blog',
    title: 'BLOG',
    ariaLabel: '文章页面索引',
    streamLabel: 'ARTICLE_STREAM',
    entriesLabel: 'ENTRIES',
    scrollLabel: 'SCROLL INDEX',
    readLabel: 'READ',
  },
  about: {
    id: 'about',
    kicker: 'ABOUT / 关于',
    title: 'ABOUT',
    ariaLabel: '个人信息页面索引',
  },
} as const

// 首页导航和 ScrollTrigger 共用的章节顺序由展示配置统一派生。
export const homeSectionIds = [
  heroContent.id,
  homeSections.project.id,
  homeSections.tool.id,
  homeSections.blog.id,
  homeSections.about.id,
] as const

/**
 * 限制首页滚动状态只能指向配置中存在的章节。
 */
export type HomeSectionId = (typeof homeSectionIds)[number]

// 项目、工具、文章和个人入口卡片共享的交互状态文案。
export const homeCardLabels = {
  openNewPage: 'OPEN NEW PAGE',
  noTarget: 'NO TARGET',
  ready: 'READY',
  unassigned: 'UNASSIGNED',
} as const

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
    accent: '#5470d2',
    secondary: '#e7ecff',
    pattern: ['...1...', '..111..', '.11.11.', '11...11', '...1...', '...1...', '..111..'],
  },
  {
    id: 'tool-02',
    index: '02',
    title: 'PIXEL ENTRY',
    summary: '等待配置像素工具页面',
    meta: 'CANVAS',
    href: '',
    accent: '#2b8c8c',
    secondary: '#ddf4f1',
    pattern: ['1111111', '1.1.1.1', '1111111', '1.1.1.1', '1111111', '1.1.1.1', '1111111'],
  },
  {
    id: 'tool-03',
    index: '03',
    title: 'CODE ENTRY',
    summary: '等待配置代码工具页面',
    meta: 'SOURCE',
    href: '',
    accent: '#7658b8',
    secondary: '#ede5fb',
    pattern: ['11...11', '.11.11.', '..111..', '...1...', '..111..', '.11.11.', '11...11'],
  },
  {
    id: 'tool-04',
    index: '04',
    title: 'DATA ENTRY',
    summary: '等待配置数据工具页面',
    meta: 'BUFFER',
    href: '',
    accent: '#c95f78',
    secondary: '#fbe5ea',
    pattern: ['.11111.', '11...11', '1.111.1', '1.1.1.1', '1.111.1', '11...11', '.11111.'],
  },
]

// 博客 section 只展示文章索引，正文始终由目标页面渲染。
export const blogItems: HomeSectionLinkItem[] = [
  {
    id: 'blog-001',
    index: '001',
    title: 'PIXEL TEXT PIPELINE',
    summary: '让 Canvas 栅格化保留文字的笔画边界',
    meta: 'CANVAS / NOTE',
    href: '',
    accent: '#2f8257',
    secondary: '#b7e2ca',
    pattern: ['111111.', '1....1.', '1.11.1.', '1....1.', '1.11.1.', '1....1.', '111111.'],
  },
  {
    id: 'blog-002',
    index: '002',
    title: 'SCROLL STATE MACHINE',
    summary: '处理 GSAP 进入、离开与回滚时的状态切换',
    meta: 'GSAP / MOTION',
    href: '',
    accent: '#247d88',
    secondary: '#b7e4e6',
    pattern: ['1111111', '1.....1', '1.111.1', '1.....1', '1.111.1', '1.....1', '1111111'],
  },
  {
    id: 'blog-003',
    index: '003',
    title: 'WEBGL PIXEL FIELD',
    summary: '用 Three.js 管理二维像素层的性能与深度',
    meta: 'THREE / WEBGL',
    href: '',
    accent: '#c83d4b',
    secondary: '#f0b9bf',
    pattern: ['1.....1', '11...11', '1.1.1.1', '1..1..1', '1.1.1.1', '11...11', '1.....1'],
  },
]

// About 独立使用的柔和主色与浅色背景集中在此处维护。
export const aboutPalette = {
  blue: '#7892e4',
  teal: '#6fc4bf',
  purple: '#a184d2',
  pink: '#df9fba',
  blueLight: '#eaf0fc',
  tealLight: '#e4f4f2',
  purpleLight: '#f0eafa',
  pinkLight: '#faeaf1',
} as const

// About 的滚动文字、律动柱和最终个人名片全部由这一份配置驱动。
export const aboutContent = {
  palette: aboutPalette,
  intro: [
    {
      id: 'curiosity',
      text: '好奇，让我不断靠近未知',
      color: aboutPalette.blue,
      density: 11,
    },
    {
      id: 'building',
      text: '把想法拆开，再做成能运行的东西',
      color: aboutPalette.teal,
      density: 11,
    },
    {
      id: 'order',
      text: '在代码、像素与运动之间寻找秩序',
      color: aboutPalette.purple,
      density: 11,
    },
    {
      id: 'motion',
      text: '保持躁动，也保持构建',
      color: aboutPalette.pink,
      density: 11,
    },
  ] satisfies AboutIntroLine[],
  bars: [
    { id: 'left-01', side: 'left', color: aboutPalette.blue, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 0 },
    { id: 'left-02', side: 'left', color: aboutPalette.blue, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 0.26 },
    { id: 'left-03', side: 'left', color: aboutPalette.teal, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 0.52 },
    { id: 'left-04', side: 'left', color: aboutPalette.teal, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 0.78 },
    { id: 'left-05', side: 'left', color: aboutPalette.purple, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 1.04 },
    { id: 'left-06', side: 'left', color: aboutPalette.purple, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 1.3 },
    { id: 'left-07', side: 'left', color: aboutPalette.pink, segmentCount: 9, mobileSegmentCount: 5, minVisible: 3, phase: 1.56 },
    { id: 'left-08', side: 'left', color: aboutPalette.pink, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 1.82 },
    { id: 'left-09', side: 'left', color: aboutPalette.purple, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 2.08 },
    { id: 'left-10', side: 'left', color: aboutPalette.teal, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 2.34 },
    { id: 'left-11', side: 'left', color: aboutPalette.blue, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 2.6 },
    { id: 'left-12', side: 'left', color: aboutPalette.blue, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 2.86 },
    { id: 'right-01', side: 'right', color: aboutPalette.pink, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 0.72 },
    { id: 'right-02', side: 'right', color: aboutPalette.pink, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 0.98 },
    { id: 'right-03', side: 'right', color: aboutPalette.purple, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 1.24 },
    { id: 'right-04', side: 'right', color: aboutPalette.purple, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 1.5 },
    { id: 'right-05', side: 'right', color: aboutPalette.teal, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 1.76 },
    { id: 'right-06', side: 'right', color: aboutPalette.teal, segmentCount: 9, mobileSegmentCount: 5, minVisible: 3, phase: 2.02 },
    { id: 'right-07', side: 'right', color: aboutPalette.blue, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 2.28 },
    { id: 'right-08', side: 'right', color: aboutPalette.blue, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 2.54 },
    { id: 'right-09', side: 'right', color: aboutPalette.teal, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 2.8 },
    { id: 'right-10', side: 'right', color: aboutPalette.purple, segmentCount: 8, mobileSegmentCount: 5, minVisible: 3, phase: 3.06 },
    { id: 'right-11', side: 'right', color: aboutPalette.pink, segmentCount: 7, mobileSegmentCount: 4, minVisible: 2, phase: 3.32 },
    { id: 'right-12', side: 'right', color: aboutPalette.pink, segmentCount: 6, mobileSegmentCount: 4, minVisible: 2, phase: 3.58 },
  ] satisfies AboutRhythmBar[],
  profile: {
    portrait: {
      src: aboutAvatar,
      alt: 'NH3 的个人头像',
      fallback: 'NH3',
    },
    name: 'NH3',
    role: 'SOFTWARE ENGINEER / EXPLORER',
    statement: 'LEARN. CREATE. REPEAT.',
    fragments: [
      { id: 'nature', label: 'NATURE', value: 'CURIOUS', side: 'left', shift: -34, accent: aboutPalette.blue, background: aboutPalette.blueLight },
      { id: 'focus', label: 'FOCUS', value: 'VUE / CANVAS / MOTION', side: 'left', shift: 18, accent: aboutPalette.teal, background: aboutPalette.tealLight },
      { id: 'mode', label: 'MODE', value: 'LEARN / CREATE / REPEAT', side: 'left', shift: -10, accent: aboutPalette.purple, background: aboutPalette.purpleLight },
      { id: 'passion', label: 'PASSION', value: 'BUILDING', side: 'right', shift: 30, accent: aboutPalette.pink, background: aboutPalette.pinkLight },
      { id: 'energy', label: 'ENERGY', value: 'UNLIMITED', side: 'right', shift: -20, accent: aboutPalette.blue, background: aboutPalette.blueLight },
      { id: 'status', label: 'STATUS', value: 'OPEN & ITERATING', side: 'right', shift: 12, accent: aboutPalette.teal, background: aboutPalette.tealLight },
    ] satisfies AboutProfileFragment[],
    contacts: [
      { id: 'github', label: 'GITHUB', value: '@zaodonganqi', href: 'https://github.com/zaodonganqi', accent: '#30343b' },
      { id: 'repository', label: 'SOURCE', value: 'NH3', href: 'https://github.com/zaodonganqi/NH3', accent: aboutPalette.purple },
    ] satisfies AboutContactLink[],
  },
} as const

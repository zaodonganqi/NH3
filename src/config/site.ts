export type PixelPalette = Record<string, string>

export interface NavItem {
  id: string
  label: string
  icon: string[]
}

export interface ProjectItem {
  title: string
  description: string
  pattern: string[]
  palette: PixelPalette
}

export interface DecorativePixel {
  x: number
  y: number
  color: 'cyan' | 'pink' | 'blue' | 'purple'
  size: number
}

export const palettes = {
  primary: { '1': '#617cf4' },
  ink: { '1': '#243854' },
  hydrogen: { '1': '#62c9c8', '2': '#93dfdc' },
  nitrogen: { '1': '#758af3', '2': '#a8b6ff' },
  white: { '1': '#ffffff' },
  section: { '1': '#617cf4', '2': '#70d3d0', '3': '#f3a3ce', w: '#ffffff' },
} satisfies Record<string, PixelPalette>

export const navItems: NavItem[] = [
  { id: 'home', label: 'HOME', icon: ['..1..', '.111.', '1.1.1', '..1..', '.111.'] },
  { id: 'about', label: 'ABOUT', icon: ['..1..', '.111.', '..1..', '.111.', '11111'] },
  { id: 'projects', label: 'PROJECTS', icon: ['1...1', '.1.1.', '..1..', '.1.1.', '1...1'] },
  { id: 'blog', label: 'BLOG', icon: ['11111', '1...1', '11111', '1...1', '11111'] },
  { id: 'contact', label: 'CONTACT', icon: ['11111', '1...1', '.1.1.', '..1..', '11111'] },
]

export const patterns = {
  smile: ['.....', '.1.1.', '.....', '1...1', '.111.'],
  cursor: ['1.......', '11......', '1.1.....', '1..1....', '1...1...', '1....1..', '1.1111..', '11..1...', '1....1..'],
  chevron: ['1.....1', '.1...1.', '..1.1..', '...1...'],
  face: ['..11111..', '.1222221.', '122222221', '12w222w21', '122222221', '1222w2221', '12w222w21', '.1222221.', '..11111..'],
  mail: ['111111111', '122222221', '112222211', '121222121', '122121221', '122212221', '122222221', '111111111'],
}

export const projects: ProjectItem[] = [
  {
    title: '交互实验室',
    description: '围绕浏览器、动效和视觉反馈构建的小型实验集合。',
    pattern: ['11111111', '12222221', '12122121', '12211221', '12122121', '12222221', '11111111', '........'],
    palette: { '1': '#617cf4', '2': '#a9b8ff' },
  },
  {
    title: '效率工具箱',
    description: '把重复操作压缩成清晰、快速、可维护的工具。',
    pattern: ['..1111..', '.122221.', '12211221', '12122121', '12122121', '12211221', '.122221.', '..1111..'],
    palette: { '1': '#45aaa9', '2': '#70d3d0' },
  },
  {
    title: '开源记录',
    description: '代码、笔记与持续迭代中的公开过程。',
    pattern: ['1......1', '.1....1.', '..1..1..', '...11...', '...11...', '..1..1..', '.1....1.', '1......1'],
    palette: { '1': '#d889bb' },
  },
]

export const posts = [
  { date: '2026.07', title: '如何让界面保留一点生命力' },
  { date: '2026.05', title: '从一个小工具开始整理复杂流程' },
  { date: '2026.03', title: '像素并不等于粗糙' },
]

export const decorativePixels: DecorativePixel[] = [
  { x: 4, y: 36, color: 'cyan', size: 10 }, { x: 8, y: 58, color: 'pink', size: 8 },
  { x: 18, y: 18, color: 'blue', size: 7 }, { x: 24, y: 68, color: 'cyan', size: 9 },
  { x: 30, y: 20, color: 'pink', size: 9 }, { x: 34, y: 11, color: 'cyan', size: 10 },
  { x: 39, y: 30, color: 'purple', size: 12 }, { x: 44, y: 15, color: 'blue', size: 9 },
  { x: 47, y: 69, color: 'pink', size: 10 }, { x: 51, y: 22, color: 'cyan', size: 7 },
  { x: 55, y: 78, color: 'blue', size: 10 }, { x: 62, y: 12, color: 'pink', size: 7 },
  { x: 68, y: 52, color: 'purple', size: 11 }, { x: 73, y: 33, color: 'cyan', size: 8 },
  { x: 77, y: 73, color: 'pink', size: 9 }, { x: 83, y: 36, color: 'pink', size: 10 },
  { x: 88, y: 66, color: 'blue', size: 9 }, { x: 92, y: 22, color: 'purple', size: 10 },
  { x: 96, y: 53, color: 'cyan', size: 8 }, { x: 15, y: 88, color: 'cyan', size: 9 },
]

export const circuitPoints = [
  ...Array.from({ length: 11 }, (_, index) => ({ x: 76 + index * 1.35, y: 43 })),
  ...Array.from({ length: 7 }, (_, index) => ({ x: 90 + index * 1.35, y: 43 - index * 0.8 })),
  ...Array.from({ length: 9 }, (_, index) => ({ x: index * 1.15, y: 76 })),
]

export const equalizer = [2, 4, 7, 3, 5, 9, 4, 2, 6, 3, 1]

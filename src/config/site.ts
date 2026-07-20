import type { PixelPalette } from '../types'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: string[]
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

// 顶部导航按照首页实际章节顺序排列，GitHub 是唯一外部入口。
export const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'HOME',
    href: '#home',
    icon: ['..1..', '.111.', '1.1.1', '..1..', '.111.'],
  },
  {
    id: 'project',
    label: 'PROJECT',
    href: '#project',
    icon: ['1...1', '.1.1.', '..1..', '.1.1.', '1...1'],
  },
  {
    id: 'tool',
    label: 'TOOL',
    href: '#tool',
    icon: ['11...', '.11..', '..111', '..1..', '.1...', '1....'],
  },
  {
    id: 'blog',
    label: 'BLOG',
    href: '#blog',
    icon: ['11111', '1...1', '11111', '1...1', '11111'],
  },
  {
    id: 'about',
    label: 'ABOUT',
    href: '#about',
    icon: ['..1..', '.111.', '..1..', '.111.', '11111'],
  },
  {
    id: 'github',
    label: 'GITHUB',
    href: githubUrl,
    external: true,
    icon: [
      '..11111..',
      '.1111111.',
      '111111111',
      '111111111',
      '111111111',
      '.1111111.',
      '..11.11..',
      '.11...11.',
      '11.....11',
    ],
  },
]

// Hero 内部继续复用的少量像素图案。
export const patterns = {
  smile: ['.....', '.1.1.', '.....', '1...1', '.111.'],
  cursor: ['1.......', '11......', '1.1.....', '1..1....', '1...1...', '1....1..', '1.1111..', '11..1...', '1....1..'],
  chevron: ['1.....1', '.1...1.', '..1.1..', '...1...'],
}
# NH3 Blog

个人博客站，基于 Vue 3 + Vite 8 构建。

## 技术栈

- Vue 3.5
- Vite 8
- pnpm

## 开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

## 项目结构

```
src/
├── api/             # 接口请求
├── assets/          # 静态资源
│   ├── images/
│   └── styles/
├── components/      # 通用组件
│   └── common/
├── composables/     # 组合式函数
├── config/          # 应用配置
├── directives/      # 自定义指令
├── layouts/         # 布局组件
├── plugins/         # 插件
├── router/          # 路由
├── stores/          # 状态管理
├── utils/           # 工具函数
├── views/           # 页面组件
├── App.vue
└── main.js
```

## License

GPL-3.0

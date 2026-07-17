# NH3.skill

**简体中文** | [English](docs/README.en.md)

NH3.skill 是以我的昵称命名的 Vue 3 编码 skill。主要面向 Vue 3 + Vite + TypeScript 项目，以我个人的喜好整理了一组实用工程约束：路由安全、组件边界、i18n、环境隔离、紧凑型后台界面、视觉一致性、验证策略、发布准备和聚焦协作。

本仓库仅面向 Vue 3。React、Svelte、Angular、Nuxt、Next、SvelteKit、非前端项目以及其他技术栈不在支持范围内，在 Vue 3以外的项目中使用时不保证这些规则有效。

## 目录

- [内容](#内容)
- [使用](#使用)
- [适用场景](#适用场景)
- [不适用场景](#不适用场景)
- [维护](#维护)
- [许可证](#许可证)

## 内容

```text
NH3.skill/
├── SKILL.md                 # 英文标准 skill 指令
├── agents/
│   └── openai.yaml          # Codex 元数据（需要时自取）
├── references/
│   └── zh-CN.md             # SKILL.md 的中文直译参考
├── docs/
│   └── README.en.md         # 英文 README
├── LICENSE
└── README.md
```

## 使用

将此目录复制到支持 skill 的 AI 编码工具或工作流所使用的位置。需要应用 Vue 3 规则时，可以显式调用：

```text
Use $nh3 to review this Vue 3 admin page and fix the issues you find.
```

## 适用场景

- Vue 3 + Vite + TypeScript 应用
- SPA 后台系统、仪表盘和内部工具
- Vue Router、Pinia、composables、SFC 和组件库工作
- 需要关注路由可达性、i18n、环境隔离、视觉质量和窄 diff 的前端 review

## 不适用场景

- React、Svelte、Angular 或其他非 Vue 技术栈
- Nuxt、Next、SvelteKit 或 SSR/全栈框架约定
- 纯后端、纯 CLI、纯数据或纯基础设施项目

## 维护

保持 `SKILL.md` 简洁且权威。保持 `references/zh-CN.md` 作为 `SKILL.md` 的直接翻译，不添加额外规则或扩展说明。所有文本使用 UTF-8。欢迎补充其他框架下的项目约束，不让 AI 工具在自己的项目内肆无忌惮。

## 许可证

Apache-2.0
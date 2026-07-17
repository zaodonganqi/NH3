# NH3.skill

[简体中文](../README.md) | **English**

NH3.skill is a Vue 3 coding skill named after my nickname. It is mainly for Vue 3 + Vite + TypeScript projects, and collects a set of practical engineering constraints based on my personal preferences: route safety, component boundaries, i18n, environment separation, compact admin-style UI, visual consistency, validation strategy, release readiness, and focused collaboration.

This repository is only for Vue 3. React, Svelte, Angular, Nuxt, Next, SvelteKit, non-frontend projects, and other stacks are outside its supported scope. These rules are not guaranteed to work when used outside Vue 3 projects.

## Contents

```text
NH3.skill/
├── SKILL.md                 # Standard English skill instructions
├── agents/
│   └── openai.yaml          # Codex metadata (take it when needed)
├── references/
│   └── zh-CN.md             # Direct Chinese translation of SKILL.md
├── docs/
│   └── README.en.md         # English README
├── LICENSE
└── README.md
```

## Use

Copy this directory into the skill location used by an AI coding tool or workflow that supports skills. Invoke it explicitly when you want the Vue 3 rules applied:

```text
Use $nh3 to review this Vue 3 admin page and fix the issues you find.
```

## When It Helps

- Vue 3 + Vite + TypeScript applications
- SPA admin systems, dashboards, and internal tools
- Vue Router, Pinia, composables, SFCs, and component-library work
- Frontend reviews where route reachability, i18n, environment separation, visual quality, and narrow diffs matter

## Not In Scope

- React, Svelte, Angular, or other non-Vue stacks
- Nuxt, Next, SvelteKit, or SSR/full-stack framework conventions
- Backend-only, CLI-only, data-only, or infrastructure-only projects

## Maintenance

Keep `SKILL.md` concise and authoritative. Keep `references/zh-CN.md` as a direct translation of `SKILL.md`, without extra rules or expanded guidance. Store all text as UTF-8. Contributions for project constraints under other frameworks are welcome, so AI tools do not run wild inside their own projects.

## License

Apache-2.0
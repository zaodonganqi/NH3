---
name: nh3
description: Apply NH3's practical Vue 3 frontend engineering rules to Vue 3, Vite, TypeScript, SPA, admin, dashboard, and component-library projects. Use when an AI coding assistant needs to inspect, implement, refactor, review, validate, build, or release Vue 3 frontend code while preserving routes, permissions, existing behavior, UI clarity, environment separation, security, and focused change scope. This skill is scoped to Vue 3 projects only; React, Svelte, Angular, Nuxt, Next, SvelteKit, and other stacks are out of scope and are not guaranteed to benefit from these rules.
---

# NH3 Vue 3 Engineering Rules

## Scope

Use this skill only for Vue 3 frontend projects, especially Vue 3 + Vite + TypeScript applications, SPA admin systems, dashboards, tool interfaces, and Vue component-library work. If the target repository is not a Vue 3 project, state that the skill is outside its supported scope and continue only with ordinary engineering judgment.

Do not treat these instructions as guidance for React, Svelte, Angular, Nuxt, Next, SvelteKit, or non-frontend projects. Other stacks may share broad engineering concerns, but this skill does not guarantee good outcomes outside Vue 3.

## Core Principles

1. Confirm the target is Vue 3 before applying this skill. Inspect `package.json`, Vite config, router/store setup, SFC usage, and component-library conventions.
2. Inspect the target project before editing. Routes, navigation, permissions, copy, APIs, state, layouts, tests, and build config define the real engineering boundary.
3. Preserve existing capabilities. Navigation cleanup, page merging, or refactoring must not make a capability unreachable.
4. Keep changes narrow. Do not reformat unrelated files, rewrite unrelated modules, or replace dependencies without need.
5. Operational pages should be compact, clear, and scannable. Build working tools, not marketing pages.
6. Every new abstraction, rule, or file must provide concrete value.
7. Final output must state changed files, static checks, and validation that was not executed.

## Project Structure

Use this structure for typical Vue 3 SPA, admin, dashboard, and component-library projects. If the repository already has a structure, follow it and preserve the same responsibility boundaries.

```text
project/
├── docs/                    # Project rules, architecture notes, release notes
├── public/                  # Public static assets
├── src/
│   ├── api/                 # API clients, request adapters, DTO boundaries
│   ├── assets/              # Source-managed images, fonts, icons
│   ├── components/          # Reusable UI and business components
│   ├── composables/         # Vue composables and lifecycle-aware reusable logic
│   ├── config/              # Environment and runtime configuration mapping
│   ├── constants/           # Constants, enums, stable mappings
│   ├── directives/          # Vue directives
│   ├── i18n/                # Localization and user-facing copy
│   ├── layouts/             # App shells and layout frames
│   ├── pages/               # Route pages grouped by domain
│   ├── router/              # Routes, guards, route metadata
│   ├── stores/              # Global and cross-page derived state
│   ├── styles/              # Global styles, tokens, resets
│   ├── theme/               # Theme tokens and component-library overrides
│   ├── types/               # Shared types
│   └── utils/               # Pure utilities without UI coupling
├── tests/                   # Unit, integration, and e2e tests
├── package.json
└── README.md
```

## Forbidden Defaults

| Forbidden | Constraint |
|---|---|
| Removing feature pages, routes, or menu items casually | Confirm no requirement depends on them, or keep a clear replacement entry |
| Changing auth, payment, import/export, permissions, or other sensitive flows casually | Touch only when explicitly requested or fixing a clear defect |
| Hardcoding user-facing copy | Use i18n or the repository's copy system |
| Creating scattered policy files | Keep rules centralized to avoid future AI confusion |
| Adding unnecessary dependencies | Check existing framework, component library, and utilities first |
| Using Tailwind CSS or its utility-first style patterns | Use semantic CSS, component-scoped `<style>`, or the project's existing design system instead |
| Over-abstracting | Do not create many functions, components, composables, or stores for a small feature |
| Formatting unrelated files | Keep the diff narrow and reviewable |
| Reverting existing worktree changes | Treat them as someone else's work unless explicitly asked to revert |
| Explaining unfinished UI with long copy | Finish it, disable it, or remove the entry |

## UI and Information Architecture

1. Admin, dashboard, and tool pages should be compact, restrained, and scannable.
2. The first screen should expose real controls, data, task status, forms, filters, or primary actions.
3. Avoid hero sections, marketing gradients, slogans, decorative metrics, and meaningless explanatory sidebars.
4. Use cards only for necessary grouping, repeated objects, or modal content.
5. Copy should be short and explain state, result, or next action.
6. Desktop and narrow layouts must avoid text overflow, overlapping controls, clipped buttons, and unusable navigation.
7. Merge pages only when they represent views of the same object or workflow.
8. Before deleting routes or menus, inspect entry points, links, permissions, tests, docs, and prior requirements.
9. Migrated features need a clear replacement path; preserve deep links or redirects when feasible.
10. Mature workflows should receive connection fixes and visual cleanup, not arbitrary interaction redesign.

### Internal Page Layout

1. Build operational applications around a stable workspace shell: navigation, optional list/filter pane, and a flexible primary content pane.
2. Keep navigation and secondary panes within deliberate min/max widths. Give the primary pane `min-width: 0` and let it absorb remaining space.
3. Use consistent horizontal bars for page titles, filters, tabs, and actions. Align controls to a shared height and baseline instead of placing each action in a separate card.
4. Make long navigation, lists, and detail content scroll independently when the workflow benefits from persistent context. Avoid nested scroll areas without a clear ownership boundary.
5. Use an 8px spacing rhythm with compact increments such as 4, 8, 12, 16, and 24px. Reserve larger gaps for major page regions.
6. On narrow screens, collapse secondary panes into drawers, overlays, or explicit view switches. Keep the primary task and its main action reachable.

### Visual System

1. Define semantic tokens for page background, raised surface, navigation surface, border, primary accent, muted text, success, warning, and error states.
2. Use neutral surfaces and subtle 1px separators as the default structure. Apply the primary color to selection, focus, links, and key actions rather than tinting every surface.
3. Keep radii consistent, normally 6-8px for controls, list items, popovers, and framed content. Avoid excessive pill shapes and large floating-card radii.
4. Use shadows sparingly to clarify hover, selection, popovers, and temporary elevation. Borders and background contrast should carry most of the hierarchy.
5. Establish a compact type hierarchy: page/detail titles around 18-24px, item titles around 15-17px, body text around 14-16px, and metadata around 12-13px. Match the repository's existing scale when present.
6. Use icons for familiar actions and pair unfamiliar icons with tooltips. Keep icon buttons square and dimensionally stable.
7. Do not rely on a single hue family. Combine a neutral base, one primary accent, and distinct semantic colors with accessible contrast.

### Lists, Details, and States

1. List items should expose a clear order: title, short metadata, concise description, optional tags, and timestamp or status. Truncate secondary text before allowing controls to shift.
2. Distinguish selected items with a restrained combination of border, background, and text color. Hover may use a 1-2px lift or a small shadow, but must not move surrounding layout.
3. Detail views should keep identity and actions in a compact header, with readable content below and long-form content owning its own scroll area.
4. Keep tags small and secondary. Use them for classification or status, not as the main visual structure.
5. Place loading, empty, error, and stale-data states inside the pane they affect. Preserve surrounding navigation and recovery actions.

### Motion and Data Drawing

1. Use 150-250ms transitions for hover, focus, selection, panel entry, and small state changes. Respect reduced-motion preferences and avoid continuous decorative motion.
2. Keep press feedback local through scale, color, or a contained ripple. Do not animate width, height, or neighboring layout unless the workflow requires it.
3. Charts, diagrams, canvases, and node graphs must use stable dimensions, readable labels, consistent 1-2px strokes, restrained fills, and semantic color mapping.
4. Prefer direct labels, aligned legends, clear selection, zoom limits, and useful empty/loading states over decorative effects.
5. Use gradients, glow, blur, and glass effects only when they clarify depth or brand context. They must not reduce contrast or become the page's primary visual language.

## i18n and Copy

1. New or changed user-facing text must use the repository's i18n/copy system.
2. Locale keys must remain aligned across supported languages.
3. Menus, buttons, dialogs, empty states, validation, and errors must match real behavior.
4. Empty states should be short and action-oriented.
5. Do not add copy that explains obvious UI structure, design intent, or strategy.
6. Internal logs, test descriptions, and developer comments do not need i18n when they are not user-facing.

## JavaScript and TypeScript

1. `var` is forbidden. Use `const` or `let` only.
2. Use ES6+ syntax by default: modules, arrow functions, destructuring, template literals, optional chaining, and nullish coalescing where appropriate.
3. Prefer `const`; use `let` only when reassignment is required.
4. Do not introduce implicit globals, implicit `any`, or untyped object pass-through.
5. Model API DTOs, domain objects, component props, route metadata, and store state explicitly.
6. Do not use `any` to bypass type issues; if unavoidable, isolate it locally and explain why.
7. Async logic must handle failure states.
8. Public exports must have deliberate boundaries and must not expose internal implementation details casually.

## Function and Abstraction Boundaries

Small features should not be split into too many functions. Function definitions must serve semantic boundaries, reuse, testability, side-effect isolation, or complexity reduction.

### Extract a Function When

| Case | Requirement |
|---|---|
| Logic is reused | At least two real call sites, or a stable shared capability |
| Branching is complex | Extraction makes the main flow easier to read |
| Business meaning is stable | The function name expresses domain intent clearly |
| Logic needs direct testing | Parsing, transformation, validation, and pure logic fit well |
| Side effects need isolation | Network, storage, routing, telemetry, and similar effects need clear boundaries |

### Do Not Extract When

| Anti-pattern | Reason |
|---|---|
| Wrapping a single line | Adds jump cost only |
| Creating one thin handler per tiny button | Inline or combine into a clear handler |
| Splitting a small flow into generic steps | Creates bloat and hides intent |
| Extracting only to make code look structured | Hurts local readability |
| Using vague names | `handleProcess`, `doAction`, and `manageData` hide meaning |

## Components, State, and Modules

1. Extract components only for real reuse, complexity reduction, or stable business fragments.
2. Page components orchestrate; business components own reusable domain UI; base components own generic UI.
3. Do not create many files for a small page-local fragment.
4. Cross-page state belongs in stores; page-local state stays local.
5. Pure helpers belong in `utils`; lifecycle/UI-aware logic belongs in composables.
6. API clients handle requests, responses, and type boundaries, not page state.
7. Configuration mapping belongs in `config`, not scattered across pages.

## Comment Standards

Comments are mandatory for functions, variables, and utility-file headers. Comments elsewhere are optional and should be added only when they clarify purpose, business meaning, constraints, or non-obvious behavior.

Mandatory requirements:

1. Add a clear comment to every new or modified function or method, including composables, lifecycle callbacks, event handlers, and utility functions. Explain its purpose and, when relevant, inputs, outputs, side effects, constraints, or important behavior.
2. Add an adjacent comment to every new or modified variable or constant, including reactive state, refs, computed values, store fields, and module-level constants. Explain what the value represents or why it exists.
3. Add a file header comment to every new or modified utility class or utility/helper file, including files under `utils`, shared helper modules, and tooling scripts. State the file's responsibility and boundary.
4. Comments for imports, types, template regions, control-flow branches, styles, configuration entries, and tests are optional unless needed to explain non-obvious behavior.

Choose the language for every new or updated comment from the current author's established usage in the target project, file, or module. This language-selection requirement is mandatory and must never be skipped. If the current author consistently writes Chinese comments, use concise Chinese. If the current author consistently writes English comments, use concise English. If the surrounding code is mixed, match the nearest stable convention and avoid mixing languages inside one comment.

### Utility File Header Example

```ts
/**
 * Menu state resolution for navigation selection and route mapping.
 *
 * This module maps route paths to stable menu keys. It does not own page-level interaction state.
 */
```

### Function Comment Example

```ts
/**
 * Resolve the menu key for the current route.
 *
 * Detail and list routes may share a parent entry, so exact matches take precedence over prefixes.
 */
export function resolveActiveMenuKey(pathname: string): string { ... }
```

### Variable Comment Example

```ts
// Stable menu key used when the current route has no explicit navigation mapping.
const fallbackMenuKey = 'overview'
```

### Multi-line Comment Format

`/** */` style multi-line comments must span at least three lines. Never compress them into a single line.

```ts
/**
 * Resolve the menu key for the current route.
 */
```

```ts
/** Resolve the menu key for the current route. */
```

### Comment Bans

| Ban | Reason |
|---|---|
| Missing comments on new or modified functions, variables, or utility-file headers | These comment locations are mandatory |
| Comments that only restate syntax | They do not explain purpose, meaning, constraints, or behavior |
| Decorative separator blocks | Reduces scan efficiency |
| Mixing languages inside one prose comment | Makes collaboration and maintenance inconsistent |
| Comments explaining unfinished UI | The UI should be finished, disabled, or removed |
| Stale comments | Update or remove them; mandatory comments must be replaced with current explanations |

TODO/FIXME/HACK must include scope and next action:

```ts
// TODO(API integration): Remove the compatibility mapping after the status enum is confirmed.
// FIXME(navigation): Keep the user area stable when the narrow layout collapses.
```

## Environment Strategy

Development, test, staging, and production must be separated. Use only necessary configuration and avoid over-separation. File names vary by framework; Vite-like projects may use:

```text
.env.example              # Public template, committed
.env.local                # Local secrets and developer overrides, ignored
.env.development          # Development defaults, secret-free if committed
.env.test                 # Test defaults, secret-free if committed
.env.staging              # Staging defaults, secret-free if committed
.env.production           # Production defaults, secret-free if committed
```

### Environment Variable Rules

| Rule | Requirement |
|---|---|
| Browser exposure | Use the framework's public prefix, such as `VITE_` |
| Secrets | Never expose secrets to the browser bundle or public frontend config |
| Documentation | Document supported variables in `.env.example` or docs |
| Validation | Validate required variables before startup/build when possible |
| Separation | Production must not silently fall back to development endpoints |
| Traceability | Production builds may include non-sensitive commit/build metadata |

## Development Environment

1. README or docs must state package manager, install command, start command, and required environment variables.
2. `dev` should start local development without production credentials.
3. Local debugging config must not leak into production config.
4. Typecheck, static checks, unit tests, and e2e tests should be independently runnable.
5. Developer logs may be verbose; user-facing debug UI must be hidden or guarded by a switch.
6. Do not write local absolute paths into source, config templates, or docs examples.

Suggested Vue 3 scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview"
  }
}
```

Prefer `vue-tsc --noEmit` for Vue 3 type checking. Use the repository's existing package manager and script names when they already differ.

## Dependency Versions

When adding or updating dependencies in Vue 3 projects, prefer recent stable versions. Avoid outdated packages that the ecosystem has moved past.

Reference versions for common Vue 3 project dependencies:

| Package | Suggested Version |
|---|---|
| vue | ^3.5.0 |
| vue-router | ^4.5.0 |
| pinia | ^2.2.0 |
| axios | ^1.7.0 |
| echarts | ^5.5.0 |
| dayjs | ^1.11.0 |
| @vitejs/plugin-vue | ^5.2.0 |
| vite | ^5.4.0 |
| typescript | ^5.7.0 |
| vue-tsc | ^2.2.0 |
| less | ^4.2.0 |
| sass | ^1.80.0 |
| unplugin-vue-components | ^0.28.0 |
| unplugin-auto-import | ^0.19.0 |
| vite-plugin-compression | ^0.5.0 |
| @types/node | ^22.0.0 |

Rules:

| Rule | Requirement |
|---|---|
| Stay current | Use versions from the table above as a floor; newer stable releases are preferred |
| Check existing | Match the repository's existing major versions when they are already recent |
| Avoid ancient | Do not install Vue 2.x, Vue Router 3.x, Vite 2.x, or other end-of-life majors in new Vue 3 work |
| Lockfile | Use the repository's lockfile and configured package manager for deterministic installs |

## Production Environment

Production must be stable, traceable, and safe.

| Area | Requirement |
|---|---|
| Type checking | Production builds must be type-checkable |
| Environment | API endpoint, base path, and asset path must be explicit |
| Source maps | Deliberately enable, disable, or protect access based on deployment context |
| Bundle | Evaluate size impact when adding large dependencies |
| Assets | Use cache-friendly filenames and correct public base path |
| Errors | Critical apps should have error boundaries or reporting |
| Feature flags | Incomplete features are disabled by default |
| Debugging | No debug panels, test entries, internal links, or stack traces for end users |

Runtime rules:

1. Do not depend on dev-server behavior.
2. SPA hosting needs route fallback.
3. Protected routes must fail closed.
4. User-facing error pages should be short, clear, and actionable.
5. Build metadata may support troubleshooting, but must not contain secrets or internal sensitive paths.
6. A rollback path must be known before release.

## Testing and Validation Strategy

Do not proactively run builds, start services, or perform runtime validation by default. Run those commands only when the request explicitly asks to validate, run, build, test, open a browser, or start a service. Otherwise, perform static checks only: syntax, parameters, paths, config fields, imports/exports, and reference consistency.

### Default Static Checks

| Item | Check |
|---|---|
| Markdown / YAML | Frontmatter, headings, links, and formatting are reasonable |
| package scripts | Command names, arguments, and dependency references are plausible |
| TypeScript examples | Syntax, generics, imports/exports, and ES6+ usage are reasonable |
| Environment variables | Names, prefixes, purpose, and sensitivity are reasonable |
| Routes/navigation advice | Paths, entries, and permission relationships are self-consistent |
| Config examples | Field names, nesting, and defaults are clear |

### When Explicit Validation Is Requested

| Request | Action |
|---|---|
| Build | Run the project build command |
| Test | Run relevant tests |
| Typecheck | Run `vue-tsc --noEmit` or the project's existing Vue typecheck command |
| Browser validation | Start the local service and interact with affected pages |
| Pre-release check | Run build, tests, preview, or staging smoke test according to project capability |

If a command cannot run, report the reason and unverified scope.

## Build and CI

Vue 3 projects should have composable quality gates. Do not run builds, tests, or service-start commands unless explicitly requested.

```text
install
-> lint / format check
-> typecheck
-> unit tests
-> integration or e2e tests
-> production build
-> preview or deploy smoke test
```

CI rules:

| Rule | Requirement |
|---|---|
| Deterministic install | Use lockfile and configured package manager |
| Secret safety | CI logs must not print secrets |
| Env separation | Staging and production use separate config |
| Artifacts | Build artifacts go only to configured output directories |
| Failures | Failed tests cannot be marked acceptable without explanation |
| Cache | Dependency/build cache must be reproducible and invalidatable |

## Security and Reliability

| Area | Rule |
|---|---|
| Auth | Real authorization cannot rely only on frontend checks |
| XSS | Avoid raw HTML; sanitize rich text rendering |
| Upload/import | Validate type, size, progress, errors, and cancellation states |
| API errors | Normalize expected errors and show concise UI feedback |
| Storage | Do not store secrets in localStorage/sessionStorage |
| Dependencies | Review large or high-risk packages before adding |
| Accessibility | Controls need names, focus states, keyboard access, and reasonable contrast |
| Performance | Avoid unnecessary full-page re-renders, huge bundles, and blocking first paint |

## Collaboration Rules

1. Use fast search tools such as `rg` before editing relevant code.
2. Treat existing dirty worktree changes as someone else's work; do not revert them.
3. Explain the edit scope before modifying files for larger tasks.
4. Prefer patch-based edits; if tooling fails, use safe UTF-8 writes and keep diffs narrow.
5. Do not create multiple policy files without explicit request.
6. When implementation is requested, do not stop at a plan.
7. For review requests, lead with findings and file/line references.
8. Final replies should stay concise: changed files, static checks, and validation not executed.

## Vue 3 Scope

Applies to Vue 3 frontend applications only:

- Vue 3 + Vite: follow SFC, Composition API, composables, Vue Router, Pinia or the existing state solution.
- Vue component libraries: prefer the existing component library before custom base controls.
- Vue Options API code may be maintained when the repository already uses it, but new code should follow the local Vue 3 pattern.
- Nuxt, React, Svelte, Angular, Next, SvelteKit, and non-frontend stacks are outside this skill's adaptation scope.

## Final Checklist

Before declaring completion:

- Required features and routes remain reachable.
- User-facing copy uses the repository copy system.
- UI is compact and free of meaningless placeholder text.
- No specific business, person, organization, role, or internal data is included in generic examples.
- `var` is not used; examples follow ES6+.
- Small features are not split into bloated function layers.
- Every new or modified function and variable has a current comment, every new or modified utility file has a file header, and comment language matches the current author's established usage.
- Environment variables do not expose secrets.
- No build or runtime validation was executed unless explicitly requested.
- Static checks and unverified scope are stated.

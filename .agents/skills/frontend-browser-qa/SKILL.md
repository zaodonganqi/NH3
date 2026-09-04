---
name: frontend-browser-qa
description: Manually validate rendered frontend pages in the visible Codex in-app browser for layout, visual flicker, 1920x1080 and 2560x1440 desktop adaptation, interaction quality, and observable performance. Use for browser QA, visual acceptance, responsive desktop checks, or pre-delivery frontend verification; do not use as a substitute for unit tests or for code-only review.
---

# Frontend Browser QA

## Purpose

Use the real rendered page in the Codex in-app browser as the primary evidence. A successful build, static code inspection, or automated test alone does not count as visual validation.

Apply this skill after an affected page can run, or when the user explicitly asks to inspect an existing page. It may be combined with a framework-specific engineering skill, but this skill owns runtime visual and interaction acceptance.

## Browser Requirement

1. Read and follow `browser:control-in-app-browser` before browser work.
2. Select the Codex in-app browser explicitly and keep using that browser for the task.
3. Before opening, navigating, clicking, scrolling, typing, reloading, or resizing a page, enable the in-app browser's visible mode so the user can watch the validation. Keep it visible throughout active page interaction; do not perform a hidden interaction pass first.
4. Do not silently replace the requested in-app browser with an external browser, standalone Playwright, screenshots generated outside the browser, or HTTP-only inspection.
5. If the in-app browser is unavailable or cannot be shown, report runtime visual validation as blocked and list the unverified scope. Static inspection may support the report but must not be presented as a browser pass.
6. Reuse the browser session and page state when practical. Do not inspect cookies, local storage, passwords, or other private session data.

## Establish the Test Surface

Before judging the UI:

- Identify the requested routes, primary workflow, start command, and any safe test data already provided by the project or user.
- Preserve authentication, permissions, data, and external side-effect boundaries. Do not submit destructive or production-changing actions merely to reach a visual state.
- Start or reuse the project's normal local/preview service when the requested validation authorizes runtime testing.
- Wait for the page's intended loading state to settle before taking the baseline screenshot, while also observing what happens during startup.
- Keep browser zoom at 100% unless the user asks for zoom or accessibility testing.
- Treat viewport size as CSS pixels. By default, `1K` means `1920x1080` and `2K` means `2560x1440`; use the project's documented sizes or the user's definition when they differ.

## Required Passes

### 1. Layout and Interaction

At both required viewports, inspect more than the initial fold:

- Page shell, navigation, headers, toolbars, side panes, main content, sticky or fixed regions, and footer or bottom actions.
- Top, middle, and bottom of scrollable content; verify which region owns scrolling and look for accidental nested scrollbars.
- Long labels, dense rows, empty/loading/error states, expanded sections, selected states, dropdowns, tooltips, drawers, dialogs, and notifications that are reachable without unsafe side effects.
- Overflow, clipping, overlap, unintended wrapping, excessive whitespace, stretched content, lost alignment, blurry borders or icons, and controls that move when content changes.
- Keyboard focus visibility and obvious keyboard reachability for the primary flow when practical.
- Browser console errors that correspond to visible or interaction failures.

Interact with the page as a user would. Do not infer that a menu, modal, hover state, or sticky region works merely because its source code looks correct.

### 2. 1K and 2K Adaptation

Run the same representative workflow at `1920x1080` and `2560x1440` rather than checking only two static screenshots.

At `1920x1080`, emphasize:

- Whether the primary task and main action remain visible and usable without unnecessary horizontal scrolling.
- Whether vertical space is consumed by oversized headers, cards, gaps, or fixed regions.
- Whether tables, filters, editors, and multi-pane layouts retain useful minimum widths.

At `2560x1440`, emphasize:

- Whether content becomes implausibly wide, sparse, or detached instead of using sensible max-widths or pane constraints.
- Whether fixed-width sidebars, charts, canvases, tables, backgrounds, and separators extend and align correctly.
- Whether typography, hit targets, and information density remain balanced rather than being scaled as if the page were an image.

Resize between the two widths at least once. Look for breakpoint thrashing, delayed reflow, stale canvas/chart sizes, floating overlays left in the wrong position, and layout states that recover only after reload.

### 3. Flicker and Visual Stability

Observe the transition, not only the settled result. Repeat a reload or route transition when needed to distinguish a reproducible defect from a one-off delay.

Check:

- First paint and reload for white flashes, theme flashes, unstyled content, late fonts/icons, hydration-like replacement, or abrupt background changes.
- Route entry, route switching, back/forward navigation, and permission redirects for intermediate wrong pages or duplicated transitions.
- Loading-to-content, empty-to-content, filter/search, tab changes, pane expansion, dialogs, and async updates for large layout shifts or control jumps.
- Hover, focus, selection, sticky positioning, image loading, charts/canvases, and animated regions for blinking, remounting, jitter, or repeated repaint symptoms.
- Whether reduced-motion preferences are respected when the page has nonessential motion and the browser surface makes that check practical.

Do not label an intentional skeleton, transition, or progress state as flicker merely because pixels change. A defect needs unwanted discontinuity, incorrect intermediate content, repeated instability, or impaired use.

### 4. Performance Judgment

Treat this as a browser-observed diagnostic pass, not a laboratory benchmark. Use interaction observation plus browser-accessible evidence; never claim precise profiling when only visual inspection was performed.

Check the risks relevant to the page:

- Slow or blank first meaningful render, late critical fonts/styles/images, oversized resources, and duplicated or serial requests that visibly delay readiness.
- Noticeable input delay, slow menu/dialog opening, scroll jank, sticky-region lag, chart/canvas stutter, and expensive resize behavior.
- Large layout shifts, repeated full-region redraws, work continuing after navigation, uncontrolled timers/animations, or performance that degrades after repeating the same interaction.
- Long lists or tables rendering far beyond the visible region, unbounded DOM growth, image decode pressure, and missing virtualization when the data size justifies it.
- Console errors, repeated warnings, failed resources, and request loops that correlate with degraded behavior.

When browser APIs expose trustworthy data, collect relevant navigation/resource timings, paint or layout-shift entries, and long tasks. Use project performance budgets first. Without a project budget, treat `LCP > 2.5s`, `CLS > 0.1`, interaction latency around `200ms` or worse, and main-thread tasks over `50ms` as investigation signals rather than automatic proof of a regression. Record environment and sample limitations.

Inspect source code only to explain a browser-observed symptom or a strong measurable signal. Avoid speculative performance findings based solely on patterns such as `watch`, `computed`, or a large component file.

## Evidence and Severity

For each issue, record:

- Route and UI state.
- Viewport and reproduction steps.
- Expected versus observed behavior.
- User impact and severity: blocking, high, medium, or low.
- Screenshot or other browser evidence when it materially clarifies the issue.
- Likely cause only when supported by runtime or code evidence; otherwise label it as a hypothesis.

Capture baseline screenshots for both required viewports. For transient defects, capture the incorrect state when possible and describe the timing precisely. If a fix is in scope, retest the exact reproduction path and both desktop viewports; a code change without browser revalidation is not a verified fix.

## Scope and Stopping Rules

- A review or validation request authorizes inspection and reporting, not code changes. Fix issues only when implementation is also requested or clearly part of the active task.
- Keep interactions reversible and avoid sending messages, placing orders, deleting data, publishing content, or changing live configuration.
- If required data, authentication, or a working service blocks a route, validate the reachable scope and report the blocked states instead of inventing a pass.
- Do not expand a focused page check into exhaustive whole-product QA unless the user asks for it.

## Completion Report

Lead with the overall result: pass, pass with findings, or blocked. Then provide findings in severity order with route, viewport, reproduction, evidence, and verification status.

Always state:

- Pages and states actually exercised.
- Results at `1920x1080` and `2560x1440`.
- Flicker/visual-stability outcome.
- Performance observations and any metrics actually collected.
- Browser console or resource failures relevant to the result.
- Anything not tested and why.

Do not say the page is fully validated if only one viewport, one settled screenshot, or static code inspection was completed.

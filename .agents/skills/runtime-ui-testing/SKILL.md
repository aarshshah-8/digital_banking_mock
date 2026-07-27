---
name: runtime-ui-testing
description: How to bring the digital_banking_mock workspace up in a browser and test its runtime UI behaviour — serving both consumer apps and the built Storybook, controlling viewport width to exercise the responsive breakpoint, and measuring layout/contrast facts objectively. Use when doing manual or agent-driven runtime verification (e.g. migration before/after baselines), not for unit tests or the CI evidence harness.
---

# Runtime UI testing for this workspace

`AGENTS.md` covers builds, unit tests and the CI gates. This file covers the thing those do not:
driving the **running** apps in a real browser.

## Bringing everything up

```bash
npm install --legacy-peer-deps          # required; Storybook 7 and Angular 14 disagree on peers
npx ng build bofa-design-system         # ALWAYS first — both apps resolve it from dist/
npx ng serve --port 4200                # digital-banking-shell
npx ng serve advisor-console --port 4201  # second consumer; needs an explicit non-default port
```

There is no login, no backend and no credentials. Every service is an `of(...)` mock
(`src/app/core/*`), so the UI is fully deterministic: the balance is always `$4,231.09`, the
session user is always `demo-user`.

Serving the Storybook catalog is often faster than `npm run storybook`, and it is the only place
some component states exist at all:

```bash
npm run build-storybook   # if dist/storybook is stale
cd dist/storybook/bofa-design-system && python3 -m http.server 6007
```

Deep-link a single story without the Storybook chrome:
`http://localhost:6007/iframe.html?id=<story-id>&viewMode=story`, e.g.
`bds-button--all-variants`, `bds-alert-banner--all-severities`. Note that typing a URL containing
`?` into the address bar via automation can silently drop the query string — set the URL with
`ctrl+a` then type, and verify the address bar afterwards.

## What screens actually exist

Do not go hunting for navigation — there is none.

- `digital-banking-shell`: exactly one route, `'' → DashboardComponent`
  (`src/app/app-routing.module.ts`). `app.component.html` is a bare `<router-outlet>`.
- `advisor-console`: `const routes: Routes = []`. Its `app.component.html` renders one card
  statically. That single card is the whole app.

## Controlling viewport width (the responsive breakpoint)

The dashboard's most interesting behaviour is a **960px breakpoint**: `fxLayout="row"` with
`fxLayout.lt-md="column"`. `@angular/flex-layout` resolves `lt-md` to
`screen and (max-width: 959.98px)`, so the flip is between viewport **960** (row) and **959**
(column).

Resize the real browser window rather than using the devtools device toolbar — it is far clearer
in a recording and exercises the same code path:

```bash
wmctrl -r :ACTIVE: -e 0,0,0,<WIDTH>,<HEIGHT>
```

**Viewport width = window width − 32px** in Chrome for Testing on this box (measured; verify with
`window.innerWidth` rather than assuming). So window `992` → viewport `960`, window `991` →
viewport `959`. Stepping those two windows one pixel apart is what actually proves the breakpoint
exists, as opposed to ordinary flex wrapping. Do NOT use `xdotool key super+Up` to maximise; use
`wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.

Close stray desktop windows before recording: `wmctrl -c "Home — Dolphin"` etc.

## Assert on measurements, not screenshots

Screenshots alone cannot distinguish "responsive breakpoint fired" from "flex happened to wrap".
Read the facts out of the live DOM instead. Wrap console snippets in an IIFE — a bare statement
returns `undefined` through the console tool.

```js
// layout: same top + different left == row; same left + different top == column
(() => [...document.querySelectorAll('bds-card')].map(c => {
  const b = c.getBoundingClientRect();
  return {t: c.getAttribute('title'), top: b.top|0, left: b.left|0, w: b.width|0};
}))()
```

```js
// accessible-name / zero-size defects
(() => [...document.querySelectorAll('bds-button')].map(b => {
  const i = b.querySelector('button'), r = i.getBoundingClientRect();
  return {v: b.getAttribute('variant'), text: i.textContent.trim(), w: r.width|0, h: r.height|0};
}))()
```

Contrast can be measured live from computed styles with the WCAG relative-luminance formula; the
values so obtained have matched the harness's figures exactly (warning alert 3.79:1, danger
button 3.68:1), which makes it a cheap independent cross-check of the axe numbers.

## Verifying handlers fire when there is no visible feedback

Every control in this app is an inert mock — nothing navigates, no dialog opens, no text changes.
`onTransferClick()` only pushes onto an in-memory analytics queue. Under `ng serve` (dev mode) you
can observe it without touching app code:

```js
(() => window.ng.getComponent(document.querySelector('app-dashboard')).analytics.queue.map(e => e.name))()
```

Drive the control with a real keyboard/mouse interaction, then read the queue before and after.

## Traps

- **The primary and secondary `bds-button` may render at zero height** (measured 64×0px and
  64×2px). If so, a mouse click at the button's coordinates passes through to `<body>` and never
  reaches the button — check `document.activeElement` after clicking rather than assuming the
  click landed. Keyboard `Tab` + `Enter` still reaches and activates it, and is the reliable way
  to exercise the handler while this is the case. This stems from `bds-button.component.html`
  declaring three bare `<ng-content>` slots, so labels only project for `variant="danger"`; if
  that is ever fixed, expect the sizes to become normal and mouse clicks to start working.
- **`advisor-console` may load unthemed**, logging
  `Could not find Angular Material core theme`, because its `angular.json` `styles` array omits
  `@angular/material/prebuilt-themes/indigo-pink.css` (the shell includes it). Do not mistake
  this for a theming regression introduced by a change under test — check the console and
  `angular.json` first.
- A CSS reimplementation of a flex-layout breakpoint is evaluated against the **media** width,
  while `window.innerWidth` excludes the scrollbar. The two can differ by the scrollbar width, so
  compare *viewport* widths across before/after, never window widths.
- The Storybook evidence harness screenshots at a **fixed 900px viewport**, i.e. below the 960px
  breakpoint. It structurally cannot see the desktop row layout, so responsive behaviour must be
  verified by hand.

## Devin secrets needed

None. This workspace is entirely self-contained — no credentials, tokens, or network access are
required to run or test it.

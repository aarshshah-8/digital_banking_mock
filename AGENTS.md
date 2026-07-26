# Agent instructions

## Before changing anything in `projects/bofa-design-system`

Read [`projects/bofa-design-system/BRAND_CONTRACT.md`](projects/bofa-design-system/BRAND_CONTRACT.md)
first. It is the brand and accessibility contract for the shared library: measured contrast
thresholds, component rules, Angular Material MDC migration mechanics, and repo rules.

If a change would break a rule in it, don't make the change. Say which rule, quote the measured
value, and propose a compliant alternative on the PR.

## Workspace

Three projects: `digital-banking-shell` (root `src/`), `projects/bofa-design-system` (the shared
library), and `projects/advisor-console` (a second consumer). The library is consumed by both apps,
so a breaking change there must build in both.

```bash
npm install --legacy-peer-deps
npx ng build bofa-design-system   # build the library first
npx ng build digital-banking-shell
npx ng build advisor-console
npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox
npm run storybook          # the component catalog, on :6006
```

Headless tests need a real Chrome binary on `CHROME_BIN`. The `google-chrome` on `PATH` in an agent
session is a shim that drives the desktop browser over CDP, not an executable Karma can launch —
point it at a real one, e.g. Playwright's:
`export CHROME_BIN=$(ls ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome | head -1)`.

## Migration work

Angular 14 → 18, in four phases.

| Phase | What |
|---|---|
| 0 | Harness — Storybook, axe, evidence tool, API and dependency reports, `v14` baseline |
| 1 | Walk to v16 — 14→15→16, remove `@angular/flex-layout` (archived, hard-blocks v15+) |
| 2 | Legacy → MDC — theme and all components |
| 3 | v16 → v18 — through the v17 gate |

All Material MDC work happens on **v16**: legacy components were deleted in v17 and `ng update`
fails while any legacy import remains.

Phase 2 is the only phase where the UI is *supposed* to change. Phases 1 and 3 must be visually
inert, so they're compared with `--strict-pixels`.

## How work is triggered

Every phase starts as a GitHub issue opened by a person. The issue is a **tracking issue**: its body
is a checklist of the PRs the phase needs.

1. **Triage.** Read the code and post a **costed plan** as an issue comment. It must contain: the
   PR breakdown, one row per PR with an estimate and a risk level, which consumers each PR affects,
   which deleted or archived APIs are in use, and anything that could block. Then edit the issue
   body's **PRs** section to that checklist. **Write no code at this stage.**

   Estimate two numbers per PR — the Devin session time, and what the same work would take a person
   who already knows the codebase. Estimate from what you actually read, not from the phase name;
   if you can't estimate something, say which unknown is in the way rather than padding it.
2. **Wait for `devin:approved`.** Until that label is present, don't branch, edit files, or open a
   PR. The label means a human accepted *that plan at that price* — if the work turns out to differ
   materially from the estimate, stop and re-triage rather than spending past it.
3. **Execute**, one PR per checklist item, each targeting `migration/angular-18` and referencing the
   tracking issue. Only the last one says `Closes #<issue>`.
4. **Stop when blocked.** If the change would break a rule in `BRAND_CONTRACT.md`, or needs a
   decision you shouldn't make alone, comment why with the measured value, label the issue
   `devin:blocked`, and stop. Don't work around the rule, and don't open a PR you can't back.
5. **Write back what the phase taught you.** In the last PR of a phase, add anything you had to
   work out the hard way to `BRAND_CONTRACT.md` (if it's a rule) or to this file (if it's a
   mechanic), and correct any estimate or claim here that the phase proved wrong. A trap that
   cost an hour and isn't written down will cost the next migration the same hour — that is the
   difference between four phases and a repeatable process.
6. **Never merge your own work.**

Two things are humans-only: applying `devin:approved`, and merging. Open follow-up issues freely —
that's how pre-existing defects get recorded instead of fixed mid-migration (rule D4).

### How a phase splits into PRs

One PR per phase is not reviewable, but the axis a phase splits along isn't the same each time.

**Version walks split by version step, not by project.** `package.json` and the lockfile are single
files, and there is no way to bump Angular for the library but not its two consumers — the workspace
wouldn't build. So phases 1 and 3 are one PR per version, necessarily stacked and merged in order.

**Only the MDC phase splits by component.** The theme PR lands first because everything depends on
it; after that the three components are independent of one another and can be worked in parallel,
followed by one PR per consuming app.

A phase is finished when every box on its tracking issue is checked. Nothing from the next phase
branches until then.

## Verifying a change

Three gates, each answering a different question. All three run in CI on every PR.

### 1. Does it still look and behave right?

```bash
npm run build-storybook
npm run evidence -- --label <name>
npm run evidence -- --compare baseline <name>   # add --strict-pixels for phases 1 and 3
```

Prints the markdown table for the PR body and exits non-zero on any regression: a story
disappears, a story renders fewer controls than it used to, axe violations increase, or a control
loses its accessible name, shrinks below 24×24, or drops below 4.5:1.

The pixel-diff percentage is **not** a gate in phase 2 — MDC changes every component's DOM, so
everything legitimately moves. Use it to decide which diff images to open.

**What this gate cannot see.** Stories render at a fixed **900px** viewport, which is below the
dashboard's 960px breakpoint — so the desktop row layout is never captured, and a responsive
regression passes cleanly. Anything breakpoint-dependent has to be verified by driving the running
app. The v14 numbers to hold Phase 1 to are recorded on issue #2.

### 2. Did anything downstream break?

```bash
npx ng build bofa-design-system
npm run api-report -- --check
```

Building the two apps in this workspace is **not** evidence that consumers are safe — they compile
against the library's published types, and it is the template-facing surface (selector, inputs,
outputs, content slots) that `ng update` and the MDC schematics rewrite. `api-report/` is that
surface, generated from the built `.d.ts`.

The whole premise of BDS is that it absorbs Material's churn, so **a diff in that file is a
migration leak until proven otherwise.** If it's genuinely intended, regenerate with
`npm run api-report -- --write`, commit it, and say on the PR which consumers have to change.

### 3. Is the dependency posture no worse?

```bash
npm run deps-report -- --check
```

A version walk arrives as a five-figure lockfile diff. This reduces it to added / removed /
version-changed counts, and gates on the **production** dependency closure only. Build-time
advisories are reported but not gated — counting the two together is how a real finding gets lost
in tooling noise.

Regenerate with `--write` when versions move, and only once the delta is understood.

### The baseline is promoted, not frozen

`baseline` resolves through `.storybook-evidence/baseline.json` — currently `v14`. Don't regenerate
a baseline in place; that would silently redefine what every later phase is measured against. At
the end of a migration, capture the final state and promote it:

```bash
npm run evidence -- --promote v18 --note "Angular 18 / Material 18 MDC"
```

The next migration's before-state is this one's after-state. Same for `api-report/` and
`deps-report/`, which are regenerated and committed when the surface legitimately moves.

### Known pre-existing failures in the baseline

These are in the `v14` numbers deliberately. Don't fix them in a migration PR (rule D4), and
don't be alarmed when they persist:

- **11 × `button-name`** — `bds-button` declares three `<ng-content>` slots, so only
  `variant="danger"` receives the projected label. Primary and secondary buttons render blank.
  In the running app the primary measures **64 × 0 px**, so a mouse click passes through it to
  `<body>`; `bdsClick` fires only via keyboard. Drive that control with `Tab` + `Enter`, or a
  pre-existing defect will read as a migration regression.
- **2 × `color-contrast`** — the `warning` alert is 3.79:1 against a 4.5:1 floor.
- **`bds-button--danger` at 3.68:1** — white on Material's `warn` palette. axe scores this story
  clean; the property measurement is what catches it.
- **`<bds-button>` declares three content slots** in `api-report/`, which is the same defect seen
  from the API side. Fixing it is a public-API change, so it belongs in its own PR, not a
  migration one.
- **11 high-severity runtime advisories**, all in `@angular/*` itself — XSS in `core` and
  `compiler`, XSRF token leakage in `common`. None are patchable on v14; the version walk is the
  fix. This is the security argument for the migration, not an argument against it.
- **`advisor-console` loads with no Material core theme at all** (issue #11), so the two consumers
  don't look alike today and phase 2 will land differently in each.


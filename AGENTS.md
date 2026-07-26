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
```

Headless requires a real Chrome binary on `CHROME_BIN`. Playwright's works:
`export CHROME_BIN=$(node -e "console.log(require('playwright').chromium.executablePath())")`.

## Migration work

Angular 14 → 18, in four phases. One issue per phase, one PR per phase.

| Phase | What |
|---|---|
| 0 | Harness — Storybook, axe, evidence tool, `before` baseline on v14 |
| 1 | Walk to v16 — 14→15→16, remove `@angular/flex-layout` (archived, hard-blocks v15+) |
| 2 | Legacy → MDC — theme and all components |
| 3 | v16 → v18 — through the v17 gate |

All Material MDC work happens on **v16**: legacy components were deleted in v17 and `ng update`
fails while any legacy import remains.

Phase 2 is the only phase where the UI is *supposed* to change. Phases 1 and 3 must be visually
inert, so they're compared with `--strict-pixels`.

## How work is triggered

Every phase starts as a GitHub issue opened by a person.

1. **Triage.** Read the code and post a plan as an issue comment: what you'd change, which consumers
   are affected, which deleted APIs are in use, and the risks. **Write no code at this stage.**
2. **Wait for `devin:approved`.** Until that label is present, don't branch, edit files, or open a
   PR.
3. **Execute the whole phase** — implementation, tests, evidence — then open a PR with
   `Closes #<issue>`.
4. **Stop when blocked.** If the change would break a rule in `BRAND_CONTRACT.md`, or needs a
   decision you shouldn't make alone, comment why with the measured value, label the issue
   `devin:blocked`, and stop. Don't work around the rule, and don't open a PR you can't back.
5. **Never merge your own work.**

Two things are humans-only: applying `devin:approved`, and merging. Open follow-up issues freely —
that's how pre-existing defects get recorded instead of fixed mid-migration (rule D4).

## Verifying a phase

```bash
npm run build-storybook
node tools/storybook-evidence.mjs --label <phase>
node tools/storybook-evidence.mjs --compare before <phase>   # add --strict-pixels for phases 1 and 3
```

The comparison prints the markdown table for the PR body and exits non-zero on any regression. It
fails when a story disappears, when axe violations increase, or when a control loses its accessible
name, shrinks below 24×24, or drops below 4.5:1.

The pixel-diff percentage is **not** a gate in phase 2 — MDC changes every component's DOM, so
everything legitimately moves. Use it to decide which diff images to look at.

`.storybook-evidence/before/` is the committed v14 baseline. Don't regenerate it; every later phase
compares against it.

### Known pre-existing failures in the baseline

These are in the `before` numbers deliberately. Don't fix them in a migration PR (rule D4), and
don't be alarmed when they persist:

- **11 × `button-name`** — `bds-button` declares three `<ng-content>` slots, so only
  `variant="danger"` receives the projected label. Primary and secondary buttons render blank.
- **2 × `color-contrast`** — the `warning` alert is 3.79:1 against a 4.5:1 floor.

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
npx ng test
```

## Migration work

Angular 14 → 18, in four phases.

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

Every phase starts as a GitHub issue opened by a person. The issue is a **tracking issue**: its body
is a checklist of the PRs the phase needs.

1. **Triage.** Read the code and post a plan as an issue comment: how you'd break the phase into
   PRs, which consumers each affects, which deleted APIs are in use, and the risks. **Write no code
   at this stage.**
2. **Wait for `devin:approved`.** Until that label is present, don't branch, edit files, or open a
   PR.
3. **Execute**, one PR per checklist item, each targeting `migration/angular-18` and referencing the
   tracking issue. Only the last one says `Closes #<issue>`.
4. **Stop when blocked.** If the change would break a rule in `BRAND_CONTRACT.md`, or needs a
   decision you shouldn't make alone, comment why with the measured value, label the issue
   `devin:blocked`, and stop. Don't work around the rule, and don't open a PR you can't back.
5. **Never merge your own work.**

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


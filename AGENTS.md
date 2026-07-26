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

Angular 14 → 18. The walk is 14 → 15 → 16 → 17 → 18. All Angular Material MDC work happens on **16**:
legacy components were deleted in v17 and `ng update` fails while any legacy import remains.

One component per PR, with the evidence bundle described in the contract (rule E2).

## How work is triggered

Every unit of migration work starts as a GitHub issue opened by a person. Work the issue in this
order and do not skip ahead:

1. **Triage** (`devin:triage`). Read the code and post a plan as an issue comment: what you'd change,
   which consumers are affected, which deleted APIs are in use, which contract rules the component
   currently violates, and what the risks are. **Write no code at this stage.** Then relabel
   `devin:awaiting-approval`.
2. **Wait.** A maintainer adds `devin:approved`. Until that label is present, do not branch, do not
   edit files, do not open a PR.
3. **Execute.** Branch from `migration/angular-18`, do the work, assemble the evidence bundle, open a
   PR with `Closes #<issue>`. Relabel `devin:in-progress`.
4. **Stop at violations.** If the change would break a rule in `BRAND_CONTRACT.md`, do not work
   around it and do not weaken the rule. Comment the rule ID, the measured value, and a compliant
   alternative; label the issue `blocked:waiver`; wait for a maintainer.
5. **Never merge your own work.** A human approves and merges.

You may open new issues yourself — follow-ups you find but shouldn't fix in a scoped PR, and port
issues from the branch-sync job. You may not apply `devin:approved`, clear `blocked:waiver` or
`blocked:human`, or merge. Those three are the human gates.

If a task arrives without an issue, open one and triage it rather than starting work.

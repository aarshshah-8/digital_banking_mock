Part of #

## What changed

<!-- One item from the phase's tracking issue: one version step, one component, or one app. -->

## Evidence

- [ ] `bofa-design-system`, `digital-banking-shell` and `advisor-console` all build
- [ ] Tests pass
- [ ] `npm run evidence -- --compare baseline <label>` exits 0
- [ ] No unresolved `TODO(mdc-migration):`

<!-- Paste the table --compare prints. Embed before/after screenshots for anything that moved. -->

| Story | axe before | axe after | pixels moved | |
|---|---|---|---|---|
| | | | | |

## Downstream

- [ ] `npm run api-report -- --check` exits 0

<!-- If it doesn't: the point of BDS is to absorb Material's churn, so a change here is a leak
     until argued otherwise. Paste the diff and name the consumers that have to change. -->

## Dependencies

- [ ] `npm run deps-report -- --check` exits 0

<!-- Paste the added / removed / version-changed counts. If the runtime advisory count moved in
     either direction, say so — a migration that closes advisories is worth stating too. -->

## Contract

- [ ] No rule in `projects/bofa-design-system/BRAND_CONTRACT.md` is violated

<!-- If one is, don't work around it: say which rule and the measured value, and let a maintainer
     decide. Record the decision here. -->

## Learned

<!-- Last PR of a phase only. What did this phase teach that isn't written down yet? Move it into
     BRAND_CONTRACT.md or AGENTS.md in this PR so the next migration doesn't rediscover it. -->

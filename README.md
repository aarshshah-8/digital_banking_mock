# Digital Banking Mock — Angular 14 → 18 Upgrade Demo

This is a **mock repo**, built to demo an Angular version-upgrade agent
against a workspace that structurally mirrors a large customer-facing
digital banking application — without using any real proprietary code.
It exists to support a specific conversation: helping engineering
leadership evaluate whether an autonomous coding agent can safely carry
out an Angular 14 → 18 upgrade on an app with a shared component library,
multiple downstream consumers, and integrations with systems that can't
be freely refactored.

Nothing in this repo represents any real institution's actual codebase,
architecture, or business logic. Service and integration names are
generic stand-ins chosen to mirror the *shape* of a large bank's typical
frontend stack, not any specific company's real systems.

## What's in the workspace

| Project | Role |
|---|---|
| `digital-banking-shell` | The customer-facing app — analogous to the "large customer-facing digital banking application" |
| `bofa-design-system` | Shared component library layered on Angular Material, consumed by multiple downstream apps |
| `advisor-console` | A second, independent downstream app that also consumes the shared library |

## Why this structure, specifically

The interesting part of a real upgrade like this isn't bumping a
version number — it's proving an agent can do it **without breaking
things it doesn't own**. So this repo intentionally includes:

- **A shared library consumed by more than one app.** Any breaking
  change to `bofa-design-system` should show up as a build failure in
  *both* `digital-banking-shell` and `advisor-console`, not just the
  app being actively worked on.
- **Stubbed integration points** (`src/app/core/auth`,
  `src/app/core/analytics`, `src/app/core/market-data`) standing in for
  SSO/MFA, a proprietary analytics SDK, and a third-party data
  provider. These model the *call shape* of real integrations, not
  business logic, so an upgrade has to preserve the boundary rather
  than being free to delete or rewrite these call sites.
- **A deliberately uneven test suite.** `bds-button` has real spec
  coverage, including a disabled-state edge case. `bds-card`,
  `bds-alert-banner`, and the entire `DashboardComponent` (which
  exercises the session/auth and balance-display path) have none. This
  mirrors "some services have no existing test infrastructure at all"
  from the use case description.

## Seeded breaking-change points (for the 14 → 18 upgrade)

These are **real, well-documented** Angular upgrade blockers — not
invented for this demo — chosen because they're the actual friction
points teams hit on this version span:

1. **`@angular/flex-layout`** (`src/app/dashboard/dashboard.component.html`,
   `app.module.ts`) — the package was archived by the Angular team and
   never published a stable release compatible with Angular 15+.
   Migrating off it (typically to CSS Grid/Flexbox) is mandatory, not
   optional, for this upgrade.
2. **Pre-MDC Material APIs** (`bofa-design-system` button/card
   components) — Angular Material's v15 MDC-based rewrite changes DOM
   structure and, for teams keeping the legacy visual API, requires
   migrating to `MatLegacy*` modules or the new MDC API surface.
3. **Deprecated RxJS `toPromise()`** (`AuthService.establishSession`)
   — deprecated since RxJS 7, removed entirely in RxJS 8. A real
   compatibility gap when an Angular major bump also pulls in a current
   RxJS major.

## Suggested demo flow

1. **Pre-run before the meeting:** point the agent at the full 14 → 18
   upgrade across all three projects. Confirm it completes cleanly, and
   note the 1–2 most interesting moments (e.g., how it resolves the
   flex-layout removal, whether it catches the downstream
   `advisor-console` build).
2. **Live in the room:** give the agent a smaller, fresh follow-up task
   it hasn't seen before — e.g., introduce a new breaking-change
   pattern, or ask it to raise `bds-card` test coverage to match
   `bds-button`. Show the PR it opens, not just the finished diff, so
   the review/approval gate is visible.
3. Throughout, narrate what the agent is checking (does the shared
   library still build for both consumers? are existing tests still
   green?) rather than just the fact that it "worked" — this is what
   maps back to the Chief Architect's and Security Engineer's actual
   concerns.

## Local setup

```bash
npm install --legacy-peer-deps
npx ng build bofa-design-system   # build the shared lib first
npx ng build digital-banking-shell
npx ng build advisor-console
```

Note: `angular.json` has font inlining disabled
(`optimization.fonts: false`) for both apps. That's a sandbox-network
workaround from where this repo was built, not a real-world constraint
— safe to remove if your environment has outbound access to
`fonts.googleapis.com`.

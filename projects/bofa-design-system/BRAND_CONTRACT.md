# BDS brand & accessibility contract

The rules a migration must not break. Devin reads this before touching a component. If a change
would break a rule, Devin stops and comments the rule ID and the measured value on the issue rather
than working around it.

This lives in the repo rather than a wiki so that changing a rule is a reviewed commit, and so each
PR records the revision it was checked against.

Conformance floor: **WCAG 2.1 AA**.

---

## A · Colour

Contrast uses the WCAG relative-luminance formula, compared unrounded (4.499 fails). Text needs
**4.5:1**. Non-text boundaries — borders, focus rings, control outlines — need **3:1** against the
adjacent colour.

- **A1** — No text below 4.5:1, no UI boundary below 3:1. Re-measure after migration even when the
  colour didn't change: MDC often changes the adjacent surface.
- **A2** — `brandAccent` `#E31837` is 4.72:1 on white. It clears AA by 0.22, so any tint, opacity or
  darker surface breaks it. Identity colour, not a text colour.
- **A3** — Colour is never the only carrier of meaning.

## B · Accessibility

- **B1** — Every control is keyboard-operable with a visible focus indicator at ≥3:1. `outline: none`
  only with an equivalent replacement.
- **B2** — Targets ≥24×24 CSS px. Never restore pre-MDC compactness with `mat.checkbox-density(-1)`,
  `radio-density(-1)` or `slide-toggle-density(-1)` — MDC grew those targets deliberately. Re-space
  the layout instead.
- **B3** — Every `<mat-form-field>` has a `<mat-label>`. A placeholder is not a label.
- **B4** — No component loses an accessible name, role or state in migration. This is the one thing
  the schematic will silently take from you.

## C · Migration mechanics

- **C1** — MDC work happens on **v16**. Legacy components were deleted in v17 and `ng update` fails
  while any legacy import remains, so v17 is a gate, not a step.
- **C2** — `@use` only; v17 removed `@import` for Material Sass. `mat.legacy-typography-hierarchy`
  becomes `mat.typography-hierarchy`, and it's no longer emitted automatically.
- **C3** — Never regex `.mat-` → `.mat-mdc-`. Prefixes split three ways: `.mat-tab-label` →
  `.mat-mdc-tab`, `.mat-tab-label-active` → `.mdc-tab--active`, some have no equivalent.
- **C4** — Never style `.mdc-*` internals, and no `::ng-deep` or `!important` to force appearance.
  MDC's internal DOM is explicitly unstable.
- **C5** — `ng update @angular/material@15|16` rewrites TS imports but leaves the prebuilt theme path
  in `angular.json` and SCSS `@use` statements pointing at MDC. Fix both by hand, or the build goes
  green with MDC styles on legacy DOM. Measured on the 14 → 15 step (PR #15): leaving the theme path
  alone moves **6 of 15 stories** by 0.2–0.8% — enough to change typography and card metrics,
  little enough that only `--strict-pixels` fails it. Two details the guide doesn't spell out:
  - the legacy theme lives in a **new directory** as well as under a new name —
    `@angular/material/legacy-prebuilt-themes/legacy-indigo-pink.css`, not
    `prebuilt-themes/legacy-indigo-pink.css`;
  - the schematic is **partial**, not just incomplete on styles. On this workspace it rewrote a
    *spec* file to `MatLegacyButtonModule` and left the library's own `NgModule` importing
    `MatButtonModule`/`MatCardModule` from the MDC entry points. MDC keeps the legacy selectors
    (`mat-card`, `button[mat-raised-button]`), so that compiles, renders and tests green while
    quietly serving MDC components. After any `ng update` of Material, grep the whole workspace for
    `@angular/material/` and check every import by hand.
- **C6** — Deleted APIs to grep for: `appearance="legacy"|"standard"`, `floatLabel="never"`,
  `matPrefix`/`matSuffix` (now `matIconPrefix`/`matTextPrefix`).
- **C7** — No unresolved `TODO(mdc-migration):` at merge.

## D · Scope

- **D1** — One component per PR.
- **D2** — Every migration PR carries the evidence bundle: both consumers build, tests pass,
  Storybook before/after.
- **D3** — A change to this library must build in **both** `digital-banking-shell` and
  `advisor-console`.
- **D4** — Fix what the migration forces. Pre-existing defects get an issue, not a drive-by fix in a
  migration PR.

---

## Checking a colour

```python
def _lum(h):
    h = h.lstrip('#')
    srgb = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def contrast(fg, bg):
    hi, lo = sorted((_lum(fg), _lum(bg)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)      # do not round before comparing
```

## Provenance

Palette and accessibility rules derive from bankofamerica.com's served CSS and its public WCAG 2.1 AA
commitment — evidence of shipped practice, not a published internal standard. Material rules come
from the v15 MDC migration guide and the v17 release notes. Token values in this repo are demo
placeholders.

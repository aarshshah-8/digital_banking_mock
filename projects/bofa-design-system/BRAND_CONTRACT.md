# BDS brand & accessibility contract

The rules every change to this library must satisfy. Devin reads this before migrating a component;
CI enforces the mechanical parts. If a change breaks a rule, it is refused and the rule ID is quoted
on the PR with the measured value.

Brand and accessibility rules are versioned here rather than in a wiki so that changing one is a
reviewed commit, and so a PR records which revision it was checked against.

Conformance floor is **WCAG 2.1 AA**; 2.2 AA is the target.

---

## A. Colour — measured, not eyeballed

Contrast is computed with the WCAG relative-luminance formula and compared without rounding
(4.499 fails). Text needs **4.5:1**; large text (≥18.66px bold / ≥24px) and any non-text boundary —
borders, focus rings, toggle tracks, checkbox outlines, chart series — needs **3:1** against its
*adjacent* colour. Re-measure after migration even when the colour didn't change: MDC frequently
changes the adjacent surface.

Current tokens, measured against `surface` (`#FFFFFF`):

| Token | Value | Ratio | Verdict |
|---|---|---|---|
| `textPrimary` | `#0B1B32` | 17.25 | ok |
| `brandPrimary` | `#012169` | 14.76 | ok |
| `danger` | `#B3261E` | 6.54 | ok |
| `success` | `#1E7A34` | 5.40 | ok |
| `brandAccent` | `#E31837` | 4.72 | ok, but see A2 |
| `warning` | `#B26A00` | 4.24 | **fails** — see A3 |

- **A1** — No text/background pair below 4.5:1, no UI boundary below 3:1.
- **A2** — `brandAccent` clears AA by 0.22. Any tint, opacity, hover shift or dark surface breaks it.
  It is an identity colour, not a text colour: never use it for body text, and never on
  `brandPrimary` (that pair is 3.13:1). For red text use `#C41230` (6.04) or `#A50E28` (7.80).
- **A3** — `warning` `#B26A00` fails on white (4.24) *and* on its own banner background `#FCF1E0`
  (3.79). Use `#9A5B00` (5.43 / 4.86).
- **A4** — Never `color="warn"` on a Material button. The prebuilt palette is `#F44336` with white
  text: **3.68:1**. Theme the danger variant from `danger` instead.
- **A5** — `mat-stroked-button`'s default border is `rgba(0,0,0,.12)` ≈ **1.32:1** on white. A
  stroked button's border is its only affordance, so it must be re-themed to ≥3:1.
- **A6** — Colour is never the sole carrier of meaning. Severity, validity and state need text or
  shape as well.
- **A7** — Colours come from `BDS_COLOR_TOKENS`. A raw hex in a component file is a violation even
  when the value is right. (`alert-banner.component.scss` currently violates this with eight
  literals; the four surface tints it uses aren't in the token file at all.)

## B. Component rules

- **B1** — Every interactive control is reachable and operable by keyboard, with a visible focus
  indicator at ≥3:1. `outline: none` is only acceptable alongside an equivalent replacement.
- **B2** — Targets are ≥24×24 CSS px (WCAG 2.2 AA); aim for 44×44. Never restore pre-MDC compactness
  with `mat.checkbox-density(-1)`, `radio-density(-1)` or `slide-toggle-density(-1)` — MDC grew those
  targets deliberately. Re-space the layout instead. Each density step removes ~4px.
- **B3** — Every `<mat-form-field>` has a `<mat-label>`. A placeholder is not a label.
- **B4** — Decorative `<mat-icon>` carries `aria-hidden="true"`, otherwise screen readers announce
  the ligature text ("check_circle"). If the icon carries meaning, the meaning is also in text.
- **B5** — `role="alert"` is assertive and only fires on dynamic insertion. Use it for genuine
  interruptions; use `role="status"` for informational and success messaging.
- **B6** — No `@Input` that renders nothing. A declared-but-unimplemented control is an API lie.
- **B7** — Buttons declare an explicit `type`; inside a form the default is `submit`.
- **B8** — Async states are announced, not just drawn (`aria-busy`, or a live region).

## C. Migration mechanics

- **C1** — MDC work happens on **v16**. Legacy components were deleted in v17 and `ng update` fails
  while any legacy import remains, so v17 is a gate, not a step.
- **C2** — `@use` only; v17 removed `@import` for Material Sass. `mat.legacy-typography-hierarchy`
  becomes `mat.typography-hierarchy`, and it is no longer emitted automatically — include it or the
  type hierarchy silently disappears.
- **C3** — Never regex `.mat-` → `.mat-mdc-`. Prefixes split three ways: `.mat-tab-label` →
  `.mat-mdc-tab`, `.mat-tab-label-active` → `.mdc-tab--active`, and some have no equivalent.
- **C4** — Never style `.mdc-*` internals, and no `::ng-deep` or `!important` to force brand
  appearance. MDC's internal DOM is explicitly unstable; overriding it blocks future patches. Use
  theming mixins or token overrides at the highest applicable selector.
- **C5** — `ng update @angular/material@16` rewrites TS imports but leaves the prebuilt theme path in
  `angular.json` and SCSS `@use` statements pointing at MDC. Fix both by hand, or the build goes
  green with MDC styles on legacy DOM.
- **C6** — Deleted APIs to grep for and decide case by case: `appearance="legacy"|"standard"`,
  `floatLabel="never"`, `matPrefix`/`matSuffix` (now `matIconPrefix`/`matTextPrefix`).
- **C7** — The chips schematic always emits `mat-chip-listbox`. Text-input + chips must be
  `mat-chip-grid`/`mat-chip-row`.
- **C8** — `mat-slide-toggle` becomes `<button role="switch">`, so native form validation stops
  firing. Any form depending on it needs explicit validation.
- **C9** — `mat-tab-nav-bar` requires `[tabPanel]`. `mat-slider` wraps `<input matSliderThumb>` and
  value, events and `aria-label` all move to the inner input.
- **C10** — No unresolved `TODO(mdc-migration):` at merge. Tests use component harnesses, not
  assertions against `.mat-*` DOM.

## D. Geometry and type

- **D1** — Buttons are pills: radius ≈ height/2 (32/16, 44/22, 56/28); icon buttons 4px. Material's
  default 4px on a text button is off-brand.
- **D2** — The real brand face is Connections (`cnx-*`), licensed exclusively to BofA. Never commit
  the font binaries, never fetch them from a third-party font site, never substitute a lookalike.
  This repo uses the fallback stack deliberately.
- **D3** — The logo is never recoloured, rotated, cropped, animated, or rebuilt by hand in CSS/SVG.

## E. Repo rules

- **E1** — One component per PR. A whole-library `mdc-migration` dump is unreviewable.
- **E2** — Every migration PR carries the same evidence bundle: Storybook before/after, axe-core
  before/after, a contrast table for changed colours, a grep of affected consumers, and the resolved
  `TODO(mdc-migration):` markers.
- **E3** — A breaking change to this library must build in *both* consumers (`digital-banking-shell`
  and `advisor-console`) before merge.
- **E4** — No PII, account numbers, real balances, credentials or internal hostnames in fixtures,
  specs or screenshots.
- **E5** — Never disable a lint, test or accessibility gate to make a build pass.

---

## Known open violations

Tracked deliberately, not silently fixed — each is a migration ticket.

| Rule | Where | Detail |
|---|---|---|
| A3 | `tokens/design-tokens.ts` | `warning` `#B26A00` fails AA on white and on its banner |
| A4 | `button/bds-button.component.html` | `danger` variant uses `color="warn"` → 3.68:1 |
| A5 | `button/bds-button.component.html` | `secondary` variant border 1.32:1 |
| A7 | `alert-banner/bds-alert-banner.component.scss` | 8 raw hex literals; tints missing from tokens |
| A7 | `tokens/design-tokens.ts` | `BDS_COLOR_TOKENS` is exported but imported by nothing |
| B4 | `alert-banner/bds-alert-banner.component.html` | `<mat-icon>` lacks `aria-hidden` |
| B5 | `alert-banner/bds-alert-banner.component.html` | `role="alert"` on all four severities |
| B6 | `alert-banner/bds-alert-banner.component.ts` | `dismissible` renders no control |
| B7/B8 | `button/bds-button.component.html` | no explicit `type`; `loading` sets no `aria-busy` |
| D1 | `button/bds-button.component.scss` | `border-radius: 4px` |
| — | `advisor-console` | consumes the library but loads no Material theme |

## Verifying a colour

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

Palette, focus treatment and button geometry are derived from bankofamerica.com's served CSS and
public WCAG commitments — evidence of shipped practice, not a published internal standard. Angular
Material rules come from the v15 MDC migration guide and the v17 release notes. The token values in
this repo are demo placeholders. Replace this section when the authoritative internal brand and
accessibility standards are available.

# Cross-browser check, 2026-11-02

What had only been checked in Chrome, run in Chromium, Firefox and WebKit through Playwright 1.64.1 (headless, macOS) against the studio dev server: `geometry-check.html`, `react-check.html`, the select popup on both sides of the viewport, every motion easing against the resolver, the numerals detection table, and screenshots of `#/home`, `#/components`, `#/motion` and `#/typography` (1440 × 1000). The runner that repeats this is `npm run check:browsers` (`apps/studio/scripts/check-browsers.ts`).

| Engine | Version |
|---|---|
| Chromium | 156.0.8078.4 |
| Firefox | 157.0 |
| WebKit | 27.2 (Safari 27 engine) |

## Results

Fails per check, before and after the fallbacks below. The select and motion rows are the runner's own probes; before them, no page measured either.

| Check | Chromium | Firefox | WebKit |
|---|---|---|---|
| geometry-check (12098 checks) | 0 → 0 | 80 → 0 | 0 → 0 |
| react-check (4456; Firefox 4426, no select parts without base-select) | 0 → 0 | 6 → 0 | 0 → 0 |
| select placement (2 sides) | 0 → 0 | 0 → 0 | 3 → 0 |
| motion easings (8, 1e-4 per sample) | 0 → 0 | 0 → 0 | 4 → 0 |

The four screenshots match across engines apart from glyph rasterization; no page errors. The console warnings on the check pages (`ui-kit icons: phosphor/pp4 unavailable`, a 404) come from the check fixtures' placeholder icon names and occur in every engine.

## Feature support

| Feature | Chromium | Firefox | WebKit | Where |
|---|---|---|---|---|
| `linear()` with `calc()` samples using `exp()`, `cos()`, `sin()`, `sqrt()` | yes | yes | yes | `tokens/motion` |
| `@property` registered `<number>` | yes | yes | yes, kept at 6 decimals | `styles/motion.ts` |
| anchor positioning (`position-area`, `anchor-scope`, `position-try-fallbacks`) | yes | yes | yes | select popup |
| `position-try-order: most-block-size` | yes | yes | parsed, not applied | select popup |
| `appearance: base-select`, `::picker(select)`, `<selectedcontent>` | yes | no | yes | React Select |
| `font-variant-numeric`, `font-variant-position`, `"case"` | yes | yes | yes | numerals |
| `font-synthesis-position` | no | yes | no | numerals (superior / inferior figures) |
| `corner-shape: superellipse()` | yes | no | yes | every radius |
| `color-mix(in oklab / oklch)`, `:has()`, container queries, subgrid, `pow()`, `round(up, …)`, popover, `@starting-style`, `transition-behavior: allow-discrete` | yes | yes | yes | recipes |
| `interpolate-size` | yes | no | no | not used |

The script placement path of `ui-select` (no anchor positioning) runs in none of the three: all of them now ship anchor positioning. It is unit-tested (`placePopup`, `popupVars`) but was not exercised in a browser here.

## Breaks and fallbacks

### WebKit: motion easings off at bounce 0

WebKit keeps a computed registered `<number>` at 6 decimals. At bounce 0 the angular step `--motion-<x>-f` is about 2e-4 (ωd is floored at 0.001 ω0), so it kept 3 significant digits and the `quick` and `smooth` springs (and the `feedback` and `reveal` intents) were up to 7e-4 off the solve; the first `quick` sample read 0.016592 where Chrome and Firefox read 0.016292.

Fallback: `--motion-<x>-f` is stored × 1000 and the samples read `f × j/1000` (`tokens/motion/index.ts`). One source for every engine; every easing is now within 5e-6 of Chrome and 1e-4 of the resolver. `test/motion.test.ts` evaluates the CSS with the registered variables at 6 decimals and fails on the old form.

### WebKit: select popup squeezed below the trigger

With `max-height: var(--available-height)` the popup always fits its position-area cell, so only `position-try-order: most-block-size` makes Chrome and Firefox flip it above a trigger near the viewport bottom. WebKit parses the property and keeps the first fit: the list opened below, 15.5px tall.

Fallback: `#measureSide` (`select.element.ts`) reads the popup back after it opens; when the list overflows it takes the side with more room, and `data-side="top"` places the popup above in CSS (`select.recipe.ts`, with `flip-block` still as the fallback). Each opening starts below. The side matches Chrome's choice, so Chrome and Firefox are unchanged.

Open: the React Select's `::picker(select)` has no script, so in WebKit it still opens squeezed below a trigger near the viewport bottom. A CSS-only fix would need a content-based minimum height that does not also stop Chrome from shrinking a long list in a short viewport; none found.

### Firefox: React Select as a flat text line

Without `appearance: base-select`, the recipe's reset for the customizable select (no padding, border or background, line height 0) applied to the platform select, which showed as bare text 19px tall.

Fallback: the reset sits under `@supports (appearance: base-select)`; under `@supports not` the platform select takes the field control's fill, edge, radius, 2u bare-edge padding and the control height (`select.recipe.ts`), with the platform arrow and picker. Adornments (the leading icon) and rich option content do not render in a platform select.

### Firefox: rhythm line height rounded up a whole step

Firefox evaluates `calc()` in float32: 12.5px × 1.2 lands just above 15px, and `round(up, …, 2.5px)` gave 17.5px (`section-kicker` at u = 2.5, both border cases).

Fallback: the CSS subtracts 1e-4 of a rhythm step before rounding up, and the resolver uses the same tolerance (`RHYTHM_TOLERANCE`, `tokens/typography/resolve.ts`, `styles/typography.ts`; it replaced the resolver's 1e-6). Generated outputs are unchanged.

### Firefox: engine precision in the check pages

Not breaks in the components, but the pages' tolerances assumed Blink:

- Gecko keeps a computed `font-size` to about 2^-10 of its value (67.32px reads 67.375px, 39.47px reads 39.5px): 62 `type.*.size` fails up to 0.06px.
- Gecko lays out in 1/60px units, and two of them add up to 0.033px: 16 `segmented.height` and `checkbox.row` fails of 0.02–0.03px.
- A native `<button>`'s computed padding snaps to 1/60px (1.3125px reads 1.31667px): 6 `ch.pad` / `chX.pad` fails in react-check.

Fallback: `geometry-check.html` measures the engine (does 16.01px stay 16.01px; how tall is a 0.01px box) and allows half a font-size step on measured font sizes and two layout units on a grid coarser than 1/64px; Chromium and WebKit keep the 0.02px tolerance. `react-check` accepts a lone px value within 1/60px. The page reports `precision` next to `fails`.

## Passing without change

- Motion in Firefox: every easing equals Chrome's to 1e-6.
- Anchor positioning in Firefox and WebKit: the popup sits 1u below its trigger at the trigger's width, `data-side` is read back, and Firefox flips above near the bottom.
- Numerals: the detection specimen (`pages/numerals.ts`, SVG `foreignObject` rasterized onto a canvas) runs in all three engines and reports the same table for every face. Firefox draws superior and inferior figures (`font-synthesis-position: auto`) where the face lacks `sups` / `subs`; Chrome and WebKit do not, as the typography spec says.
- `corner-shape` in Firefox: unsupported, plain round corners, as `styles/geometry.ts` intends.

## Open

- WebKit: the React picker opens squeezed near the viewport bottom (above).
- Firefox: `getComputedStyle` on a popup placed by a position-try fallback returned the style from before a later `data-side` change (even inline styles), until a layout change re-ran the try; painting was current. With the side fallback above, the flipped popup's `transform-origin` now reads `bottom center` in Firefox too. Not reduced to a bug report.
- The select's script placement path is not exercised by any current engine.

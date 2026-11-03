# Typography

massimo-ui's type roles and font families, placed on our u ramp. Reference: `packages/ui-kit/tokens/typography/resolve.ts`; CSS: `styles/typography.ts`. Neighbors: [geometry](geometry.md) (the unit u), [theming](theming.md) (ratio and rhythm parameters, voice attributes).

## The rule

- **Base** = the control font, `10px + u` (14px at u = 4, massimo-ui's anchor). Text scales with `size` like every other length.
- **Step role:** `size = (10px + u) × ratio^step`. **Fixed role:** `size = n·u`.
- **Line height:** `round(up, size × multiplier, rhythm × u)`, less 1e-4 of a step first (`RHYTHM_TOLERANCE`, in the resolver too: Firefox computes in float32, where 12.5px × 1.2 lands above 15px and would round up a whole step); rhythm 0 keeps the natural height. Controls keep a unitless 1.2.
- Computed in CSS with `pow()` and `round()` at each element from inherited inputs, so it works per subtree with no script.

## Inputs

| Input | Where | Values | Default |
|---|---|---|---|
| ratio | theme `type-ratio` | 1–1.5 (named: 1 product UI, 1.125, 1.2, 1.25, 1.333 perfect fourth, 1.5) | 1.333 |
| rhythm | theme `type-rhythm` | 0 (natural), 0.5, 1 (× u) | 1 |
| u | theme `unit`, `size` / `data-size` | see geometry | 4.5 |

## Faces, voices, roles

Fonts work in three layers, like colors (ramps → roles):

1. **Faces** (the stacks): `sans`, `serif`, `mono`, `display`, `controls`. Tokens `fonts.*`, CSS `--fonts-<face>`. `display` starts as the sans stack; `controls` is the platform UI font (system-ui).
2. **Voices** (what text is for), each pointing at a face:

   | Voice | Default face | Used by |
   |---|---|---|
   | display | display | display |
   | heading | sans | heading-1–3 |
   | body | sans | body-large, body, caption |
   | ui | controls | control, label, control-small, kickers; all buttons, form controls, badges, tags and chips |
   | numeric | follows ui (controls) | `data-numeric` (stats, counters, tables), tabular lining figures by default ([numerals](#numerals)) |
   | code | mono | code |

3. **Roles** (below) point at voices. Kickers are a role on the ui voice (case, tracking, weight), not a voice of their own; numerics are mostly font features, so `numeric` follows `ui` unless repointed.

Repoint a voice for a subtree with `data-font-<voice>="<face>"` (e.g. `data-font-heading="serif"`). Display and heading voices drop to regular weight (400) on the serif face, massimo-ui's serif heading style; the jig applies the same rule to any face whose stack ends in `serif`. Change a face's stack by overriding `--fonts-<face>` (or `tokens.fonts` in a Panda preset). Curated stacks per face: `FACE_STACKS`.

## Roles

| Role | Size | Line height | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| display | step 6 | 0.95 (rounded up to the rhythm: 76 at u = 4, 81 at u = 4.5) | 700 | −0.045em | display voice |
| heading-1 | step 4 | 1.1 | 700 | −0.025em | heading voice |
| heading-2 | step 3 | 1.15 | 700 | −0.02em | heading voice |
| heading-3 | step 2 | 1.2 | 700 | −0.01em | heading voice |
| section-kicker | step 0 | 1.2 | 700 | 0.12em | uppercase |
| group-kicker | step −1 | 1.2 | 500 | 0.096em | uppercase |
| body-large | step 1 | 1.5 | 400 | 0 | |
| body | step 0 | 1.5 | 400 | 0 | the `<body>` default |
| caption | 3u | 1.45 | 400 | 0 | field descriptions and errors |
| code | 3u | 1.5 | 400 | 0 | mono |
| control | step 0 | 1.2 (unitless) | 450 | 0 | |
| label | step 0 | 1.4 | 450 | 0 | field labels |
| title | step 0 | 1.4 | 600 | 0 | strong item titles: list and settings rows, table name cells, small card titles |
| control-small | 3u | 1.2 (unitless) | 450 | 0 | |

At u = 4, ratio 1.333, rhythm 1u: body 14/24, heading-1 44.2/52, display 78.5/76, caption 12/20.


## Default stacks

- sans and display: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- serif: `Baskerville, "Palatino Linotype", Palatino, serif`
- mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- controls: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

Display, the headings and title take the strong text color `fg.strong` (black in light, white in dark: neutral step 3 of the dark and light ramps; [color](color.md#roles)); the secondary roles (body-large, caption, code, label) default to `fg.muted`; the others inherit. The role is the one source of a text's color: components and pages do not set a color next to a role unless it is deliberate (a pull quote in primary), so a remap reaches every use. A theme remaps any role (`typography.colors`: strong, default, muted, subtle, primary or inherit; `TEXT_COLORS`), emitted as `--ui-type-color-<role>`; the jig's Typography tab has a Text colors menu per role and the Typography page lists every text color token with the roles that use it.

## Using a role

- HTML: `<h2 data-type="heading-2">`.
- Panda: `css({ textStyle: 'heading-2' })`.
- Panda `fontSizes` (`xs` … `5xl`) are steps of the same scale, (10px + u) × ratio^step with `md` = step 0 (`xs` −2, `sm` −1, `lg` 1 … `5xl` 6), computed where used, so they follow `size` subtrees and the theme ratio. Use them only for text without a role (chart ticks); there is no fixed rem scale. `lineHeights` and `letterSpacings` are unitless or em, relative to the font.

Both apply family, size, line height, weight, tracking and case. Every role's size and line height at every size are in `docs/geometry.csv` (`type.*`); `tokens/dtcg/typography.dtcg.json` holds faces, voices (aliases), `typography` composite tokens per role and the metrics. The browser geometry check verifies the CSS against the resolver.

## Numerals

Figures (stats, counters, prices, table columns) use the `data-numeric` contract: the numeric voice plus OpenType numeric features. Reference: `NUMERIC_VARIANTS`, `numericStyle()` in `tokens/typography/resolve.ts`; CSS in `styles/typography.ts`; Panda pattern `styles/numeric.ts`.

### Contract

`data-numeric` on any element; bare is `tabular-nums lining-nums`. Space-separated variants set one axis each, so variants on different axes combine (`data-numeric="oldstyle fraction"`). Two variants on one axis conflict and the later one in the table wins, whatever the attribute order.

| Token | Axis | CSS | OpenType |
|---|---|---|---|
| (bare) / `tabular` | spacing | `tabular-nums` | tnum |
| `proportional` | spacing | `proportional-nums` | pnum |
| (bare) / `lining` | figures | `lining-nums` | lnum |
| `oldstyle` | figures | `oldstyle-nums` | onum |
| `fraction` | fraction | `diagonal-fractions` | frac |
| `stacked-fraction` | fraction | `stacked-fractions` | afrc |
| `slashed-zero` | zero | `slashed-zero` | zero |
| `ordinal` | ordinal | `ordinal` | ordn |
| `caps` | caps | `font-feature-settings: "case"` | case (punctuation for all-caps settings) |
| `data-position="super"` / `"sub"` (with `data-numeric`) | position | `font-variant-position`, `font-synthesis-position: auto` | sups / subs |

Panda and React: the attribute works as is in JSX; for styles composed in `css()`, use the pattern, one typed prop per axis: `numeric({ spacing: 'proportional', figures: 'oldstyle', fraction: 'diagonal' | 'stacked', slashedZero, ordinal, caps, position: 'super' | 'sub' })` or `css(numeric.raw({ … }), …)`. Its transform is inlined by Panda, so a test checks it against `numericStyle()`.

### Layering

Roles reach elements as `textStyle` classes (Panda's utilities layer, `compositions` sublayer), while `[data-numeric]` is a global rule (base layer); a base-layer `font-family` can never beat a utilities-layer one, whatever the specificity. So the roles carry the numeric voice instead: every role's family is `var(--ui-numeric-family, <its voice>)`, and `data-numeric` sets `--ui-numeric-family` to the numeric voice. A role plus `data-numeric` on one element therefore renders in the numeric voice in both renderers (`[data-type]`, a `textStyle` class or a recipe's `textStyle`). `--ui-numeric-family` and the per-axis `--ui-num-<axis>` variables are registered non-inheriting: text without a role inherits the numeric family and features as usual, an explicit role inside a numeric element (a "/ month" caption) keeps its voice, and a nested `data-numeric` composes from its own tokens. `font-variant-numeric` reads the axis variables with the defaults as fallbacks, so a variant needs one variable, not a rule per combination. The pattern's classes are plain utilities, above textStyle compositions. Explicit utilities (`css({ fontFamily })`) still win. The browser geometry check covers role class, `data-type`, variants, nesting and position.

### formatNumber

`@massimo/ui-kit/format` (also exported from `tokens`): `formatNumber(value, options)`, `formatNumberParts(value, options)`, `formatFraction(value, options)`. Options are `Intl.NumberFormatOptions` (style, currency, unit, notation compact / scientific / engineering, digits, signDisplay) plus `locale`, `minus` (U+2212 for negatives and negative exponents, default on), `grouping` (`locale`, `narrow` U+202F as SI recommends, `thin` U+2009, `none`), `unitSpace` (U+202F where the locale puts a space before a unit, currency, percent sign or compact suffix; or `locale`) and `exponent` (`times`: `6.02 × 10²³` with narrow no-break spaces around ×; or `e`). `formatNumberParts` returns Intl's parts plus `times`, `base` and `exponent` (plain digits), for a `<sup>` where the face has no superior figures. `formatFraction` finds the nearest fraction up to `maxDenominator` (16) and writes a precomposed character (`1¾`) or `n⁄d` with U+2044 FRACTION SLASH after a narrow no-break space, which `data-numeric="fraction"` builds up where the face has `frac`. For styled output use `formatFractionParts(value)` → `{ sign, whole, fraction }` and put only `fraction` in the `data-numeric="fraction"` span: faces with `frac` set any figure-like glyph before the slash as numerator, so a minus inside the span would turn into a superscript.

### Feature support

Whether a feature shows depends on the face: in Chrome on macOS the controls face (system-ui, SF) has tnum (its digits are proportional by default), frac, sups, subs, ordn and case, but no onum, zero or afrc; Helvetica Neue (sans, display) is tabular by default and has pnum, nothing else; Baskerville (serif) is tabular lining by default with onum; the mono face has none (tabular by nature). The jig's Numerals specimen detects each feature per face live ([studio](studio.md)). Caveats: canvas text ignores font features, so detection rasterizes HTML through an SVG `foreignObject`; it measures this browser and machine, a stack resolves to the first installed font, and fallback fonts can supply glyphs. Chrome and Safari do not synthesize superior or inferior figures when the face lacks them (Firefox does), so exponents use `formatNumberParts` and `<sup>` when the face is unknown. `frac` also turns a preceding minus into a numerator in some faces, so a negative fraction reads better without `data-numeric="fraction"`.


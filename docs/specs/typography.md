# Typography

massimo-ui's type roles and font families, placed on our u ramp. Reference: `packages/ui-kit/tokens/typography/resolve.ts`; CSS: `styles/typography.ts`.

## The rule

- **Base** = the control font, `10px + u` (14px at u = 4, massimo-ui's anchor). Text scales with `size` like every other length.
- **Step role:** `size = (10px + u) × ratio^step`. **Fixed role:** `size = n·u`.
- **Line height:** `round(up, size × multiplier, rhythm × u)`; rhythm 0 keeps the natural height. Controls keep a unitless 1.2.
- Computed in CSS with `pow()` and `round()` at each element from inherited inputs, so it works per subtree with no script.

## Inputs

| Input | Where | Values | Default |
|---|---|---|---|
| ratio | theme `type-ratio` | 1–1.5 (named: 1 product UI, 1.125, 1.2, 1.25, 1.333 perfect fourth, 1.5) | 1.333 |
| rhythm | theme `type-rhythm` | 0 (natural), 0.5, 1 (× u) | 1 |
| heading style | `data-heading="serif"` on any element | sans, serif | sans |
| u | theme `unit`, `size` / `data-size` | see geometry | 4 |

## Roles

| Role | Size | Line height | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| display | step 6 | 1.05 | 700 | −0.045em | heading family |
| heading-1 | step 4 | 1.1 | 700 | −0.025em | heading family |
| heading-2 | step 3 | 1.15 | 700 | −0.02em | heading family |
| heading-3 | step 2 | 1.2 | 700 | −0.01em | heading family |
| section-kicker | step 0 | 1.2 | 700 | 0.1em | uppercase |
| group-kicker | step −1 | 1.2 | 400 | 0.08em | uppercase |
| body-large | step 1 | 1.5 | 400 | 0 | |
| body | step 0 | 1.5 | 400 | 0 | the `<body>` default |
| caption | 3u | 1.45 | 400 | 0 | field descriptions and errors |
| code | 3u | 1.5 | 400 | 0 | mono |
| control | step 0 | 1.2 (unitless) | 450 | 0 | |
| label | step 0 | 1.4 | 450 | 0 | field labels |
| control-small | 3u | 1.2 (unitless) | 450 | 0 | |

At u = 4, ratio 1.333, rhythm 1u: body 14/24, heading-1 44.2/52, display 78.5/84, caption 12/20.

Serif headings switch display and headings 1–3 to the serif stack at weight 400; other roles stay sans; code stays mono.

## Families

- sans: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- serif: `Baskerville, "Palatino Linotype", Palatino, serif`
- mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

Tokens `fonts.sans|serif|mono` (`--fonts-*`).

## Using a role

- HTML: `<h2 data-type="heading-2">`.
- Panda: `css({ textStyle: 'heading-2' })`.

Both apply family, size, line height, weight, tracking and case. Every role's size and line height at every size are in `docs/geometry.csv` (`type.*`) and the DTCG tokens; the browser geometry check verifies them.

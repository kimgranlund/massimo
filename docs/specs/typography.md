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
| u | theme `unit`, `size` / `data-size` | see geometry | 4 |

## Faces, voices, roles

Fonts work in three layers, like colors (ramps → roles):

1. **Faces** (the stacks): `sans`, `serif`, `mono`, `display`, `controls`. Tokens `fonts.*`, CSS `--fonts-<face>`. `display` starts as the sans stack; `controls` is the platform UI font (system-ui).
2. **Voices** (what text is for), each pointing at a face:

   | Voice | Default face | Used by |
   |---|---|---|
   | display | display | display |
   | heading | sans | heading-1–3 |
   | body | sans | body-large, body, caption |
   | ui | controls | control, label, control-small, kickers; badge, tag and chip text |
   | numeric | follows ui (controls) | `data-numeric` (stats, counters, tables), with `tabular-nums lining-nums` |
   | code | mono | code |

3. **Roles** (below) point at voices. Kickers are a role on the ui voice (case, tracking, weight), not a voice of their own; numerics are mostly font features, so `numeric` follows `ui` unless repointed.

Repoint a voice for a subtree with `data-font-<voice>="<face>"` (e.g. `data-font-heading="serif"`). Display and heading voices drop to regular weight (400) on the serif face, massimo-ui's serif heading style; the jig applies the same rule to any face whose stack ends in `serif`. Change a face's stack by overriding `--fonts-<face>` (or `tokens.fonts` in a Panda preset). Curated stacks per face: `FACE_STACKS`.

## Roles

| Role | Size | Line height | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| display | step 6 | 1.05 | 700 | −0.045em | display voice |
| heading-1 | step 4 | 1.1 | 700 | −0.025em | heading voice |
| heading-2 | step 3 | 1.15 | 700 | −0.02em | heading voice |
| heading-3 | step 2 | 1.2 | 700 | −0.01em | heading voice |
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


## Default stacks

- sans and display: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- serif: `Baskerville, "Palatino Linotype", Palatino, serif`
- mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- controls: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

## Using a role

- HTML: `<h2 data-type="heading-2">`.
- Panda: `css({ textStyle: 'heading-2' })`.

Both apply family, size, line height, weight, tracking and case. Every role's size and line height at every size are in `docs/geometry.csv` (`type.*`); `tokens/dtcg/typography.dtcg.json` holds faces, voices (aliases), `typography` composite tokens per role and the metrics. The browser geometry check verifies the CSS against the resolver.

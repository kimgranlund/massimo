# Theming

## Theme parameters

Numbers the geometry derives from (`tokens/themes/params.ts`), emitted as `--ui-<name>` on `:root`:

| Parameter | Range | Default |
|---|---|---|
| `unit` | 2–12 px (0.25 steps) | 4.5 |
| `border` | 0–2 px (whole) | 0 (surfaces separate by fill; invalid controls get a danger-tinted fill) |
| `radius-scale` | 0–3 | 1 |
| `corner-shape` | −1–4 (`superellipse(k)`: 1 round, 2 squircle, 0 bevel, <0 scoop) | 1 |
| `type-ratio` | 1–1.5 | 1.333 |
| `type-rhythm` | 0, 0.5, 1 (× u) | 1 |
| `pad-<level>`, `gap-<level>` | container padding and gap in u, 0.5 steps (composite padding 0–1.5, others 0–12) | composite 0.5, group 1, collection 2, tile 3, card 4, panel 6, region 8, page 8 |

Saved themes live in `tokens/themes/themes.json` as overrides (`validateTheme` accepts only known parameters in range, plus `icons`), emitted as `:root[data-ui-theme="name"]`. Themes apply at the document root only, because tokens resolve where they are declared; scope anything else with an explicit element, as the jig does.

## Per-element inputs

- `size` / `data-size`: u for a subtree (2, 2.25, 2.5, 3, 3.5, 4, 4.5, then 0.5 steps to 12).
- `icon-size` / `data-icon-size`: sm, md, lg, fill.
- `gap`: container gap override in units of u (0–8, 0.5 steps), that element only.
- `.light` / `.dark`: force a color scheme for a subtree.
- `data-font-<voice>="<face>"`: repoint a font voice (display, heading, body, ui, numeric, code) to a face (sans, serif, mono, display); `data-numeric` for tabular figures ([typography](typography.md)).
- `data-type="<role>"`: apply a type role.

## Preset

`preset.ts` merges the theme parameters, reset, scheme rules, geometry, defaults and FOUC guard per selector (`mergeGlobalCss`; a test fails if any rule is lost). Apps add `@pandacss/preset-base` and the ui-kit preset to their own Panda config. Panda 2 ships no utilities or breakpoints without preset-base and the kit's breakpoints.

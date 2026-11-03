# Theming

The inputs a theme sets (root parameters, saved themes, per-element attributes) and how the kit reaches an app: the Panda preset, its conditions and the Panda configs. What each parameter drives: [geometry](geometry.md), [typography](typography.md), [motion](motion.md); colors are Spectrum settings, not theme parameters ([color](color.md)).

## Theme parameters

Numbers the geometry and motion derive from (`tokens/themes/params.ts`; motion: [motion](motion.md#theme-inputs)), emitted as `--ui-<name>` on `:root`:

| Parameter | Range | Default |
|---|---|---|
| `unit` | 2–12 px (0.25 steps) | 4.5 |
| `border` | 0–2 px (whole) | 0 (surfaces separate by fill; invalid controls get a critical-tinted fill) |
| `radius-scale` | 0–3 | 1 |
| `corner-shape` | −1–4 (`superellipse(k)`: 1 round, 2 squircle, 0 bevel, <0 scoop) | 1 |
| `type-ratio` | 1–1.5 | 1.333 |
| `type-rhythm` | 0, 0.5, 1 (× u) | 1 |
| `motion-scale` | 0–2 (× every duration; 0 instant) | 1 |
| `motion-bounce` | 0–1 (× every spring's bounce: 0 critically damped, 1 as designed) | 1 |
| `spring-<spring>-duration` | 0.05–1.5 s (perceptual duration of `quick`, `smooth`, `snappy`, `bouncy`) | 0.2, 0.35, 0.3, 0.45 |
| `spring-<spring>-bounce` | 0–0.6 (0 critically damped) | 0, 0, 0.15, 0.3 |
| `intent-<intent>` | 0–3, whole (the spring `feedback`, `toggle`, `reveal`, `emphasis` runs: 0 quick, 1 smooth, 2 snappy, 3 bouncy) | 0, 2, 1, 3 |
| `pad-<level>`, `gap-<level>` | container padding and gap in u, 0.5 steps (composite padding 0–1.5, others 0–12) | composite 0.5, group 1, collection 2, card-xs 2, card-sm 3, card-md 4, card-lg 5, card-xl 6, panel 6, region 8, page 8 |

Saved themes live in `tokens/themes/themes.json` as overrides (`validateTheme` accepts only known parameters in range, plus `icons`), emitted as `:root[data-ui-theme="name"]`. Themes apply at the document root only, because tokens resolve where they are declared; scope anything else with an explicit element, as the jig does.

Every parameter is also a registry node (`parameter:<name>`) with its formula and what it drives in `contracts/parameters.json` ([system](system.md#the-system-as-a-function)).

## Per-element inputs

- `size` / `data-size`: u for a subtree (2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, then 0.5 steps to 12).
- `icon-size` / `data-icon-size`: sm, md, lg, fill.
- `gap`: container gap override in units of u (0–8, 0.5 steps), that element only.
- `.light` / `.dark`: force a color scheme for a subtree.
- `data-font-<voice>="<face>"`: repoint a font voice (display, heading, body, ui, numeric, code) to a face (sans, serif, mono, display); `data-numeric` for figures in the numeric voice, tabular lining when bare, with space-separated variants (`proportional`, `oldstyle`, `fraction`, …) and `data-position="super|sub"` ([typography](typography.md#numerals)).
- `data-type="<role>"`: apply a type role.

## Preset

`preset.ts` merges the theme parameters, reset, scheme rules, geometry, defaults, the container tag rules and FOUC guard per selector (`mergeGlobalCss`; a test fails if any rule is lost), and registers the component slot recipes (`theme.slotRecipes`) and the state conditions. An app that renders the web components sets `staticCss: { recipes: '*' }` and leaves class names unhashed ([components](components.md#styles)). Apps add `@pandacss/preset-base` and the ui-kit preset to their own Panda config. Panda 2 ships no utilities or breakpoints without preset-base and the kit's breakpoints.

Conditions: `osDark`, `dark`, `light` (schemes), plus the state conditions in `styles/conditions.ts`: `keyboard` (keyboard modality) and one condition per data-* state attribute (Base UI names: `checked`, `unchecked`, `indeterminate`, `disabled`, `enabled`, `readOnly`, `required`, `invalid`, `valid`, `dirty`, `touched`, `filled`, `focused`, `busy`, `pressed`, `popupOpen`, `open`, `closed`, `highlighted`, `selected`, `dragging`, `complete`, `progressing`). Both renderers set the same attributes on the same hosts ([state attributes](components.md#state-attributes)), so one `css()` or recipe rule serves both; Panda's built-in clauses for these names (`:checked`, `[aria-checked]`, …) are replaced. Only `disabled` / `enabled` keep a native clause (`:disabled`, for a control disabled by a `<fieldset>`); `enabled` also excludes `data-busy`. `contracts/tokens.json` lists them; a test fails when a condition is uncovered.

A theme scope below the root (the jig canvas) that sets `--ui-unit`, a ladder parameter or a motion parameter also redeclares the dependent Panda tokens there: `unitTokenCss()` ([geometry](geometry.md#panda-tokens-in-u)) and `motionTokenCss()` ([motion](motion.md#theme-inputs)).

## Panda configs

The kit (`packages/ui-kit/panda.config.ts`) and the studio (`apps/studio/panda.config.ts`) set `strictTokens` and `strictPropertyValues`: a value that is not a token is a type error, and a deliberate one-off uses Panda's escape hatch (`'[80rem]'`), which keeps exceptions visible and greppable. Class names are not hashed: the web components put the kit's recipe class names on their parts, so an app that renders them uses `hash: false` and `staticCss: { recipes: '*' }`. Token variables stay readable because the kit and the jig set them by name.

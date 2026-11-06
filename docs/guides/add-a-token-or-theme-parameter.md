# Add a token or theme parameter

Steps for a new theme parameter, a new Panda token, or a new color default. What the existing ones mean: [theming](../specs/theming.md), [geometry](../specs/geometry.md), [typography](../specs/typography.md), [motion](../specs/motion.md), [color](../specs/color.md). Paths are under `packages/ui-kit`; commands run from the repository root.

## A theme parameter (`--ui-<name>`)

1. Add it to `PARAMS` in `tokens/themes/params.ts` with label, range, step and default. It is emitted as `--ui-<name>` on `:root`, becomes a `parameters` entry of the [theme object](../specs/theming.md#theme-object) (validated by `validateThemeObject`), and appears in the jig's Copy when it differs from the default.
2. Put it in a parameter group of `contracts/parameters.json` (its `concept`, `formula`, `drives`); a test fails until every `PARAMS` key is listed once.
3. Use it: in a resolver and its CSS twin together (`tokens/geometry/resolve.ts` with `styles/geometry.ts`, `tokens/typography/resolve.ts` with `styles/typography.ts`), or in a token (`tokens/motion/index.ts`, `tokens/elevation/index.ts`). Tokens that read it are declared on `:root`; if the jig canvas or a subtree must re-resolve them, they go through `unitTokenVars()`, `motionTokenVars()` or `elevationTokenVars()` ([authoring](../specs/authoring.md#traps)).
4. Add a row to the panel in `apps/studio/src/studio/App.tsx` (a `Range`, `Segmented` or `Select` bound to `params`; motion parameters go in `studio/MotionPanel.tsx`). Copy, Load, Reset and the lint follow `params` already.
5. If a combination with other inputs can break the design, add a rule to `contracts/theme-constraints.json` and its predicate to `tokens/themes/lint.ts` (a failing and a passing fixture; warnings or info only, [decision 0010](../decisions/0010-lint-advisory.md)).
6. Regenerate `contracts/theme.schema.json` (`npm run theme:schema -w @massimo/ui-kit`) and document it in the parameter table of [theming](../specs/theming.md#theme-parameters) and in the spec of the area it drives.

## A theme field outside PARAMS (`color.*`, `typography.*`)

Settings that are not one number (a role mapping, a font stack, a neutral step, a per-role text color) live in a section of the theme object. Each one is wired in eight places; `test/themes.test.ts` (`every theme field is wired`) fails while one is missing:

1. The `Theme` interface and `validateThemeObject` in `tokens/themes/theme.ts` (reject unknown keys and bad values with a `path: problem` message).
2. `themeJsonSchema()` in the same file, then `npm run theme:schema`.
3. `themeVars` or `themeColorVars` in `tokens/themes/index.ts`, so a saved theme emits it.
4. The runtime path when the jig previews it without a rebuild (for colors, `spectrumCSS` / `endpointVars`).
5. The jig: state in `App.tsx`, its menu, `themeObject()` (Copy), `applyTheme()` (Load), `reset`, and the lint effect's dependencies.
6. The lint, when the field can break contrast or legibility.
7. `contracts/parameters.json` when it is a new input (a group with its concept).
8. The docs: [theming](../specs/theming.md#theme-object) and the owning spec.

## A Panda token

1. Add it in the area module (`tokens/geometry/index.ts`, `tokens/typography/index.ts`, `tokens/motion/index.ts`, `tokens/colors/index.ts`); `tokens/index.ts` assembles them. Lengths are in u (`calc(n * var(--ui-unit) * 1px)`), never fixed px or rem.
2. Cover it in `contracts/tokens.json`: a new category or group needs a `panda` path in some entry, or the token contract test fails.
3. A token that should travel to other tools goes into the DTCG export (`scripts/tokens-dtcg.ts`).

## A color default

Change the default color settings (`SPECTRUM_FIELDS` in `tokens/colors/spectrum/config.ts`) or roles (`DEFAULT_ROLES` in `tokens/colors/spectrum/index.ts`); never edit `defaults.json` or the vendored `runtime.json`.

## Regenerate and check

```sh
npm run geometry:csv -w @massimo/ui-kit      # geometry or type changed
npm run spectrum:defaults -w @massimo/ui-kit # color defaults changed
npm run tokens:dtcg -w @massimo/ui-kit       # any token changed
npm run ui-kit:test && npm run ui-kit:typecheck && npm run typecheck -w @massimo/studio && npm run ui-kit:build
```

Then `npm run studio` and open `/geometry-check.html`: `"fails": []` means the CSS matches the resolver. If a verification record binds a file you changed, `npm run verification -w @massimo/ui-kit -- run --all` restamps it after the checks pass.

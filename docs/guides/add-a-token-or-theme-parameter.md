# Add a token or theme parameter

Steps for a new theme parameter, a new Panda token, or a new color default. What the existing ones mean: [theming](../specs/theming.md), [geometry](../specs/geometry.md), [typography](../specs/typography.md), [motion](../specs/motion.md), [color](../specs/color.md). Paths are under `packages/ui-kit`; commands run from the repository root.

## A theme parameter (`--ui-<name>`)

1. Add it to `PARAMS` in `tokens/themes/params.ts` with label, range, step and default. It is emitted as `--ui-<name>` on `:root`, accepted by `validateTheme` and `themes.json`, and appears in the jig's Copy JSON when it differs from the default.
2. Use it: in a resolver and its CSS twin together (`tokens/geometry/resolve.ts` with `styles/geometry.ts`, or `tokens/typography/resolve.ts` with `styles/typography.ts`), or in a token (`tokens/motion/index.ts`). Tokens that read it are declared on `:root`; if the jig canvas or a `[size]` subtree must re-resolve them, they go through `unitTokenVars()` or `motionTokenVars()`.
3. Add a row to the panel in `apps/studio/src/studio/App.tsx` (a `Range` or `Select` bound to `params`; motion parameters go in `studio/MotionPanel.tsx`).
4. Document it in the parameter table of [theming](../specs/theming.md#theme-parameters) and in the spec of the area it drives.

## A Panda token

1. Add it in the area module (`tokens/geometry/index.ts`, `tokens/typography/index.ts`, `tokens/motion/index.ts`, `tokens/colors/index.ts`); `tokens/index.ts` assembles them. Lengths are in u (`calc(n * var(--ui-unit) * 1px)`), never fixed px or rem.
2. Cover it in `contracts/tokens.json`: a new category or group needs a `panda` path in some entry, or the token contract test fails.
3. A token that should travel to other tools goes into the DTCG export (`scripts/tokens-dtcg.ts`).

## A color default

Change the default Spectrum settings (`SPECTRUM_FIELDS` in `tokens/colors/spectrum/config.ts`) or roles (`DEFAULT_ROLES` in `tokens/colors/spectrum/index.ts`); never edit `defaults.json` or the vendored `runtime.json`.

## Regenerate and check

```sh
npm run geometry:csv -w @massimo/ui-kit      # geometry or type changed
npm run spectrum:defaults -w @massimo/ui-kit # color defaults changed
npm run tokens:dtcg -w @massimo/ui-kit       # any token changed
npm run ui-kit:test && npm run ui-kit:typecheck && npm run typecheck -w @massimo/studio && npm run ui-kit:build
```

Then `npm run studio` and open `/geometry-check.html`: `"fails": []` means the CSS matches the resolver. If a verification record binds a file you changed, `npm run verification -w @massimo/ui-kit -- run --all` restamps it after the checks pass.

# Authoring a component

How to add or change a reusable ui-kit component. Assembling a screen from existing components does not need this; use the [registry](registry.md) to choose and the guides to build.

## Before the first edit

1. Find what exists: `npm run registry -- --find <term>`, then `--assembly component:<id>`. Reuse an implemented component when its intent fits; check `avoidWhen` before adding a new one.
2. Name four things separately: the user intent, the semantic component, the geometry family (`contracts/geometry-families.json`) and the parent context (`contracts/composition.json`). Example: enter a price → `ui-input` → `field` → inside a `form` in a `card`.
3. Request the author packet: `npm run registry -- --packet author web-component component:<id> --out <file>`. Read the guide, contract, manifest, module, geometry family and verification record it delivers.
4. Define the minimal properties, attributes, events, accessible name and keyboard behavior before writing code. Prefer an existing part and the construction pattern over new anatomy.

## Rules

- Light DOM, no native form elements. Form participation goes through `UIFormElement` (one form owner per value).
- Typed properties use `declare`; avoid names that collide with built-in element properties (`role`, `prefix`, `ariaChecked`, …).
- Labelled components use the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` (`components/slots.ts`, `resolveTextRun`). Icons go in leading/trailing; short text adornments in prefix/suffix.
- Every length comes from the geometry system: change `tokens/geometry/resolve.ts` and `styles/geometry.ts` together, then regenerate `docs/geometry.csv` and `tokens/dtcg/`.
- Colors are Spectrum roles; type is a role (`textStyle`); motion uses the intents `durations.<intent>` with `easings.<intent>` (feedback, toggle, reveal, emphasis).
- Styles live in the folder's slot recipe (`<name>.recipe.ts`, registered in `components/recipes.ts`), never in element modules; the element and the React renderer only apply the generated classes. The recipe's slots are `root` plus the parts its contract owns (`test/recipes.test.ts`). A selector key appears once per style object: JavaScript keeps the last of two equal keys, so compose recipe objects with `mergeStyles` (`recipe-parts.ts`), not spreads. Continuous values reach CSS only as custom properties set by script; finite choices are attributes mapped to recipe variants.
- States are keyed on ARIA or `data-*` and styled in the recipe with the conditions of `styles/conditions.ts`, which match both renderers; add new ones to `contracts/states.json`.

## Change together

A component change is complete when these agree:

| What | Where |
|---|---|
| Behavior | `components/<name>/<name>.element.ts`, shared logic in `dom/` |
| Geometry | `tokens/geometry/resolve.ts`, `styles/geometry.ts`, `contracts/geometry-families.json` |
| Look, states and motion | `components/<name>/<name>.recipe.ts`, `components/recipe-parts.ts`, `styles/conditions.ts`, `contracts/states.json` |
| Semantic contract | `contracts/components.json` (family, parts, parents, behavior) |
| Manifest | `components/<name>/<name>.manifest.json` (see [manifest language](manifest-language.md)); the fields mirrored from source are rewritten by `npm run manifests` ([generated fields](registry.md#generated-manifest-fields)), never by hand |
| Guide and examples | `<name>.md`, `<name>.examples.json` |
| Renderers | `<name>.react.tsx` when one exists; its status in the manifest |
| Specs | `docs/specs/components.md`, `geometry.md` when behavior or lengths change |
| Jig | a specimen on `apps/studio/src/canvas/Canvas.tsx`; a check in `apps/studio/geometry-check.html` for new lengths |

A new component also needs: `define('ui-<tag>', …)` in its module, a `package.json` export (`./components/<name>/element`), the tag in `GEOMETRY_SCOPE` (`styles/geometry.ts`), JSX types in `apps/studio/src/canvas/jsx.d.ts`, a manifest folder and a verification record.

## Verify

1. `npm run manifests` (rewrites the manifest fields mirrored from source: properties, class, form association, dispatched events, contract edges, React props; then write any new property's description or inspector and a new event's `trigger`), then `npm run registry:graph` (rewrites `graph.json`).
2. `npm run verification -- run <name>`: runs the record's checks and stamps the bound source hashes only when every check runs at least one test and passes. Never edit hashes by hand; add a check when the change has a risk no existing test covers.
3. `npm run ui-kit:test`, `npm run ui-kit:typecheck`, `npm run typecheck -w @massimo/studio`, `npm run ui-kit:build`.
4. After geometry changes: `npm run geometry:csv -w @massimo/ui-kit`, `npm run tokens:dtcg -w @massimo/ui-kit`, then open `/geometry-check.html` in the running studio; `"fails": []` means the CSS matches the resolver.
5. Look at the specimen in the jig in light and dark. Numeric checks do not certify visual quality or accessibility; say which checks ran and which did not.

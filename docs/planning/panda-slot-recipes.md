---
status: accepted
owner: kim
date: 2026-11-02
---

# Component styles as Panda slot recipes

Proposal to move ui-kit component styles from global, selector-based rules (plus generated React twins) to Panda slot recipes that the web components and the React renderers both apply. Accepted and built for every component except the layout containers (see Progress); the current state is specified in [components](../specs/components.md#styles).

## Why

Today every component style is a global rule keyed on tags and attributes (`styles/geometry.ts`, `styles/defaults.ts`, `styles/motion.ts`), merged into one stylesheet (`dist/ui-kit.css`, 137 KB). React renderers are supported by generating a twin of every rule for their `data-ui` hosts (`styles/native.ts`), so about 500 selectors exist twice. This works and is well tested (unit tests, `geometry-check.html`, `react-check.html`), but it does not use Panda for what it is designed for:

- **No tree-shaking.** Consumers load every component's CSS.
- **Doubled selectors.** React support duplicates rules instead of sharing one contract.
- **Fragile ordering.** Correctness depends on specificity and `:where()`; this session's duplicate-key and override bugs came from that (a test now guards duplicate keys).
- **Hand-written variants.** `variant="primary"` is an attribute selector, not a declared variant with types.
- **No typed contract.** Nothing tells a consumer which parts, variants and states a component has, except our manifests.

## Target

Each component gets a Panda **config slot recipe** in the preset (`theme.slotRecipes`): one class per part (`root`, `leading`, `prefix`, `contents`, `suffix`, `trailing`, plus component parts such as `trigger`, `popup`, `track`, `thumb`), declared `variants` (`variant: { neutral, primary }`, later `size`) and states written with Panda conditions.

- **States keep one selector for both renderers.** Panda's built-in conditions already match ARIA and native forms together, e.g. `_disabled` is `:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])`, `_selected` is `:is([aria-selected=true], [data-selected])`, `_pressed`, `_invalid`, `_focusVisible`. Custom conditions cover the rest in the preset: `_checked: '&:is([aria-checked=true], :has(> input:checked))'`, `_mixed`, `_expanded`, `_open`, `_busy`, `_keyboard` (`:root[data-modality=keyboard] &`). The twin generator (`styles/native.ts`) is deleted.
- **Web components** add the recipe classes to their host and parts when they render (`template()` and the slot sorter already create every part) and update variant classes from attributes in `update()`. Class names come from the generated recipe function in `styled-system/recipes`, so there is no runtime CSS: only class names. Tag selectors stay valid for authors (`ui-button` still works), but the kit no longer styles through them.
- **React renderers** call the same recipe (`button({ variant })`) and spread the part classes. `data-ui` stays as an identity hook, not a styling hook.
- **Geometry stays a foundation.** The per-element variables (`--u`, `--h`, `--pad`, `--slot`, `--icon`, `--radius`, the text-run rule) remain global `:where()` foundations in `styles/geometry.ts`, because they are inputs the recipes consume, inherited per subtree by `size`. Recipes use the variables, never literal lengths. Resolvers, the CSV, DTCG and `geometry-check.html` are unchanged.
- **Motion and forced colors** move into each recipe (`transition` per part; `@media (forced-colors: active)` inside the recipe), so a component's CSS is complete in one place.
- **Delivery.** `staticCss: { recipes: '*' }` in the kit build emits every variant (web components choose variants at runtime, so extraction cannot see them). Apps using the preset get per-recipe CSS through Panda's normal pipeline; `dist/ui-kit.css` stays as the all-in-one file for plain HTML and web-component users. Per-component CSS files (`dist/components/<name>.css`) can be emitted from the same recipes for consumers who load only what they use.

## What changes for each piece

| Piece | Today | After |
|---|---|---|
| Component styles | global rules in `defaults.ts` / `geometry.ts` / `motion.ts` | one slot recipe per component folder (`components/<name>/<name>.recipe.ts`), registered in the preset |
| React support | generated twins (`styles/native.ts`) | same recipe classes; twins deleted |
| Variants | attribute selectors (`[variant=primary]`) | recipe `variants`; attribute maps to the variant class in the element |
| States | ARIA selectors per rule | Panda conditions shared by both renderers |
| Geometry | global variables + per-component rules | global variables only (foundation); per-part lengths in recipes via variables |
| Manifests | `styleSource: panda-global` | `styleSource: { format: 'panda-slot-recipe', module: './<name>.recipe.ts' }`; parts list = recipe slots |
| Checks | geometry-check, react-check, unit tests | unchanged and must stay green at every step; plus a test that each manifest's parts equal its recipe's slots |

## Migration steps

Each step is one component folder, shipped alone with all checks green. Order from simplest to most coupled:

1. **Foundation.** (done) Add custom conditions to the preset (done: `styles/conditions.ts`, `_keyboard`, `_checked`, `_indeterminate`, `_disabled`, `_busy`, `_userInvalid`, each matching the ARIA host and the native-child form); add the recipe registry; keep `geometry.ts` variables; add the manifest-to-recipe test. No visual change.
2. (done) **badge / tag / chip** (`btg`): first slot recipe with parts and the `selected` state; web component adds classes; React uses the recipe; remove their global rules and twins.
3. (done) **button**: `variant` (neutral, primary), busy, the construction pattern parts.
4. (done) **choice** (checkbox, radio, switch), **range / progress**, **color** (swatch, palette).
5. (done) **listbox / segmented / option**, then **input**, then **select** (trigger, popup, anchor positioning, the native-select twin).
6. (done, containers deferred) **swiper, image, containers.**
7. (done, with the deviations below) **Cleanup.** Delete `styles/native.ts` and the component sections of `defaults.ts`; per-component CSS output; update specs (`components.md`, `registry.md`, `authoring.md`).

Verification per step: unit tests, `geometry-check.html` (`fails: []`), `react-check.html` (`fails: []`), a light and dark screenshot of the component's jig section, and a size check of `dist/ui-kit.css` (expected to shrink as twins disappear).

## Progress

| Step | Commit | Notes |
|---|---|---|
| 2 badge, tag, chip | `0e8b56c` | recipe registry (`components/recipes.ts`), `components/classes.ts`, `_enabled` condition, schema `panda-slot-recipe`, `test/recipes.test.ts` (parts = slots) |
| 3 button | `08c59e8` | `variant` property and recipe variant; html renderer selectors are recipe classes |
| 4 choice, range/progress, color | `714cc66` | construction pattern written once per recipe (`constructionPattern`), -12 KB |
| 5 listbox/segmented/option, input, select | `195d497` | native select states and `::picker(select)` from the root; `mergeStyles` |
| 6 swiper, image | `667b759` | `styles/motion.ts` deleted; containers deferred |
| 7 cleanup | this commit | specs, split CSS output (`dist/split/`) |

Deviations:

- **Layout containers are not migrated.** They are being redesigned on another branch (area / container / wrapper families), so `ui-group` … `ui-page`, their rules in `styles/defaults.ts`, and the container and composite sections of `styles/geometry.ts` are untouched.
- **`styles/native.ts` stays**, reduced to the twin generator for those remaining global rules (containers, and the composite geometry of listbox, segmented, option and the select popup). All its native plumbing moved into recipes.
- **Size.** `dist/ui-kit.css` went from 174 KB (before step 2) to 191 KB, not smaller: each recipe carries its own copy of the shared patterns (construction pattern, field control, forced colors), where the global rules shared one selector list; about 88 KB of it is tokens. Consumers who load per component use `dist/split/styles/recipes/<name>.css`.
- **Studio class names are no longer hashed** in production: web components apply the kit's (unhashed) recipe class names, so a consuming build must emit the same names.
- **Behavior fixes found by computed-style parity** (a dump of every element's computed style before and after each step): web-component badge/tag/chip icons now size to `--icon` like the resolver and React (a specificity tie with `i[name]` kept them at 1em); a disabled swiper paddle with hover-controls stays hidden until hover in the web component too.

Open question 1 is answered: classes are the styling contract (tags remain identity and FOUC hooks). Question 2: the split output exists; whether to publish it is open. Question 3: `size` stays an inherited input.

## Risks

- **Specificity shifts.** Single-class recipe selectors are weaker than today's `tag[attr]` rules; author overrides that relied on tag selectors could start winning or losing. Mitigation: recipes in a dedicated `@layer recipes` (Panda's default), foundations in `base`, author CSS unlayered wins predictably.
- **Web components without classes.** Markup written by hand without running the element script (the FOUC window) has no classes until upgrade. The pending styles (`styles/pending.ts`) already hide undefined elements; keep them tag-based.
- **Variant explosion in `staticCss`.** Emitting every variant for every recipe grows the all-in-one file; limit to declared variants (no compound matrices).
- **Effort.** Roughly one component folder per working session, with parity checks as the safety net.

## Open questions

1. Keep tag selectors as a supported author API (styled by recipes through `ui-x` → class mapping), or document classes as the only styling contract?
2. Per-component CSS files in `dist/`: needed now, or only the all-in-one file and the preset?
3. Move `size` (u) from the inherited `size`/`data-size` attribute to a recipe variant, or keep it as the subtree input it is today? (Recommendation: keep it an input; recipes read `--u`.)

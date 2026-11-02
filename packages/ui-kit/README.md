# @massimo/ui-kit

Light-DOM web components and React components built on one headless layer and one PandaCSS preset.

| Folder | Holds | May import |
|---|---|---|
| `core/` | `signal`/`computed`/`effect`, `html`/`render`/`repeat`, `UIElement`, `UIFormElement`, `define` | nothing |
| `dom/` | Headless behaviors: functions that return attribute maps and handle events (`buttonAttrs`, `fieldAttrs`, …) | nothing |
| `icons/` | Theme-aware `<i name>` runtime, built-in CDN sets, `moduleSet` for bundled sets, SVG sanitizer | `tokens` |
| `tokens/` | Global tokens in Panda format: `colors/`, `typography/`, `geometry/`, `motion/` | `@pandacss/dev` |
| `styles/` | Reset, text styles, `pages/` patterns (`page`, `prose`) | `@pandacss/dev` |
| `components/<name>/` | `<name>.element.ts` (web component), `<name>.react.tsx` (React, where present) | `core`, `dom` |
| `preset.ts` | The Panda preset: tokens + reset + component defaults + FOUC guard | all of the above |

Components carry no styles of their own yet. `styles/defaults.ts` is one boilerplate stylesheet keyed on tags, `[data-ui]`/`[data-part]` hooks and ARIA state, shared by the web components and their React counterparts. Components: `ui-button`, `ui-input`, `ui-select`, `ui-listbox`, `ui-segmented` (a horizontal listbox), `ui-option`, `ui-badge`, `ui-tag`, `ui-chip`, `ui-checkbox`, `ui-radio`, `ui-switch`, `ui-range`, `ui-progress`, `ui-swatch`, `ui-palette`, `ui-swiper`, `ui-image`, and CSS-only containers `ui-group`, `ui-collection`, `ui-tile`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`.

## Colors: Spectrum by default

The kit's colors are the default Spectrum: HCT-generated, Radix-style 12-step ramps with separate light and dark values (engine ported from massimo-ui, provenance in `tokens/colors/spectrum/NOTICE.md`).

- Tokens: `colors.spectrum.{family}.{0..12}` for every family (step 0 is the page canvas, halfway from step 1 toward white/black). CSS: `--colors-spectrum-indigo-9`.
- Roles alias ramp steps with Radix semantics (neutral 0 canvas, 2–3 backgrounds, 6–7 borders, 11–12 text; primary 9–10 solids, 3 subtle, 11 text, 8 focus; critical 9–11). Defaults: primary indigo, neutral neutral, critical crimson.
- The values come from a generated snapshot, `tokens/colors/spectrum/defaults.json` (`npm run spectrum:defaults`; a test fails when it is stale), so builds never run the engine.
- Other settings at runtime: `generateSpectrum(settings)` (~300ms) and `spectrumCSS(data, resolveRoles(data, roles))` from `@massimo/ui-kit/spectrum` emit the same variable names; place the CSS after the kit stylesheet.

## Color scheme

Dark is automatic when the host prefers it (`prefers-color-scheme: dark`), with no script needed. Add `class="dark"` or `class="light"` to `<html>` or any element to force a scheme for that subtree.

## Icons

```html
<script type="module">import '@massimo/ui-kit/icons';</script>
<i name="caret-right"></i>
<ui-button><i slot="leading" name="plus"></i>Add</ui-button>
```

System glyphs (plus, minus, x, check, caret-*, arrow-*, dots-three, magnifying-glass) always render from Phosphor on the CDN, whatever the theme's set, so controls look the same across themes; `data-icons` on the icon itself overrides. Names are Phosphor's; other sets translate them through aliases (`caret-down` → Lucide/Tabler `chevron-down`). The set comes from the nearest `data-icons` attribute, else the active theme's `icons` value (`<html data-ui-theme>`), else `phosphor`. Built-ins load on demand from jsDelivr at pinned versions: `phosphor`, `lucide`, `tabler`. Bundle a set as a dependency instead with `registerIconSet('phosphor', moduleSet(import.meta.glob('…/*.svg', { query: '?raw', import: 'default' })))`. Fetched SVG is sanitized (drawing elements and presentation attributes only) before it touches the DOM. Icons are decorative (`aria-hidden`) unless given an `aria-label`.

## Geometry

Heights, insets, gaps, borders and radii follow one system: see [docs/geometry.md](docs/geometry.md). Use `size` (u in px, 2 to 12) or `data-size` on any element, and `gap` on a container to change its gap.

## Commands

```sh
npm run build      # panda codegen + dist/ui-kit.css
npm test           # node:test + happy-dom (Node 23+ runs the .ts directly)
npm run typecheck
```

`styled-system/` and `dist/` are generated; `npm install` runs codegen.

## Using it

```js
// Web components
import '@massimo/ui-kit/css';
import '@massimo/ui-kit/components/button/element';
// <ui-button variant="outline">Save</ui-button>

// React
import { Button } from '@massimo/ui-kit/components/button/react';

// An app's own Panda config, styled with the same tokens
import { uiKitPreset } from '@massimo/ui-kit/preset';
export default defineConfig({ presets: ['@pandacss/preset-base', uiKitPreset] });
```

## Adding a component

1. `dom/<name>.ts`: state in, attribute maps out, plus event helpers. No DOM writes.
2. Default styles: add tag/`data-part` rules to `styles/defaults.ts` and the tag to `styles/pending.ts`.
3. `<name>.element.ts`: extend `UIElement` (or `UIFormElement` for anything that submits or validates); no native form elements; use `declare` for typed props, never class fields (they shadow the reactive accessor).
4. `<name>.react.tsx`: spread `toReactProps(...)` from the same `dom/` function.
5. `npm run codegen`, then add a test in `test/`.

## Web components contain zero native form elements

No `input`, `button`, `select`, `textarea`, `label`, `fieldset`, `option` or `output` inside a `ui-*` element (tests enforce it). Instead:

- **`UIFormElement`** (`core/form-element.ts`) makes the host form-associated: `name`, `value` via `formValue()`, validity via `validate()`, `form`, `labels`, `checkValidity()`/`reportValidity()`/`setCustomValidity()`, reset/restore, and disabled by an ancestor `<fieldset>` (`isDisabled`).
- **Errors wait for the user.** Built-in validation is tracked from the start, but `aria-invalid` and the message only appear after blur or a blocked submit (`userInvalid`, `data-user-invalid` on the host). An author-supplied `error` shows immediately. Recipes key on `[aria-invalid=true]`, never native `:invalid`.
- **`<ui-input>`** is a `contenteditable="plaintext-only"` `role="textbox"`, labelled by a span via `aria-labelledby`. Enter submits the form, pasted newlines become spaces, `type="password"` masks with `-webkit-text-security` and blocks copy/cut, `type` also sets `inputmode`/spellcheck.
- **`<ui-button>`** is the host itself (`role="button"`), submitting or resetting its form through `ElementInternals`.

Known trade-offs of contenteditable fields: browser autofill and password managers don't recognise them, and there is no `maxlength` typing limit (validate instead).

## No flash of unstyled content

Undefined `ui-*` elements are `visibility: hidden` with their final size reserved (`styles/pending.ts`), so nothing jumps when they upgrade. If the script never loads, a 1.5s animation reveals the raw content instead of hiding it forever. New components: add the tag and its reserved size to `styles/pending.ts`.

## Notes

- Panda 2 needs `@pandacss/preset-base` installed and listed in `presets`; without it utilities such as `bg` are emitted verbatim.
- Template bindings: `.prop`, `@event`, `?bool`, `attr`. Attribute names are lowercased by the parser, so camelCase properties use kebab-case: `.tab-index=${0}`.

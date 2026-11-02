# @massimo/ui-kit

Light-DOM web components and native React renderers on one headless layer and one PandaCSS preset. The specs own the details: start at [system](../../docs/specs/system.md); find a component with the registry (`npm run registry -- --find <term>`, [registry](../../docs/specs/registry.md)).

## Using it

```js
// Web components
import '@massimo/ui-kit/css';
import '@massimo/ui-kit/icons';                       // fills <i name="…">
import '@massimo/ui-kit/components/button/element';   // registers ui-button
// <ui-button variant="primary">Save</ui-button>

// React (native HTML, same anatomy and styles)
import { Button } from '@massimo/ui-kit/components/button/react';

// An app's own Panda config, styled with the same tokens
import { uiKitPreset } from '@massimo/ui-kit/preset';
export default defineConfig({ presets: ['@pandacss/preset-base', uiKitPreset], strictTokens: true });
```

Panda 2 needs `@pandacss/preset-base` listed in `presets`; without it utilities such as `bg` are emitted verbatim ([theming](../../docs/specs/theming.md#preset)).

Other entry points (`package.json` `exports`): `./core`, `./dom`, `./tokens`, `./styles`, `./spectrum` (runtime color generation), `./dtcg/*` (DTCG token files), and `./components/<folder>/element` and `/react`.

## Layout

| Folder | Holds | Spec |
|---|---|---|
| `core/` | signals, `html`/`render`/`repeat`, `UIElement`, `UIFormElement`, input modality | [components](../../docs/specs/components.md) |
| `dom/` | headless behaviors: attribute maps and event helpers shared by both renderers | [components](../../docs/specs/components.md) |
| `components/<folder>/` | element, React renderer, manifest, guide, examples, verification record | [registry](../../docs/specs/registry.md) |
| `contracts/` | schemas and shared contracts (components, parts, composition, states, tokens) | [registry](../../docs/specs/registry.md) |
| `tokens/` | geometry and type resolvers, Spectrum colors, springs, theme parameters, Panda tokens, DTCG output | [geometry](../../docs/specs/geometry.md), [color](../../docs/specs/color.md), [typography](../../docs/specs/typography.md), [motion](../../docs/specs/motion.md), [theming](../../docs/specs/theming.md) |
| `icons/` | `<i name>` runtime, CDN sets, `moduleSet`, SVG sanitizer | [icons](../../docs/specs/icons.md) |
| `styles/` | the Panda global style modules, state conditions, page patterns (`page`, `prose`) | [components](../../docs/specs/components.md) |
| `preset.ts` | the Panda preset assembling all of the above | [theming](../../docs/specs/theming.md) |
| `scripts/` | generators, the registry CLI, verification | [system](../../docs/specs/system.md#generated-outputs) |

## Commands

```sh
npm test               # node:test + happy-dom, staleness and contract checks
npm run typecheck
npm run build          # panda codegen + dist/ui-kit.css
npm run registry -- --start
npm run manifests      # rewrite manifest fields mirrored from source
npm run verification -- run <folder…|--all>
```

Generators and their outputs: [system](../../docs/specs/system.md#generated-outputs). `styled-system/` and `dist/` are generated and not committed; `npm install` runs codegen.

Adding or changing a component: [authoring](../../docs/specs/authoring.md) and the [component guide](../../docs/guides/change-a-component.md).

## Known trade-offs

`<ui-input>` is a contenteditable `role=textbox`, not a native input: browser autofill and password managers do not recognise it, and there is no `maxlength` typing limit (validate instead). Template bindings: `.prop`, `@event`, `?bool`, `attr`; attribute names are lowercased by the parser, so camelCase properties use kebab-case (`.tab-index=${0}`).

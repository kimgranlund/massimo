# @massimo/ui-kit

Light-DOM web components and React components built on one headless layer and one PandaCSS preset.

| Folder | Holds | May import |
|---|---|---|
| `core/` | `signal`/`computed`/`effect`, `html`/`render`/`repeat`, `UIElement`, `define` | nothing |
| `dom/` | Headless behaviors: functions that return attribute maps and handle events (`buttonAttrs`, `fieldAttrs`, …) | nothing |
| `tokens/` | Global tokens in Panda format: `colors/`, `typography/`, `geometry/`, `motion/` | `@pandacss/dev` |
| `styles/` | Reset, text styles, `pages/` patterns (`page`, `prose`) | `@pandacss/dev` |
| `components/<name>/` | `<name>.recipe.ts`, `<name>.element.ts` (web component), `<name>.react.tsx` (React) | `core`, `dom`, `styled-system` |
| `preset.ts` | The Panda preset: tokens + styles + every recipe | all of the above |

A component's two views share state logic (`dom/`) and class names (its recipe), so `<ui-button variant="ghost">` and `<Button variant="ghost">` render identical classes and ARIA.

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
2. `components/<name>/<name>.recipe.ts`: `defineRecipe`/`defineSlotRecipe`; register it in `preset.ts`.
3. `<name>.element.ts`: extend `UIElement`; use `declare` for typed props, never class fields (they shadow the reactive accessor).
4. `<name>.react.tsx`: spread `toReactProps(...)` from the same `dom/` function.
5. `npm run codegen`, then add a test in `test/`.

## Notes

- Panda 2 needs `@pandacss/preset-base` installed and listed in `presets`; without it utilities such as `bg` are emitted verbatim.
- `staticCss: { recipes: '*' }` emits every variant because web components pick classes at runtime.
- Template bindings: `.prop`, `@event`, `?bool`, `attr`. Attribute names are lowercased by the parser, so camelCase properties use kebab-case: `.tab-index=${0}`.

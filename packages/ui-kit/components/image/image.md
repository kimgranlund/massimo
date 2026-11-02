# Image

`ui-image`. API, defaults and avoidance guidance: [image.manifest.json](image.manifest.json) (`npm run registry -- component:image`). Examples: [image.examples.json](image.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-image`: show an image in a fixed frame; show several images as a slideshow.

## Usage

```html
<ui-image src="/a.jpg" alt="Harbour at dusk" ratio="wide"></ui-image>
<ui-image ratio="square"><picture><source srcset="/a.avif" type="image/avif"><img src="/a.jpg" alt="Harbour"></picture></ui-image>
<ui-image slideshow alt="Products"><img src="/1.jpg" alt="One"><img src="/2.jpg" alt="Two"></ui-image>
```

## Anatomy

- `part:image-slide` `:scope > ui-swiper [data-part=slide]`: With slideshow: each authored child wrapped as a slide of the inline swiper.

## Geometry and appearance

Geometry families: `container` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [image.recipe.ts](image.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./image.element.ts`)

Checks and their latest run: [verification/image.verification.json](verification/image.verification.json).

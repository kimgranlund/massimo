# Swiper

`ui-swiper`. API, defaults and avoidance guidance: [swiper.manifest.json](swiper.manifest.json) (`npm run registry -- component:swiper`). Examples: [swiper.examples.json](swiper.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-swiper`: browse a row of slides one at a time.

## Usage

```html
<ui-swiper label="Highlights" hover-controls><div>One</div><div>Two</div></ui-swiper>
```

Slides scroll natively (momentum, touch, trackpad, arrow keys in the focused viewport); script only adds paddles and dots and tracks the active slide.

## Anatomy

- `part:swiper-viewport` `:scope > [data-part=viewport]`: The scroll-snap viewport (tabindex 0) holding the slides; native momentum, touch and arrow-key scrolling.
- `part:swiper-paddle` `:scope > [data-part=paddle]`: Previous / next ui-button with a caret icon (data-dir=prev|next); disabled at the ends.
- `part:swiper-dots` `:scope > [data-part=dots]`: The dot row.
- `part:swiper-dot` `:scope > [data-part=dots] > [data-part=dot]`: One dot per slide (role=button, aria-current on the active one); stretches when active.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-swiper` | arrow keys in the viewport | native scroll |
| `ui-swiper` | Enter, Space on a dot | go to that slide |

## Geometry and appearance

Geometry families: `swiper` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [swiper.recipe.ts](swiper.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./swiper.element.ts`)

Checks and their latest run: [verification/swiper.verification.json](verification/swiper.verification.json).

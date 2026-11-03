# Preview card

`ui-preview-card` (React `PreviewCard`). API, defaults and avoidance guidance: [preview-card.manifest.json](preview-card.manifest.json) (`npm run registry -- component:preview-card`). Examples: [preview-card.examples.json](preview-card.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Preview Card](https://base-ui.com/react/components/preview-card).

## Intent

- `ui-preview-card`: preview where a link goes (a profile, a page, a document) while the pointer rests on the link or it has keyboard focus.

## Usage

```html
<div>Written by
  <ui-preview-card>
    <a href="/people/ada">Ada Lovelace</a>
    <strong>Ada Lovelace</strong>
    <p>Mathematician and writer; the first published algorithm.</p>
  </ui-preview-card>.
</div>
```

```tsx
<PreviewCard trigger={<a href="/people/ada">Ada Lovelace</a>}>
  <strong>Ada Lovelace</strong>
  <p>Mathematician and writer.</p>
</PreviewCard>
```

The first child element is the trigger link and the other children the card. Hover intent opens it after `delay` ms (default 600) and closes it `close-delay` ms (default 300) after the pointer leaves link and card, so the pointer can move onto the card; keyboard focus on the link opens it at once and Tab moves into it (the card follows the link in the DOM). Focus leaving both, an outside press or Escape close it. A press follows the link; the card never toggles on a press. Each interaction fires `openchange` (cancelable) with `{ open, reason, event }`, reasons `trigger-hover`, `trigger-focus`, `focus-out`, `outside-press`, `escape-key`; React `onOpenChange(open, { reason, event })`. `open` / `defaultOpen` (`default-open`), `side` (`bottom` default), `align` (`center` default) and `disabled` follow Base UI.

## Anatomy

Parts (Base UI Preview Card):

| Base UI | Web component | React |
|---|---|---|
| PreviewCard.Root | `ui-preview-card` (host, display: contents) | `PreviewCard.Root` (`div[data-ui=preview-card]`) |
| PreviewCard.Trigger | the first child element (a link), or `[data-part=trigger]` | `PreviewCard.Trigger` (an `<a>`; `href`) |
| PreviewCard.Positioner | `[data-part=positioner]` (popover=manual) | `PreviewCard.Positioner` (`side`, `align`) |
| PreviewCard.Popup | `[data-part=popup]` | `PreviewCard.Popup` |
| PreviewCard.Arrow | `[data-part=arrow]` | `PreviewCard.Arrow` (inside the Positioner, after the Popup) |

- `part:preview-card-trigger` `:scope > [data-part=trigger]`: the link; it keeps its own role and focus ring.
- `part:preview-card-positioner`, `part:preview-card-popup`, `part:preview-card-arrow` (optional): as the popover's.

```html
<ui-preview-card side="top">
  <a data-part="trigger" href="/docs/geometry">Geometry</a>
  <div data-part="popup"><strong>Geometry</strong><p>Every length is a multiple of u.</p><div data-part="arrow"></div></div>
</ui-preview-card>
```

```tsx
<PreviewCard.Root>
  <PreviewCard.Trigger href="/docs/geometry">Geometry</PreviewCard.Trigger>
  <PreviewCard.Positioner side="top">
    <PreviewCard.Popup><strong>Geometry</strong><p>Every length is a multiple of u.</p></PreviewCard.Popup>
    <PreviewCard.Arrow />
  </PreviewCard.Positioner>
</PreviewCard.Root>
```

## Keyboard

| Element | Keys | Action |
|---|---|---|
| link | Tab (keyboard focus) | show the card; Tab again moves into it |
| link, card | Escape | hide it |
| link | Enter | follow the link |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-preview-card` / PreviewCard.Root | `data-open` / `data-closed`, `data-disabled` |
| trigger | `data-popup-open` while open |
| positioner, popup | `data-open` / `data-closed`; while open `data-side`, `data-align`; positioner `data-placement` (ours) |
| arrow | `data-open` / `data-closed`, `data-side`, `data-align`, `data-uncentered` |

## Geometry and appearance

Geometry family: `popup` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolvePopup('preview-card')`). The card is a medium card: padding 4u − B (the theme's card-md padding), radius 4u·min(1, s), the collection gap (2u; the `gap` attribute wins) between its children, at least as wide as the link and at most 80u; the overlay fill, the border role edge and the md shadow. It sits 1u below the link (above when it does not fit). It enters and leaves on the reveal intent. Styles: [preview-card.recipe.ts](preview-card.recipe.ts) on the shared [popup-parts.ts](../popover/popup-parts.ts).

## Renderers and verification

- webComponent: completed (`./preview-card.element.ts`, on `../popover/popup-base.ts`)
- react: completed (`./preview-card.react.tsx`, on the popover's parts)

React props: `npm run registry -- --assembly component:preview-card` (under `react`).

Checks and their latest run: [verification/preview-card.verification.json](verification/preview-card.verification.json).

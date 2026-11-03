# Scroll Area

`ui-scroll-area`. API, defaults and avoidance guidance: [scroll-area.manifest.json](scroll-area.manifest.json) (`npm run registry -- component:scroll-area`). Examples: [scroll-area.examples.json](scroll-area.examples.json). Contract: [components.json](../../contracts/components.json). Base UI: [Scroll Area](https://base-ui.com/react/components/scroll-area).

## Intent

Scroll a bounded region with scrollbars drawn in the theme, and show where more content is.

## Usage

```html
<ui-scroll-area style="height: 16rem">
  <p>Long content…</p>
</ui-scroll-area>
```

Give the host a height or a max-height: it is a flex column, so either bounds the viewport. Without one the area grows with its content.

- **Native scrolling**: the viewport is an ordinary scroll container (wheel, touch, find-in-page, keys once it has focus; it is focusable while it overflows), with its own scrollbars hidden. The kit's scrollbars overlay its inline end (vertical) and block end (horizontal); pad the content's end when text must not sit under them.
- **Scrollbars** show only while their axis overflows (an authored one with `keep-mounted` stays) and fade in while the pointer is over the area (`data-hovering`), while it scrolls (`data-scrolling`, until 0.5s after the last scroll) and while keyboard focus is inside. A thumb drags 1:1 along its track (pointer capture); a press on the track scrolls so the thumb centers under the pointer. They are pointer affordances (`aria-hidden`): keyboard and assistive technology scroll the viewport itself.
- **Overflow edges** (Base UI): `data-has-overflow-x` / `-y`, and `data-overflow-x-start` / `-end`, `data-overflow-y-start` / `-end` when content lies beyond that edge by more than `overflow-edge-threshold` px, on the root, viewport, content and scrollbars; for fades or shadows at the edges, the viewport's `--scroll-area-overflow-{x,y}-{start,end}` give the distances in px.
- `sync()` measures again (it runs on scroll and on resize of the viewport or the content).

React: `<ScrollArea>` (the preset: its children are the content), or `ScrollArea.Root`, `Viewport`, `Content`, `Scrollbar` (`orientation`, `keepMounted`), `Thumb`, `Corner`. Root takes `overflowEdgeThreshold` as one number or per edge (`{ xStart, xEnd, yStart, yEnd }`).

## Anatomy

### Both forms

```html
<ui-scroll-area style="height: 16rem">
  <div data-part="viewport"><div data-part="content">…</div></div>
  <div data-part="scrollbar" data-orientation="vertical"><div data-part="thumb"></div></div>
  <div data-part="scrollbar" data-orientation="horizontal"><div data-part="thumb"></div></div>
  <div data-part="corner"></div>
</ui-scroll-area>
```

```tsx
<ScrollArea.Root style={{ height: '16rem' }}>
  <ScrollArea.Viewport><ScrollArea.Content>…</ScrollArea.Content></ScrollArea.Viewport>
  <ScrollArea.Scrollbar orientation="vertical"><ScrollArea.Thumb /></ScrollArea.Scrollbar>
  <ScrollArea.Scrollbar orientation="horizontal"><ScrollArea.Thumb /></ScrollArea.Scrollbar>
  <ScrollArea.Corner />
</ScrollArea.Root>
```

With parts, only what is written is used (a scrollbar without a thumb gets one); the preset writes all of them.

### Generated

```html
<ui-scroll-area data-has-overflow-y data-overflow-y-end class="ui-scroll-area__root" style="--scroll-area-corner-width: 0px; --scroll-area-corner-height: 0px">
  <div data-part="viewport" role="presentation" tabindex="0" data-has-overflow-y data-overflow-y-end class="ui-scroll-area__viewport" style="--scroll-area-overflow-y-end: 300px; …">
    <div data-part="content" role="presentation" data-has-overflow-y data-overflow-y-end class="ui-scroll-area__content">…</div>
  </div>
  <div data-part="scrollbar" aria-hidden="true" data-orientation="vertical" data-has-overflow-y data-overflow-y-end class="ui-scroll-area__scrollbar" style="--scroll-area-thumb-height: 25px; --scroll-area-thumb-offset: 0px">
    <div data-part="thumb" data-orientation="vertical" class="ui-scroll-area__thumb"></div>
  </div>
  <div data-part="scrollbar" hidden aria-hidden="true" data-orientation="horizontal" class="ui-scroll-area__scrollbar">…</div>
  <div data-part="corner" hidden class="ui-scroll-area__corner"></div>
</ui-scroll-area>
```

React renders the same parts on `<div data-ui="scroll-area">`.

Parts: `part:scroll-area-viewport`, `part:scroll-area-content`, `part:scroll-area-scrollbar`, `part:scroll-area-thumb`, `part:scroll-area-corner` (Base UI names).

## States

Root, viewport, content and scrollbars: `data-has-overflow-x`, `data-has-overflow-y`, `data-overflow-x-start`, `data-overflow-x-end`, `data-overflow-y-start`, `data-overflow-y-end`, `data-scrolling`; scrollbars also `data-orientation` and `data-hovering`; thumbs `data-orientation` and `data-scrolling` (all Base UI names).

## Variables

Set by script as custom properties, in px: root `--scroll-area-corner-width` / `-height` (Base UI); viewport `--scroll-area-overflow-x-start`, `-x-end`, `-y-start`, `-y-end` (Base UI); scrollbar `--scroll-area-thumb-width` (horizontal) / `--scroll-area-thumb-height` (vertical) (Base UI) and `--scroll-area-thumb-offset` (ours: the thumb's place along the track, negative for the horizontal thumb in RTL, which starts at the right).

## Geometry

Family `scroll-area` (`resolveScrollArea`; CSS in `styles/geometry.ts`): the track is 2u thick, the thumb 0.5u inside it (u thick) and at least 4u long, both pills (radius min(3u·s, thickness / 2)); the corner is 2u square and shows only when both bars do. No border. The bars mirror in RTL (inline end, and the horizontal thumb runs from the right).

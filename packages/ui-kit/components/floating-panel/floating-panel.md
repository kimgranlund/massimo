# Floating panel

`ui-floating-panel` (React `FloatingPanel`): a retained nonmodal panel that moves, resizes, collapses and expands. API, defaults and avoidance guidance: [floating-panel.manifest.json](floating-panel.manifest.json).

## Usage

```html
<ui-floating-panel id="tools" label="Tools">
  <div data-part="header">Tools</div>
  <div data-part="body">…</div>
</ui-floating-panel>
```

```js
tools.show({ focus: true, opener: button });
tools.snap('top-end');
```

- Use `show()`, `hide()`, `toggle()` and `snap(anchor)`. Setting `open` directly is silent, and never call the popover API on it yourself.
- Drag it by the header, or focus the header and use the arrow keys. Shift moves four times as far.
- Drag the corner grip to resize it. Collapsed, the header stays and the body stays mounted, hidden.
- It stays inside the viewport, and it doesn't trap focus.
- `openchange` and `collapsedchange` report changes.

## Geometry and appearance

80u wide by default, at least 40u, with a 10u header and 4u from the viewport (`resolveFloatingPanel`).

## Renderers and verification

Both renderers share `dom/drag.ts`. React takes `open` and `onOpenChange`, and `snap` is on the ref.

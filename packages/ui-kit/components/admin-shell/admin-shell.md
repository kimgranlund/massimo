# Admin shell

`ui-admin-shell` (React `AdminShell`): navigation and detail panes around content, with responsive rail and drawer allocation. API, defaults and avoidance guidance: [admin-shell.manifest.json](admin-shell.manifest.json).

## Usage

```html
<ui-admin-shell style="height: 400px">
  <aside data-part="start">…</aside>
  <div data-part="toolbar">…</div>
  <main data-part="content">…</main>
  <footer data-part="footer">…</footer>
  <aside data-part="end">…</aside>
</ui-admin-shell>
```

- Fit comes from the shell's own width, with no viewport breakpoints. The end pane leaves first, then start falls to a 12u rail, and then to nothing.
- `toggle(side)` changes the inline preference, or opens the pane as a drawer if it no longer fits.
- `close(destination?)` dismisses a drawer and focuses the destination or the opener. Escape and the scrim dismiss it too.
- While a drawer is open, the rest of the shell is inert.
- `panechange` reports `{ start, end }`, each `inline`, `rail`, `drawer` or `closed`.

## Geometry and appearance

A 60u start pane, a 12u rail, an 80u end pane and at least 120u for content (`resolveShell`).

## Renderers and verification

Both renderers share `dom/shell.ts`. In React, `toggle` and `close` are on the ref.

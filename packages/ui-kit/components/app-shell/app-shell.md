# App shell

`ui-app-shell` (React `AppShell`): an application frame with header, body and footer. API, defaults and avoidance guidance: [app-shell.manifest.json](app-shell.manifest.json).

## Usage

```html
<ui-app-shell variant="editor" style="height: 320px">
  <header data-part="header">Project</header>
  <div data-part="body">
    <aside data-part="start">…</aside>
    <main data-part="main">…</main>
    <aside data-part="end">…</aside>
  </div>
  <footer data-part="footer">Saved</footer>
</ui-app-shell>
```

- It fills its parent. Give the parent a height, usually `100dvh`.
- The default body scrolls. In `variant="editor"` the body doesn't scroll, and `start`, `main` and `end` each do.
- Put a [`ui-pane`](../pane/pane.md) in a pane for its own bars.

## Geometry and appearance

12u bars, a 60u start pane and an 80u end pane (`resolveShell`).

## Renderers and verification

The web tag has no script. React `AppShell` renders `<div data-ui="app-shell">` with the same rules.

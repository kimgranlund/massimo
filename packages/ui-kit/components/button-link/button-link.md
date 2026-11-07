# Button link

`ui-button-link` (React `ButtonLink`): a real link with the look and geometry of a button. API, defaults and avoidance guidance: [button-link.manifest.json](button-link.manifest.json).

## Intent

Use it when something looks like a button but goes somewhere. It renders an `<a>`, so the browser owns navigation, history and open-in-new-tab. For an action on this page, use [`ui-button`](../button/button.md).

## Usage

```html
<ui-button-link href="/pricing" variant="primary">See pricing</ui-button-link>
<ui-button-link href="https://example.com" target="_blank"><i slot="trailing" name="arrow-up-right"></i>Docs</ui-button-link>
```

```tsx
<ButtonLink href="/pricing" variant="primary">See pricing</ButtonLink>
```

- `variant` and the slots work as on a button.
- `target="_blank"` adds `rel="noopener noreferrer"` unless you set `rel`.
- `disabled` drops the `href`, so it can't be followed.
- A `javascript:`, `data:` or `vbscript:` address is dropped.
- With a client router, use `Button` with `render={<Link />}`, which keeps the router's navigation.

## Geometry and appearance

The link wears the button's recipe and geometry, so the sizes match exactly. Its underline is removed.

## Renderers and verification

Both renderers produce a host around a real `a`. `apps/studio/geometry-check.html` compares the link with a button; `react-check.html` compares the twins.

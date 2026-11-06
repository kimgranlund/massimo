# Kbd

`ui-kbd` (React `Kbd`): keys and shortcuts shown as caps. API, defaults and avoidance guidance: [kbd.manifest.json](kbd.manifest.json).

## Intent

Show which key to press, beside a command or in running text. It's notation only: it registers no shortcut and takes no focus.

## Usage

```html
<ui-kbd>K</ui-kbd>
<ui-kbd keys="mod+k"></ui-kbd>
<ui-kbd keys="mod+shift+p" platform="mac"></ui-kbd>
```

```tsx
<Kbd keys="mod+k" />
```

- `keys` joins keys with `+`. `mod` is Command on a Mac and Control elsewhere. Names such as `shift`, `alt`, `enter`, `esc`, `tab` and `up` draw their symbol or short name, and anything else shows as written.
- `platform` is `auto`, `mac` or `other`. Set it when a page documents one platform's shortcuts.
- Text content works as `keys` on the web tag, for a single key.
- Assistive technology reads the key names, such as "Command Shift P", not the symbols.

## Geometry and appearance

Each cap is 5u tall and at least square, ½u from the next, with `10px + ½u` text (`resolveKbd`). A long key name grows the cap. Density doesn't change it.

## Renderers and verification

The web tag draws its caps by script. React renders a native `kbd` with the same parts; on the server it uses the `other` platform, and `auto` resolves after mount. `apps/studio/geometry-check.html` compares the caps with the resolver; `react-check.html` compares the twins.

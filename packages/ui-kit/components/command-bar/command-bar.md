# Command bar

`ui-command-bar` (React `CommandBar`): search commands by label or keywords, in a dialog. API, defaults and avoidance guidance: [command-bar.manifest.json](command-bar.manifest.json).

## Usage

```html
<ui-command-bar id="commands" commands='[{"id":"new","label":"New project","shortcut":"mod+n"}]'></ui-command-bar>
```

```tsx
<CommandBar open={open} onOpenChange={setOpen} commands={commands} onSelect={run} />
```

- Each command has an `id` and `label`, and optional `keywords`, `group` and `shortcut`.
- Arrow keys move the highlight and Enter chooses. Choosing fires `select` and closes the bar.
- It filters and reports. Running the command, and any global shortcut, is the app's job.

## Geometry and appearance

A dialog holding a field over a list of 7u rows.

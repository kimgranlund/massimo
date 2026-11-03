# Alert Dialog

`ui-alert-dialog` (React `AlertDialog`). API, defaults and avoidance guidance: [alert-dialog.manifest.json](alert-dialog.manifest.json) (`npm run registry -- component:alert-dialog`). Examples: [alert-dialog.examples.json](alert-dialog.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Alert Dialog](https://base-ui.com/react/components/alert-dialog).

## Intent

- `ui-alert-dialog`: interrupt to ask for a decision, usually confirming a destructive or irreversible action.

## Usage

```html
<ui-alert-dialog label="Delete project?" description="Its files and history are removed. This cannot be undone.">
  <ui-button data-part="trigger">Delete…</ui-button>
  <div data-part="actions">
    <ui-button data-part="close">Cancel</ui-button>
    <ui-button data-part="close" variant="primary">Delete</ui-button>
  </div>
</ui-alert-dialog>
```

```tsx
<AlertDialog label="Delete project?" description="This cannot be undone." trigger="Delete…" onOpenChange={(open, { reason }) => …}>
  <AlertDialog.Actions>
    <AlertDialog.Close>Cancel</AlertDialog.Close>
    <AlertDialog.Close variant="primary" onClick={remove}>Delete</AlertDialog.Close>
  </AlertDialog.Actions>
</AlertDialog>
```

It is the [dialog](../dialog/dialog.md) (same parts, props, events, nesting and geometry) with Base UI Alert Dialog's differences:

- the popup is `role=alertdialog` (`aria-modal`);
- always modal: page scroll locks, the rest of the page is inert and focus is trapped (there is no `modal` or `disable-pointer-dismissal`);
- an outside press never closes it: Escape (`escape-key`) and the close parts (`close-press`) do, through the cancelable `openchange`;
- focus starts on the least destructive action: an `[autofocus]` element, else the first close part (Cancel), else the first tabbable; it returns to the trigger on close.

The confirming action closes the alert dialog when it is also a close part; otherwise handle its press and set `open` to false.

## Anatomy

Preset: `label` becomes the title (an h2), `description` the description (a p), and the children the popup's content. Parts (Base UI Alert Dialog):

| Base UI | Web component | React |
|---|---|---|
| AlertDialog.Root | `ui-alert-dialog` (host, display: contents) | `AlertDialog.Root` (`div[data-ui=alert-dialog]`) |
| AlertDialog.Trigger | `[data-part=trigger]` | `AlertDialog.Trigger` (a kit `Button`) |
| AlertDialog.Portal | none: the top layer lifts the popup | `AlertDialog.Portal` (renders in place) |
| AlertDialog.Backdrop | `[data-part=backdrop]` | `AlertDialog.Backdrop` |
| AlertDialog.Popup | `[data-part=popup]` (role=alertdialog) | `AlertDialog.Popup` |
| AlertDialog.Title | `[data-part=title]` | `AlertDialog.Title` (h2) |
| AlertDialog.Description | `[data-part=description]` | `AlertDialog.Description` (p) |
| *actions* (ours) | `[data-part=actions]` | `AlertDialog.Actions` |
| AlertDialog.Close | `[data-part=close]` | `AlertDialog.Close` (a kit `Button`) |

```html
<ui-alert-dialog>
  <ui-button data-part="trigger">Discard</ui-button>
  <div data-part="popup">
    <h2 data-part="title">Discard changes?</h2>
    <p data-part="description">Your edits since the last save are lost.</p>
    <div data-part="actions"><ui-button data-part="close">Keep editing</ui-button><ui-button data-part="close" variant="primary">Discard</ui-button></div>
  </div>
</ui-alert-dialog>
```

```tsx
<AlertDialog.Root>
  <AlertDialog.Trigger>Discard</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Popup>
      <AlertDialog.Title>Discard changes?</AlertDialog.Title>
      <AlertDialog.Description>Your edits since the last save are lost.</AlertDialog.Description>
      <AlertDialog.Actions><AlertDialog.Close>Keep editing</AlertDialog.Close><AlertDialog.Close variant="primary">Discard</AlertDialog.Close></AlertDialog.Actions>
    </AlertDialog.Popup>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

Every part takes `render` and a `className` string or function of its state (as the dialog's).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | open the alert dialog |
| popup | Escape | close it (`escape-key`) |
| popup | Tab, Shift+Tab | move among its tabbables, wrapping |

## State attributes

As the dialog's ([states.json](../../contracts/states.json) `ui-alert-dialog`): host and backdrop `data-open` / `data-closed`; trigger `data-popup-open`; popup `data-open` / `data-closed`, `data-nested`, `data-nested-dialog-open`.

## Geometry and appearance

Geometry family: `dialog` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveDialog`): the dialog's card-xl container popup (padding p·u − B, radius = padding × min(1, s), parts 2u apart, 96u wide within a 4u viewport margin) over the `bg.backdrop` role, entering and leaving on the reveal intent. Styles: [alert-dialog.recipe.ts](alert-dialog.recipe.ts) (the dialog's style objects under `ui-alert-dialog__*` classes).

## Renderers and verification

- webComponent: completed (`./alert-dialog.element.ts`)
- react: completed (`./alert-dialog.react.tsx`)

React props: `npm run registry -- --assembly component:alert-dialog` (under `react`).

Checks and their latest run: [verification/alert-dialog.verification.json](verification/alert-dialog.verification.json).

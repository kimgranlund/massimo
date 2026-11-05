# Dialog

`ui-dialog` (React `Dialog`). API, defaults and avoidance guidance: [dialog.manifest.json](dialog.manifest.json) (`npm run registry -- component:dialog`). Examples: [dialog.examples.json](dialog.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Dialog](https://base-ui.com/react/components/dialog).

## Intent

- `ui-dialog`: ask for input or show content in a window over the page, with the page set aside until it closes.

## Usage

```html
<ui-dialog label="Rename file" description="The name shows in shared links.">
  <ui-button data-part="trigger">Rename…</ui-button>
  <ui-input label="Name" value="Report" autofocus></ui-input>
  <div data-part="actions">
    <ui-button data-part="close">Cancel</ui-button>
    <ui-button data-part="close" variant="primary">Rename</ui-button>
  </div>
</ui-dialog>
```

```tsx
<Dialog label="Rename file" description="The name shows in shared links." trigger="Rename…" onOpenChange={(open, { reason }) => …}>
  <Input label="Name" defaultValue="Report" autoFocus />
  <Dialog.Actions><Dialog.Close>Cancel</Dialog.Close><Dialog.Close variant="primary">Rename</Dialog.Close></Dialog.Actions>
</Dialog>
```

`open` (attribute and property; React: controlled `open`) and `defaultOpen` (`default-open`) follow Base UI. A press on the trigger opens it; Escape, a press outside the popup (on the backdrop) and a press on a close part close it. Each fires `openchange` (cancelable: `preventDefault` keeps the dialog as it is) with `{ open, reason, event }`, reason `trigger-press`, `escape-key`, `outside-press`, `close-press` or (not modal) `focus-out`; React calls `onOpenChange(open, { reason, event })`. Setting `open` from script fires nothing.

- `modal` (Base UI): `true` (default) traps focus, locks page scroll (`html[data-scroll-locked]`, keeping the scrollbar's space when the page scrolled) and makes everything outside the popup inert (live regions excepted); `trap-focus` traps focus only; `false` leaves the page interactive and closes when focus leaves.
- `disable-pointer-dismissal` (React `disablePointerDismissal`): outside presses (and, not modal, focus leaving) do not close it.
- Focus moves to an `[autofocus]` element in the popup (a kit host such as ui-input hands it to its first tabbable), else the first tabbable, else the popup; it returns to the element focused before (the trigger) on close.
- Nested dialogs: a `ui-dialog` inside another's popup is nested. It shows no backdrop of its own (`data-nested`); its parent steps back (`data-nested-dialog-open`, `--nested-dialogs` = the number of open dialogs inside it). Escape and outside presses close the topmost dialog only.

## Anatomy

Preset: `label` becomes the title (an h2), `description` the description (a p), and the children the popup's content, after them. Parts (Base UI Dialog):

| Base UI | Web component | React |
|---|---|---|
| Dialog.Root | `ui-dialog` (host, display: contents) | `Dialog.Root` (`div[data-ui=dialog]`, display: contents) |
| Dialog.Trigger | `[data-part=trigger]` (any element; a ui-button) | `Dialog.Trigger` (a kit `Button`) |
| Dialog.Portal | none: the top layer lifts the popup | `Dialog.Portal` (renders its children in place) |
| Dialog.Backdrop | `[data-part=backdrop]` | `Dialog.Backdrop` |
| Dialog.Popup | `[data-part=popup]` (role=dialog) | `Dialog.Popup` |
| Dialog.Title | `[data-part=title]` | `Dialog.Title` (h2) |
| Dialog.Description | `[data-part=description]` | `Dialog.Description` (p) |
| *actions* (ours) | `[data-part=actions]` | `Dialog.Actions` |
| Dialog.Close | `[data-part=close]` (any element; a ui-button) | `Dialog.Close` (a kit `Button`) |

Base UI's Dialog.Viewport is not implemented: the popup centers itself in the viewport.

- `part:dialog-trigger` `:scope > [data-part=trigger]`: outside the popup; gets `aria-haspopup=dialog`, `aria-expanded`, `aria-controls` and `data-popup-open`.
- `part:dialog-backdrop` `:scope > [data-part=backdrop]`: generated unless authored; `aria-hidden`.
- `part:dialog-popup` `:scope > [data-part=popup]`: generated from the children unless authored; `role=dialog`, `aria-modal` while modal, `aria-labelledby` the title, `aria-describedby` the description, `tabindex=-1`, `popover=manual`.
- `part:dialog-title`, `part:dialog-description`, `part:dialog-actions`, `part:dialog-close`: inside the popup (any depth, not inside a nested dialog).

```html
<ui-dialog>
  <ui-button data-part="trigger">Open</ui-button>
  <div data-part="backdrop"></div>
  <div data-part="popup">
    <h2 data-part="title">Settings</h2>
    <p data-part="description">Changes apply at once.</p>
    <div data-part="actions"><ui-button data-part="close">Done</ui-button></div>
  </div>
</ui-dialog>
```

```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Popup>
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Description>Changes apply at once.</Dialog.Description>
      <Dialog.Actions><Dialog.Close>Done</Dialog.Close></Dialog.Actions>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

Every part takes `render` and a `className` string or function of its state (`{ open, closed }`; the popup also `nested`, `nestedDialogOpen`; the trigger `popupOpen`). Trigger and Close take the kit Button's props (`variant`, `leading`, …).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | open the dialog |
| popup | Escape | close the topmost dialog (`escape-key`) |
| popup | Tab, Shift+Tab | move among the popup's tabbables, wrapping (modal, trap-focus) |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics.

| Element | Attributes |
|---|---|
| `ui-dialog` / Dialog.Root | `data-open` / `data-closed` (ours: Base UI's Root renders no element) |
| trigger | `data-popup-open` while open |
| backdrop | `data-open` / `data-closed` (`hidden` when nested) |
| popup | `data-open` / `data-closed`, `data-nested`, `data-nested-dialog-open` (and `--nested-dialogs`) |

`data-starting-style` / `data-ending-style` are not set: enter and exit run on `@starting-style` and discrete `display` / `overlay` transitions.

## Geometry and appearance

Geometry family: `dialog` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveDialog` in `tokens/geometry/resolve.ts`). The popup is a container at the card-xl level: padding p·u − B inside a B edge in the border role (p = the theme's `pad-card-xl`, 8u), radius p·u × min(1, s) (never rounder than its padding), the parts 2u apart (the collection gap; the `gap` attribute on the host wins), the actions row at the end edge with its buttons 2u apart. It is 96u wide (24rem at u = 4), at most the viewport less 4u on each side, centered, and scrolls inside past the viewport height less 4u above and below. The fill is `bg.overlay` with the `md` shadow; the backdrop is `bg.backdrop` over the viewport. Title: the heading-3 role; description: body in `fg.muted`. Both layers enter and leave on the reveal intent (the backdrop fades; the popup fades and grows from 0.97), `display` and `overlay` transitioning discretely so the closing layer stays painted; reduced motion collapses the duration. Styles: [dialog.recipe.ts](dialog.recipe.ts).

## Renderers and verification

- webComponent: completed (`./dialog.element.ts`)
- react: completed (`./dialog.react.tsx`)

React props: `npm run registry -- --assembly component:dialog` (under `react`).

Checks and their latest run: [verification/dialog.verification.json](verification/dialog.verification.json).

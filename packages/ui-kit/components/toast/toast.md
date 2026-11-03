# Toast

`ui-toast-viewport` (React `Toast`). API, defaults and avoidance guidance: [toast.manifest.json](toast.manifest.json) (`npm run registry -- component:toast`). Examples: [toast.examples.json](toast.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Toast](https://base-ui.com/react/components/toast).

## Intent

- `ui-toast-viewport`: tell the user briefly that something happened or is in progress, without interrupting their task, with an optional action.

## Usage

Toasts are not markup: a toast manager holds them ([manager.ts](manager.ts), Base UI's `createToastManager` / `useToastManager`) and a viewport draws them. Put one viewport on the page; add toasts from anywhere.

```html
<ui-toast-viewport></ui-toast-viewport>
<script type="module">
  import { toastManager } from '@massimo/ui-kit/components/toast/element';
  const id = toastManager.add({ title: 'Saved', description: 'Your draft is stored.', type: 'success' });
  toastManager.update(id, { description: 'Stored and synced.' });
  toastManager.close(id);
  toastManager.promise(save(), { loading: 'Saving…', success: 'Saved', error: (e) => ({ title: 'Not saved', description: String(e) }) });
</script>
```

```tsx
<Toast placement="bottom-end" onOpenChange={(open, { id, reason }) => …}>
  <App />
</Toast>

function SaveButton() {
  const toast = useToastManager(); // or Toast.useToastManager()
  return <Button onClick={() => toast.add({ title: 'Saved', actionProps: { children: 'Undo', onClick: undo } })}>Save</Button>;
}
```

- **Manager** (both renderers): `add(options)` returns the id (an existing id updates that toast in place and restarts its timer); `update(id, options | prev => options)`; `close(id?)` (no id: all); `promise(p, { loading, success, error })` (each a string, options or a function of the result; the loading toast has no timeout). Options: `id`, `title`, `description`, `type` (`data-type`; success, error, warning and info colour the title and edge, loading is set by `promise`), `timeout` (ms; 0 keeps it), `priority` (`low` polite, `high` assertive), `actionProps` (`children` is the label, `onClick`), `positionerProps` (an anchored toast, below), `onClose`, `onRemove`, `data`.
- **Anchored toasts** (Base UI `positionerProps`): `add({ description: 'Copied', positionerProps: { anchor: button, side: 'bottom' } })` shows the toast beside `anchor` with an arrow instead of in the stack, for feedback at the control that caused it. `side` (default `top`), `align` (default `center`) and `sideOffset` (px, default 1u) place it; it flips when there is no room, keeps its timer, and closes as any toast does (close, Escape, timeout), but does not swipe and takes no stack index.
- **Viewport**: `limit` (default 3: older toasts stay mounted, `data-limited` and `inert`), `timeout` (the default for toasts that set none, 5000), `placement` (`bottom-end` default, `bottom-center`, `top-end`, `top-center`, or `inline` for a preview in flow), `swipe-direction` (default `down right`), `label` (default Notifications), and the `manager` property (default: the page's `toastManager`; React: `Toast.Provider toastManager`, else its own).
- **Timers** pause while the stack is hovered or holds focus (which also expands it, `data-expanded`) and while the document is hidden, keeping the time left.
- **Events**: the viewport fires `openchange` with `{ open, id, toast, reason, event }`: `open: true, reason: 'none'` when a toast is added; `open: false` when one closes. A swipe (`swipe`), the close (`close-press`) or Escape on a focused toast (`escape-key`) fire it first and cancelably (`preventDefault` keeps the toast); a timeout or a script close fires it after the fact with `reason: 'none'`. React: `Toast.Viewport onOpenChange(open, details)` (or the preset's), and per toast `onClose` / `onRemove`.

## Anatomy

| Base UI | Web component | React |
|---|---|---|
| Toast.Provider | the manager (`toastManager`, `createToastManager`) | `Toast.Provider` |
| Toast.Portal | not needed (the viewport is in the top layer) | `Toast.Portal` (document.body, after mount) |
| Toast.Viewport | `ui-toast-viewport` (host) | `Toast.Viewport` (`div[data-ui=toast]`) |
| Toast.Positioner | `[data-part=positioner]` around an anchored toast (top layer) | `Toast.Positioner toast` |
| Toast.Root | `[data-part=toast]` | `Toast.Root` |
| Toast.Arrow | `[data-part=positioner] > [data-part=arrow]` | `Toast.Arrow` |
| Toast.Content | `[data-part=toast] > [data-part=content]` | `Toast.Content` |
| Toast.Title | `[data-part=content] > h2[data-part=title]` | `Toast.Title` (`<h2>`) |
| Toast.Description | `[data-part=content] > p[data-part=description]` | `Toast.Description` (`<p>`) |
| Toast.Action | `[data-part=content] > [data-part=action]` (role=button) | `Toast.Action` (`<button>`) |
| Toast.Close | `[data-part=content] > [data-part=close]` (role=button, an x) | `Toast.Close` (`<button>`) |

Base UI's Root is the `toast` part here, because the viewport is the recipe's root. The web component draws every part itself (title and description as text); the React parts take children and `render`:

- `part:toast-positioner` `:scope > [data-part=positioner]`: an anchored toast's box, fixed in the top layer beside the anchor (`data-side`, `data-placement`).
- `part:toast-toast` `:scope > [data-part=toast]`: one toast (in a positioner when anchored: `data-anchored`, `data-side`).
- `part:toast-arrow` `… > [data-part=positioner] > [data-part=arrow]`: the anchored toast's arrow, as a popover's.
- `part:toast-content` `… > [data-part=content]`: its parts in a grid: title and description in one column, then the action and the close.
- `part:toast-title`, `part:toast-description`, `part:toast-action`, `part:toast-close`: the parts above.

```html
<!-- What ui-toast-viewport draws for toastManager.add({ title: 'Saved', description: 'Draft stored.', actionProps: { children: 'Undo' } }) -->
<ui-toast-viewport role="region" aria-label="Notifications" aria-live="polite">
  <div data-part="toast" role="dialog" aria-modal="false" aria-labelledby="…" aria-describedby="…">
    <div data-part="content">
      <h2 data-part="title">Saved</h2>
      <p data-part="description">Draft stored.</p>
      <div data-part="action" role="button" tabindex="0">Undo</div>
      <div data-part="close" role="button" tabindex="0" aria-label="Close"><i name="x"></i></div>
    </div>
  </div>
</ui-toast-viewport>
```

```tsx
<Toast.Provider limit={3}>
  <App />
  <Toast.Viewport placement="top-end">
    <ToastList />
  </Toast.Viewport>
</Toast.Provider>

function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} swipeDirection="right">
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        {t.actionProps && <Toast.Action />}
        <Toast.Close />
      </Toast.Content>
    </Toast.Root>
  ));
}
```

A `Toast.Viewport` without children draws that list; a `Toast.Root` without children draws that content. Every part takes `render` and a `className` string or function of its state (`{ expanded }`; a toast also `type`, `limited`, `swiping`, `swipeDirection`, `startingStyle`, `endingStyle`; content `behind`).

### Stack variables

Base UI's, px set by script from layout (both renderers; [stack.ts](stack.ts)): on each toast `--toast-index` (0 is the frontmost), `--toast-height` (its own height), `--toast-offset-y` (the heights of the toasts in front of it), `--toast-swipe-movement-x` / `-y` (while swiping); on the viewport `--toast-frontmost-height`. Collapsed, the toasts behind peek 2u a step, shrink 5% a step and take the frontmost height with their content hidden (`data-behind`); expanded, each stands 2u from the next at its own height. The stack moves on the toggle intent; toasts enter (`data-starting-style`) and leave (`data-ending-style`, toward `data-swipe-direction` after a swipe) on the reveal intent, and are removed when the exit transition ends.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| page | F6 | focus the viewport (when it has toasts and is placed, not inline); F6 again returns focus |
| viewport | Tab, Shift+Tab | move between the toasts' actions and close buttons |
| action, close | Enter, Space | press it |
| toast | Escape | dismiss it (reason `escape-key`) |

Swipe: press on a toast (not on its action or close, a link, a button or `[data-swipe-ignore]`) and drag in an allowed direction; a release past 10u dismisses it (reason `swipe`), a shorter one springs back.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-toast-viewport` / Toast.Viewport | `data-expanded` |
| toast | `data-type`, `data-expanded`, `data-limited`, `data-swiping`, `data-swipe-direction`, `data-starting-style`, `data-ending-style`, `data-anchored`, `data-side` (anchored) |
| positioner, arrow (anchored) | `data-side` (positioner also `data-placement`) |
| content | `data-behind`, `data-expanded` |
| title, description, action, close | `data-type` |

## Geometry and appearance

Geometry family: `toast` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveToast`).

- **Toast**: a container at the card-sm level: padding `pad-card-sm` (3u) − B inside the border, radius equal to that edge × min(1, s); `bg.overlay` with the `border` edge (the feedback role's border for success, error, warning, info) and the md shadow.
- **Content**: title (`title` type role; the feedback role's `fg` by type) and description (`caption`, `fg.muted`) in one column, 0.5u apart; the action and the close sit after it, 1u apart, centered on the text.
- **Action**: an 8u control row on `bg.control` (padding u − B, label 2u at its edges, the control radius). **Close**: a 6u slot (radius min(control radius, 3u)) with an x at icon size sm.
- **Viewport**: 80u wide, at most the window less 8u, 4u from the window edges, in the top layer (`showTopLayer`; raised above earlier layers when a toast arrives). `inline` is in flow, as wide as its container up to 80u, the toasts 2u apart.

Styles: [toast.recipe.ts](toast.recipe.ts).

## Renderers and verification

- webComponent: completed (`./toast.element.ts`)
- react: completed (`./toast.react.tsx`)

React props: `npm run registry -- --assembly component:toast` (under `react`).

Checks and their latest run: [verification/toast.verification.json](verification/toast.verification.json).

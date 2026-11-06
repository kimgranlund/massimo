# Avatar

`ui-avatar`. API, defaults and avoidance guidance: [avatar.manifest.json](avatar.manifest.json) (`npm run registry -- component:avatar`). Examples: [avatar.examples.json](avatar.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Show a person or entity as a round picture, with initials or an icon until the picture loads or when it fails ([Base UI Avatar](https://base-ui.com/react/components/avatar)).

## Usage

```html
<ui-avatar name="Maya Lindqvist"></ui-avatar>
<ui-avatar src="/people/maya.jpg" alt="Maya Lindqvist" delay="300">ML</ui-avatar>
<ui-avatar avatar-size="xl" name="Kim Sandberg" class="tone-primary"></ui-avatar>
```

```tsx
import { Avatar } from '@massimo/ui-kit/components/avatar/react';
<Avatar src="/people/maya.jpg" alt="Maya Lindqvist">ML</Avatar>
```

- `name` names the avatar when there is no `alt`, and its initials (up to two letters) are the fallback when none is authored. Without either, the fallback is a user icon.
- `alt` names the picture; with `alt` or `name` the host is `role=img` with that `aria-label`, and the image and fallback are hidden from the accessibility tree.
- The fill is neutral (`bg.muted`, `fg.muted`); a tone is an author class with color roles (`bg: primary.subtle, color: primary.fg`).

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*.

```html
<ui-avatar name="Kim Sandberg"><img data-part="image" src="/people/kim.jpg" alt=""><span data-part="fallback">KS</span></ui-avatar>
```

```tsx
<Avatar.Root name="Kim Sandberg">
  <Avatar.Image src="/people/kim.jpg" />
  <Avatar.Fallback delay={300}>KS</Avatar.Fallback>
</Avatar.Root>
```

Web component: an authored `<img>` (with or without `data-part="image"`) becomes the image part and seeds `src` and `alt`; an authored `[data-part=fallback]` is the fallback; loose children become the fallback's content. React: `Avatar.Image` renders the `<img>` (hidden until loaded), `Avatar.Fallback` the fallback; the preset's children are the fallback's.

- `part:avatar-image` `:scope > [data-part=image]`: the picture; hidden until it has loaded.
- `part:avatar-fallback` `:scope > [data-part=fallback]`: shown until then (after `delay` ms).

## Keyboard

None: the avatar is not focusable. Put it in a button or link to make it interactive.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-avatar` / Avatar image part | `data-loading` while the image loads, `data-error` after it failed |

## Events and values

| Renderer | Event / callback |
|---|---|
| `ui-avatar` | `loadingstatuschange`: `detail { status }`, `idle`, `loading`, `loaded` or `error`; `status` property |
| React Avatar.Image (and the preset) | `onLoadingStatusChange(status)` |

## Geometry and appearance

Geometry family: `avatar` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveAvatar`, CSS `--avatar*` in `styles/geometry.ts`). `avatar-size` (React `avatarSize`): sm 6u (the slot: it fits a button's leading slot), md 8u (the control height, default), lg 12u, xl 16u. The avatar is a control scaled by k = size / 8u: initials (10px + u)·k at line height 1.2, the fallback icon (10px + 1.5u)·k. Round: radius size/2 × min(1, s). Styles: [avatar.recipe.ts](avatar.recipe.ts); the image fades in with the reveal intent.

## Renderers and verification

- webComponent: completed (`./avatar.element.ts`)
- react: completed (`./avatar.react.tsx`)

Checks and their latest run: [verification/avatar.verification.json](verification/avatar.verification.json).

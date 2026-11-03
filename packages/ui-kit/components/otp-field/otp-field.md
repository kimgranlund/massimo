# OTP Field

`ui-otp-field`. API, defaults and avoidance guidance: [otp-field.manifest.json](otp-field.manifest.json) (`npm run registry -- component:otp-field`). Examples: [otp-field.examples.json](otp-field.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Enter a short one-time code, such as a verification or sign-in code, one character per cell ([Base UI OTP Field](https://base-ui.com/react/components/otp-field)). A password of free length is a `ui-input type="password"`; a quantity is a `ui-number-field`.

## Usage

```html
<ui-field label="Verification code" description="Sent to your phone.">
  <ui-otp-field name="code" length="6" required></ui-otp-field>
</ui-field>
```

```tsx
import { OTPField } from '@massimo/ui-kit/components/otp-field/react';
<OTPField name="code" length={6} onValueComplete={(code) => verify(code)} />
```

The value is one string over `length` cells, kept contiguous: cell i shows character i. Typing overwrites the focused cell and moves to the next; a paste distributes from the focused cell (spaces and dashes in `123 456` are dropped); Backspace clears the focused cell, or the one before when it is empty. `validation-type` (`numeric` by default, `alpha`, `alphanumeric`, `none`) filters characters; rejected ones fire `valueinvalid` with the attempted text. `normalizeValue` (a property; React prop) maps accepted text, e.g. to upper case. A complete code fires `complete`; with `auto-submit` the form is then submitted. The first cell carries `autocomplete="one-time-code"`. SMS autofill: with that hint (the default) the web component asks the WebOTP API (`navigator.credentials.get({ otp })`) for the code once connected, and fills what it returns as typed (reason `input-change`, then `complete` and `auto-submit`); the request is aborted on disconnect, and `autocomplete="off"` turns it off. WebOTP is Chromium on Android, and the SMS must name the origin (`@example.com #123456`). iOS Safari's autofill needs a native input, so it works only in the React renderer, which distributes the filled code over the cells. Name the group with a wrapping `ui-field` (it sets `aria-labelledby` on the host) or `label` (`aria-label`).

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*.

```html
<ui-otp-field name="code">
  <div data-part="input"></div><div data-part="input"></div><div data-part="input"></div>
  <div data-part="separator"></div>
  <div data-part="input"></div><div data-part="input"></div><div data-part="input"></div>
</ui-otp-field>
```

```tsx
<OTPField.Root name="code" length={6}>
  <OTPField.Input /><OTPField.Input /><OTPField.Input />
  <OTPField.Separator />
  <OTPField.Input /><OTPField.Input /><OTPField.Input />
</OTPField.Root>
```

Web component: without authored cells the host generates `length` cells (the preset); with authored `[data-part=input]` children it keeps the markup's order (separators included) and `length` becomes their count. React: `OTPField.Root` numbers its `OTPField.Input` direct children in order; the preset `<OTPField length={6} />` renders six.

- `part:otp-field-input` `:scope > [data-part=input]`: a cell, contenteditable role=textbox (React: a native `<input>`, `type="password"` with `mask`), `aria-label` "Character i of n".
- `part:otp-field-separator` `:scope > [data-part=separator]`: role=separator, a dash between groups.

## Keyboard

| Key | Action |
|---|---|
| characters | overwrite the focused cell, move to the next |
| Backspace | clear the focused cell, or the one before when it is empty |
| Delete | clear the focused cell (the following characters move up) |
| Arrow Left / Right | move between cells (mirrored in RTL) |
| Home / End | first cell / the last reachable cell |
| Enter | submit the form |

Focus never lands past the first empty cell, and that cell (the last when complete) is the only tab stop.

## State attributes

Host: the field state (`data-disabled`, `data-readonly`, `data-required`, `data-valid` / `data-invalid`, `data-dirty`, `data-touched`, `data-filled`: at least one character, `data-focused`) and `data-complete`. Cells: `data-filled` (this cell), `data-complete`, `data-focused` (any cell), `data-disabled`, `data-readonly`. Separator: `data-orientation`. All Base UI names ([states.json](../../contracts/states.json)).

## Events and values

| Renderer | Value | Events |
|---|---|---|
| `ui-otp-field` | `value`, `default-value`, `length`, `validation-type`, `mask`, `auto-submit`, `autocomplete`, `inputmode` | `input` and `change` on every change `{ value, reason, event }`; `complete`; `valueinvalid` |
| React OTPField | `value`, `defaultValue`, `length`, `validationType`, `normalizeValue`, `mask`, `autoSubmit`, `autoComplete`, `inputMode` | `onValueChange`, `onValueComplete`, `onValueInvalid` `(value, details)` |

Reasons (Base UI): `input-change`, `input-clear`, `input-paste`, `keyboard` (Delete). Validity: required and empty is `valueMissing`, a partial code `tooShort`.

## Geometry and appearance

Geometry family: `otp-field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveOtpField`): each cell is a square field control, 8u × 8u (`--h`), pad u − B inside the border (`--pad`, `--b`), the control radius and font, the character centered on the single-line rule (`--line`, `--line-pad`); cells 1u apart; a separator is a 2u × 0.5u dash, radius 0.25u. Styles: [otp-field.recipe.ts](otp-field.recipe.ts): cells are `bg.muted` with the field states (critical tint when invalid, subtle read-only, faded disabled), the focus ring on the focused cell after any press; the separator is `fg.subtle`.

## Renderers and verification

- webComponent: completed (`./otp-field.element.ts`)
- react: completed (`./otp-field.react.tsx`)

Checks and their latest run: [verification/otp-field.verification.json](verification/otp-field.verification.json).

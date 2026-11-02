# Components

Light-DOM custom elements, registered on import (`@massimo/ui-kit/components/<name>/element`). No native form elements inside any of them. Lengths: [geometry](geometry.md). Colors: [color](color.md).

## Foundations

- `UIElement` (`core/element.ts`): `static properties` become signal-backed properties with attribute parsing and optional reflection; one render effect per element (`template()` then `update()`); `connected()` / `disconnected()` hooks. Use `declare` for typed props.
- `UIFormElement` (`core/form-element.ts`): form association through ElementInternals: `name`, value (`formValue()`), validity (`validate()`), `form`, `labels`, `checkValidity` / `reportValidity` / `setCustomValidity`, reset and restore, disabled by an ancestor `<fieldset>` (`isDisabled`). Errors show only after interaction or a blocked submit (`userInvalid`, `data-user-invalid`); author `error` shows at once.
- Slots (`components/slots.ts`): button, option, tag and chip sort children into `[data-part=leading|contents|trailing]`; `slot="leading"` / `slot="trailing"` mark icons; empty slots are hidden.
- Input modality (`core/modality.ts`): `<html data-modality="keyboard|pointer">`; focus rings show only after keyboard use.
- FOUC: undefined elements are hidden with their size reserved; a 1.5s reveal guards against a missing script (`styles/pending.ts`).

## Inventory

| Element | Role and behavior | Key attributes |
|---|---|---|
| `ui-button` | `role=button`; Enter/Space activate; submit/reset through the form | `type`, `disabled`, `loading`, `icon-size` |
| `ui-input` | contenteditable `role=textbox`; Enter submits; paste flattened; password masked, copy blocked | `label`, `value`, `type`, `placeholder`, `description`, `error`, `required`, `minlength`, `pattern`, `readonly` |
| `ui-select` | select-only combobox; popover listbox; APG keys; typeahead | `label`, `value`, `placeholder`, `description`, `error`, `required`, `gap` |
| `ui-listbox` | single-select listbox; selection follows focus; typeahead | `value`, `orientation`, `label`, `gap` |
| `ui-segmented` | horizontal listbox | same as listbox |
| `ui-option` | option for listbox/segmented/select, with slots | `value`, `disabled` |
| `ui-checkbox` | `role=checkbox`; Space toggles; mixed state | `checked`, `indeterminate`, `value`, `required` |
| `ui-radio` | `role=radio`; groups by `name`; arrows move and select; roving tab stop; group-wide required | `name`, `value`, `checked` |
| `ui-switch` | `role=switch`; Space/Enter toggle | `checked` |
| `ui-range` | `role=slider`; arrows, Page Up/Down (10%), Home/End, drag; exposes `--ui-ratio` | `value`, `min`, `max`, `step`, `label`, `value-text` |
| `ui-progress` | `role=progressbar`; indeterminate without `value` | `value`, `max`, `label` |
| `ui-badge` | static text; one character is a circle | |
| `ui-tag` | static label with slots | `icon-size` |
| `ui-chip` | `role=button`; `selectable` toggles `aria-pressed`; `removable` adds ✕, Delete/Backspace fire cancelable `remove` | `selectable`, `selected`, `removable`, `disabled` |
| `ui-swatch` | a color chip over a checkerboard; `role=img` | `color`, `label` |
| `ui-palette` | strip of swatches; with `name`/`selectable` a horizontal single-select listbox | `name`, `value`, `label`, `selectable` |
| `ui-swiper` | scroll-snap carousel; paddles and dots; `slidechange` event | `label`, `hover-controls`, `no-dots`, `no-paddles` |
| `ui-image` | cover formats, fit, position; author `<picture>`/`<source>` for file formats; `slideshow` makes an inline swiper | `src`, `srcset`, `sizes`, `alt`, `ratio`, `fit`, `position`, `slideshow` |
| containers | `ui-group`, `ui-collection`, `ui-tile`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`; CSS only | `size`, `gap` |

React counterparts exist for `Button` and `Input` (`/components/button/react`, `/components/input/react`).

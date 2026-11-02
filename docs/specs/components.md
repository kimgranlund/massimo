# Components

Light-DOM custom elements, registered on import (`@massimo/ui-kit/components/<name>/element`). No native form elements inside any of them. Lengths: [geometry](geometry.md). Colors: [color](color.md). Per-component API, anatomy and guidance: the manifests and guides in each component folder, through the [registry](registry.md).

## Foundations

- `UIElement` (`core/element.ts`): `static properties` become signal-backed properties with attribute parsing and optional reflection; one render effect per element (`template()` then `update()`); `connected()` / `disconnected()` hooks. Use `declare` for typed props.
- `UIFormElement` (`core/form-element.ts`): form association through ElementInternals: `name`, value (`formValue()`), validity (`validate()`), `form`, `labels`, `checkValidity` / `reportValidity` / `setCustomValidity`, reset and restore, disabled by an ancestor `<fieldset>` (`isDisabled`). Errors show only after interaction or a blocked submit (`userInvalid`, `data-user-invalid`); author `error` shows at once.
- Construction pattern (`components/slots.ts`): button, option, badge, tag, chip and the choices sort children into `[data-part=leading|prefix|contents|suffix|trailing]`; `slot="leading"` / `"trailing"` mark icons, `slot="prefix"` / `"suffix"` mark text adornments, the rest is the label; empty parts are hidden. The input control and select trigger have the same parts, filled from slotted children (`adoptAdornments`). Spacing: [geometry](geometry.md).
- Input modality (`core/modality.ts`): `<html data-modality="keyboard|pointer">`; focus rings show only after keyboard use.
- FOUC: undefined elements are hidden with their size reserved; a 1.5s reveal guards against a missing script (`styles/pending.ts`).

## Inventory

| Element | Role and behavior | Key attributes |
|---|---|---|
| `ui-button` | `role=button`; Enter/Space activate; submit/reset through the form | `type`, `disabled`, `loading`, `icon-size` |
| `ui-input` | contenteditable `role=textbox`; Enter submits; paste flattened; password masked, copy blocked; adornments via `slot` children | `label`, `value`, `type`, `placeholder`, `description`, `error`, `required`, `minlength`, `pattern`, `readonly` |
| `ui-select` | select-only combobox; popover listbox; APG keys; typeahead | `label`, `value`, `placeholder`, `description`, `error`, `required`, `gap` |
| `ui-listbox` | single-select listbox; selection follows focus; typeahead | `value`, `orientation`, `label`, `gap` |
| `ui-segmented` | horizontal listbox | same as listbox |
| `ui-option` | option for listbox/segmented/select, with slots | `value`, `disabled` |
| `ui-checkbox` | `role=checkbox`; Space toggles; mixed state | `checked`, `indeterminate`, `value`, `required` |
| `ui-radio` | `role=radio`; groups by `name`; arrows move and select; roving tab stop; group-wide required | `name`, `value`, `checked` |
| `ui-switch` | `role=switch`; Space/Enter toggle | `checked` |
| `ui-range` | `role=slider`; arrows, Page Up/Down (10%), Home/End, drag; exposes `--ui-ratio` | `value`, `min`, `max`, `step`, `label`, `value-text` |
| `ui-progress` | `role=progressbar`; indeterminate without `value` | `value`, `max`, `label` |
| `ui-badge` | static label with the construction pattern; never narrower than tall; spacing in u′ = height / 8 | `icon-size` |
| `ui-tag` | static label with slots | `icon-size` |
| `ui-chip` | `role=button`; `selectable` toggles `aria-pressed`; `removable` adds ✕, Delete/Backspace fire cancelable `remove` | `selectable`, `selected`, `removable`, `disabled` |
| `ui-swatch` | a color chip over a checkerboard; `role=img` | `color`, `label` |
| `ui-palette` | strip of swatches (row, or column with `orientation="vertical"`); with `name`/`selectable` a single-select listbox | `name`, `value`, `label`, `selectable`, `orientation` |
| `ui-swiper` | scroll-snap carousel; paddles and dots; `slidechange` event | `label`, `hover-controls`, `no-dots`, `no-paddles` |
| `ui-image` | cover formats, fit, position; author `<picture>`/`<source>` for file formats; `slideshow` makes an inline swiper | `src`, `srcset`, `sizes`, `alt`, `ratio`, `fit`, `position`, `slideshow` |
| containers | `ui-group`, `ui-collection`, `ui-tile`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`; CSS only | `size`, `gap` |

## Type

Buttons, form controls (input, select, listbox, segmented, option, checkbox, radio, switch, range, palette), badges, tags and chips use the UI voice: the Controls face (system-ui) unless `data-font-ui` repoints it ([typography](typography.md)). Field descriptions and errors use the caption role.

## States

Every state a component sets is styled in `styles/defaults.ts`, keyed on ARIA or `data-*` (never on a class), so React counterparts match. Transitions: [motion](motion.md).

| State | Hook | Look |
|---|---|---|
| hover / press | `:hover` / `:active` on enabled controls | neutral fill steps 3 → 4 → 5; on solids `accent.solidHover`; selected options `accent.subtleHover` |
| keyboard focus | `:focus-visible` after key use (`data-modality`) | 2px focus-ring outline; text fields keep it after a pointer click |
| highlighted option | `data-active` | neutral fill |
| selected / checked / mixed | `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current` | accent solid (choices, chips) or accent subtle (options); segmented: raised `bg` |
| open | trigger `aria-expanded=true` | pressed fill, chevron turned 180° |
| disabled | `aria-disabled=true` (host or control) | 50% opacity, `not-allowed` |
| busy | `aria-busy=true` (button) | readable, `progress` cursor, indeterminate sweep on the bottom edge |
| read-only | `aria-readonly=true` | subtle fill, default cursor |
| required | `[required]` field, `aria-required` checkbox/switch | ` *` in `danger.fg` after the label |
| invalid | `aria-invalid=true` | danger-tinted fill (palette: danger outline) |
| placeholder | `data-placeholder` | `fg.muted` |
| indeterminate | `data-indeterminate` (progress) | sweep; a faint full fill under reduced motion |
| unparsable color | `data-invalid` (swatch) | danger strike |
| failed image | `img[data-error]` | hidden; the frame's empty fill remains |
| forced colors | `@media (forced-colors: active)` | 1px `CanvasText` outline (no space), `Highlight` for on states, `GrayText` disabled |

React renderers are native HTML with the same anatomy and `data-ui="<name>"` on the host (`@massimo/ui-kit/components/<name>/react`): Button (`<button>`), Input (`<input>` in the control), Checkbox, Radio and Switch (`<input type=checkbox|radio>`, switch with `role=switch`, inside a `<label>`), Range (`<input type=range>` over the painted track), Progress (`<progress>`), Badge and Tag (`<span>`), Chip (`<button>`, `aria-pressed` when selectable), Swatch (`<span role=img>`), Palette (a radio group of native radios when selectable), Image (`<div>` + `<img>`; no slideshow yet) and the containers (`<div>`). The native element owns state, focus, keys and form value. Styles are not duplicated by hand: every rule for a `ui-*` tag gets a generated twin for its data-ui host, with ARIA state hooks mapped to the native input through `:has()` (`styles/native.ts`, e.g. `[aria-checked=true]` → `:has(> input:checked)`, `aria-invalid` → `input:user-invalid`). `apps/studio/react-check.html` compares each twin with its web component in the browser.

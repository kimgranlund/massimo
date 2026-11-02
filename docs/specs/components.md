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
| `ui-button` | `role=button`; Enter/Space activate; submit/reset through the form; `variant="primary"` paints the primary solid with contrast text | `type`, `variant`, `disabled`, `loading`, `icon-size` |
| `ui-input` | contenteditable `role=textbox`; Enter submits; paste flattened; password masked, copy blocked; adornments via `slot` children | `label`, `hide-label`, `value`, `type`, `placeholder`, `description`, `error`, `required`, `minlength`, `pattern`, `readonly` |
| `ui-select` | select-only combobox; popover listbox placed by CSS anchor positioning (script fallback); APG keys; typeahead | `label`, `hide-label`, `value`, `placeholder`, `description`, `error`, `required`, `gap` |
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
| `ui-field` | no role; its visible label (text + `unit`) names one slotted control: `aria-labelledby` on a host-role control, `labelledby` on ui-input / ui-select (forwarded to the editor or trigger); label press focuses or toggles; optional readout and description | `label`, `unit`, `readout`, `description`, `layout` (stacked, inline) |
| `ui-field-grid` | no role; columns label \| control \| readout shared by its ui-field rows (`subgrid`); other children (headings) span | |
| containers | `ui-group`, `ui-collection` (wrappers), `ui-card` (container), `ui-panel`, `ui-region`, `ui-page` (areas); CSS only | `size`, `gap`; card `padding` xs…xl |

## Type

Buttons, form controls (input, select, listbox, segmented, option, checkbox, radio, switch, range, palette), badges, tags and chips use the UI voice: the Controls face (system-ui) unless `data-font-ui` repoints it ([typography](typography.md)). Field descriptions and errors use the caption role.

## States

Every state a component sets is keyed on ARIA or `data-*` (never on a class) and styled in that component's slot recipe ([styles](#styles)) through the state conditions in `styles/conditions.ts` (`_checked`, `_indeterminate`, `_disabled`, `_enabled`, `_busy`, `_userInvalid`, `_keyboard`, plus Panda's `_pressed`, `_hover`, …). Each condition matches the web component's ARIA host and the React renderer's native element (`:has(> input:checked)`, `:disabled`, …), so one rule serves both. Transitions: [motion](motion.md).

| State | Hook | Look |
|---|---|---|
| hover / press | `:hover` / `:active` on enabled controls | neutral fill steps 3 → 4 → 5; on solids `primary.solidHover`; selected options `primary.subtleHover` |
| keyboard focus | `:focus-visible` after key use (`data-modality`) | 2px focus-ring outline; text fields keep it after a pointer click |
| highlighted option | `data-active` | neutral fill |
| selected / checked / mixed | `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current` | primary solid (choices, chips; the check, minus and radio dot use the contrast color `fg.onSolid`) or primary subtle (select popup options); listbox and segmented: `bg.selected` / `fg.selected` (neutral 1 with neutral 12 text in light, the primary solid with its contrast text in dark) |
| open | trigger `aria-expanded=true` | pressed fill, chevron turned 180° |
| disabled | `aria-disabled=true` (host or control) | 50% opacity, `not-allowed` |
| busy | `aria-busy=true` (button) | readable (no disabled fade), `progress` cursor, indeterminate sweep on the bottom edge (contrast color on primary) |
| read-only | `aria-readonly=true` | subtle fill, default cursor |
| required | `[required]` field, `aria-required` checkbox/switch | ` *` in `critical.fg` after the label |
| invalid | `aria-invalid=true` | critical-tinted fill (palette: critical outline) |
| placeholder | `data-placeholder` | `fg.subtle` (neutral 8) |
| indeterminate | `data-indeterminate` (progress) | sweep; a faint full fill under reduced motion |
| unparsable color | `data-invalid` (swatch) | critical strike |
| failed image | `img[data-error]` | hidden; the frame's empty fill remains |
| forced colors | `@media (forced-colors: active)` | 1px `CanvasText` outline (no space), `Highlight` for on states, `GrayText` disabled |

React renderers are native HTML with the same anatomy and `data-ui="<name>"` on the host (`@massimo/ui-kit/components/<name>/react`): Button (`<button>`), Input (`<input>` in the control), Checkbox, Radio and Switch (`<input type=checkbox|radio>`, switch with `role=switch`, inside a `<label>`), Range (`<input type=range>` over the painted track), Progress (`<progress>`), Badge and Tag (`<span>`), Chip (`<button>`, `aria-pressed` when selectable), Swatch (`<span role=img>`), Palette (a radio group of native radios when selectable), Image (`<div>` + `<img>`; `slideshow` uses the React Swiper), Swiper (scroll-snap viewport with native `<button>` paddles and dots), Select (a native `<select>` with customizable-select styling: the trigger is its `<button>`, the value `<selectedcontent>`, the popup `::picker(select)`, options rich `<option>`s; browsers without `appearance: base-select` show the platform select), the containers and Field / FieldGrid (`<div>`; Field's label is a `<label htmlFor>` and a render function hands the control its ids), and Listbox, Segmented and Option (ARIA listboxes on the shared `dom/listbox` helpers, the same semantics, keys and typeahead as the web components; a hidden input carries the form value). The native element owns state, focus, keys and form value. Both renderers call the same generated recipe function and put the same classes on host and parts; `data-ui` names the host and carries the geometry variables, but is not a styling hook. `apps/studio/react-check.html` compares each React renderer with its web component in the browser.

## Styles

Each component folder has one `<name>.recipe.ts` with a Panda config slot recipe per component (`theme.slotRecipes`, registered in `components/recipes.ts`): one class per part (`root` plus the parts the contract names, e.g. `ui-button__root`, `ui-button__leading`), declared `variants` for finite choices (button `variant` neutral | primary, chip `selectable`, palette `selectable` and `orientation`, image `ratio`, `fit` and `slideshow`), states through the conditions above, and the component's transitions and forced-colors rules. Shared pieces (the construction pattern, field parts, motion and forced-color helpers) are in `components/recipe-parts.ts`.

- **Web components** call the generated function (`styled-system/recipes/<name>.js`) in `update()` and set its classes on the host and parts (`components/classes.ts`; only the kit's classes are swapped, author classes stay). There is no runtime CSS, only class names. Tag selectors are not a styling hook; the FOUC guard (`styles/pending.ts`) stays tag-based.
- **React renderers** call the same function and spread the classes (`className`, and `classes` on `Parts`).
- **Plain HTML** uses the classes directly (`<button data-ui="button" class="ui-button__root ui-button__root--variant_primary">`).
- **Geometry stays a foundation**: the per-element variables (`--u`, `--h`, `--pad`, `--slot`, `--icon`, `--radius`, the btg ladder, `--track`) are global `:where()`/`:is()` rules in `styles/geometry.ts`; recipes read them and never hold a literal length. The composite geometry (list and popup padding, gap, radius, option height) and the layout containers are still global rules in `styles/geometry.ts` / `styles/defaults.ts`, with generated `data-ui` twins (`styles/native.ts`) for the React hosts.
- **Layers**: recipes are in Panda's `recipes` layer, above the global `base` layer, so a recipe always wins over a global rule; author CSS outside layers wins over both. Inside a recipe, the more specific selector wins, never stylesheet order.
- **Delivery**: `staticCss: { recipes: '*' }` emits every variant (web components pick variants at runtime, which extraction cannot see), and class names are not hashed. An app that renders the web components through its own Panda config needs the same two settings (the studio has them). `dist/ui-kit.css` is the all-in-one file; `dist/split/` holds the same CSS split per layer and per recipe (`styles/recipes/<name>.css`, imported by `dist/split/styles.css`).

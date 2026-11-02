# Components

Light-DOM custom elements, registered on import (`@massimo/ui-kit/components/<name>/element`). No native form elements inside any of them. Lengths: [geometry](geometry.md). Colors: [color](color.md). Per-component API, anatomy and guidance: the manifests and guides in each component folder, through the [registry](registry.md).

## Foundations

- `UIElement` (`core/element.ts`): `static properties` become signal-backed properties with attribute parsing and optional reflection; one render effect per element (`template()` then `update()`); `connected()` / `disconnected()` hooks. Use `declare` for typed props.
- `UIFormElement` (`core/form-element.ts`): form association through ElementInternals: `name`, value (`formValue()`), validity (`validate()`), `form`, `labels`, `checkValidity` / `reportValidity` / `setCustomValidity`, reset and restore, disabled by an ancestor `<fieldset>` (`isDisabled`). Errors show only after interaction or a blocked submit (`userInvalid`); author `error` shows at once. The host carries the field state as data-* ([state attributes](#state-attributes)): `data-disabled`, `data-readonly`, `data-required`, `data-valid` / `data-invalid` (once shown), `data-dirty` (value differs from the first render), `data-touched` (left once; a choice also on activation), `data-filled` (non-empty value; a choice: checked), `data-focused` (focus within). `static fieldState = false` opts out (ui-button).
- Construction pattern (`components/slots.ts`): button, option, badge, tag, chip and the choices sort children into `[data-part=leading|prefix|contents|suffix|trailing]`; `slot="leading"` / `"trailing"` mark icons, `slot="prefix"` / `"suffix"` mark text adornments, the rest is the label; empty parts are hidden. The input control and select trigger have the same parts, filled from slotted children (`adoptAdornments`). Spacing: [geometry](geometry.md).
- Input modality (`core/modality.ts`): `<html data-modality="keyboard|pointer">`; focus rings show only after keyboard use.
- FOUC: undefined elements are hidden with their size reserved; a 1.5s reveal guards against a missing script (`styles/pending.ts`).

## Inventory

| Element | Role and behavior | Key attributes |
|---|---|---|
| `ui-button` | `role=button`; Enter/Space activate; submit/reset through the form; `variant="primary"` paints the primary solid with contrast text | `type`, `variant`, `disabled`, `loading`, `icon-size` |
| `ui-input` | contenteditable `role=textbox`; Enter submits; paste flattened; password masked, copy blocked; adornments via `slot` children | `label`, `hide-label`, `value`, `type`, `placeholder`, `description`, `error`, `required`, `minlength`, `pattern`, `readonly` |
| `ui-select` | select-only combobox; popover listbox placed by CSS anchor positioning (script fallback) with Base UI's positioner variables (`--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`; CSS where anchored, px from script otherwise, CSS only on the React picker: [select guide](../../packages/ui-kit/components/select/select.md#popup-variables)); APG keys; typeahead | `label`, `hide-label`, `value`, `placeholder`, `description`, `error`, `required`, `gap` |
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
| `ui-field` | no role; its visible label (text + `unit`) names one slotted control: `aria-labelledby` on a host-role control, `labelledby` on ui-input / ui-select (forwarded to the editor or trigger); label press focuses or toggles; optional readout and description | `label`, `unit`, `readout`, `description`, `error`, `layout` (stacked, inline) |
| `ui-field-grid` | no role; columns label \| control \| readout shared by its ui-field rows (`subgrid`); other children (headings) span | |
| `ui-collapsible` | a role=button trigger (aria-expanded, aria-controls) shows and hides one panel; Enter / Space or a press toggle it and fire a cancelable `openchange`; the panel's height animates in CSS (reveal intent) | `label`, `open`, `default-open`, `disabled` |
| `ui-accordion` | stacks `ui-collapsible` items (heading header, region panel); owns their open state (`value` = open item values; `multiple`); a press fires the item's `openchange`, then a cancelable `change`; arrow keys, Home, End move focus between triggers (all stay in the tab order) | `value`, `default-value`, `multiple`, `disabled`, `orientation` |
| containers | `ui-group`, `ui-collection` (wrappers), `ui-card` (container), `ui-panel`, `ui-region`, `ui-page` (areas); CSS only | `size`, `gap`; card `padding` xs…xl |

### Part names

`data-part` values (and the slot recipe's slot names) follow [Base UI](https://base-ui.com) anatomy where Base UI has an equivalent part; the construction-pattern parts (`leading`, `prefix`, `contents`, `suffix`, `trailing`) keep their names inside them, except where a Base UI part takes their place (the select trigger's value and icon). Renamed parts:

| Component | Old `data-part` | New `data-part` (Base UI part) | Graph ID |
|---|---|---|---|
| `ui-select` / Select | trigger › `contents` | trigger › `value` (Select.Value) | `part:select-value` |
| `ui-select` / Select | trigger › `trailing` (chevron) | trigger › `icon` (Select.Icon) | `part:select-icon` (was `part:select-chevron`) |
| `ui-select` | popup › `ui-option` | popup › `list` › `ui-option` (Select.Popup › List › Item); web component only, the native select has no list | `part:select-list` (new) |
| `ui-checkbox`, `ui-radio` / Checkbox, Radio | leading › `box` | leading › `indicator` (Checkbox.Indicator, Radio.Indicator; the radio dot stays its `::after`) | `part:choice-indicator` (was `part:choice-box`) |
| `ui-switch` / Switch | leading › `box` (track) with the knob as `::after` | leading › `indicator` › `thumb` (Switch.Thumb, now an element) | `part:choice-indicator`, `part:switch-thumb` (new) |
| `ui-range`, `ui-progress` / Range, Progress | track › `fill` | track › `indicator` (Slider.Indicator, Progress.Indicator) | `part:track-indicator` (was `part:track-fill`) |

Unchanged because they already carry the Base UI name: `label`, `description`, `error` (Field.Label, Description, Error), select `trigger` and `popup`, range `track` and `thumb`. Kept because Base UI has no equivalent: the input `control`, field `readout`, swiper `viewport`, `paddle`, `dots`, `dot`, image `slide`, chip `remove`. Base UI's `Select.ItemText` is an option's construction-pattern `contents`; `Select.ItemIndicator` is an opt-in React part in the option's `trailing` slot (the presets and the web component's options draw no check indicator). The field's `error` part (Base UI Field.Error) is new on `ui-field`, created once its `error` is set.

## Events and values

Value-bearing components take [Base UI](https://base-ui.com)'s props and report changes with Base UI's event details (`dom/events.ts`: `{ reason, event }`, `ChangeReason`):

- **Values**: `value` and `defaultValue` (attribute `default-value`) on `ui-input`, `ui-select`, `ui-listbox`, `ui-segmented`, `ui-palette` and `ui-range`; `checked` and `defaultChecked` (`default-checked`) on the choices. The default sets the first value when no value attribute or property did, and is the value form reset returns to; without it the value attribute is the default, like a native input's (`settleDefault`, `core/form-element.ts`). `ui-select` also has `open` and `defaultOpen` (`default-open`); setting `open` shows or hides the popup without an event.
- **Disclosure**: `ui-collapsible` has `open` and `defaultOpen` (`default-open`); a trigger press fires `openchange` (cancelable) with `{ open, reason: 'trigger-press', event }`; React `onOpenChange(open, details)`. `ui-accordion` has `value` (comma-separated open item values; React `string[]`) and `defaultValue`; it fires a cancelable `change` with `{ value: string[], reason: 'trigger-press', event }`; React `onValueChange(value, details)`.
- **Web component events**: `change` (and `input`, which ui-range and ui-input fire on every change and the others with `change`) are `CustomEvent`s whose `detail` is `{ value, reason, event }`: choices `{ checked, value, reason, event }`, a selectable chip's `change` `{ pressed, reason, event }`. `ui-select` fires `openchange` (cancelable: `preventDefault` keeps the popup as it is) with `{ open, reason, event }`. `event` is the DOM event that caused the change.
- **React**: Checkbox, Radio, Switch `onCheckedChange(checked, details)`; Input, Listbox, Segmented, Palette, Select `onValueChange(value, details)`; Range `onValueChange` and `onValueCommitted` (the native change event); Chip `onSelectedChange(selected, details)`; Select `open`, `defaultOpen` and `onOpenChange(open, details)` within what the native select allows (`showPicker` needs user activation and cannot close; the open state is reread from `select:open`). The native `onChange` still fires.
- **Reasons** (Base UI's names): `item-press` (an option or swatch pressed, or Enter / Space on the highlighted option), `keyboard` (arrow, Home / End, Page or typeahead keys in a listbox, palette or range), `list-navigation` (a navigation key opened the select), `trigger-press`, `outside-press`, `escape-key`, `focus-out` (blur; Tab commits the highlighted option), `track-press` and `drag` (range), `none` (checkbox, radio, switch, chip, input: Base UI's only reason for them). Both renderers report the same reason for the same interaction (`test/events.test.ts`).

## Composition

Base UI alignment: level 0 (data-* state attributes), 1 (part names), 2 (popup positioner variables), 3 (events and props: `{ value, reason, event }`, `onValueChange(value, details)`, `open` / `defaultOpen`) and 4 (compound parts, this section) are done.

Every component with parts can be written two ways, and both render the same DOM, recipe classes and data-* (`test/composition.test.ts`, both renderers; `react-check.html` compares their computed geometry):

- **Presets**: the one-element forms (`<ui-select label …>`, `<Select label leading prefix …>`, `<Checkbox>`, `<Range>`). They are unchanged; in React each is composed from its parts.
- **Parts**: the anatomy written out, Base UI style.

| React | Parts (Base UI names; ours in italics) |
|---|---|
| Select | `Select.Root`, `Select.Label`, `Select.Trigger`, `Select.Value`, `Select.Icon`, `Select.Popup`, `Select.List`, `Select.Item`, `Select.ItemText`, `Select.ItemIndicator`, *`Select.Description`*, *`Select.Error`* |
| Checkbox, Radio, Switch | `Checkbox.Root` / `Checkbox.Indicator`, `Radio.Root` / `Radio.Indicator`, `Switch.Root` / `Switch.Thumb` |
| Slider (alias Range), Progress | `Slider.Root`, `Slider.Track`, `Slider.Indicator`, `Slider.Thumb`; `Progress.Root`, `Progress.Track`, `Progress.Indicator` |
| Field | `Field.Root`, `Field.Label` (*`unit`*), `Field.Control`, `Field.Description`, `Field.Error`, *`Field.Readout`* |
| Input | *`Input.Root`*, *`Input.Label`*, *`Input.Control`*, *`Input.Description`*, *`Input.Error`* (Base UI's Field parts on the input's own recipe) |
| Listbox, Segmented | `Listbox.Root`, `Listbox.Item`, `Listbox.ItemText`, `Listbox.ItemIndicator`; `Segmented.Root`, `Segmented.Item`, `Segmented.ItemText` (`Listbox`, `Segmented`, `Option` are the same components) |
| Button | one part: `Button` |
| Collapsible | `Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Panel` |
| Accordion | `Accordion.Root` (alias `Accordion`), `Accordion.Item` (with `label`: a preset item), `Accordion.Header`, `Accordion.Trigger`, `Accordion.Panel` |

- **render** (`components/compound.react.tsx`, `renderPart`): an element, whose props are merged with the part's (classes join, styles merge, handlers and refs both run, its other props win), or `(props, state) => element`. The recipe class, `data-part` and the data-* state stay on whatever renders.
- **className**: a string, or `(state) => string`; added after the recipe class. The state is the part's data-* state as camelCase values (`data-popup-open` → `popupOpen: true`, `data-orientation="vertical"` → `orientation: 'vertical'`); every part receives its Root's state (an item its own: `selected`, `highlighted`, `disabled`).
- **Context**: a Root shares its recipe classes, state and wiring with its parts; a part outside its Root throws. Parts a Root must see (Select's Label, Trigger, Popup, Description and Error; Field's and Input's Label, Description and Error; Listbox items) are its direct children.
- **Native elements stay where the React renderer had them**, behind the parts, and these cannot be separate parts: the checkbox / radio / switch `<input>` (rendered by the Root: the `<label>` host makes a press on the text toggle it), the range `<input>` (rendered by `Slider.Thumb` after the painted thumb, as Base UI's Thumb holds its input: it takes keys, pointer and the form value), `<progress>` (rendered by `Progress.Root`), the text `<input>` (inside `Input.Control`; its props come from `Input.Root`) and the customizable `<select>` (rendered by `Select.Root`, which moves `Select.Trigger` and the items inside it; `Select.Popup` and `Select.List` render no element, because the browser draws `::picker(select)` and the options are the select's children, so they take neither `render` nor `className`). `Field.Control` renders no element either: it hands the ids to its control.
- **Manifests**: `renderers.react.parts` lists each compound part with its props, generated from the `Name.Part = Impl;` lines ([registry](registry.md#generated-manifest-fields)).

**Web components** take the parts as `[data-part]` children instead of new tags: the same names the generated anatomy uses, so there is nothing new to register, guard against FOUC (`styles/pending.ts` is tag-based and unchanged) or scope for geometry, and zero native form elements as before.

```html
<ui-select><div data-part="trigger"><span data-part="value">Choose…</span><span data-part="icon"><i name="caret-up-down"></i></span></div>
  <div data-part="popup"><div data-part="list"><ui-option value="a">A</ui-option></div></div></ui-select>
```

When a part is present, the host adopts it (`components/slots.ts`): templated hosts (ui-select, ui-input, ui-range, ui-progress) collect the authored parts at connect and, after rendering their anatomy, copy each one's attributes and author classes onto the generated part with the same `data-part` path (`adoptPart`; never `data-part`, `hidden` or kit recipe classes) and move its content for content parts (the select and input slots, the select icon, the range thumb). Text stands for a property at the first connect: label, description and error (select, input, field; the field's unit and readout too) and the select value's placeholder. The construction-pattern hosts (button, option, choices, badge, tag, chip) keep authored `span[data-part]` slots and their loose children (`claimSlots`); a choice keeps an authored indicator (alone or in `leading`) and fills it when empty. ui-field keeps its authored label, readout, description and error parts. Parts that are absent are generated as before, so markup without them renders exactly as it did. The host still owns roles, ARIA, ids and state attributes on adopted parts.

## Type

Buttons, form controls (input, select, listbox, segmented, option, checkbox, radio, switch, range, palette), badges, tags and chips use the UI voice: the Controls face (system-ui) unless `data-font-ui` repoints it ([typography](typography.md)). Field descriptions and errors use the caption role.

## States

Every state a component sets is a `data-*` presence attribute with a [Base UI](https://base-ui.com) name (never a class), set on the same host or part by both renderers and styled in that component's slot recipe ([styles](#styles)) through the state conditions in `styles/conditions.ts` (`_checked`, `_unchecked`, `_indeterminate`, `_disabled`, `_enabled`, `_readOnly`, `_required`, `_invalid`, `_valid`, `_dirty`, `_touched`, `_filled`, `_focused`, `_busy`, `_pressed`, `_popupOpen`, `_open`, `_closed`, `_highlighted`, `_selected`, `_dragging`, `_complete`, `_progressing`, `_keyboard`, plus Panda's `_hover`, …). ARIA stays on both renderers for semantics; styles key on data-*. Web components set the attributes in `update()` (`UIFormElement` the field state); React renderers set them as props from React state (`components/state.react.ts`: the host listens to focus, blur, input, change, invalid and form reset on its native control; a radio rereads itself on any change in its group). The shared maps are in `dom/state.ts` (`fieldDataAttrs`, `checkedDataAttrs`, `popupDataAttrs`) and the headless helpers (`optionAttrs`, `comboboxAttrs`, `buttonAttrs`, `listboxAttrs`, `rangeDataAttrs`, `progressState`). The contract is `contracts/states.json`; `test/state-parity.test.ts` checks that both renderers set the same names for the same state, and `react-check.html` compares them in the browser. Transitions: [motion](motion.md).

### State attributes

Base UI = the same name for the same state in Base UI; **ours** = a name Base UI does not have. Field state = `data-disabled`, `data-required`, `data-valid` / `data-invalid`, `data-dirty`, `data-touched`, `data-filled`, `data-focused` (Base UI Field; all Base UI names).

| Element (React) | Host | Parts | Base UI? |
|---|---|---|---|
| `ui-button` (Button) | `data-disabled`, `data-busy` | | `data-busy` ours |
| `ui-chip` (Chip) | `data-disabled`, `data-pressed` (selected) | | Base UI Toggle |
| `ui-checkbox` (Checkbox) | `data-checked` / `data-unchecked` / `data-indeterminate` (instead of either), field state | | Base UI Checkbox |
| `ui-radio`, `ui-switch` (Radio, Switch) | `data-checked` / `data-unchecked`, field state | | Base UI Radio, Switch |
| `ui-input` (Input) | field state, `data-readonly` | | Base UI Field / Input |
| `ui-select` (Select) | field state | trigger `data-popup-open`, `data-pressed` (while open), `data-placeholder` (also on its `value`), `data-disabled`; popup `data-open` / `data-closed`, `data-side` (bottom, top), `data-align` (start); options `data-selected`, `data-highlighted`, `data-disabled` | Base UI Select; these part attributes are web component only (React: native, below; the React parts' className functions receive the host's field state, an item `selected` / `disabled`) |
| `ui-listbox`, `ui-segmented` (Listbox, Segmented) | field state, `data-orientation` | options `data-selected`, `data-highlighted`, `data-disabled` | Base UI Select.Item and Radio Group names (Base UI has no listbox) |
| `ui-range` (Range) | field state, `data-orientation`, `data-dragging` | | Base UI Slider |
| `ui-progress` (Progress) | `data-indeterminate` / `data-progressing` / `data-complete` | | Base UI Progress |
| `ui-palette` (Palette) | field state, `data-orientation` | swatches `data-selected`, `data-highlighted` (while the palette has focus) | Base UI names on a component of ours |
| `ui-swatch` (Swatch) | `data-alpha` (translucent), `data-invalid` (unparsable color) | | `data-alpha` ours |
| `ui-swiper` (Swiper) | `data-single` | dots `data-selected` (current slide); paddles `data-disabled` | `data-single` ours; Base UI has no carousel |
| `ui-image` (Image) | | `img[data-error]` | ours |
| `ui-collapsible` (Collapsible) | `data-open` / `data-closed`, `data-disabled` | trigger `data-panel-open`, `data-disabled`; panel `data-open` / `data-closed` | Base UI Collapsible |
| `ui-accordion` (Accordion) | `data-orientation`, `data-disabled` | items (ui-collapsible) `data-open` / `data-closed`, `data-disabled`; header `data-open`, `data-disabled`; trigger `data-panel-open`, `data-disabled`; panel `data-open` / `data-closed`, `data-disabled`, `data-orientation` (all with structural `data-index`) | Base UI Accordion |
| `ui-field` (Field) | none; reads its control's `data-disabled` / `data-required` (`:has`) | | |

Where a React renderer keeps a native pseudo-class, and why: `:disabled` beside `data-disabled` for a native control disabled by an ancestor `<fieldset disabled>`, which React cannot see; the React Select's open state (`select:open`), its options' selection and highlight (`:checked`, `:focus`) and its popup (`::picker(select)`), because the browser owns the customizable select's picker and reports none of it to script (a native select has no placeholder either). React validity is read from the native control's constraint validation when the host sets `data-valid` / `data-invalid`, so both renderers show errors at the same moment (blur or a blocked submit), not at `:user-invalid` time. Not implemented: `data-starting-style` / `data-ending-style` (the select popup's enter and exit stay on `@starting-style` and `allow-discrete` transitions with the reveal intent).

| State | Hook | Look |
|---|---|---|
| hover / press | `:hover` / `:active` on `_enabled` controls (not `data-disabled`, not `data-busy`) | neutral fill steps 3 → 4 → 5; on solids `primary.solidHover`; selected options `primary.subtleHover` |
| keyboard focus | `:focus-visible` after key use (`data-modality`) | 2px focus-ring outline; text fields keep it after a pointer click |
| highlighted option | `data-highlighted` | neutral fill (swatch: focus-ring outline under keyboard modality) |
| selected / checked / mixed | `data-checked`, `data-indeterminate`, `data-selected`, `data-pressed` | primary solid (choices, chips; the check, minus and radio dot use the contrast color `fg.onSolid`) or primary subtle (select popup options); listbox and segmented: `bg.selected` / `fg.selected` (neutral 1 with neutral 12 text in light, the primary solid with its contrast text in dark) |
| open | trigger `data-popup-open` (React: `select:open`) | pressed fill, chevron turned 180° |
| disabled | `data-disabled` (host, option or paddle) | 50% opacity, `not-allowed` |
| busy | `data-busy` (button) | readable (no disabled fade), `progress` cursor, indeterminate sweep on the bottom edge (contrast color on primary) |
| read-only | `data-readonly` | subtle fill, default cursor |
| required | `data-required` | ` *` in `critical.fg` after the label |
| invalid | `data-invalid` (after blur or a blocked submit; an author error at once) | critical-tinted fill (palette: critical outline) |
| dragging | `data-dragging` (range) | grabbing cursor, raised thumb; thumb and fill follow the pointer 1:1 |
| placeholder | `data-placeholder` | `fg.subtle` (neutral 8) |
| indeterminate | `data-indeterminate` (progress) | sweep; a faint full fill under reduced motion |
| unparsable color | `data-invalid` (swatch) | critical strike |
| failed image | `img[data-error]` | hidden; the frame's empty fill remains |
| forced colors | `@media (forced-colors: active)` | 1px `CanvasText` outline (no space), `Highlight` for on states, `GrayText` disabled |

React renderers are native HTML with the same anatomy and `data-ui="<name>"` on the host (`@massimo/ui-kit/components/<name>/react`): Button (`<button>`), Input (`<input>` in the control), Checkbox, Radio and Switch (`<input type=checkbox|radio>`, switch with `role=switch`, inside a `<label>`), Range (`<input type=range>` over the painted track), Progress (`<progress>`), Badge and Tag (`<span>`), Chip (`<button>`, `aria-pressed` when selectable), Swatch (`<span role=img>`), Palette (a radio group of native radios when selectable), Image (`<div>` + `<img>`; `slideshow` uses the React Swiper), Swiper (scroll-snap viewport with native `<button>` paddles and dots), Select (a native `<select>` with customizable-select styling: the trigger is its `<button>`, the value `<selectedcontent>`, the popup `::picker(select)`, options rich `<option>`s; browsers without `appearance: base-select` show the platform select), the containers and Field / FieldGrid (`<div>`; Field's label is a `<label htmlFor>` and a render function hands the control its ids), and Listbox, Segmented and Option (ARIA listboxes on the shared `dom/listbox` helpers, the same semantics, keys and typeahead as the web components; a hidden input carries the form value). The native element owns state, focus, keys and form value; the host mirrors it as the data-* state attributes above. Both renderers call the same generated recipe function and put the same classes on host and parts; `data-ui` names the host and carries the geometry variables, but is not a styling hook. `apps/studio/react-check.html` compares each React renderer with its web component in the browser, and each composed form with its preset. The compound parts that compose these renderers: [composition](#composition).

## Styles

Each component folder has one `<name>.recipe.ts` with a Panda config slot recipe per component (`theme.slotRecipes`, registered in `components/recipes.ts`): one class per part (`root` plus the parts the contract names, e.g. `ui-button__root`, `ui-button__leading`), declared `variants` for finite choices (button `variant` neutral | primary, chip `selectable`, palette `selectable` and `orientation`, image `ratio`, `fit` and `slideshow`), states through the conditions above, and the component's transitions and forced-colors rules. Shared pieces (the construction pattern, field parts, motion and forced-color helpers) are in `components/recipe-parts.ts`.

- **Web components** call the generated function (`styled-system/recipes/<name>.js`) in `update()` and set its classes on the host and parts (`components/classes.ts`; only the kit's classes are swapped, author classes stay). There is no runtime CSS, only class names. Tag selectors are not a styling hook; the FOUC guard (`styles/pending.ts`) stays tag-based.
- **React renderers** call the same function and spread the classes (`className`, and `classes` on `Parts`).
- **Plain HTML** uses the classes directly (`<button data-ui="button" class="ui-button__root ui-button__root--variant_primary">`).
- **Geometry stays a foundation**: the per-element variables (`--u`, `--h`, `--pad`, `--slot`, `--icon`, `--radius`, the btg ladder, `--track`) are global `:where()`/`:is()` rules in `styles/geometry.ts`; recipes read them and never hold a literal length. The composite geometry (list and popup padding, gap, radius, option inset and height) is part of the listbox, segmented, option and select recipes (`composite`, `compositeOption` in `recipe-parts.ts`). `--ui-gap` (set by the `gap` attribute) is registered as a non-inheriting property (`geometryProperties`), so the attribute wins on its own element only, with no per-tag reset; the select popup takes its host's value explicitly.
- **CSS-only tags** (the layout containers `ui-group` … `ui-page`, `components/container/container.recipe.ts`) run no script, so nothing would put classes on them. Their recipes are also emitted as global rules on the tags (`containerTags`, built by `tagRules` in `recipe-parts.ts` from the same recipe objects): the base and default variants on `ui-card`, every other variant on `ui-card[padding=xs]`, `&` in nested selectors becoming the tag. React and plain HTML use the classes (`ui-card__root ui-card__root--padding_sm`). One source, no FOUC (the tag rules apply before any script, as before) and no script; the trade-off is that the container CSS is emitted twice (tag rules in the `base` layer, classes in `recipes`, about 4 KB with the composite now in four recipes), and the tag rules keep tag specificity (`ui-card`, `ui-card[padding=sm]`) like the global rules they replace. Only root-only recipes can be aliased this way (`tagRules` throws otherwise). There are no generated twins left: `styles/native.ts` is gone.
- **Layers**: recipes are in Panda's `recipes` layer, above the global `base` layer, so a recipe always wins over a global rule; author CSS outside layers wins over both. Inside a recipe, the more specific selector wins, never stylesheet order.
- **Delivery**: `staticCss: { recipes: '*' }` emits every variant (web components pick variants at runtime, which extraction cannot see), and class names are not hashed. An app that renders the web components through its own Panda config needs the same two settings (the studio has them). `dist/ui-kit.css` is the all-in-one file; `dist/split/` holds the same CSS split per layer and per recipe (`styles/recipes/<name>.css`, imported by `dist/split/styles.css`).

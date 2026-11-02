// Panda conditions: the state vocabulary shared by both renderers, keyed on the data-* state contract
// (Base UI names, dom/state.ts). Web components set the attributes in update() (UIFormElement for the
// field state); React renderers set the same attributes on the same hosts from React state
// (components/state.react.ts). ARIA stays on both for semantics; styles key on data-*.
// Native pseudo-classes remain only where the browser holds state React cannot see:
//   disabled / enabled: a native control disabled by an ancestor <fieldset disabled> (:disabled).
// Names that Panda also defines (checked, disabled, invalid, …) are replaced, not extended: their
// built-in clauses (:checked, [aria-checked], …) are not part of the contract. The scheme conditions
// (osDark, dark, light) live in the preset.
const DISABLED = '[data-disabled], :disabled, :has(> :is(input, select):disabled)';

export const conditions = {
  /** Keyboard modality (core/modality.ts): focus rings and highlighted-option outlines. */
  keyboard: ':root[data-modality=keyboard] &',
  // ── Choices (Base UI Checkbox, Radio, Switch) ──
  checked: '&[data-checked]',
  unchecked: '&[data-unchecked]',
  indeterminate: '&[data-indeterminate]',
  // ── Field state (Base UI Field) ──
  disabled: `&:is(${DISABLED})`,
  /** Interactive: neither disabled nor busy (Panda's own enabled is :enabled only). */
  enabled: `&:not(${DISABLED}, [data-busy])`,
  readOnly: '&[data-readonly]',
  required: '&[data-required]',
  /** Invalid once shown: after interaction or a blocked submit, or an author error at once. */
  invalid: '&[data-invalid]',
  valid: '&[data-valid]',
  dirty: '&[data-dirty]',
  touched: '&[data-touched]',
  filled: '&[data-filled]',
  focused: '&[data-focused]',
  // ── Buttons, toggles, popups and items ──
  /** Busy (loading) controls: data-busy (ours; aria-busy for semantics). */
  busy: '&[data-busy]',
  /** A toggle that is on (Base UI Toggle; chip selectable). */
  pressed: '&[data-pressed]',
  /** A trigger whose popup is open (Base UI Select.Trigger). */
  popupOpen: '&[data-popup-open]',
  open: '&[data-open]',
  closed: '&[data-closed]',
  /** The keyboard-highlighted item (Base UI Select.Item; replaces data-active). */
  highlighted: '&[data-highlighted]',
  selected: '&[data-selected]',
  dragging: '&[data-dragging]',
  complete: '&[data-complete]',
  progressing: '&[data-progressing]',
} as const;

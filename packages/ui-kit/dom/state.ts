// The data-* state contract (Base UI names, https://base-ui.com): state as presence attributes that
// styles key on. ARIA stays for semantics; data-* is the styling hook. Web components apply these
// maps in update() (applyAttrs); React spreads them (toReactProps). Present = '' , absent = undefined,
// so both renderers write the same markup (data-checked="").
import type { Attrs } from './attrs.ts';
import type { Align, Side } from './floating.ts';

const on = (v: unknown) => (v ? '' : undefined);

export interface FieldDataState {
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  /** Validity once shown: true valid, false invalid, null not validated yet (neither attribute). */
  valid?: boolean | null;
  /** The value differs from the initial value. */
  dirty?: boolean;
  /** The user has left the control once (blur), or activated a choice. */
  touched?: boolean;
  /** The value is not empty (a choice: checked). */
  filled?: boolean;
  /** Focus is within the control. */
  focused?: boolean;
}

/** Field state on a form control's host (Base UI Field: data-disabled … data-focused). */
export function fieldDataAttrs(s: FieldDataState): Attrs {
  return {
    'data-disabled': on(s.disabled),
    'data-readonly': on(s.readonly),
    'data-required': on(s.required),
    'data-valid': on(s.valid === true),
    'data-invalid': on(s.valid === false),
    'data-dirty': on(s.dirty),
    'data-touched': on(s.touched),
    'data-filled': on(s.filled),
    'data-focused': on(s.focused),
  };
}

/**
 * Checkbox, radio and switch: data-checked or data-unchecked; an indeterminate checkbox carries
 * data-indeterminate instead of either (Base UI Checkbox).
 */
export function checkedDataAttrs(checked: boolean, indeterminate = false): Attrs {
  return {
    'data-checked': on(!indeterminate && checked),
    'data-unchecked': on(!indeterminate && !checked),
    'data-indeterminate': on(indeterminate),
  };
}

/**
 * Popup state (Base UI Select popup, and every floating layer's positioner and popup): data-open or
 * data-closed, the side it sits on, its alignment.
 */
export function popupDataAttrs(s: { open: boolean; side?: Side; align?: Align }): Attrs {
  return {
    'data-open': on(s.open),
    'data-closed': on(!s.open),
    'data-side': s.open ? s.side : undefined,
    'data-align': s.open ? s.align : undefined,
  };
}

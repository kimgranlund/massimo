// UIFormElement: base for form-associated custom elements (no native form controls inside).
// Handles form value, validity, reset/restore, `name`, disabled-by-fieldset, and when to
// show errors: only after the user has left the field or tried to submit, never on load.
// The host carries the field state as data-* (Base UI Field names, dom/state.ts): data-disabled,
// data-readonly, data-required, data-valid / data-invalid (once shown), data-dirty, data-touched,
// data-filled, data-focused.
import { UIElement } from './element.ts';
import { effect, signal } from './signals.ts';
import { applyAttrs } from '../dom/attrs.ts';
import { fieldDataAttrs } from '../dom/state.ts';

export interface Problem { flags: ValidityStateFlags; message: string }

/**
 * Base UI's value / defaultValue (checked / defaultChecked) at connect. A default given as an
 * attribute (`default-value`, `default-checked`) or property sets the value unless the value
 * was set too (its attribute, or a property differing from `initial`); without one, the value
 * attribute is the default, like a native input's, else `fallback`. Reset returns to the default.
 */
export function settleDefault(el: any, initial: unknown, fallback: unknown = initial, key = 'value', defKey = key === 'checked' ? 'defaultChecked' : 'defaultValue') {
  if (el[defKey] != null) {
    if (!el.hasAttribute(key) && Object.is(el[key], initial)) el[key] = el[defKey];
    return;
  }
  el[defKey] = el.hasAttribute(key) ? el[key] : fallback;
}

export class UIFormElement extends UIElement {
  static formAssociated = true;
  /** Set the field state data-* on the host (false for controls without a value, such as a button). */
  static fieldState = true;
  static properties = {
    name: { type: String, default: '', reflect: true }, // the form reads the attribute
    disabled: { type: Boolean, default: false, reflect: true },
    required: { type: Boolean, default: false, reflect: true },
  };
  declare name: string;
  declare disabled: boolean;
  declare required: boolean;

  readonly internals: ElementInternals = this.attachInternals();
  #formDisabled = signal(false);
  /** Errors are shown: the user left the field, activated it, or a submit was blocked. */
  #shown = signal(false);
  /** The user left the field (or activated a choice) at least once. */
  #touched = signal(false);
  #focused = signal(false);
  #custom = signal('');
  /** The form value at the first render, for data-dirty. */
  #initial: string | undefined;
  #stopForm?: () => void;

  // ── Native-like API ──
  get form() { return this.internals.form; }
  get labels() { return this.internals.labels; }
  get validity() { return this.internals.validity; }
  get validationMessage() { return this.internals.validationMessage; }
  get willValidate() { return this.internals.willValidate; }
  checkValidity() { return this.internals.checkValidity(); }
  reportValidity() { this.#shown.value = true; return this.internals.reportValidity(); }
  setCustomValidity(message: string) { this.#custom.value = message; }

  /** Disabled by its own attribute or by a disabled ancestor <fieldset>. Reactive. */
  get isDisabled() { return this.disabled || this.#formDisabled.value; }
  /** The current validation problem, if any. Reactive. */
  get problem(): Problem | null {
    if (this.isDisabled) return null;
    const custom = this.#custom.value;
    return custom ? { flags: { customError: true }, message: custom } : this.validate();
  }
  /** Invalid and the user has interacted or tried to submit: the moment to show an error. Reactive. */
  get userInvalid() { return this.#shown.value && !!this.problem; }
  /** The error to show now: the author error (subclasses with an `error` property), else a shown problem. Reactive. */
  get invalidShown() { return !!this.authorError() || this.userInvalid; }
  /** The user has left the field (or activated a choice) at least once. Reactive. */
  get touched() { return this.#touched.value; }
  /** Focus is within the host. Reactive. */
  get focused() { return this.#focused.value; }
  markTouched() { this.#touched.value = true; this.#shown.value = true; }

  // ── Subclass hooks ──
  /** Value submitted with the form; null submits nothing. */
  formValue(): string | File | FormData | null { return null; }
  /** Built-in checks (required, pattern, …). Read reactive props only. */
  validate(): Problem | null { return null; }
  /** Element the browser points at when it reports a validation error. */
  validationAnchor(): HTMLElement | undefined { return undefined; }
  /** Restore the initial value on form reset. */
  resetValue() {}
  /** Restore a value after navigation or autofill restore. */
  restoreValue(_state: unknown) {}
  /** An author error shown at once (input and select `error`). Read reactive props only. */
  authorError(): string { return ''; }
  /** Read-only (input `readonly`). */
  isReadonly(): boolean { return false; }
  /** data-filled: a non-empty form value (a choice: checked). */
  isFilled(): boolean { const v = this.formValue(); return v != null && v !== ''; }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('invalid', this.#onInvalid);
    const state = (this.constructor as typeof UIFormElement).fieldState;
    if (state) {
      this.addEventListener('focusin', this.#onFocusIn);
      this.addEventListener('focusout', this.#onFocusOut);
    }
    this.#stopForm = effect(() => {
      const value = this.formValue();
      this.internals.setFormValue(this.isDisabled ? null : value);
      const p = this.problem;
      if (p) this.internals.setValidity(p.flags, p.message, this.validationAnchor());
      else this.internals.setValidity({});
      if (!state) return;
      const key = typeof value === 'string' || value == null ? value ?? '' : '\u0000';
      this.#initial ??= key;
      const invalid = this.invalidShown;
      applyAttrs(this, fieldDataAttrs({
        disabled: this.isDisabled, readonly: this.isReadonly(), required: this.required,
        valid: invalid ? false : this.#shown.value && !this.isDisabled ? true : null,
        dirty: key !== this.#initial, touched: this.#touched.value, filled: this.isFilled(), focused: this.#focused.value,
      }));
    });
  }

  disconnectedCallback() {
    this.#stopForm?.();
    this.removeEventListener('invalid', this.#onInvalid);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
    super.disconnectedCallback();
  }

  formDisabledCallback(disabled: boolean) { this.#formDisabled.value = disabled; }
  formResetCallback() { this.#shown.value = false; this.#touched.value = false; this.#custom.value = ''; this.resetValue(); }
  formStateRestoreCallback(state: unknown) { this.restoreValue(state); }

  // The browser fires `invalid` on each failing control when a submit is blocked.
  #onInvalid = () => { this.#shown.value = true; };
  #onFocusIn = () => { this.#focused.value = true; };
  // Leaving the host (not moving within it) is a blur: touched, and errors show from here on.
  #onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.#focused.value = false;
    this.markTouched();
  };
}

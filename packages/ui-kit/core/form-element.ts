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

/**
 * Containers that disable the form elements inside them, like a native <fieldset disabled>
 * (ui-fieldset, ui-radio-group, ui-checkbox-group register their tags). A container exposes a
 * reactive `isDisabled`; a form element reads the nearest one (`disablingContainer`).
 */
const disablers = new Set<string>();
export function registerDisabler(tag: string) { disablers.add(tag); }
/** The nearest registered disabling container around `el` (not `el` itself), if any. */
export function disablingContainer(el: Element): { isDisabled?: boolean } | null {
  return disablers.size ? (el.parentElement?.closest([...disablers].join(', ')) as { isDisabled?: boolean } | null) ?? null : null;
}
/** Re-read the disabling container of every form element (and nested container) inside `root` (a container connected or upgraded late). */
export function syncDisabled(root: Element) {
  for (const el of root.querySelectorAll('*')) if (typeof (el as { syncContainer?: unknown }).syncContainer === 'function') (el as UIFormElement).syncContainer();
}

/**
 * Kit form owners (ui-form registers its tag): a form element without a native <form> owner submits
 * and resets through the nearest one (`submitOwner`), and follows its validation mode
 * (Base UI Form validationMode: onSubmit, onBlur, onChange).
 */
export type ValidationMode = 'onSubmit' | 'onBlur' | 'onChange';
export interface FormOwner { requestSubmit(submitter?: HTMLElement | null): void; reset(): void; validationMode?: string; submitted?: boolean }
const owners = new Set<string>();
export function registerFormOwner(tag: string) { owners.add(tag); }
/** The nearest registered kit form owner around `el` (not `el` itself), if any. */
export function formOwnerOf(el: Element): FormOwner | null {
  return owners.size ? (el.parentElement?.closest([...owners].join(', ')) as unknown as FormOwner | null) ?? null : null;
}
/** Where a submit or reset from `el` goes: its native form, else the nearest kit form owner. */
export function submitOwner(el: UIFormElement): FormOwner | null { return el.form ?? formOwnerOf(el); }

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
  /** The nearest disabling container (ui-fieldset, a choice group); its isDisabled is reactive. */
  #container = signal<{ isDisabled?: boolean } | null>(null);
  /** Errors are shown: the user left the field, activated it, or a submit was blocked. */
  #shown = signal(false);
  /** The user left the field (or activated a choice) at least once. */
  #touched = signal(false);
  #focused = signal(false);
  #custom = signal('');
  /** An error given by the form owner (ui-form `errors`, by name): shown at once, cleared on the next change. */
  #formError = signal('');
  /** The nearest kit form owner (ui-form), for its validation mode. */
  #owner = signal<FormOwner | null>(null);
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
  /** The form owner's error for this control's name (ui-form `errors`). Reactive. */
  get formError() { return this.#formError.value; }
  /** Set (or clear, with '') the form owner's error: it is the control's problem and shows at once. */
  setFormError(message: string) {
    this.#formError.value = message;
    if (message) this.#shown.value = true;
  }
  /**
   * When errors show now (Base UI validationMode), from the kit form owner's mode, else onBlur:
   * onSubmit waits for a submit attempt, then re-validates on change (onChange). Reactive.
   */
  get validationMode(): ValidationMode {
    const o = this.#owner.value, m = o?.validationMode;
    if (m === 'onSubmit') return o!.submitted ? 'onChange' : 'onSubmit';
    return m === 'onChange' ? 'onChange' : 'onBlur';
  }

  /** Disabled by its own attribute, a disabled ancestor <fieldset>, or a disabled kit container (ui-fieldset, a choice group). Reactive. */
  get isDisabled(): boolean { return this.disabled || this.#formDisabled.value || !!this.#container.value?.isDisabled; }
  /** Find the nearest disabling container again (called on connect, and by a container that connects late). */
  syncContainer() { this.#container.value = null; this.#container.value = disablingContainer(this); }
  /** The current validation problem, if any. Reactive. */
  get problem(): Problem | null {
    if (this.isDisabled) return null;
    const custom = this.#custom.value || this.#formError.value;
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
  /** The user left the field (or activated a choice): touched; errors show from here on, except in onSubmit mode (they wait for a submit). */
  markTouched() { this.#touched.value = true; if (this.validationMode !== 'onSubmit') this.#shown.value = true; }

  /** Take the value at the next render as the clean one (data-dirty): a group that sets a member it just adopted. */
  markClean() { this.#initial = undefined; }

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
  /** The value data-dirty compares with the first render's: the form value as a string (a FormData value: override). */
  valueKey(value: string | File | FormData | null): string { return typeof value === 'string' || value == null ? value ?? '' : '\u0000'; }
  /** data-filled: a non-empty form value (a choice: checked). */
  isFilled(): boolean { const v = this.formValue(); return v != null && v !== ''; }

  connectedCallback() {
    this.#container.value = disablingContainer(this);
    this.#owner.value = formOwnerOf(this);
    super.connectedCallback();
    this.addEventListener('invalid', this.#onInvalid);
    this.addEventListener('input', this.#onValueEvent);
    this.addEventListener('change', this.#onValueEvent);
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
      const key = this.valueKey(value);
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
    this.#container.value = null;
    this.#stopForm?.();
    this.#owner.value = null;
    this.removeEventListener('invalid', this.#onInvalid);
    this.removeEventListener('input', this.#onValueEvent);
    this.removeEventListener('change', this.#onValueEvent);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
    super.disconnectedCallback();
  }

  formDisabledCallback(disabled: boolean) { this.#formDisabled.value = disabled; }
  formResetCallback() { this.#shown.value = false; this.#touched.value = false; this.#custom.value = ''; this.#formError.value = ''; this.resetValue(); }
  formStateRestoreCallback(state: unknown) { this.restoreValue(state); }

  // The browser fires `invalid` on each failing control when a submit is blocked.
  #onInvalid = () => { this.#shown.value = true; };
  // A value change from this control (its own input / change event, not a bubbled one): the form
  // owner's error is stale; in onChange mode errors show from the first change.
  #onValueEvent = (e: Event) => {
    if (e.target !== this) return;
    if (this.#formError.peek()) this.#formError.value = '';
    if (this.validationMode === 'onChange') this.#shown.value = true;
  };
  /** Find the nearest kit form owner again (a ui-form that upgraded late calls this). */
  syncOwner() { this.#owner.value = formOwnerOf(this); }
  #onFocusIn = () => { this.#focused.value = true; };
  // Leaving the host (not moving within it) is a blur: touched, and errors show from here on.
  #onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.#focused.value = false;
    this.markTouched();
  };
}

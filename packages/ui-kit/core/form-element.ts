// UIFormElement: base for form-associated custom elements (no native form controls inside).
// Handles form value, validity, reset/restore, `name`, disabled-by-fieldset, and when to
// show errors: only after the user has left the field or tried to submit, never on load.
import { UIElement } from './element.ts';
import { effect, signal } from './signals.ts';

export interface Problem { flags: ValidityStateFlags; message: string }

export class UIFormElement extends UIElement {
  static formAssociated = true;
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
  #touched = signal(false);
  #custom = signal('');
  #stopForm?: () => void;

  // ── Native-like API ──
  get form() { return this.internals.form; }
  get labels() { return this.internals.labels; }
  get validity() { return this.internals.validity; }
  get validationMessage() { return this.internals.validationMessage; }
  get willValidate() { return this.internals.willValidate; }
  checkValidity() { return this.internals.checkValidity(); }
  reportValidity() { this.#touched.value = true; return this.internals.reportValidity(); }
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
  get userInvalid() { return this.#touched.value && !!this.problem; }
  markTouched() { this.#touched.value = true; }

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

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('invalid', this.#onInvalid);
    this.#stopForm = effect(() => {
      this.internals.setFormValue(this.isDisabled ? null : this.formValue());
      const p = this.problem;
      if (p) this.internals.setValidity(p.flags, p.message, this.validationAnchor());
      else this.internals.setValidity({});
      this.toggleAttribute('data-user-invalid', this.userInvalid);
    });
  }

  disconnectedCallback() {
    this.#stopForm?.();
    this.removeEventListener('invalid', this.#onInvalid);
    super.disconnectedCallback();
  }

  formDisabledCallback(disabled: boolean) { this.#formDisabled.value = disabled; }
  formResetCallback() { this.#touched.value = false; this.#custom.value = ''; this.resetValue(); }
  formStateRestoreCallback(state: unknown) { this.restoreValue(state); }

  // The browser fires `invalid` on each failing control when a submit is blocked.
  #onInvalid = () => { this.#touched.value = true; };
}

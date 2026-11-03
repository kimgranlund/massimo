// <ui-form>: a form of kit fields (Base UI Form) with no native <form> inside or around it: the host
// is the form owner of every kit form control inside that has no native form (core/form-element.ts
// registerFormOwner). A ui-button type=submit, Enter in a ui-input or requestSubmit() validates
// every control (its errors show, the first invalid one takes focus) and, when all pass, fires
// `formsubmit` with { values, reason: 'none', event } (Base UI onFormSubmit(values, details)).
// `errors` (Base UI Form errors: { [name]: message | message[] }, e.g. from a server) reach the
// controls of that name as their form error: invalid and shown at once, in the control's own error
// part (ui-input, ui-select) or its ui-field's error part, and cleared when that control changes.
// `validation-mode` (onSubmit | onBlur | onChange, Base UI's names; default onSubmit) decides when a
// control's own errors show. The host stacks its children with the collection gap (resolveForm).
import { UIElement, UIFormElement, define, registerFormOwner, signal, type ValidationMode } from '../../core/index.ts';
import { applyAttrs, eventDetails } from '../../dom/index.ts';
import { applyRecipe } from '../classes.ts';
import { form } from '../../styled-system/recipes/form.js';

/** Base UI Form errors: messages by control name. */
export type FormErrors = Record<string, string | string[] | undefined | null>;
/** Base UI Form values: by name; a name with several values (a checkbox group) holds an array. */
export type FormValues = Record<string, string | File | (string | File)[]>;

const message = (v: FormErrors[string]) => (Array.isArray(v) ? v.filter(Boolean).join(' ') : v ?? '');

export class UIForm extends UIElement {
  static properties = {
    /** Errors by control name (Base UI Form errors), an object or its JSON; shown at once on the controls of that name, cleared when one changes. */
    errors: { default: null },
    /** When the controls' own errors show (Base UI validationMode): onSubmit (after a submit attempt, then on change), onBlur, onChange. */
    validationMode: { type: String, default: 'onSubmit', attribute: 'validation-mode' },
  };
  declare errors: FormErrors | string | null;
  declare validationMode: ValidationMode;

  #applied: FormErrors | string | null | undefined = undefined;
  #submitted = signal(false);

  /** A submit was attempted (data-submitted), until reset; in onSubmit mode the controls then re-validate on change. Reactive. */
  get submitted() { return this.#submitted.value; }

  /** The kit form controls this form owns: every UIFormElement inside with no native form of its own. */
  get elements(): UIFormElement[] {
    return [...this.querySelectorAll('*')].filter((el): el is UIFormElement => el instanceof UIFormElement && !el.form && el.closest('ui-form') === this);
  }

  /** The values the form submits, by name (as FormData would: disabled controls and nulls left out; a repeated name or a FormData value is an array). */
  values(): FormValues {
    const out: FormValues = {};
    const add = (name: string, v: string | File, many: boolean) => {
      const cur = out[name];
      if (cur === undefined) out[name] = many ? [v] : v;
      else out[name] = [...(Array.isArray(cur) ? cur : [cur]), v];
    };
    for (const el of this.elements) {
      if (!el.name || el.isDisabled) continue;
      const v = el.formValue();
      if (v == null) continue;
      if (v instanceof FormData) {
        const all = v.getAll(el.name);
        if (!all.length && out[el.name] === undefined) out[el.name] = [];
        for (const x of all) add(el.name, x, true);
      } else add(el.name, v, false);
    }
    return out;
  }

  /** Every owned control is valid (no errors shown). */
  checkValidity() { return this.elements.every((el) => el.isDisabled || el.checkValidity()); }

  /** Validate every control (or the controls named `name`, Base UI actions.validate): the invalid ones fire `invalid` and show their errors. True when all pass. */
  validate(name?: string) {
    let ok = true;
    for (const el of this.elements) {
      if (el.isDisabled || (name !== undefined && el.name !== name)) continue;
      if (!el.checkValidity()) ok = false;
    }
    return ok;
  }

  /** Validate and show errors; focus the first invalid control. True when all pass. */
  reportValidity() {
    const ok = this.validate();
    if (!ok) (this.elements.find((el) => !el.isDisabled && !el.checkValidity()) as HTMLElement | undefined)?.focus();
    return ok;
  }

  /** Submit as a native form would (ui-button type=submit, Enter in a ui-input): validate, then fire formsubmit with the values. */
  requestSubmit(submitter?: HTMLElement | null, event?: Event) {
    // detail.event: the event that asked for the submit when the caller has one (none from Enter or script).
    // A new attempt: the previous submit's errors are answered (Base UI: the author sets new ones).
    for (const el of this.elements) if (el.formError) el.setFormError('');
    this.#submitted.value = true;
    if (!this.reportValidity()) return false;
    const e = new CustomEvent('formsubmit', { bubbles: true, detail: { values: this.values(), submitter: submitter ?? null, ...eventDetails('none', event) } });
    this.dispatchEvent(e);
    return true;
  }

  /** Reset every owned control to its default, clear the shown errors and the form errors (a cancelable `reset` event first). */
  reset() {
    if (!this.dispatchEvent(new Event('reset', { cancelable: true }))) return;
    for (const el of this.elements) el.formResetCallback();
    this.#submitted.value = false;
  }

  connected() {
    // Controls inside may have connected (and looked for their owner) before this upgraded.
    queueMicrotask(() => { for (const el of this.querySelectorAll('*')) if (el instanceof UIFormElement) el.syncOwner(); this.#apply(true); });
  }

  update() {
    // Reading the properties tracks them: a new errors object is applied to the controls once.
    void this.validationMode;
    if (this.errors !== this.#applied) this.#apply();
    // data-submitted (ours): a submit was attempted, until reset.
    applyAttrs(this, { role: 'form', 'data-submitted': this.#submitted.value ? '' : undefined });
    applyRecipe(this, form());
  }

  /** Give each owned control its error by name ('' clears one the new errors no longer name). */
  #apply(force = false) {
    if (!force && this.errors === this.#applied) return;
    this.#applied = this.errors;
    let errors: FormErrors = {};
    if (typeof this.errors === 'string') { try { errors = JSON.parse(this.errors) ?? {}; } catch { errors = {}; } }
    else if (this.errors) errors = this.errors;
    for (const el of this.elements) {
      if (!el.name) continue;
      const m = message(errors[el.name]);
      if (m !== el.formError) el.setFormError(m);
    }
  }
}

registerFormOwner('ui-form');
define('ui-form', UIForm);

declare global {
  interface HTMLElementTagNameMap { 'ui-form': UIForm }
}

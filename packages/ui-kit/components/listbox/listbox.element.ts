// <ui-listbox>: single-select list of <ui-option> children. Selection follows focus.
// <ui-segmented>: the same listbox, horizontal.
import { UIFormElement, define, settleDefault, signal, type Problem } from '../../core/index.ts';
import { applyAttrs, createTypeahead, eventDetails, firstEnabled, isPrintableKey, listboxAttrs, navigate, optionAttrs, type ChangeReason, type Orientation } from '../../dom/index.ts';
import './option.element.ts';
import { ensureId, optionList } from './options.ts';
import { applyRecipe } from '../classes.ts';
import { listbox, segmented } from '../../styled-system/recipes/index.js';

export class UIListbox extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    orientation: { type: String, default: 'vertical', reflect: true },
    label: { type: String, default: '' },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare orientation: Orientation;
  declare label: string;

  #list = optionList(() => this);
  #active = signal(-1);
  #focused = signal(false);
  #typeahead = createTypeahead();

  get options() { return this.#list.options; }

  connected() {
    settleDefault(this, '');
    this.#list.observe(this);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('focus', this.#onFocus);
    this.addEventListener('blur', this.#onBlur);
  }

  disconnected() {
    this.#list.disconnect();
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('focus', this.#onFocus);
    this.removeEventListener('blur', this.#onBlur);
  }

  update() {
    const opts = this.options;
    const active = this.#focused.value ? this.#active.value : -1;
    opts.forEach((o, i) => applyAttrs(o, optionAttrs({
      id: ensureId(o), selected: o.optionValue === this.value, disabled: o.disabled || this.isDisabled, active: i === active,
    })));
    applyAttrs(this, listboxAttrs({
      orientation: this.orientation, activeId: opts[active]?.id, label: this.label,
      disabled: this.isDisabled, required: this.required, invalid: this.userInvalid,
    }));
    applyRecipe(this, this.recipe());
  }

  /** The slot recipe's classes (listbox.recipe.ts). */
  protected recipe(): Record<string, string> { return listbox(); }

  formValue() { return this.value || null; }
  resetValue() { this.value = this.defaultValue ?? ''; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Select an option.' } : null;
  }

  #items() { return this.options.map((o) => ({ ...o.item, disabled: o.disabled || this.isDisabled })); }

  #select(i: number, reason: ChangeReason, event: Event) {
    const o = this.options[i];
    if (!o || o.disabled || this.isDisabled) return;
    this.#active.value = i;
    if (o.optionValue === this.value) return;
    this.value = o.optionValue;
    const detail = { value: this.value, ...eventDetails(reason, event) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }

  #rtl() { try { return this.matches(':dir(rtl)'); } catch { return getComputedStyle(this).direction === 'rtl'; } }

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const items = this.#items();
    const from = this.#active.value;
    let i = navigate(items, from, e.key, { orientation: this.orientation, rtl: this.#rtl() });
    if (i === undefined && isPrintableKey(e)) i = this.#typeahead(items, from, e.key);
    if (i === undefined) return;
    e.preventDefault();
    this.#select(i, 'keyboard', e); // selection follows focus
    this.options[i]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  #onClick = (e: Event) => {
    const o = (e.target as Element).closest?.('ui-option');
    if (o && o.parentElement === this) this.#select(this.options.indexOf(o as any), 'item-press', e);
  };

  #onFocus = () => {
    this.#focused.value = true;
    if (this.#active.value < 0) {
      const sel = this.options.findIndex((o) => o.optionValue === this.value);
      this.#active.value = sel >= 0 ? sel : firstEnabled(this.#items()) ?? -1;
    }
  };

  #onBlur = () => { this.#focused.value = false; this.markTouched(); };
}

export class UISegmented extends UIListbox {
  static properties = { ...UIListbox.properties, orientation: { type: String, default: 'horizontal', reflect: true } };
  protected recipe() { return segmented(); }
}

define('ui-listbox', UIListbox);
define('ui-segmented', UISegmented);

declare global {
  interface HTMLElementTagNameMap { 'ui-listbox': UIListbox; 'ui-segmented': UISegmented }
}

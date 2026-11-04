// <ui-option>: one choice inside <ui-listbox>, <ui-segmented> or <ui-select>.
// The owning list sets role, id and selection state; the option carries data and the same
// leading / contents / trailing slots as ui-button.
import { UIElement, define } from '../../core/element.ts';
import type { OptionItem } from '../../dom/listbox.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe } from '../classes.ts';
import { option } from '../../styled-system/recipes/option.js';

export class UIOption extends UIElement {
  static properties = {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false, reflect: true },
  };
  declare value: string;
  declare disabled: boolean;

  #unslot?: () => void;
  connected() { this.#unslot = observeSlots(this); }
  disconnected() { this.#unslot?.(); }
  update() { applyRecipe(this, option()); }

  /** Text of the contents slot (icons excluded). */
  get label(): string {
    const contents = this.querySelector(':scope > [data-part=contents]');
    return ((contents ?? this).textContent ?? '').trim();
  }
  /** The submitted value: the `value` attribute, or the label when absent. */
  get optionValue(): string { return this.getAttribute('value') ?? (this.value || this.label); }
  get item(): OptionItem { return { value: this.optionValue, label: this.label, disabled: this.disabled }; }
}

define('ui-option', UIOption);

declare global {
  interface HTMLElementTagNameMap { 'ui-option': UIOption }
}

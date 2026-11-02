// <ui-option>: one choice inside <ui-listbox>, <ui-segmented> or <ui-select>.
// The owning list sets role, id and selection state; the option only carries data.
import { UIElement, define } from '../../core/index.ts';
import type { OptionItem } from '../../dom/index.ts';

export class UIOption extends UIElement {
  static properties = {
    value: { type: String, default: '' },
    disabled: { type: Boolean, default: false, reflect: true },
  };
  declare value: string;
  declare disabled: boolean;

  get label() { return (this.textContent ?? '').trim(); }
  /** The submitted value: the `value` attribute, or the label when absent. */
  get optionValue() { return this.getAttribute('value') ?? (this.value || this.label); }
  get item(): OptionItem { return { value: this.optionValue, label: this.label, disabled: this.disabled }; }
}

define('ui-option', UIOption);

declare global {
  interface HTMLElementTagNameMap { 'ui-option': UIOption }
}

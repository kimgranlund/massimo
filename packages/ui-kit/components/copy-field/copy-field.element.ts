// <ui-copy-field>: a value to copy, such as a link or a key. It's a read-only ui-input with a button in
// its trailing slot. The button says Copied for a moment, and a hidden status says so to screen readers.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import '../input/input.element.ts';
import '../button/button.element.ts';
import { COPIED_MS, copyText } from '../../dom/copy.ts';
import { applyRecipe } from '../classes.ts';
import { copyField } from '../../styled-system/recipes/copy-field.js';

export class UICopyField extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    hideLabel: { type: Boolean, default: false, attribute: 'hide-label' },
  };
  declare label: string;
  declare value: string;
  declare hideLabel: boolean;
  #timer = 0;

  template() {
    return html`<ui-input readonly ?hide-label=${this.hideLabel} .label=${this.label} .value=${this.value}>
      <ui-button slot="trailing" variant="primary" aria-label="Copy" @click=${this.#copy}><i slot="leading" name="copy"></i></ui-button>
    </ui-input><span data-part="status" role="status"></span>`;
  }

  update() { applyRecipe(this, copyField(), (slot) => this.querySelector(`[data-part=${slot}]`)); }
  disconnected() { clearTimeout(this.#timer); }

  #copy = async () => {
    const ok = await copyText(this.value);
    const status = this.querySelector('[data-part=status]'), icon = this.querySelector('ui-button i');
    if (status) status.textContent = ok ? 'Copied' : 'Couldn\'t copy. Select the text instead.';
    if (!ok) return;
    icon?.setAttribute('name', 'check');
    clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => { icon?.setAttribute('name', 'copy'); if (status) status.textContent = ''; }, COPIED_MS);
    this.dispatchEvent(new CustomEvent('copy-value', { bubbles: true, detail: { value: this.value } }));
  };
}

define('ui-copy-field', UICopyField);

declare global {
  interface HTMLElementTagNameMap { 'ui-copy-field': UICopyField }
}

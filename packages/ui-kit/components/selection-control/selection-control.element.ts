// <ui-selection-control>: a range, checkbox, switch or radio group beside its label and live value. The
// child keeps its value, form and keyboard behavior; this only reads it and shows it as text.
import { UIElement, define } from '../../core/element.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { selectionText } from '../../dom/selection.ts';
import { selectionControl } from '../../styled-system/recipes/selection-control.js';

export class UISelectionControl extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    unit: { type: String, default: '' },
  };
  declare label: string;
  declare unit: string;
  #labelEl?: HTMLElement;
  #valueEl?: HTMLElement;
  #control?: Element;

  connected() {
    this.#control = [...this.children].find((c) => !c.hasAttribute('data-part'));
    if (!this.#labelEl) {
      this.#labelEl = document.createElement('span'); this.#labelEl.setAttribute('data-part', 'label');
      this.#valueEl = document.createElement('span'); this.#valueEl.setAttribute('data-part', 'value');
      this.prepend(this.#labelEl); this.append(this.#valueEl);
    }
    this.addEventListener('input', this.#read);
    this.addEventListener('change', this.#read);
    queueMicrotask(this.#read);
  }
  disconnected() { this.removeEventListener('input', this.#read); this.removeEventListener('change', this.#read); }

  update() {
    const c = selectionControl();
    applyRecipe(this, c, () => null);
    setClasses(this.#labelEl, c.label); setClasses(this.#valueEl, c.value);
    if (this.#labelEl) this.#labelEl.textContent = this.label;
    this.#read();
  }

  #read = () => { if (this.#valueEl) this.#valueEl.textContent = selectionText(this.#control as never, this.unit); };
}

define('ui-selection-control', UISelectionControl);

declare global {
  interface HTMLElementTagNameMap { 'ui-selection-control': UISelectionControl }
}

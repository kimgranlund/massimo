// <ui-button>: the host element is the button. Authored children are kept as its label.
import { UIFormElement, define } from '../../core/index.ts';
import { applyAttrs, buttonAttrs, blockIfInactive, onButtonKeydown, type ButtonState } from '../../dom/index.ts';

export class UIButton extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false, reflect: true },
  };
  declare type: 'button' | 'submit' | 'reset';
  declare loading: boolean;

  get #state(): ButtonState { return { disabled: this.isDisabled, loading: this.loading }; }

  connected() {
    // Capture phase so a blocked click never reaches the page's own listeners.
    this.addEventListener('click', this.#onClick, true);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnected() {
    this.removeEventListener('click', this.#onClick, true);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  update() {
    applyAttrs(this, buttonAttrs(this.#state));
  }

  #onClick = (e: Event) => {
    if (blockIfInactive(e, this.#state)) return;
    if (this.type === 'submit') this.form?.requestSubmit();
    else if (this.type === 'reset') this.form?.reset();
  };

  #onKeydown = (e: KeyboardEvent) => onButtonKeydown(e, this.#state, () => this.click());
}

define('ui-button', UIButton);

declare global {
  interface HTMLElementTagNameMap { 'ui-button': UIButton }
}

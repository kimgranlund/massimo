// <ui-button>: the host element is the button. Authored children are kept as its label.
import { UIFormElement, define } from '../../core/index.ts';
import { applyAttrs, buttonAttrs, blockIfInactive, onButtonKeydown, type ButtonState } from '../../dom/index.ts';
import { button, type ButtonVariantProps } from '../../styled-system/recipes/index.js';

export class UIButton extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    variant: { type: String, default: 'solid', reflect: true },
    size: { type: String, default: 'md', reflect: true },
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false, reflect: true },
  };
  declare variant: NonNullable<ButtonVariantProps['variant']>;
  declare size: NonNullable<ButtonVariantProps['size']>;
  declare type: 'button' | 'submit' | 'reset';
  declare loading: boolean;

  #classes: string[] = [];
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
    // Swap only our recipe classes so author classes survive.
    const next = button({ variant: this.variant, size: this.size }).split(' ');
    this.classList.remove(...this.#classes);
    this.classList.add(...next);
    this.#classes = next;
  }

  #onClick = (e: Event) => {
    if (blockIfInactive(e, this.#state)) return;
    const form = this.form;
    if (this.type === 'submit') form?.requestSubmit();
    else if (this.type === 'reset') form?.reset();
  };

  #onKeydown = (e: KeyboardEvent) => onButtonKeydown(e, this.#state, () => this.click());
}

define('ui-button', UIButton);

declare global {
  interface HTMLElementTagNameMap { 'ui-button': UIButton }
}

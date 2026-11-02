// <ui-button>: the host element is the button. Children are sorted into leading / contents /
// trailing slots (mark icons with slot="leading" or slot="trailing"); see components/slots.ts.
import { UIFormElement, define } from '../../core/index.ts';
import { applyAttrs, buttonAttrs, blockIfInactive, onButtonKeydown, type ButtonState } from '../../dom/index.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe } from '../classes.ts';
import { button } from '../../styled-system/recipes/button.js';

export class UIButton extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false, reflect: true },
    variant: { type: String, default: 'neutral' },
  };
  declare type: 'button' | 'submit' | 'reset';
  declare loading: boolean;
  declare variant: 'neutral' | 'primary';

  #unslot?: () => void;
  get #state(): ButtonState { return { disabled: this.isDisabled, loading: this.loading }; }

  connected() {
    this.#unslot = observeSlots(this);
    // Capture phase so a blocked click never reaches the page's own listeners.
    this.addEventListener('click', this.#onClick, true);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnected() {
    this.#unslot?.();
    this.removeEventListener('click', this.#onClick, true);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  update() {
    applyAttrs(this, buttonAttrs(this.#state));
    applyRecipe(this, button({ variant: this.variant === 'primary' ? 'primary' : 'neutral' }));
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

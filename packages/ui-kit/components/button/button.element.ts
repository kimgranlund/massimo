// <ui-button>: the host element is the button. Children are sorted into leading / contents /
// trailing slots (mark icons with slot="leading" or slot="trailing"); see components/slots.ts.
import { UIFormElement, submitOwner } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { buttonAttrs, blockIfInactive, onButtonKeydown, type ButtonState } from '../../dom/button.ts';
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
  // A button has no value: data-disabled and data-busy come from buttonAttrs, not the field state.
  static fieldState = false;
  declare type: 'button' | 'submit' | 'reset';
  declare loading: boolean;
  declare variant: 'neutral' | 'primary' | 'ghost';

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
    applyRecipe(this, button({ variant: this.variant === 'primary' || this.variant === 'ghost' ? this.variant : 'neutral' }));
  }

  #onClick = (e: Event) => {
    if (blockIfInactive(e, this.#state)) return;
    // The native form, else the nearest kit form owner (ui-form).
    const owner = submitOwner(this);
    // (A native form takes no custom-element submitter: requestSubmit() would throw.)
    if (this.type === 'submit') owner === this.form ? this.form?.requestSubmit() : owner?.requestSubmit(this);
    else if (this.type === 'reset') owner?.reset();
  };

  #onKeydown = (e: KeyboardEvent) => onButtonKeydown(e, this.#state, () => this.click());
}

define('ui-button', UIButton);

declare global {
  interface HTMLElementTagNameMap { 'ui-button': UIButton }
}

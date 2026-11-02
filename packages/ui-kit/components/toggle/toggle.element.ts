// <ui-toggle>: a two-state button (Base UI Toggle): role=button with aria-pressed, data-pressed while
// on, data-disabled. Click, Enter or Space flip it and fire a cancelable `change` whose detail is
// { pressed, reason: 'none', event } (Base UI onPressedChange); preventDefault keeps the state.
// Children use the construction pattern (slot="leading" | "prefix" | "suffix" | "trailing"; the
// rest is the label), on the button recipe and control geometry (toggle.recipe.ts).
import { UIElement, define } from '../../core/index.ts';
import { applyAttrs, buttonAttrs, eventDetails, isInactive, onButtonKeydown, type ButtonState } from '../../dom/index.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe } from '../classes.ts';
import { toggle } from '../../styled-system/recipes/toggle.js';

export class UIToggle extends UIElement {
  static properties = {
    pressed: { type: Boolean, default: false, reflect: true },
    /** The pressed state at connect when no pressed attribute is set (Base UI defaultPressed). */
    defaultPressed: { type: Boolean, default: false, attribute: 'default-pressed' },
    disabled: { type: Boolean, default: false, reflect: true },
    value: { type: String, default: '' },
  };
  declare pressed: boolean;
  declare defaultPressed: boolean;
  declare disabled: boolean;
  declare value: string;

  #unslot?: () => void;
  get #state(): ButtonState { return { disabled: this.disabled, pressed: this.pressed }; }

  connected() {
    if (this.defaultPressed && !this.hasAttribute('pressed')) this.pressed = true;
    this.#unslot = observeSlots(this);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnected() {
    this.#unslot?.();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  update() {
    applyAttrs(this, buttonAttrs(this.#state));
    applyRecipe(this, toggle());
  }

  #onClick = (e: Event) => {
    if (isInactive(this.#state)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const next = !this.pressed;
    const ok = this.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true, detail: { pressed: next, ...eventDetails('none', e) } }));
    if (ok) this.pressed = next;
  };

  #onKeydown = (e: KeyboardEvent) => onButtonKeydown(e, this.#state, () => this.click());
}

define('ui-toggle', UIToggle);

declare global {
  interface HTMLElementTagNameMap { 'ui-toggle': UIToggle }
}

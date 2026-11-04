// <ui-toggle>: a two-state button (Base UI Toggle): role=button with aria-pressed, data-pressed while
// on, data-disabled. Click, Enter or Space flip it and fire a cancelable `change` whose detail is
// { pressed, reason: 'none', event } (Base UI onPressedChange); preventDefault keeps the state.
// Children use the construction pattern (slot="leading" | "prefix" | "suffix" | "trailing"; the
// rest is the label), on the button recipe and control geometry (toggle.recipe.ts).
// Inside a <ui-toggle-group> the group owns the pressed state (it answers the change), disables the
// toggle with itself and sets the roving tab index (tabIndexFor).
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { buttonAttrs, isInactive, onButtonKeydown, type ButtonState } from '../../dom/button.ts';
import { eventDetails } from '../../dom/events.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe } from '../classes.ts';
import { toggle } from '../../styled-system/recipes/toggle.js';

/** What a toggle reads from its ui-toggle-group (components/toggle-group). */
interface ToggleGroupHost { disabled: boolean; tabIndexFor(t: UIToggle): number }

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
  /** The ui-toggle-group parent, if any. */
  #group = signal<ToggleGroupHost | null>(null);
  get #state(): ButtonState { return { disabled: this.disabled || !!this.#group.value?.disabled, pressed: this.pressed }; }

  connected() {
    const p = this.parentElement;
    this.#group.value = null;
    // The group may upgrade after its toggles: read it once it is defined.
    if (p?.localName === 'ui-toggle-group') customElements.whenDefined('ui-toggle-group').then(() => { if (this.parentElement === p) this.#group.value = p as unknown as ToggleGroupHost; });
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
    const s = this.#state;
    applyAttrs(this, buttonAttrs(s));
    const g = this.#group.value;
    if (g && !s.disabled) applyAttrs(this, { tabindex: g.tabIndexFor(this) });
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

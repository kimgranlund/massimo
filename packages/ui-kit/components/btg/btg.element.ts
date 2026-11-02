// <ui-badge>: short status or count; one character makes a circle.
// <ui-tag>: static label.
// All three use the construction pattern (leading / prefix / contents / suffix / trailing) with the
// label-wrapper padding of resolveBtg.
// <ui-chip>: interactive label. `selectable` makes it a toggle button (aria-pressed);
//   `removable` adds a trailing ✕: clicking it, Delete or Backspace fires a cancelable
//   `remove` event, and unless prevented the chip removes itself and focus moves to a
//   neighbouring chip.
import { UIElement, define } from '../../core/index.ts';
import { applyAttrs, buttonAttrs, eventDetails, isInactive, onButtonKeydown } from '../../dom/index.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { badge } from '../../styled-system/recipes/badge.js';
import { tag } from '../../styled-system/recipes/tag.js';
import { chip } from '../../styled-system/recipes/chip.js';
import '../../icons/index.ts';

export class UIBadge extends UIElement {
  #unslot?: () => void;
  connected() { this.#unslot = observeSlots(this); }
  update() { applyRecipe(this, badge()); }
  disconnected() { this.#unslot?.(); }
}

export class UITag extends UIElement {
  #unslot?: () => void;
  connected() { this.#unslot = observeSlots(this); }
  update() { applyRecipe(this, tag()); }
  disconnected() { this.#unslot?.(); }
}

export class UIChip extends UIElement {
  static properties = {
    selectable: { type: Boolean, default: false, reflect: true },
    selected: { type: Boolean, default: false, reflect: true },
    removable: { type: Boolean, default: false, reflect: true },
    disabled: { type: Boolean, default: false, reflect: true },
  };
  declare selectable: boolean;
  declare selected: boolean;
  declare removable: boolean;
  declare disabled: boolean;

  #unslot?: () => void;
  #removeIcon?: HTMLElement;
  get #state() { return { disabled: this.disabled, pressed: this.selectable ? this.selected : undefined }; }

  connected() {
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
    applyAttrs(this, { ...buttonAttrs(this.#state), 'aria-keyshortcuts': this.removable ? 'Delete' : undefined });
    if (this.removable && !this.#removeIcon?.isConnected) {
      // A click target inside the chip, not a separate tab stop (no nested buttons).
      const i = document.createElement('i');
      i.setAttribute('name', 'x');
      i.setAttribute('slot', 'trailing');
      i.setAttribute('data-remove', '');
      this.#removeIcon = i;
      this.append(i);
    } else if (!this.removable && this.#removeIcon) {
      this.#removeIcon.remove();
      this.#removeIcon = undefined;
    }
    applyRecipe(this, chip({ selectable: this.selectable }), (slot) => slot === 'remove' ? this.#removeIcon : partOf(this, slot));
  }

  /** Fire `remove`; unless prevented, remove the chip and move focus to a neighbour. */
  requestRemove() {
    if (this.disabled) return;
    const ok = this.dispatchEvent(new Event('remove', { bubbles: true, cancelable: true }));
    if (!ok) return;
    const hadFocus = this.matches(':focus');
    const next = [this.nextElementSibling, this.previousElementSibling].find((el) => el?.localName === 'ui-chip') as HTMLElement | undefined;
    this.remove();
    if (hadFocus) next?.focus();
  }

  #onClick = (e: Event) => {
    if (isInactive(this.#state)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if ((e.target as Element).closest?.('[data-remove]')) { e.stopImmediatePropagation(); this.requestRemove(); return; }
    if (this.selectable) {
      this.selected = !this.selected;
      // Base UI Toggle's onPressedChange details (reason 'none').
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { pressed: this.selected, ...eventDetails('none', e) } }));
    }
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (this.removable && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); this.requestRemove(); return; }
    onButtonKeydown(e, this.#state, () => this.click());
  };
}

define('ui-badge', UIBadge);
define('ui-tag', UITag);
define('ui-chip', UIChip);

declare global {
  interface HTMLElementTagNameMap { 'ui-badge': UIBadge; 'ui-tag': UITag; 'ui-chip': UIChip }
}

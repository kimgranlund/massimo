// <ui-swatch color="…">: a 6u color chip. Translucent or missing colors get data-alpha and sit on a
//   checkerboard; opaque ones paint a single layer (a checkerboard under an opaque color fringes
//   at rounded, antialiased edges).
//   Any CSS color; invalid colors are ignored. Named by `label`, else the color text.
// <ui-palette>: a strip of swatches with no gaps. With `name` (or `selectable`) it becomes a
//   single-select listbox: arrows move, the swatch's color is the form value.
//   orientation: horizontal (default) | vertical (a column; Up/Down move).
import { UIElement, UIFormElement, define, settleDefault, signal, type Problem } from '../../core/index.ts';
import { applyAttrs, eventDetails, navigate, optionAttrs, listboxAttrs, uid, type ChangeReason } from '../../dom/index.ts';

import { isTranslucent, validColor } from './color.ts';
import { applyRecipe } from '../classes.ts';
import { swatch, palette } from '../../styled-system/recipes/index.js';

export { isTranslucent } from './color.ts';

export class UISwatch extends UIElement {
  static properties = {
    color: { type: String, default: '' },
    label: { type: String, default: '' },
  };
  declare color: string;
  declare label: string;

  update() {
    const ok = validColor(this.color);
    if (ok) this.style.setProperty('--ui-swatch-color', this.color);
    else this.style.removeProperty('--ui-swatch-color');
    // Inside a selectable palette the palette owns the role.
    if (!this.closest('ui-palette[name], ui-palette[selectable]')) {
      applyAttrs(this, { role: 'img', 'aria-label': this.label || this.color || undefined });
    }
    this.toggleAttribute('data-invalid', !!this.color && !ok);
    this.toggleAttribute('data-alpha', !ok || isTranslucent(this.color));
    applyRecipe(this, swatch());
  }
}

export class UIPalette extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    label: { type: String, default: '' },
    selectable: { type: Boolean, default: false, reflect: true },
    orientation: { type: String, default: 'horizontal', reflect: true },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare label: string;
  declare selectable: boolean;
  declare orientation: 'horizontal' | 'vertical';

  #active = signal(-1);
  #focused = signal(false);
  #version = signal(0);
  #mo?: MutationObserver;

  get swatches(): UISwatch[] { void this.#version.value; return [...this.children].filter((c) => c.localName === 'ui-swatch') as UISwatch[]; }
  get #orientation() { return this.orientation === 'vertical' ? 'vertical' as const : 'horizontal' as const; }
  get #isSelectable() { return this.selectable || !!this.name; }

  connected() {
    settleDefault(this, '');
    this.#mo = new MutationObserver(() => this.#version.value++);
    this.#mo.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['color'] });
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('focus', this.#onFocus);
    this.addEventListener('blur', this.#onBlur);
  }

  disconnected() {
    this.#mo?.disconnect();
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('focus', this.#onFocus);
    this.removeEventListener('blur', this.#onBlur);
  }

  update() {
    const list = this.swatches;
    applyRecipe(this, palette({ selectable: this.#isSelectable, orientation: this.#orientation }));
    if (!this.#isSelectable) { applyAttrs(this, { role: 'group', 'aria-label': this.label || undefined, 'data-orientation': this.#orientation }); return; }
    // The highlighted swatch (data-highlighted, aria-activedescendant) shows while the palette has focus.
    const active = !this.#focused.value ? -1 : this.#active.value >= 0 ? this.#active.value : list.findIndex((s) => s.color === this.value);
    list.forEach((s, i) => applyAttrs(s, {
      ...optionAttrs({ id: s.id || (s.id = uid('swatch')), selected: s.color === this.value, active: i === active }),
      'aria-label': s.label || s.color,
    }));
    applyAttrs(this, listboxAttrs({ orientation: this.#orientation, activeId: list[active]?.id, label: this.label, disabled: this.isDisabled, invalid: this.userInvalid }));
  }

  formValue() { return this.#isSelectable ? this.value || null : null; }
  resetValue() { this.value = this.defaultValue ?? ''; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null { return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Choose a color.' } : null; }

  #select(i: number, reason: ChangeReason, event: Event) {
    const s = this.swatches[i];
    if (!s || this.isDisabled) return;
    this.#active.value = i;
    if (s.color === this.value) return;
    this.value = s.color;
    const detail = { value: this.value, ...eventDetails(reason, event) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (!this.#isSelectable || this.isDisabled) return;
    const items = this.swatches.map((s) => ({ value: s.color, label: s.label || s.color }));
    const from = this.#active.value >= 0 ? this.#active.value : items.findIndex((i) => i.value === this.value);
    const i = navigate(items, from, e.key, { orientation: this.#orientation, rtl: getComputedStyle(this).direction === 'rtl' });
    if (i === undefined) return;
    e.preventDefault();
    this.#select(i, 'keyboard', e);
  };

  #onFocus = () => { this.#focused.value = true; };
  #onBlur = () => { this.#focused.value = false; };

  #onClick = (e: Event) => {
    if (!this.#isSelectable) return;
    const s = (e.target as Element).closest?.('ui-swatch');
    if (s) this.#select(this.swatches.indexOf(s as UISwatch), 'item-press', e);
  };
}

define('ui-swatch', UISwatch);
define('ui-palette', UIPalette);

declare global {
  interface HTMLElementTagNameMap { 'ui-swatch': UISwatch; 'ui-palette': UIPalette }
}

// <ui-toggle-group>: a row of <ui-toggle> children that share one pressed state (Base UI ToggleGroup).
// `value` is the comma-separated list of pressed toggle values (a toggle's `value`, else its index),
// `default-value` the first one; without either, the toggles' own pressed / default-pressed seed it.
// Single mode (default): pressing a toggle presses only it, pressing the pressed one releases it;
// `multiple` lets several be pressed. A press fires the group's cancelable change ({ value: string[],
// reason: 'none', event }) instead of the toggle's own; preventDefault keeps the state. Roving focus
// (Base UI CompositeRoot): one tab stop (the last focused toggle, else the first pressed, else the
// first enabled); arrow keys (Left / Right mirrored in RTL; Up / Down when vertical), Home and End
// move focus among enabled toggles, wrapping. `disabled` disables every toggle. Geometry: a
// composite on the control fill like ui-segmented; its toggles are composite options (the toggle
// recipe's in-group rules).
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { eventDetails } from '../../dom/events.ts';
import { setClasses } from '../classes.ts';
import { toggleGroup } from '../../styled-system/recipes/toggle-group.js';
import '../toggle/toggle.element.ts';
import type { UIToggle } from '../toggle/toggle.element.ts';

const on = (v: unknown) => (v ? '' : undefined);
export const parseValues = (v: string | null | undefined) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export class UIToggleGroup extends UIElement {
  static properties = {
    value: { type: String, default: '' },
    defaultValue: { type: String, default: '', attribute: 'default-value' },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false, reflect: true },
    orientation: { type: String, default: 'horizontal' },
  };
  declare value: string;
  declare defaultValue: string;
  declare multiple: boolean;
  declare disabled: boolean;
  declare orientation: 'horizontal' | 'vertical';

  #items = signal(0);
  /** The toggle that holds the tab stop once one was focused. */
  #stop = signal<UIToggle | null>(null);
  #mo?: MutationObserver;
  #settled = false;

  /** The toggles, in order. */
  get toggles(): UIToggle[] { this.#items.value; return [...this.children].filter((c) => c.localName === 'ui-toggle') as UIToggle[]; }
  /** The pressed toggle values. */
  get values(): string[] { return parseValues(this.value); }
  toggleValue(t: UIToggle) { return t.value || String(this.toggles.indexOf(t)); }
  #enabled() { return this.disabled ? [] : this.toggles.filter((t) => !t.disabled); }

  /** The roving tab index of one of its toggles (read by ui-toggle's update, so it tracks the group). */
  tabIndexFor(t: UIToggle): number {
    const enabled = this.#enabled(), values = this.values, kept = this.#stop.value;
    const stop = kept && enabled.includes(kept) ? kept : enabled.find((x) => values.includes(this.toggleValue(x))) ?? enabled[0];
    return t === stop ? 0 : -1;
  }

  connected() {
    // Capture: the group answers a toggle's change before anyone sees it, and fires its own.
    this.addEventListener('change', this.#onToggle, true);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusIn);
    this.#mo = new MutationObserver(() => { this.#items.value++; });
    this.#mo.observe(this, { childList: true });
    // Toggles upgrade after their group: settle the first value once they have.
    queueMicrotask(() => {
      if (!this.#settled) {
        this.#settled = true;
        // A value set as an attribute or a property (a framework may set the property) wins.
        if (!this.hasAttribute('value') && !this.value) {
          const seed = this.hasAttribute('default-value') || this.defaultValue ? parseValues(this.defaultValue) : this.toggles.filter((t) => t.pressed).map((t) => this.toggleValue(t));
          this.value = (this.multiple ? seed : seed.slice(0, 1)).join(',');
        }
      }
      this.#items.value++;
    });
  }

  disconnected() {
    this.removeEventListener('change', this.#onToggle, true);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.#mo?.disconnect();
  }

  #onToggle = (e: Event) => {
    const t = e.target as UIToggle;
    if ((t as Element) === this || t.parentElement !== this || t.localName !== 'ui-toggle') return;
    // The toggle's own change stops here; the group decides and fires its change.
    e.stopPropagation();
    e.preventDefault();
    const { pressed, event } = (e as CustomEvent).detail;
    const v = this.toggleValue(t), rest = this.values.filter((x) => x !== v);
    const next = pressed ? (this.multiple ? [...rest, v] : [v]) : rest;
    const change = new CustomEvent('change', { bubbles: true, cancelable: true, detail: { value: next, ...eventDetails('none', event) } });
    if (this.dispatchEvent(change)) this.value = next.join(',');
  };

  #onFocusIn = (e: FocusEvent) => {
    const t = e.target as UIToggle;
    if (t.parentElement === this && t.localName === 'ui-toggle') this.#stop.value = t;
  };

  #onKeydown = (e: KeyboardEvent) => {
    const t = e.target as UIToggle;
    if (t.parentElement !== this || t.localName !== 'ui-toggle') return;
    const vertical = this.orientation === 'vertical';
    const rtl = !vertical && getComputedStyle(this).direction === 'rtl';
    const step = (vertical
      ? { ArrowDown: 1, ArrowUp: -1 }
      : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } as Record<string, number>)[e.key as 'ArrowDown'];
    const list = this.#enabled(), at = list.indexOf(t);
    const to = step ? (at + step + list.length) % list.length : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : -1;
    if (to < 0 || !list.length) return;
    e.preventDefault();
    list[to].focus();
  };

  update() {
    const toggles = this.toggles, values = this.values;
    applyAttrs(this, {
      role: 'group',
      'data-orientation': this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      'data-disabled': on(this.disabled),
      'data-multiple': on(this.multiple),
    });
    setClasses(this, toggleGroup().root);
    // Until the first value is settled the toggles keep their own pressed state (it seeds the value).
    if (!this.#settled) return;
    for (const t of toggles) t.pressed = values.includes(this.toggleValue(t));
  }
}

define('ui-toggle-group', UIToggleGroup);

declare global {
  interface HTMLElementTagNameMap { 'ui-toggle-group': UIToggleGroup }
}

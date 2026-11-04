// <ui-accordion>: a stack of collapsibles of which one (or, with `multiple`, several) is open (Base UI
// Accordion: Root, Item, Header, Trigger, Panel). Its items are <ui-collapsible> children: each one
// puts its trigger in a heading part (role=heading, aria-level 3) and makes its panel a region
// labelled by the trigger (components/collapsible). The accordion owns the open state: `value` is the
// comma-separated list of open item values (an item's `value`, else its index), `default-value` the
// first one; without either, the items' own open / default-open seed it. A trigger press fires the
// item's openchange, then the accordion's cancelable change ({ value: string[], reason:
// 'trigger-press', event }); in single mode opening an item closes the others. Arrow keys move focus
// between the triggers (Up / Down; Left / Right when horizontal), Home / End to the first / last;
// every trigger stays in the tab order (APG accordion).
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { eventDetails } from '../../dom/events.ts';
import { setClasses } from '../classes.ts';
import { accordion } from '../../styled-system/recipes/accordion.js';
import '../collapsible/collapsible.element.ts';
import type { UICollapsible } from '../collapsible/collapsible.element.ts';

const on = (v: unknown) => (v ? '' : undefined);
export const parseValues = (v: string | null | undefined) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export class UIAccordion extends UIElement {
  static properties = {
    value: { type: String, default: '' },
    defaultValue: { type: String, default: '', attribute: 'default-value' },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false, reflect: true },
    orientation: { type: String, default: 'vertical' },
  };
  declare value: string;
  declare defaultValue: string;
  declare multiple: boolean;
  declare disabled: boolean;
  declare orientation: 'vertical' | 'horizontal';

  #items = signal(0);
  #mo?: MutationObserver;
  #settled = false;

  /** The item collapsibles, in order. */
  get items(): UICollapsible[] { return [...this.children].filter((c) => c.localName === 'ui-collapsible') as UICollapsible[]; }
  /** The open item values. */
  get values(): string[] { return parseValues(this.value); }
  itemValue(item: UICollapsible) { return item.value || String(this.items.indexOf(item)); }

  connected() {
    this.addEventListener('openchange', this.#onOpenChange);
    this.addEventListener('keydown', this.#onKeydown);
    this.#mo = new MutationObserver(() => { this.#items.value++; });
    this.#mo.observe(this, { childList: true });
    // Items upgrade after their accordion: settle the first value once they have.
    queueMicrotask(() => {
      if (!this.#settled) {
        this.#settled = true;
        if (!this.hasAttribute('value')) {
          const seed = this.hasAttribute('default-value') ? parseValues(this.defaultValue) : this.items.filter((i) => i.open).map((i) => this.itemValue(i));
          this.value = (this.multiple ? seed : seed.slice(0, 1)).join(',');
        }
      }
      this.#items.value++;
    });
  }

  disconnected() {
    this.removeEventListener('openchange', this.#onOpenChange);
    this.removeEventListener('keydown', this.#onKeydown);
    this.#mo?.disconnect();
  }

  #onOpenChange = (e: Event) => {
    const item = e.target as UICollapsible;
    if (item.parentElement !== this || e.defaultPrevented) return;
    const { open, event } = (e as CustomEvent).detail;
    const v = this.itemValue(item), cur = this.values.filter((x) => x !== v);
    const next = open ? (this.multiple ? [...cur, v] : [v]) : cur;
    const change = new CustomEvent('change', { bubbles: true, cancelable: true, detail: { value: next, ...eventDetails('trigger-press', event) } });
    if (!this.dispatchEvent(change)) { e.preventDefault(); return; }
    this.value = next.join(',');
  };

  #onKeydown = (e: KeyboardEvent) => {
    const t = (e.target as Element).closest('[data-part=trigger]');
    const item = t?.closest('ui-collapsible');
    if (!t || item?.parentElement !== this) return;
    const horizontal = this.orientation === 'horizontal';
    const rtl = horizontal && getComputedStyle(this).direction === 'rtl';
    const step = ({ ArrowDown: horizontal ? 0 : 1, ArrowUp: horizontal ? 0 : -1, ArrowRight: horizontal ? (rtl ? -1 : 1) : 0, ArrowLeft: horizontal ? (rtl ? 1 : -1) : 0 } as Record<string, number>)[e.key];
    const triggers = this.items.filter((i) => !i.isDisabled).map((i) => i.trigger).filter(Boolean) as HTMLElement[];
    const at = triggers.indexOf(t as HTMLElement);
    let to = -1;
    if (step) to = (at + step + triggers.length) % triggers.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = triggers.length - 1;
    if (to < 0 || !triggers.length) return;
    e.preventDefault();
    triggers[to].focus();
  };

  update() {
    this.#items.value;
    const values = this.values, c = accordion();
    applyAttrs(this, { 'data-orientation': this.orientation === 'horizontal' ? 'horizontal' : 'vertical', 'data-disabled': on(this.disabled) });
    setClasses(this, c.root);
    // Until the first value is settled the items keep their own open state (it seeds the value).
    if (!this.#settled) return;
    for (const item of this.items) {
      item.open = values.includes(this.itemValue(item));
      item.setAttribute('data-part', 'item');
      setClasses(item, c.item, 'accordion');
      setClasses(item.querySelector(':scope > [data-part=header]'), c.header, 'accordion');
    }
  }
}

define('ui-accordion', UIAccordion);

declare global {
  interface HTMLElementTagNameMap { 'ui-accordion': UIAccordion }
}

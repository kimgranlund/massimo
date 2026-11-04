// <ui-tabs>: a list of tabs that switches between peer panels (Base UI Tabs: Root, List, Tab,
// Indicator, Panel). Authored with its parts as [data-part] children:
//   <div data-part="list"><div data-part="tab" value="a">A</div>…</div><div data-part="panel" value="a">…</div>…
// or as a preset, panels alone: `<div data-part="panel" value="a" label="Overview">…</div>` (the list
// and tabs are generated from the labels). Values are the tabs' and panels' `value` attributes
// (else their index). The indicator (generated when absent) is placed by Base UI's variables
// --active-tab-left / -top / -right / -bottom / -width / -height, px from the active tab's box
// (script, on change and resize). Roving focus: the active tab is the list's tab stop; arrow keys
// (Left / Right, mirrored in RTL; Up / Down when vertical), Home and End move focus, wrapping and
// skipping disabled tabs; Enter, Space or a press activates, or focus does with activate-on-focus.
// A user change fires a cancelable change { value, reason: 'none', event } (Base UI's reason).
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { eventDetails } from '../../dom/events.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { arrangeSlots, claimSlots } from '../slots.ts';
import { tabs as tabsRecipe } from '../../styled-system/recipes/tabs.js';
import { INDICATOR_VARS, activeTabVars } from './indicator.ts';
import '../../icons/index.ts';

const on = (v: unknown) => (v ? '' : undefined);
export type ActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export class UITabs extends UIElement {
  static properties = {
    value: { type: String, default: '' },
    defaultValue: { type: String, default: '', attribute: 'default-value' },
    orientation: { type: String, default: 'horizontal' },
    variant: { type: String, default: 'segmented' },
    activateOnFocus: { type: Boolean, default: false, attribute: 'activate-on-focus' },
    label: { type: String, default: '' },
  };
  declare value: string;
  declare defaultValue: string;
  declare orientation: 'horizontal' | 'vertical';
  declare variant: 'segmented' | 'underline';
  declare activateOnFocus: boolean;
  declare label: string;

  #list?: HTMLElement;
  #indicator?: HTMLElement;
  #dir = signal<ActivationDirection>('none');
  #parts = signal(0);
  #ro?: ResizeObserver;
  #mo?: MutationObserver;
  #ids = new Map<Element, string>();

  /** The tab parts, in order. */
  get tabs(): HTMLElement[] { return this.#list ? [...this.#list.children].filter((c) => c.getAttribute('data-part') === 'tab') as HTMLElement[] : []; }
  /** The panel parts, in order. */
  get panels(): HTMLElement[] { return [...this.children].filter((c) => c.getAttribute('data-part') === 'panel') as HTMLElement[]; }
  /** Base UI data-activation-direction: where the active tab moved last (none before any change). */
  get activationDirection() { return this.#dir.value; }

  partValue(el: Element, list: Element[]) { return el.getAttribute('value') ?? String(list.indexOf(el)); }
  #tabValue = (t: Element) => this.partValue(t, this.tabs);
  #id(el: Element, kind: string) {
    if (el.id) return el.id;
    let id = this.#ids.get(el);
    if (!id) this.#ids.set(el, (id = uid(`tabs-${kind}`)));
    return id;
  }

  connected() {
    if (!this.#list) this.#build();
    if (!this.hasAttribute('value')) {
      const first = this.tabs.find((t) => !t.hasAttribute('disabled'));
      this.value = this.hasAttribute('default-value') ? this.defaultValue : first ? this.#tabValue(first) : '';
    }
    this.#ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.#place()) : undefined;
    this.#ro?.observe(this.#list!);
    this.#mo = new MutationObserver(() => this.#parts.value++);
    this.#mo.observe(this, { childList: true });
    this.#mo.observe(this.#list!, { childList: true });
  }

  disconnected() { this.#ro?.disconnect(); this.#mo?.disconnect(); }

  #build() {
    let list = [...this.children].find((c) => c.getAttribute('data-part') === 'list') as HTMLElement | undefined;
    if (!list) {
      // Preset: a tab per labelled panel.
      list = document.createElement('div');
      list.setAttribute('data-part', 'list');
      for (const [i, p] of this.panels.entries()) {
        const t = document.createElement('div');
        t.setAttribute('data-part', 'tab');
        t.setAttribute('value', this.partValue(p, this.panels));
        if (p.hasAttribute('disabled')) t.setAttribute('disabled', '');
        t.textContent = p.getAttribute('label') ?? String(i + 1);
        list.append(t);
      }
      this.prepend(list);
    }
    for (const t of [...list.children].filter((c) => c.getAttribute('data-part') === 'tab') as HTMLElement[]) { claimSlots(t); arrangeSlots(t); }
    let ind = [...list.children].find((c) => c.getAttribute('data-part') === 'indicator') as HTMLElement | undefined;
    if (!ind) { ind = document.createElement('span'); ind.setAttribute('data-part', 'indicator'); list.append(ind); }
    ind.setAttribute('aria-hidden', 'true');
    this.#list = list;
    this.#indicator = ind;
    list.addEventListener('click', (e) => {
      const t = (e.target as Element).closest('[data-part=tab]') as HTMLElement | null;
      if (t && t.parentElement === list) this.#select(t, e);
    });
    list.addEventListener('keydown', this.#onKeydown);
    list.addEventListener('focusin', (e) => {
      const t = (e.target as Element).closest('[data-part=tab]') as HTMLElement | null;
      if (this.activateOnFocus && t && t.parentElement === list && this.#keyed) this.#select(t, e);
    });
  }

  #keyed = false;

  #select(tab: HTMLElement, event: Event) {
    if (tab.hasAttribute('disabled')) return;
    const value = this.#tabValue(tab);
    if (value === this.value) return;
    const e = new CustomEvent('change', { bubbles: true, cancelable: true, detail: { value, ...eventDetails('none', event) } });
    if (!this.dispatchEvent(e)) return;
    const tabs = this.tabs, from = tabs.findIndex((t) => this.#tabValue(t) === this.value), to = tabs.indexOf(tab);
    const vertical = this.orientation === 'vertical';
    this.#dir.value = from < 0 ? 'none' : to > from ? (vertical ? 'down' : 'right') : (vertical ? 'up' : 'left');
    this.value = value;
  }

  #onKeydown = (e: KeyboardEvent) => {
    const t = (e.target as Element).closest('[data-part=tab]') as HTMLElement | null;
    if (!t || t.parentElement !== this.#list) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.#select(t, e); return; }
    const vertical = this.orientation === 'vertical', rtl = !vertical && getComputedStyle(this).direction === 'rtl';
    const step = ({ ArrowRight: vertical ? 0 : rtl ? -1 : 1, ArrowLeft: vertical ? 0 : rtl ? 1 : -1, ArrowDown: vertical ? 1 : 0, ArrowUp: vertical ? -1 : 0 } as Record<string, number>)[e.key];
    const enabled = this.tabs.filter((x) => !x.hasAttribute('disabled'));
    const at = enabled.indexOf(t);
    const to = step ? (at + step + enabled.length) % enabled.length : e.key === 'Home' ? 0 : e.key === 'End' ? enabled.length - 1 : -1;
    if (to < 0 || !enabled.length) return;
    e.preventDefault();
    this.#keyed = true;
    enabled[to].focus();
    this.#keyed = false;
  };

  /** Base UI's indicator variables: the active tab's box in the list, px. */
  #place() {
    const ind = this.#indicator, list = this.#list;
    const t = this.tabs.find((x) => this.#tabValue(x) === this.value);
    if (!ind || !list) return;
    const vars = activeTabVars(list, t);
    if (!vars) { for (const k of INDICATOR_VARS) ind.style.removeProperty(`--active-tab-${k}`); return; }
    for (const [k, v] of Object.entries(vars)) ind.style.setProperty(k, v);
  }

  update() {
    this.#parts.value;
    const list = this.#list, ind = this.#indicator;
    if (!list || !ind) return;
    const value = this.value, dir = this.#dir.value;
    const orientation = this.orientation === 'vertical' ? 'vertical' : 'horizontal';
    const variant = this.variant === 'underline' ? 'underline' : 'segmented';
    const shared = { 'data-orientation': orientation, 'data-activation-direction': dir };
    const tabs = this.tabs, panels = this.panels;
    const panelOf = (v: string) => panels.find((p) => this.partValue(p, panels) === v);
    const tabOf = (v: string) => tabs.find((t) => this.#tabValue(t) === v);
    applyAttrs(this, shared);
    applyAttrs(list, { role: 'tablist', 'aria-orientation': orientation, 'aria-label': this.label || undefined, ...shared });
    for (const t of tabs) {
      const v = this.#tabValue(t), active = v === value, disabled = t.hasAttribute('disabled'), p = panelOf(v);
      applyAttrs(t, {
        role: 'tab', id: this.#id(t, 'tab'), 'aria-selected': String(active), 'aria-controls': p ? this.#id(p, 'panel') : undefined,
        tabindex: active ? 0 : -1, 'aria-disabled': disabled ? 'true' : undefined,
        'data-active': on(active), 'data-disabled': on(disabled), ...shared,
      });
    }
    panels.forEach((p, i) => {
      const v = this.partValue(p, panels), t = tabOf(v), hidden = v !== value;
      p.hidden = hidden;
      applyAttrs(p, {
        role: 'tabpanel', id: this.#id(p, 'panel'), 'aria-labelledby': t ? this.#id(t, 'tab') : undefined, tabindex: 0,
        'data-hidden': on(hidden), 'data-index': i, ...shared,
      });
    });
    applyAttrs(ind, shared);
    const c = tabsRecipe({ variant });
    applyRecipe(this, c, (slot) => slot === 'list' ? list : slot === 'indicator' ? ind : slot === 'tab' || slot === 'panel' ? null : null);
    for (const t of tabs) {
      setClasses(t, c.tab);
      for (const s of ['leading', 'prefix', 'contents', 'suffix', 'trailing'] as const) setClasses(partOf(t, s), c[s]);
    }
    for (const p of panels) setClasses(p, c.panel);
    // Place the indicator from the current layout (reading it forces one), and again on the next
    // frame, after late style or font changes; the ResizeObserver follows later resizes.
    this.#place();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this.#place());
  }
}

define('ui-tabs', UITabs);

declare global {
  interface HTMLElementTagNameMap { 'ui-tabs': UITabs }
}

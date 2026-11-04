// <ui-menubar>: a bar of menus (Base UI Menubar; WAI-ARIA APG menubar). Its children are ui-menu
// elements, whose triggers become the bar's items (role=menuitem):
//   <ui-menubar label="App"><ui-menu label="File">…</ui-menu><ui-menu label="Edit">…</ui-menu></ui-menubar>
// Roving focus: one trigger is the tab stop (the last focused, else the first enabled); ArrowRight /
// ArrowLeft (mirrored in RTL; ArrowDown / ArrowUp when vertical) move between triggers, wrapping;
// Home / End go to the ends; ArrowDown (ArrowRight on a vertical bar) opens a menu on its first item,
// ArrowUp on its last. While a menu is open, ArrowRight / ArrowLeft inside it switch to the next /
// previous menu, and hovering another trigger opens that one; only one menu is open at a time (the
// others close with reason sibling-open). Each menu fires its own openchange.
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { isRtl, menuItemDisabled } from '../../dom/menu.ts';
import { menubarAttrs, menubarKeyIntent, menubarStep } from '../../dom/menubar.ts';
import { setClasses } from '../classes.ts';
import type { UIMenu } from '../menu/menu.element.ts';
import '../menu/menu.element.ts';
import { menubar } from '../../styled-system/recipes/menubar.js';

export class UIMenubar extends UIElement {
  static properties = {
    /** horizontal (default) or vertical: the bar's direction, its keys and where its menus open. */
    orientation: { type: String, default: 'horizontal', reflect: true },
    /** Accessible name of the bar (aria-label). */
    label: { type: String, default: '' },
  };
  declare orientation: 'horizontal' | 'vertical';
  declare label: string;

  #stop = signal(-1);
  #parts = signal(0);
  #mo?: MutationObserver;

  /** The bar's menus, in order. */
  get menus(): UIMenu[] { return [...this.children].filter((c) => c.localName === 'ui-menu') as UIMenu[]; }

  connected() {
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('openchange', this.#onOpenChange as EventListener);
    this.#mo = new MutationObserver(() => this.#parts.value++);
    this.#mo.observe(this, { childList: true });
    // The menus connect after the bar: render again once their triggers exist.
    queueMicrotask(() => this.#parts.value++);
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('openchange', this.#onOpenChange as EventListener);
    this.#mo?.disconnect();
  }

  #vertical() { return this.orientation === 'vertical'; }
  #disabled(menus: UIMenu[]) { return menus.map((m) => m.disabled || !m.trigger || menuItemDisabled(m.trigger)); }

  #onFocusIn = (e: FocusEvent) => {
    const i = this.menus.findIndex((m) => m.trigger === e.target);
    if (i >= 0) this.#stop.value = i;
  };

  /** One menu open at a time: another opening closes the rest (sibling-open); a hover switch moves focus. */
  #onOpenChange = (e: CustomEvent<{ open: boolean; reason: string }>) => {
    const target = e.target as UIMenu;
    if (!e.detail.open || target.parentElement !== this) return;
    queueMicrotask(() => {
      if (!target.open) return;
      for (const m of this.menus) if (m !== target && m.open) m.setOpen(false, 'sibling-open', e);
      if (e.detail.reason === 'trigger-hover') queueMicrotask(() => target.trigger?.focus({ preventScroll: true }));
    });
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;
    const menus = this.menus, target = e.target as Element;
    let i = menus.findIndex((m) => m.trigger === target), inPopup = false;
    if (i < 0) { i = menus.findIndex((m) => m.popup?.contains(target)); inPopup = true; }
    if (i < 0) return;
    const intent = menubarKeyIntent(e.key, { orientation: this.#vertical() ? 'vertical' : 'horizontal', rtl: isRtl(this), inPopup });
    if (!intent) return;
    e.preventDefault();
    if (intent === 'open-first' || intent === 'open-last') {
      if (!menus[i].disabled) menus[i].openMenu('list-navigation', e, intent === 'open-first' ? 'first' : 'last');
      return;
    }
    const j = menubarStep(this.#disabled(menus), i, intent);
    if (j < 0) return;
    const wasOpen = menus.some((m) => m.open);
    if (wasOpen && j !== i) menus[i].setOpen(false, 'sibling-open', e);
    this.#stop.value = j;
    menus[j].trigger?.focus({ preventScroll: true });
    if (wasOpen && j !== i) menus[j].openMenu('list-navigation', e, 'first');
  };

  update() {
    this.#parts.value;
    const menus = this.menus;
    const vertical = this.#vertical();
    const open = menus.some((m) => m.open);
    applyAttrs(this, menubarAttrs({ orientation: vertical ? 'vertical' : 'horizontal', open, label: this.label }));
    const disabled = this.#disabled(menus);
    const stop = this.#stop.value >= 0 && this.#stop.value < menus.length && !disabled[this.#stop.value] ? this.#stop.value : disabled.findIndex((d) => !d);
    menus.forEach((m, k) => { if (m.trigger) applyAttrs(m.trigger, { tabindex: k === stop ? 0 : -1 }); });
    setClasses(this, menubar({ orientation: vertical ? 'vertical' : 'horizontal' }).root);
  }
}

define('ui-menubar', UIMenubar);

declare global {
  interface HTMLElementTagNameMap { 'ui-menubar': UIMenubar }
}

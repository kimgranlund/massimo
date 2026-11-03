// <ui-context-menu>: a menu that opens at the pointer over an area (Base UI ContextMenu). Authored
// like ui-menu, with the area as its trigger part:
//   <ui-context-menu><div data-part="trigger">Right-click here</div>
//     <div data-part="popup"><div data-part="item">Copy</div>…</div></ui-context-menu>
// or as a preset, the area and the items as children (the popup is generated). The popup opens at
// the pointer on contextmenu (right click, the platform's gesture) and on a long press (touch,
// 500 ms), and at the focused element's start corner on Shift+F10 or the ContextMenu key; it is
// placed from script only (no anchor element), 1u from the point, flipping at the viewport edges.
// Everything else (items, keys, submenus, dismissal, events) is ui-menu's: openchange { open,
// reason, event } with reason trigger-press for the gesture.
import { define } from '../../core/index.ts';
import { pointAnchor, type Attrs } from '../../dom/index.ts';
import { UIMenu, type MenuPlacement } from '../menu/menu.element.ts';
import { contextMenu } from '../../styled-system/recipes/context-menu.js';

const on = (v: unknown) => (v ? '' : undefined);
/** The long press that opens the menu on touch, in ms (Base UI: 500). */
export const LONG_PRESS = 500;

export class UIContextMenu extends UIMenu {
  static properties = { ...UIMenu.properties };

  #point = { x: 0, y: 0 };
  #press?: ReturnType<typeof setTimeout>;
  #start = { x: 0, y: 0 };

  protected placement(): MenuPlacement { return this.nested ? 'submenu' : 'point'; }
  protected anchorElement() { return pointAnchor(this.#point.x, this.#point.y, () => this.trigger); }
  protected slottedTrigger() { return false; }
  protected generatedCaret() { return null; }
  protected triggerClass() { return contextMenu().trigger; }
  protected triggerAttrs(open: boolean): Attrs {
    return { 'data-popup-open': on(open), 'data-disabled': on(this.disabled) };
  }

  /** Open at a point (viewport px): reposition when already open. */
  openAt(x: number, y: number, event?: Event, focus: 'first' | 'popup' = 'popup') {
    if (this.disabled) return false;
    this.#point = { x, y };
    if (this.open) { this.place(); return true; }
    return this.openMenu('trigger-press', event, focus);
  }

  protected bindTrigger(trigger: HTMLElement) {
    trigger.addEventListener('contextmenu', (e) => {
      if (this.disabled) return;
      e.preventDefault();
      this.openAt(e.clientX, e.clientY, e);
    });
    // Long press (touch): the platform's contextmenu event does not fire everywhere.
    trigger.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || this.disabled) return;
      clearTimeout(this.#press);
      this.#start = { x: e.clientX, y: e.clientY };
      this.#press = setTimeout(() => this.openAt(this.#start.x, this.#start.y, e), LONG_PRESS);
    });
    const cancel = () => clearTimeout(this.#press);
    trigger.addEventListener('pointerup', cancel);
    trigger.addEventListener('pointercancel', cancel);
    trigger.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - this.#start.x, e.clientY - this.#start.y) > 10) cancel();
    });
    trigger.addEventListener('keydown', (e) => {
      if (this.disabled || !((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu')) return;
      e.preventDefault();
      const r = (e.target as Element).getBoundingClientRect();
      this.openAt(r.left, r.bottom, e, 'first');
    });
  }

  protected rootClass() { return contextMenu().root; }
}

define('ui-context-menu', UIContextMenu);

declare global {
  interface HTMLElementTagNameMap { 'ui-context-menu': UIContextMenu }
}

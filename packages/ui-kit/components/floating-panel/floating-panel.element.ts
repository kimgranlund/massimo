// <ui-floating-panel>: a retained nonmodal panel that moves, resizes, collapses and expands. Author one
// [data-part=header] and one [data-part=body]. The body stays mounted when collapsed. show(), hide(),
// toggle() and snap() are the API: assigning open directly changes nothing visible.
import { UIElement, define } from '../../core/element.ts';
import '../button/button.element.ts';
import { attachPanel, type Anchor } from '../../dom/drag.ts';
import { resolveFloatingPanel } from '../../tokens/geometry/resolve.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { floatingPanel } from '../../styled-system/recipes/floating-panel.js';

const unitOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).scrollPaddingTop) || 4;
const button = (label: string, icon: string, onClick: () => void) => {
  const b = document.createElement('ui-button'); b.setAttribute('variant', 'ghost'); b.setAttribute('aria-label', label);
  const i = document.createElement('i'); i.setAttribute('slot', 'leading'); i.setAttribute('name', icon); b.append(i);
  b.addEventListener('click', onClick);
  return b;
};

export class UIFloatingPanel extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    open: { type: Boolean, default: false, reflect: true },
    collapsed: { type: Boolean, default: false, reflect: true },
  };
  declare label: string;
  declare open: boolean;
  declare collapsed: boolean;
  #panel?: ReturnType<typeof attachPanel>;
  #opener: HTMLElement | null = null;
  #controls?: HTMLElement;

  connected() {
    this.setAttribute('role', 'region');
    this.setAttribute('popover', 'manual');
    this.#panel = attachPanel(this, () => { const g = resolveFloatingPanel({ unit: unitOf(this) }); return { margin: g.margin, step: g.step, min: g.min }; });
    const header = partOf(this, 'header') as HTMLElement | null;
    if (header && !this.#controls) {
      header.tabIndex = 0;
      const c = document.createElement('span'); c.setAttribute('data-part', 'controls');
      c.append(button('Collapse', 'caret-up', () => this.#setCollapsed(!this.collapsed)), button('Close', 'x', () => this.hide()));
      header.append(c); this.#controls = c;
    }
    if (!partOf(this, 'grip')) { const g = document.createElement('span'); g.setAttribute('data-part', 'grip'); g.setAttribute('aria-hidden', 'true'); this.append(g); }
    if (this.open) this.#present();
  }
  disconnected() { this.#panel?.stop(); this.#panel = undefined; }

  update() {
    applyRecipe(this, floatingPanel(), (slot) => (slot === 'controls' ? this.#controls ?? null : partOf(this, slot)));
    this.setAttribute('aria-label', this.label);
    this.toggleAttribute('data-collapsed', this.collapsed);
    const body = partOf(this, 'body') as HTMLElement | null;
    if (body) body.hidden = this.collapsed;
    const toggle = this.#controls?.firstElementChild;
    toggle?.setAttribute('aria-expanded', String(!this.collapsed));
    toggle?.setAttribute('aria-label', this.collapsed ? 'Expand' : 'Collapse');
  }

  #present() { try { (this as HTMLElement & { showPopover?(): void }).showPopover?.(); } catch { /* already open */ } this.toggleAttribute('data-open', true); }
  /** Open it. focus moves focus into the panel; opener takes focus back on hide. */
  show({ focus = false, opener = null }: { focus?: boolean; opener?: HTMLElement | null } = {}) {
    this.#opener = opener;
    if (this.open) return;
    this.open = true;
    this.#present();
    if (focus) (partOf(this, 'header') as HTMLElement | null)?.focus();
    this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, detail: { open: true } }));
  }
  hide() {
    if (!this.open) return;
    this.open = false;
    try { (this as HTMLElement & { hidePopover?(): void }).hidePopover?.(); } catch { /* already closed */ }
    this.removeAttribute('data-open');
    this.#opener?.focus?.();
    this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, detail: { open: false } }));
  }
  toggle(options: { focus?: boolean; opener?: HTMLElement | null } = {}) { if (this.open) this.hide(); else this.show(options); }
  snap(anchor: Anchor) { this.#panel?.snap(anchor); }
  #setCollapsed(on: boolean) { this.collapsed = on; this.dispatchEvent(new CustomEvent('collapsedchange', { bubbles: true, detail: { collapsed: on } })); }
}

define('ui-floating-panel', UIFloatingPanel);

declare global {
  interface HTMLElementTagNameMap { 'ui-floating-panel': UIFloatingPanel }
}

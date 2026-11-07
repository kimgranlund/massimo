// <ui-sidebar>: named navigation sections that collapse to an icon rail. Links keep their names when
// collapsed, for assistive technology. Author sections with [data-part=section] and a link holding an
// icon and a <span> label.
import { UIElement, define } from '../../core/element.ts';
import '../button/button.element.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { sidebar } from '../../styled-system/recipes/sidebar.js';

export class UISidebar extends UIElement {
  static properties = {
    label: { type: String, default: 'Main' },
    collapsed: { type: Boolean, default: false, reflect: true },
  };
  declare label: string;
  declare collapsed: boolean;
  #toggle?: HTMLElement;

  connected() {
    if (this.#toggle) return;
    const t = document.createElement('ui-button'); t.setAttribute('variant', 'ghost'); t.setAttribute('data-part', 'toggle');
    const i = document.createElement('i'); i.setAttribute('slot', 'leading'); i.setAttribute('name', 'sidebar-simple'); t.append(i);
    t.addEventListener('click', () => { this.collapsed = !this.collapsed; this.dispatchEvent(new CustomEvent('collapsedchange', { bubbles: true, detail: { collapsed: this.collapsed } })); });
    this.#toggle = t;
    this.prepend(t);
  }

  update() {
    const c = sidebar();
    this.setAttribute('role', 'navigation');
    this.setAttribute('aria-label', this.label);
    this.toggleAttribute('data-collapsed', this.collapsed);
    applyRecipe(this, c, () => null);
    setClasses(this.#toggle, c.toggle, 'toggle');
    this.#toggle?.setAttribute('aria-label', this.collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    this.#toggle?.setAttribute('aria-expanded', String(!this.collapsed));
  }
}

define('ui-sidebar', UISidebar);

declare global {
  interface HTMLElementTagNameMap { 'ui-sidebar': UISidebar }
}

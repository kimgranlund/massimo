// <ui-toolbar>: a named command strip, one tab stop with arrow keys along it. Children that don't fit
// hide, and a More menu runs them. It only arranges commands: each keeps its own behavior.
import { UIElement, define } from '../../core/element.ts';
import '../button/button.element.ts';
import '../menu/menu.element.ts';
import { attachRoving, fitCount } from '../../dom/toolbar.ts';
import { applyRecipe } from '../classes.ts';
import { toolbar } from '../../styled-system/recipes/toolbar.js';

export class UIToolbar extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    orientation: { type: String, default: 'horizontal' },
  };
  declare label: string;
  declare orientation: 'horizontal' | 'vertical';
  #roving?: ReturnType<typeof attachRoving>;
  #size?: ResizeObserver;
  #more?: HTMLElement;

  connected() {
    this.#roving = attachRoving(this, () => this.orientation === 'vertical');
    if (typeof ResizeObserver !== 'undefined') { this.#size = new ResizeObserver(() => requestAnimationFrame(this.#fit)); this.#size.observe(this); }
  }
  disconnected() { this.#roving?.stop(); this.#size?.disconnect(); }

  update() {
    this.setAttribute('role', 'toolbar');
    this.setAttribute('aria-label', this.label);
    this.setAttribute('aria-orientation', this.orientation);
    this.setAttribute('data-orientation', this.orientation);
    applyRecipe(this, toolbar());
    this.#roving?.sync();
  }

  #moreWidth = 40;
  #items() { return ([...this.children] as HTMLElement[]).filter((c) => c !== this.#more && !c.hasAttribute('data-part')); }
  #fit = () => {
    if (this.orientation === 'vertical') return;
    const items = this.#items();
    items.forEach((i) => { i.hidden = false; });
    const u = parseFloat(getComputedStyle(this).columnGap) || 0;
    const count = fitCount(items.map((i) => i.getBoundingClientRect().width), this.clientWidth - 2 * (parseFloat(getComputedStyle(this).paddingInlineStart) || 0), u, this.#moreWidth);
    items.forEach((item, i) => { item.hidden = i >= count; });
    this.#more?.remove();
    this.#more = undefined;
    const rest = items.slice(count);
    if (rest.length) {
      const menu = document.createElement('ui-menu');
      menu.setAttribute('label', 'More');
      menu.setAttribute('data-part', 'more');
      for (const item of rest) {
        const row = document.createElement('div');
        row.setAttribute('data-part', 'item');
        row.textContent = item.getAttribute('aria-label') || item.textContent?.trim() || '';
        row.addEventListener('click', () => item.click());
        menu.append(row);
      }
      this.#more = menu;
      this.append(menu);
      // The menu's width is only known once it's drawn: fit again if the guess was short.
      requestAnimationFrame(() => { const w = menu.getBoundingClientRect().width; if (w > this.#moreWidth + 0.5) { this.#moreWidth = w; this.#fit(); } });
    }
    this.#roving?.sync();
  };
}

define('ui-toolbar', UIToolbar);

declare global {
  interface HTMLElementTagNameMap { 'ui-toolbar': UIToolbar }
}

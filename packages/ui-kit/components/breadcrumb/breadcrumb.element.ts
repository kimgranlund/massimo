// <ui-breadcrumb>: where a page sits, as links to its ancestors. Author the crumbs as children, root
// first: links, then the current page. The last crumb is the current page. `max-items` folds the middle
// behind an ellipsis, keeping the root and the current page, and the ellipsis shows them all.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { pressKey, visibleCrumbs } from '../../dom/breadcrumb.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { breadcrumb } from '../../styled-system/recipes/breadcrumb.js';

export class UIBreadcrumb extends UIElement {
  static properties = {
    label: { type: String, default: 'Breadcrumb' },
    maxItems: { type: Number, default: 0, attribute: 'max-items' },
  };
  declare label: string;
  declare maxItems: number;

  #crumbs: HTMLElement[] = [];
  #expanded = false;

  connected() {
    if (!this.#crumbs.length) this.#crumbs = [...this.children].filter((e) => !e.hasAttribute('data-part')) as HTMLElement[];
  }

  template() { return html`<ol data-part="list"></ol>`; }

  update() {
    const c = breadcrumb();
    this.setAttribute('role', 'navigation');
    this.setAttribute('aria-label', this.label);
    applyRecipe(this, c);
    const { shown, folded } = visibleCrumbs(this.#crumbs.length, this.maxItems, this.#expanded);
    const last = this.#crumbs.length - 1;
    const item = (children: Node[], withSeparator: boolean) => {
      const li = document.createElement('li');
      li.setAttribute('data-part', 'item');
      li.className = c.item;
      if (withSeparator) {
        const sep = document.createElement('span');
        sep.setAttribute('data-part', 'separator');
        sep.setAttribute('aria-hidden', 'true');
        sep.className = c.separator;
        const icon = document.createElement('i');
        icon.setAttribute('name', 'caret-right');
        sep.append(icon);
        li.append(sep);
      }
      li.append(...children);
      return li;
    };
    const items = shown.flatMap((i, at) => {
      const crumb = this.#crumbs[i];
      crumb.setAttribute('data-part', 'link');
      crumb.classList.add(...c.link.split(' '));
      if (i === last) crumb.setAttribute('aria-current', 'page'); else crumb.removeAttribute('aria-current');
      const li = item([crumb], at > 0);
      return folded && at === 0 ? [li, item([this.#ellipsis(c.ellipsis)], true)] : [li];
    });
    partOf(this, 'list')?.replaceChildren(...items);
  }

  #ellipsis(className: string) {
    const el = document.createElement('span');
    el.setAttribute('data-part', 'ellipsis');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Show all crumbs');
    el.className = className;
    el.textContent = '…';
    const expand = () => {
      this.#expanded = true;
      this.update();
      this.#crumbs[1]?.focus();
    };
    el.addEventListener('click', expand);
    el.addEventListener('keydown', (e) => { if (pressKey(e.key)) { e.preventDefault(); expand(); } });
    return el;
  }
}

define('ui-breadcrumb', UIBreadcrumb);

declare global {
  interface HTMLElementTagNameMap { 'ui-breadcrumb': UIBreadcrumb }
}

// <ui-tree-view>: select one item in a bounded hierarchy. `items` is a list of { id, label, children? }.
// Branches expand on their own, and moving focus doesn't select. It follows the ARIA tree pattern with
// one tab stop.
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { treeKey, visibleRows, type TreeItem } from '../../dom/tree.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { treeView } from '../../styled-system/recipes/tree-view.js';

export class UITreeView extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    items: { default: null },
  };
  declare label: string;
  declare value: string;
  declare items: TreeItem[] | string | null;

  #expanded = signal<ReadonlySet<string>>(new Set());
  #focus = signal('');
  get #tree(): TreeItem[] { const i = this.items; if (Array.isArray(i)) return i; try { return (JSON.parse(i ?? '[]') ?? []) as TreeItem[]; } catch { return []; } }

  connected() {
    this.addEventListener('keydown', this.#onKey);
    this.addEventListener('click', this.#onClick);
  }
  disconnected() { this.removeEventListener('keydown', this.#onKey); this.removeEventListener('click', this.#onClick); }

  update() {
    const c = treeView(), rows = visibleRows(this.#tree, this.#expanded.value), focus = this.#focus.value || this.value || rows[0]?.item.id;
    this.setAttribute('role', 'tree');
    this.setAttribute('aria-label', this.label);
    applyRecipe(this, c, () => null);
    const had = this.contains(document.activeElement);
    this.replaceChildren(...rows.map((r) => {
      const row = document.createElement('div');
      row.setAttribute('role', 'treeitem'); row.setAttribute('data-part', 'row'); row.setAttribute('data-id', r.item.id);
      row.setAttribute('aria-level', String(r.level)); row.setAttribute('aria-posinset', String(r.posinset)); row.setAttribute('aria-setsize', String(r.setsize));
      row.setAttribute('aria-selected', String(r.item.id === this.value)); row.tabIndex = r.item.id === focus ? 0 : -1;
      if (r.branch) row.setAttribute('aria-expanded', String(r.expanded));
      row.style.setProperty('--ui-level', String(r.level)); setClasses(row, c.row);
      const caret = document.createElement('span'); caret.setAttribute('data-part', 'caret'); caret.setAttribute('aria-hidden', 'true'); setClasses(caret, c.caret);
      if (r.branch) { const i = document.createElement('i'); i.setAttribute('name', 'caret-right'); caret.append(i); }
      const label = document.createElement('span'); label.setAttribute('data-part', 'label'); setClasses(label, c.label); label.textContent = r.item.label;
      row.append(caret, label);
      return row;
    }));
    if (had) (this.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
  }

  #toggle(id: string, open: boolean) { const next = new Set(this.#expanded.value); if (open) next.add(id); else next.delete(id); this.#expanded.value = next; }
  #select(id: string) { this.value = id; this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: id } })); }
  #onClick = (e: Event) => {
    const row = (e.target as HTMLElement).closest?.('[data-id]'), id = row?.getAttribute('data-id');
    if (!id) return;
    this.#focus.value = id;
    if ((e.target as HTMLElement).closest('[data-part=caret]') && row!.hasAttribute('aria-expanded')) this.#toggle(id, row!.getAttribute('aria-expanded') !== 'true'); else this.#select(id);
  };
  #onKey = (e: KeyboardEvent) => {
    const id = (e.target as HTMLElement).closest?.('[data-id]')?.getAttribute('data-id');
    if (!id) return;
    const a = treeKey(e.key, visibleRows(this.#tree, this.#expanded.value), id, getComputedStyle(this).direction === 'rtl');
    if (!a) return;
    e.preventDefault();
    if ('focus' in a) this.#focus.value = a.focus;
    else if ('expand' in a) this.#toggle(a.expand, true);
    else if ('collapse' in a) this.#toggle(a.collapse, false);
    else this.#select(a.select);
  };
}

define('ui-tree-view', UITreeView);

declare global {
  interface HTMLElementTagNameMap { 'ui-tree-view': UITreeView }
}

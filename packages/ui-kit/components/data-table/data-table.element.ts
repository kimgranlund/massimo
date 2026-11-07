// <ui-data-table>: semantic records from `columns` and `rows`, with sortable columns and interactive
// cells. A column's render(row) returns a node or text. navigable makes it an ARIA grid with one tab
// stop. Attributes take JSON.
import { UIElement, define } from '../../core/element.ts';
import { ariaSort, attachCellNav, cellText, nextSort, parseSort, sortRows, sortText, type TableColumn } from '../../dom/table.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { dataTable } from '../../styled-system/recipes/data-table.js';

type Row = Record<string, unknown>;
const json = <T,>(v: T[] | string | null): T[] => { if (Array.isArray(v)) return v; try { return (JSON.parse(v ?? '[]') ?? []) as T[]; } catch { return []; } };
const el = (tag: string, part: string, cls: string) => { const n = document.createElement(tag); n.setAttribute('data-part', part); setClasses(n, cls); return n; };

export class UIDataTable extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    columns: { default: null },
    rows: { default: null },
    sort: { type: String, default: '' },
    locale: { type: String, default: '' },
    navigable: { type: Boolean, default: false },
  };
  declare label: string;
  declare columns: TableColumn<Row>[] | string | null;
  declare rows: Row[] | string | null;
  declare sort: string;
  declare locale: string;
  declare navigable: boolean;
  #nav?: ReturnType<typeof attachCellNav>;

  disconnected() { this.#nav?.stop(); this.#nav = undefined; }

  update() {
    const c = dataTable(), cols = json<TableColumn<Row>>(this.columns), sort = parseSort(this.sort), col = cols.find((k) => k.key === sort?.key);
    const rows = sortRows(json<Row>(this.rows), col, sort?.dir ?? 'asc', this.locale || undefined);
    applyRecipe(this, c, () => null);
    this.setAttribute('role', 'region'); this.setAttribute('aria-label', this.label); this.tabIndex = 0;
    const table = el('table', 'content', c.content);
    if (this.navigable) table.setAttribute('role', 'grid');
    const head = document.createElement('tr');
    for (const k of cols) {
      const th = el('th', 'header', c.header); th.setAttribute('scope', 'col');
      if (k.align && k.align !== 'start') th.setAttribute('data-align', k.align);
      if (k.sort) {
        th.setAttribute('aria-sort', ariaSort(sort, k.key));
        const b = el('span', 'sort', c.sort); b.setAttribute('role', 'button'); b.tabIndex = 0; b.textContent = k.label;
        const i = document.createElement('i'); i.setAttribute('name', 'caret-up'); i.setAttribute('aria-hidden', 'true'); b.append(i);
        b.addEventListener('click', (e) => this.#sortBy(k.key, e));
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.#sortBy(k.key, e); } });
        th.append(b);
      } else th.textContent = k.label;
      head.append(th);
    }
    const thead = document.createElement('thead'); thead.append(head);
    const tbody = document.createElement('tbody');
    for (const row of rows) {
      const tr = el('tr', 'row', c.row);
      for (const k of cols) {
        const td = el('td', 'cell', c.cell);
        if (k.align && k.align !== 'start') td.setAttribute('data-align', k.align);
        const content = k.render?.(row);
        if (content instanceof Node) td.append(content); else td.textContent = cellText(k.render ? content : row[k.key]);
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(thead, tbody);
    this.replaceChildren(table);
    this.#nav?.stop(); this.#nav = this.navigable ? attachCellNav(table) : undefined;
  }

  #sortBy(key: string, e: Event) {
    this.sort = sortText(nextSort(parseSort(this.sort), key));
    this.dispatchEvent(new CustomEvent('sortchange', { bubbles: true, detail: { sort: this.sort, event: e } }));
  }
}

define('ui-data-table', UIDataTable);

declare global {
  interface HTMLElementTagNameMap { 'ui-data-table': UIDataTable }
}

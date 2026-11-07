// Data table logic (ui-data-table, React DataTable): sorting and optional cell navigation. Columns and
// rows are data, and both renderers share this module.
import { gridMove, type GridPos } from './grid-nav.ts';

export type Align = 'start' | 'center' | 'end';
export interface TableColumn<R = Record<string, unknown>> {
  key: string;
  label: string;
  align?: Align;
  /** How the column sorts. Omit it for a column that doesn't. */
  sort?: 'text' | 'number';
  /** The cell's content. Default: the row's value as text. */
  render?: (row: R) => unknown;
}
export interface TableSort { key: string; dir: 'asc' | 'desc' }

export const parseSort = (text: string): TableSort | null => { const [key, dir] = text.split(':'); return key ? { key, dir: dir === 'desc' ? 'desc' : 'asc' } : null; };
export const sortText = (s: TableSort | null) => (s ? `${s.key}:${s.dir}` : '');
/** Unsorted, then ascending, then descending, then unsorted. */
export const nextSort = (s: TableSort | null, key: string): TableSort | null => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null);
export const ariaSort = (s: TableSort | null, key: string) => (s?.key === key ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none');

/** A stable sort. Empty values go last in either direction. */
export function sortRows<R extends Record<string, unknown>>(rows: readonly R[], column: TableColumn<R> | undefined, dir: 'asc' | 'desc', locale?: string): R[] {
  if (!column?.sort) return [...rows];
  const empty = (v: unknown) => v === null || v === undefined || v === '';
  const text = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const by = (a: unknown, b: unknown) => (column.sort === 'number' ? Number(a) - Number(b) : text.compare(String(a), String(b)));
  return rows.map((row, i) => ({ row, i })).sort((a, b) => {
    const x = a.row[column.key], y = b.row[column.key];
    if (empty(x) || empty(y)) return empty(x) && empty(y) ? a.i - b.i : empty(x) ? 1 : -1;
    return (dir === 'asc' ? by(x, y) : by(y, x)) || a.i - b.i;
  }).map((e) => e.row);
}

export const cellText = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex="0"]:not([data-part=cell], [data-part=header])';
/** Arrow-key cell navigation with one tab stop (the ARIA grid pattern), reusing dom/grid-nav.ts. */
export function attachCellNav(table: HTMLElement) {
  const rows = () => [...table.querySelectorAll('tr')].map((r) => [...r.children] as HTMLElement[]);
  let at: GridPos = { row: 1, col: 0 };
  const sync = () => {
    const grid = rows(), row = Math.min(at.row, grid.length - 1);
    grid.forEach((r, i) => r.forEach((c, j) => { c.tabIndex = i === row && j === at.col ? 0 : -1; }));
  };
  const onKey = (e: KeyboardEvent) => {
    const cell = (e.target as Element).closest?.('th, td') as HTMLElement | null;
    if (!cell) return;
    const grid = rows(), row = grid.findIndex((r) => r.includes(cell)), col = grid[row]?.indexOf(cell) ?? -1;
    const next = gridMove(e.key, { row, col }, { rows: grid.length, cols: grid[0]?.length ?? 0, pageRows: 5, rtl: getComputedStyle(table).direction === 'rtl' }, e.ctrlKey);
    if (!next) return;
    e.preventDefault();
    at = next; sync();
    const target = grid[next.row][next.col];
    (target.querySelector<HTMLElement>(FOCUSABLE) ?? target).focus();
  };
  table.addEventListener('keydown', onKey); sync();
  return { sync, stop() { table.removeEventListener('keydown', onKey); } };
}

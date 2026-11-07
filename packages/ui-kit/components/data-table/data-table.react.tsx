// React <DataTable>: the same table as <ui-data-table>, from the same columns and rows. A column's
// render(row) returns a React node.
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { ariaSort, attachCellNav, cellText, nextSort, parseSort, sortRows, sortText, type TableColumn } from '../../dom/table.ts';
import { dataTable } from '../../styled-system/recipes/data-table.js';

type Row = Record<string, unknown>;
export interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  /** key:asc or key:desc. */
  defaultSort?: string;
  onSortChange?: (sort: string) => void;
  locale?: string;
  navigable?: boolean;
}

export function DataTable({ label, columns, rows, defaultSort = '', onSortChange, locale, navigable = false, className, ...rest }: DataTableProps) {
  const [sortValue, setSort] = useState(defaultSort), table = useRef<HTMLTableElement>(null), c = dataTable();
  const sort = parseSort(sortValue), col = columns.find((k) => k.key === sort?.key), shown = sortRows(rows, col, sort?.dir ?? 'asc', locale);
  useEffect(() => { if (!navigable) return; const nav = attachCellNav(table.current!); return () => nav.stop(); }, [navigable, shown.length, columns.length]);
  const by = (key: string) => { const next = sortText(nextSort(sort, key)); setSort(next); onSortChange?.(next); };
  const align = (k: TableColumn<Row>) => (k.align && k.align !== 'start' ? k.align : undefined);
  return (
    <div {...rest} data-ui="data-table" role="region" aria-label={label} tabIndex={0} className={[c.root, className].filter(Boolean).join(' ')}>
      <table ref={table} data-part="content" role={navigable ? 'grid' : undefined} className={c.content}>
        <thead>
          <tr>{columns.map((k) => (
            <th key={k.key} scope="col" data-part="header" data-align={align(k)} aria-sort={k.sort ? ariaSort(sort, k.key) : undefined} className={c.header}>
              {k.sort ? <span data-part="sort" role="button" tabIndex={0} className={c.sort} onClick={() => by(k.key)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); by(k.key); } }}>{k.label}<i {...{ name: 'caret-up' }} aria-hidden="true" /></span> : k.label}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={i} data-part="row" className={c.row}>
              {columns.map((k) => <td key={k.key} data-part="cell" data-align={align(k)} className={c.cell}>{k.render ? k.render(row) as ReactNode : cellText(row[k.key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// React Column, List and Grid: the ui-column, ui-list and ui-grid elements as data-ui hosts with plain
// attributes (flow.recipe.ts), styled by the same global rules. List renders a native ul.
import type { HTMLAttributes } from 'react';
import type { GridColumns, GridMin } from '../../tokens/geometry/resolve.ts';

type Align = 'start' | 'center' | 'end' | 'stretch';
const attrs = (a: Record<string, string | number | undefined>) => Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));

export interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
  /** Gutter between children in units of u, 0 … 8 in 0.5 steps. Default 2. */
  gap?: number;
  /** Cross-axis alignment. Default: stretch. */
  align?: Align;
}
/** React Column (ui-column): children in a stack. */
export function Column({ gap, align, ...rest }: ColumnProps) {
  return <div {...rest} data-ui="column" {...attrs({ gap, align })} />;
}

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /** Gutter between items in units of u, 0 … 8 in 0.5 steps. Default 2. */
  gap?: number;
  /** Cross-axis alignment. Default: stretch. */
  align?: Align;
}
/** React List (ui-list): an unordered list in a stack, with no markers. Give it li children. */
export function List({ gap, align, ...rest }: ListProps) {
  return <ul {...rest} data-ui="list" {...attrs({ gap, align })} />;
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Gutter between tiles in units of u, 0 … 8 in 0.5 steps. Default 2. */
  gap?: number;
  /** A fixed column count. Default: as many tiles as fit `min`. */
  columns?: GridColumns;
  /** The smallest tile width: sm 40u, md 60u, lg 80u. Default md. */
  min?: GridMin;
}
/** React Grid (ui-grid): tiles that wrap to fill the row. */
export function Grid({ gap, columns, min, ...rest }: GridProps) {
  return <div {...rest} data-ui="grid" {...attrs({ gap, columns, min })} />;
}

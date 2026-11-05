// React Row: the ui-row element as <div data-ui="row"> (row.recipe.ts), styled by the same global rules.
import type { HTMLAttributes } from 'react';

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  /** A title row: the height of a divided row, for a title above a list. */
  header?: boolean;
}

/** React Row (ui-row): a composed row that takes its inset from the container holding it. */
export function Row({ header, ...rest }: RowProps) {
  return <div {...rest} data-ui="row" {...(header ? { header: '' } : {})} />;
}

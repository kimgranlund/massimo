// React Row: the ui-row element as <div data-ui="row"> (row.recipe.ts), styled by the same global rules.
import type { HTMLAttributes } from 'react';

export type RowProps = HTMLAttributes<HTMLDivElement>;

/** React Row (ui-row): a line of text and actions. */
export function Row(props: RowProps) {
  return <div {...props} data-ui="row" />;
}

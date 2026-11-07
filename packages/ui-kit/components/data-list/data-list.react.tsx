// React DataList: the ui-data-list element as <div data-ui="data-list"> around a native dl, with the
// same global rules. Each DataList.Item is a row: a dt and a dd in a div.
import type { HTMLAttributes, ReactNode } from 'react';

export interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  /** Rule the rows. */
  divided?: boolean;
  /** inline (default): label beside value. stacked: label above value. */
  layout?: 'inline' | 'stacked';
  children?: ReactNode;
}

export function DataList({ divided, layout, children, ...rest }: DataListProps) {
  return (
    <div {...rest} data-ui="data-list" {...(divided ? { divided: '' } : {})} {...(layout ? { layout } : {})}>
      <dl>{children}</dl>
    </div>
  );
}

export interface DataListItemProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  children?: ReactNode;
}

/** One record: its label and value. */
export function DataListItem({ label, children, ...rest }: DataListItemProps) {
  return <div {...rest}><dt>{label}</dt><dd>{children}</dd></div>;
}
DataList.Item = DataListItem;

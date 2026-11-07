// React SettingRow: the ui-setting-row element as <div data-ui="setting-row">, styled by the same global rules.
import type { HTMLAttributes, ReactNode } from 'react';

export interface SettingRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** The controls. Give each its own accessible name. */
  children?: ReactNode;
}

/** React SettingRow (ui-setting-row): setting copy beside its controls. */
export function SettingRow({ title, description, children, ...rest }: SettingRowProps) {
  return (
    <div {...rest} data-ui="setting-row">
      <div data-part="copy">
        <span data-part="title">{title}</span>
        {description != null && <span data-part="description">{description}</span>}
      </div>
      {children}
    </div>
  );
}

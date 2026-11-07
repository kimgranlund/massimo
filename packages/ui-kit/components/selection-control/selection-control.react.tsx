// React <SelectionControl>: a control beside its label and value. React already holds the value, so
// the caller passes the text, and the shape matches <ui-selection-control>.
import type { ReactNode } from 'react';
import { selectionControl } from '../../styled-system/recipes/selection-control.js';

export interface SelectionControlProps {
  label: string;
  /** The value as text. */
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function SelectionControl({ label, value, children, className }: SelectionControlProps) {
  const c = selectionControl();
  return (
    <div data-ui="selection-control" className={[c.root, className].filter(Boolean).join(' ')}>
      <span data-part="label" className={c.label}>{label}</span>
      {children}
      <span data-part="value" className={c.value}>{value}</span>
    </div>
  );
}

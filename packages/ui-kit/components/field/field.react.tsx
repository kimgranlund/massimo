// React <Field> and <FieldGrid>: the anatomy and classes of <ui-field> / <ui-field-grid>.
// The label is a native <label htmlFor> (a native child control gets focus on a press); the ids to
// wire reach the control through a render function: `id` for a native control, `aria-labelledby`
// and `aria-describedby` for any control (they name it "label unit", like the web component).
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../styled-system/css/cx.js';
import { field, fieldGrid } from '../../styled-system/recipes/index.js';

/** Props a field passes to its control. */
export interface FieldControlProps {
  id: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: string;
  /** Unit shown at the label's end ("px"); part of the control's accessible name. */
  unit?: string;
  /** Readout in the readout column (tabular figures, end-aligned). */
  readout?: ReactNode;
  description?: string;
  /** stacked: label above the control; inline: label beside it. */
  layout?: 'stacked' | 'inline';
  /** Id of the control; generated when omitted. */
  htmlFor?: string;
  /** The control, or a function that receives the ids to put on it. */
  children?: ReactNode | ((ids: FieldControlProps) => ReactNode);
}

export function Field({ label, unit, readout, description, layout = 'stacked', htmlFor, children, className, ...rest }: FieldProps) {
  const auto = useId();
  const id = htmlFor ?? `${auto}field`;
  const ids = { label: `${id}-label`, unit: `${id}-unit`, desc: `${id}-desc` };
  const c = field({ layout });
  const control: FieldControlProps = {
    id,
    'aria-labelledby': label ? [ids.label, unit && ids.unit].filter(Boolean).join(' ') : undefined,
    'aria-describedby': description ? ids.desc : undefined,
  };
  return (
    <div data-ui="field" data-layout={layout} className={cx(c.root, className)} {...rest}>
      {label && (
        <label data-part="label" htmlFor={id} className={c.label}>
          <span data-part="contents" id={ids.label} className={c.contents}>{label}</span>
          {unit && <span data-part="suffix" id={ids.unit} className={c.suffix}>{unit}</span>}
        </label>
      )}
      {typeof children === 'function' ? children(control) : children}
      {readout != null && readout !== '' && <span data-part="readout" className={c.readout}>{readout}</span>}
      {description && <p data-part="description" id={ids.desc} className={c.description}>{description}</p>}
    </div>
  );
}

/** Shared label | control | readout columns: each Field child is a subgrid row; headings span. */
export function FieldGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-ui="field-grid" className={cx(fieldGrid().root, className)} {...rest} />;
}

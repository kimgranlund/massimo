// React <Field> and <FieldGrid>: the anatomy and classes of <ui-field> / <ui-field-grid>.
// The label is a native <label htmlFor> (a native child control gets focus on a press); the ids to
// wire reach the control through a render function: `id` for a native control, `aria-labelledby`
// and `aria-describedby` for any control (they name it "label unit", like the web component).
// Compound parts (Base UI Field): Field.Root, Field.Label (with the unit as its suffix), Field.Control
// (renders no element of its own: it hands the ids to its child, `render` element or function),
// Field.Description, Field.Error, and Field.Readout (ours). Parts are direct children of Field.Root,
// which reads the Label, Description and Error among them to wire the control. The preset <Field
// label unit readout description error> is Root + those parts.
import { Children, cloneElement, createContext, isValidElement, useContext, useId, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { findPart, renderPart, type PartBase, type PartState } from '../compound.react.tsx';
import { cx } from '../../styled-system/css/cx.js';
import { field, fieldGrid } from '../../styled-system/recipes/index.js';

/** Props a field passes to its control. */
export interface FieldControlProps {
  id: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>, PartBase {
  label?: string;
  /** Unit shown at the label's end ("px"); part of the control's accessible name. */
  unit?: string;
  /** Readout in the readout column (tabular figures, end-aligned). */
  readout?: ReactNode;
  description?: string;
  /** Error message under the control (Base UI Field.Error), in the description's place and after it. */
  error?: string;
  /** stacked: label above the control; inline: label beside it. */
  layout?: 'stacked' | 'inline';
  /** Id of the control; generated when omitted. */
  htmlFor?: string;
  /** The control, or a function that receives the ids to put on it (Field.Root: the parts). */
  children?: ReactNode | ((ids: FieldControlProps) => ReactNode);
}

/** Field.Root's props: the preset's without the content its parts carry. */
export type FieldRootProps = Omit<FieldProps, 'label' | 'unit' | 'readout' | 'description' | 'error'>;

interface FieldContext { c: Record<string, string>; state: PartState; id: string; ids: { label: string; unit: string; desc: string; error: string }; control: FieldControlProps }
const Ctx = createContext<FieldContext | null>(null);
const useField = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Field.Root`);
  return v;
};

/** Field.Root: the grid host; wires the control from the Label, Description and Error among its children. */
export function FieldRoot({ layout = 'stacked', htmlFor, children, className, render, ...rest }: FieldRootProps) {
  const auto = useId();
  const id = htmlFor ?? `${auto}field`;
  const ids = { label: `${id}-label`, unit: `${id}-unit`, desc: `${id}-desc`, error: `${id}-error` };
  const c = field({ layout });
  const kids = typeof children === 'function' ? null : children;
  const label = findPart<FieldLabelProps>(kids, [FieldLabel]);
  const described = [findPart(kids, [FieldDescription]) && ids.desc, findPart(kids, [FieldError]) && ids.error].filter(Boolean).join(' ');
  const control: FieldControlProps = {
    id,
    'aria-labelledby': label ? [ids.label, label.props.unit && ids.unit].filter(Boolean).join(' ') : undefined,
    'aria-describedby': described || undefined,
  };
  const state = { layout };
  return (
    <Ctx.Provider value={{ c, state, id, ids, control }}>
      {renderPart('div', c.root, { 'data-ui': 'field', 'data-layout': layout, className, ...rest, render, children: typeof children === 'function' ? children(control) : children }, state)}
    </Ctx.Provider>
  );
}

export interface FieldLabelProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'className'>, PartBase {
  /** Unit at the label's end, in its suffix part; part of the control's accessible name. */
  unit?: ReactNode;
  children?: ReactNode;
}

/** Field.Label: a native <label htmlFor> with the text (contents) and the unit (suffix). */
export function FieldLabel({ unit, children, className, render, ...rest }: FieldLabelProps) {
  const f = useField('Field.Label');
  return renderPart('label', f.c.label, {
    'data-part': 'label', htmlFor: f.id, className, ...rest, render,
    children: <>
      <span data-part="contents" id={f.ids.label} className={f.c.contents}>{children}</span>
      {unit != null && unit !== '' && <span data-part="suffix" id={f.ids.unit} className={f.c.suffix}>{unit}</span>}
    </>,
  }, f.state);
}

export interface FieldControlPartProps {
  /** The control to wire: an element (the ids merge into its props) or `(ids, state) => element`. */
  render?: ReactElement | ((ids: FieldControlProps, state: PartState) => ReactNode);
  /** The control element (the ids merge into it), or a function of the ids. */
  children?: ReactNode | ((ids: FieldControlProps) => ReactNode);
}

/** Field.Control: renders no element of its own; hands the control ids to its child. */
export function FieldControl({ render, children }: FieldControlPartProps) {
  const f = useField('Field.Control');
  if (typeof render === 'function') return <>{render(f.control, f.state)}</>;
  if (isValidElement(render)) return cloneElement(render, f.control as unknown as Record<string, unknown>);
  if (typeof children === 'function') return <>{children(f.control)}</>;
  const only = Children.toArray(children);
  return <>{only.length === 1 && isValidElement(only[0]) ? cloneElement(only[0], f.control as unknown as Record<string, unknown>) : children}</>;
}

export interface FieldTextPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Field.Readout (ours): the readout column (tabular figures, end-aligned). */
export function FieldReadout({ className, render, ...rest }: FieldTextPartProps) {
  const f = useField('Field.Readout');
  return renderPart('span', f.c.readout, { 'data-part': 'readout', className, ...rest, render }, f.state);
}

/** Field.Description: help text, wired with aria-describedby. */
export function FieldDescription({ className, render, ...rest }: FieldTextPartProps) {
  const f = useField('Field.Description');
  return renderPart('p', f.c.description, { 'data-part': 'description', id: f.ids.desc, className, ...rest, render }, f.state);
}

/** Field.Error: the error message, wired with aria-describedby after the description. */
export function FieldError({ className, render, ...rest }: FieldTextPartProps) {
  const f = useField('Field.Error');
  return renderPart('p', f.c.error, { 'data-part': 'error', id: f.ids.error, className, ...rest, render }, f.state);
}

/** Preset: Field.Root with a Label (and unit), the control, a Readout, a Description and an Error. */
export function Field({ label, unit, readout, description, error, layout = 'stacked', children, ...rest }: FieldProps) {
  return (
    <FieldRoot layout={layout} {...rest}>
      {label && <FieldLabel unit={unit}>{label}</FieldLabel>}
      {typeof children === 'function' ? <FieldControl>{children}</FieldControl> : children}
      {readout != null && readout !== '' && <FieldReadout>{readout}</FieldReadout>}
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </FieldRoot>
  );
}
Field.Root = FieldRoot;
Field.Label = FieldLabel;
Field.Control = FieldControl;
Field.Readout = FieldReadout;
Field.Description = FieldDescription;
Field.Error = FieldError;

/** Shared label | control | readout columns: each Field child is a subgrid row; headings span. */
export function FieldGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-ui="field-grid" className={cx(fieldGrid().root, className)} {...rest} />;
}

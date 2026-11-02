// Thin React bindings for ui-kit web components: properties go through React 19's custom
// element support; events are attached with addEventListener.
import { useCallback, useRef, type ReactNode } from 'react';
import '@massimo/ui-kit/components/field/element';
import * as s from './styles.ts';

/**
 * Listen for a DOM event on an element. Returns a callback ref, so the listener follows the element:
 * a keyed component that remounts (a select whose options change) gets its listener again.
 */
export function useEvent(type: string, fn: (el: any) => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((el: any) => {
    if (!el) return;
    const h = () => fnRef.current(el);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type]);
}

// Figma-style pane rows: ui-field rows (layout="inline") in the panel's ui-field-grid, which shares
// the label | control | readout columns across every group of a tab. The field's label names its
// control (aria-labelledby, or labelledby on ui-select), so controls carry no label of their own.

/** A pane row. A trailing "(unit)" in the label becomes the unit suffix: "Unit (px)" → Unit … px. */
export function Field({ label, readout, id, children }: { label: string; readout?: string; id?: string; children: ReactNode }) {
  const m = /^(.*?)\s*\(([^()]+)\)$/.exec(label);
  return <ui-field id={id} layout="inline" label={m ? m[1] : label} unit={m ? m[2] : ''} readout={readout ?? ''}>{children}</ui-field>;
}

export function Range({ label, value, min, max, step, onValue, format }: { label: string; value: number; min: number; max: number; step: number; onValue: (v: number) => void; format?: (v: number) => string }) {
  const ref = useEvent('input', (el) => onValue(Number(el.value)));
  return (
    <Field label={label} readout={format ? format(value) : String(value)}>
      <ui-range ref={ref} min={min} max={max} step={step} value={value} />
    </Field>
  );
}

export function Segmented<T extends string>({ label, value, options, onValue }: { label?: string; value: T; options: [T, string][]; onValue: (v: T) => void }) {
  const ref = useEvent('change', (el) => onValue(el.value));
  const control = (
    <ui-segmented ref={ref} value={value}>
      {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
    </ui-segmented>
  );
  return label ? <Field label={label}>{control}</Field> : <div className={s.control}>{control}</div>;
}

/** ui-select moves its options into its popup, so a change of option list remounts it. */
type SelectProps = { label: string; value: string; options: [string, string][]; onValue: (v: string) => void; swatch?: (value: string) => string };
/** How a bare select is named: by visible text elsewhere (`labelledby`, ids) or, with nothing visible
 * to point at (the content header), by its own hidden label. In a Field the field names it. */
type ControlProps = Omit<SelectProps, 'label'> & { label?: string; labelledby?: string };

/** `swatch` maps an option value to a CSS color: each option and the trigger lead with a ui-swatch. */
export function SelectControl({ label, labelledby, value, options, onValue, swatch }: ControlProps) {
  const ref = useEvent('change', (el) => onValue(el.value));
  const name = label ? { label, 'hide-label': '' } : labelledby ? { labelledby } : {};
  return <ui-select key={options.map((o) => o[0]).join('|')} ref={ref} {...name} value={value}>
    {/* The select moves this into its trigger once; React then only updates its color attribute. */}
    {swatch && <ui-swatch slot="leading" color={swatch(value)} />}
    {options.map(([v, l]) => <ui-option key={v} value={v}>{swatch && <ui-swatch slot="leading" color={swatch(v)} />}{l}</ui-option>)}
  </ui-select>;
}

export function Select({ label, ...props }: SelectProps) {
  return <Field label={label}><SelectControl {...props} /></Field>;
}

export function Switch({ label, checked, onValue }: { label: string; checked: boolean; onValue: (v: boolean) => void }) {
  const ref = useEvent('change', (el) => onValue(el.checked));
  return <Field label={label}><ui-switch ref={ref} checked={checked} /></Field>;
}

/** A group of rows: a heading in the panel's field grid, spanning its columns, then the rows. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return <><h2>{title}</h2>{children}</>;
}

// Thin React bindings for ui-kit web components: properties go through React 19's custom
// element support; events are attached with addEventListener.
import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import '@massimo/ui-kit/components/field/element';
import * as s from './styles.ts';

/**
 * Listen for a DOM event on an element. Returns a callback ref, so the listener follows the element:
 * a keyed component that remounts (a select whose options change) gets its listener again.
 */
export function useEvent(type: string, fn: (el: any, detail: any) => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((el: any) => {
    if (!el) return;
    // ui-kit events carry Base UI's details: { value | checked | open, reason, event } (dom/events.ts).
    const h = (e: Event) => fnRef.current(el, (e as CustomEvent).detail);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type]);
}

// Figma-style pane rows: ui-field rows (layout="inline") in the panel's ui-field-grid, which shares
// the label | control | readout columns across every group of a tab. The field's label names its
// control (aria-labelledby, or labelledby on ui-select), so controls carry no label of their own.

/** A pane row. A trailing "(unit)" in the label becomes the unit suffix: "Unit (px)" → Unit … px. */
export function Field({ label, readout, id, description, children }: { label: string; readout?: string; id?: string; description?: string; children: ReactNode }) {
  const m = /^(.*?)\s*\(([^()]+)\)$/.exec(label);
  return <ui-field id={id} layout="inline" label={m ? m[1] : label} unit={m ? m[2] : ''} readout={readout ?? ''} description={description ?? ''}>{children}</ui-field>;
}

export function Range({ label, value, min, max, step, onValue, format, disabled, description }: { label: string; value: number; min: number; max: number; step: number; onValue: (v: number) => void; format?: (v: number) => string; disabled?: boolean; description?: string }) {
  const ref = useEvent('input', (_el, d) => onValue(d.value));
  return (
    <Field label={label} readout={format ? format(value) : String(value)} description={description}>
      <ui-range ref={ref} min={min} max={max} step={step} value={value} disabled={disabled} />
    </Field>
  );
}

export function Segmented<T extends string>({ label, value, options, onValue }: { label?: string; value: T; options: [T, string][]; onValue: (v: T) => void }) {
  const ref = useEvent('change', (_el, d) => onValue(d.value));
  const control = (
    <ui-segmented ref={ref} value={value}>
      {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
    </ui-segmented>
  );
  return label ? <Field label={label}>{control}</Field> : <div className={s.control}>{control}</div>;
}

/** ui-select moves its options into its popup, so a change of option list remounts it. */
/** A color, or a split swatch: the left half dark mode, the right half light mode, each a [surface, color] pair (a square of the surface, an inset circle of the color). */
export type SwatchSpec = string | { dark: [string, string]; light: [string, string] };
type SelectProps = { label: string; value: string; options: [string, string][]; onValue: (v: string) => void; swatch?: (value: string) => SwatchSpec | undefined };
/** How a bare select is named: by visible text elsewhere (`labelledby`, ids) or, with nothing visible
 * to point at (the content header), by its own hidden label. In a Field the field names it. */
type ControlProps = Omit<SelectProps, 'label'> & { label?: string; labelledby?: string };

// Split swatch: two halves (dark | light), each its surface with an inset half-circle of its color, so
// the contrast of a text color reads in both schemes at once.
const split = css({
  display: 'inline-block', position: 'relative', flexShrink: 0, width: '[var(--icon)]', height: '[var(--icon)]',
  borderRadius: '[calc(var(--u) * var(--ui-radius-scale))]', overflow: 'hidden',
  background: '[linear-gradient(90deg, var(--sw-db) 50%, var(--sw-lb) 50%)]',
  boxShadow: '[inset 0 0 0 1px color-mix(in oklch, var(--colors-border) 60%, transparent)]',
  _after: { content: '""', position: 'absolute', inset: '[18%]', borderRadius: 'full', background: '[linear-gradient(90deg, var(--sw-df) 50%, var(--sw-lf) 50%)]' },
});
function Swatch({ spec }: { spec?: SwatchSpec }) {
  if (spec === undefined) return <ui-swatch slot="leading" color="transparent" />;
  if (typeof spec === 'string') return <ui-swatch slot="leading" color={spec} />;
  return <span slot="leading" className={split} aria-hidden="true" style={{ '--sw-db': spec.dark[0], '--sw-df': spec.dark[1], '--sw-lb': spec.light[0], '--sw-lf': spec.light[1] } as CSSProperties} />;
}

/** `swatch` maps an option value to a CSS color or a split swatch: each option and the trigger lead with it. */
export function SelectControl({ label, labelledby, value, options, onValue, swatch }: ControlProps) {
  const ref = useEvent('change', (_el, d) => onValue(d.value));
  const name = label ? { label, 'hide-label': '' } : labelledby ? { labelledby } : {};
  return <ui-select key={options.map((o) => o[0]).join('|')} ref={ref} {...name} value={value}>
    {/* The select moves this into its trigger once; React then only updates its color attribute. */}
    {swatch && <Swatch spec={swatch(value)} />}
    {options.map(([v, l]) => <ui-option key={v} value={v}>{swatch && <Swatch spec={swatch(v)} />}{l}</ui-option>)}
  </ui-select>;
}

export function Select({ label, ...props }: SelectProps) {
  return <Field label={label}><SelectControl {...props} /></Field>;
}

export function Switch({ label, checked, onValue }: { label: string; checked: boolean; onValue: (v: boolean) => void }) {
  const ref = useEvent('change', (_el, d) => onValue(d.checked));
  return <Field label={label}><ui-switch ref={ref} checked={checked} /></Field>;
}

/** A group of rows: a heading in the panel's field grid, spanning its columns, then the rows. */
export function Group({ title, children }: { title: string; children: ReactNode }) {
  return <><h2>{title}</h2>{children}</>;
}

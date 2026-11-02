// Thin React bindings for ui-kit web components: properties go through React 19's custom
// element support; events are attached with addEventListener.
import { useCallback, useRef, type ReactNode } from 'react';
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

// Figma-style pane rows: a 5-column grid where every row is a label (2 columns) and a control
// (3 columns). Components keep their own label for assistive tech; the pane hides it visually.

/** A pane row: label in columns 1–2, control in columns 3–5. */
// A trailing "(unit)" in a label becomes a unit suffix at the label's end: "Unit (px)" → Unit … px.
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const m = /^(.*?)\s*\(([^()]+)\)$/.exec(label);
  return (
    <>
      <span className={s.paneLabel}>
        <span className={s.paneLabelText}>{m ? m[1] : label}</span>
        {m && <span className={s.paneUnit}>{m[2]}</span>}
      </span>
      <div className={s.paneControl}>{children}</div>
    </>
  );
}

export function Range({ label, value, min, max, step, onValue, format }: { label: string; value: number; min: number; max: number; step: number; onValue: (v: number) => void; format?: (v: number) => string }) {
  const ref = useEvent('input', (el) => onValue(Number(el.value)));
  return (
    <Field label={label}>
      <ui-range ref={ref} label={label} min={min} max={max} step={step} value={value} />
      <span className={s.value}>{format ? format(value) : value}</span>
    </Field>
  );
}

export function Segmented<T extends string>({ label, value, options, onValue }: { label?: string; value: T; options: [T, string][]; onValue: (v: T) => void }) {
  const ref = useEvent('change', (el) => onValue(el.value));
  const control = (
    <ui-segmented ref={ref} value={value} label={label ?? ''}>
      {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
    </ui-segmented>
  );
  return label ? <Field label={label}>{control}</Field> : <div className={s.control}>{control}</div>;
}

/** ui-select moves its options into its popup, so a change of option list remounts it. */
type SelectProps = { label: string; value: string; options: [string, string][]; onValue: (v: string) => void; swatch?: (value: string) => string };

/** The jig shows the name in its pane row, so the select's own label is hidden (still its accessible name).
 * `swatch` maps an option value to a CSS color: each option and the trigger lead with a ui-swatch. */
export function SelectControl({ label, value, options, onValue, swatch }: SelectProps) {
  const ref = useEvent('change', (el) => onValue(el.value));
  return <ui-select key={options.map((o) => o[0]).join('|')} ref={ref} label={label} hide-label="" value={value}>
    {/* The select moves this into its trigger once; React then only updates its color attribute. */}
    {swatch && <ui-swatch slot="leading" color={swatch(value)} />}
    {options.map(([v, l]) => <ui-option key={v} value={v}>{swatch && <ui-swatch slot="leading" color={swatch(v)} />}{l}</ui-option>)}
  </ui-select>;
}

export function Select(props: SelectProps) {
  return <Field label={props.label}><SelectControl {...props} /></Field>;
}

export function Switch({ label, checked, onValue }: { label: string; checked: boolean; onValue: (v: boolean) => void }) {
  const ref = useEvent('change', (el) => onValue(el.checked));
  return <Field label={label}><ui-switch ref={ref} checked={checked} aria-label={label} /></Field>;
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className={s.paneGrid}><h2 className={s.groupTitle}>{title}</h2>{children}</section>;
}

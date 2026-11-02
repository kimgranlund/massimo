// Thin React bindings for ui-kit web components: properties go through React 19's custom
// element support; events are attached with addEventListener.
import { useEffect, useRef, type ReactNode } from 'react';
import * as s from './styles.ts';

export function useEvent(type: string, fn: (el: any) => void) {
  const ref = useRef<any>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = () => fnRef.current(el);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type]);
  return ref;
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
export function SelectControl({ label, value, options, onValue }: { label: string; value: string; options: [string, string][]; onValue: (v: string) => void }) {
  const ref = useEvent('change', (el) => onValue(el.value));
  return <ui-select key={options.map((o) => o[0]).join('|')} ref={ref} label={label} value={value}>
    {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
  </ui-select>;
}

export function Select(props: { label: string; value: string; options: [string, string][]; onValue: (v: string) => void }) {
  return <Field label={props.label}><SelectControl {...props} /></Field>;
}

export function Switch({ label, checked, onValue }: { label: string; checked: boolean; onValue: (v: boolean) => void }) {
  const ref = useEvent('change', (el) => onValue(el.checked));
  return <Field label={label}><ui-switch ref={ref} checked={checked} aria-label={label} /></Field>;
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className={s.paneGrid}><h2 className={s.groupTitle}>{title}</h2>{children}</section>;
}

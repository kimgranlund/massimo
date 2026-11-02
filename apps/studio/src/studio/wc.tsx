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

export function Range({ label, value, min, max, step, onValue, format }: { label: string; value: number; min: number; max: number; step: number; onValue: (v: number) => void; format?: (v: number) => string }) {
  const ref = useEvent('input', (el) => onValue(Number(el.value)));
  return (
    <div className={s.control}>
      <span className={s.controlHead}><span>{label}</span><span className={s.value}>{format ? format(value) : value}</span></span>
      <ui-range ref={ref} label={label} min={min} max={max} step={step} value={value} />
    </div>
  );
}

export function Segmented<T extends string>({ label, value, options, onValue }: { label?: string; value: T; options: [T, string][]; onValue: (v: T) => void }) {
  const ref = useEvent('change', (el) => onValue(el.value));
  return (
    <div className={s.control}>
      {label && <span className={s.controlHead}><span>{label}</span></span>}
      <ui-segmented ref={ref} value={value} label={label ?? ''}>
        {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
      </ui-segmented>
    </div>
  );
}

/** ui-select moves its options into its popup, so a change of option list remounts it. */
export function Select({ label, value, options, onValue }: { label: string; value: string; options: [string, string][]; onValue: (v: string) => void }) {
  const ref = useEvent('change', (el) => onValue(el.value));
  return <ui-select key={options.map((o) => o[0]).join('|')} ref={ref} label={label} value={value}>
    {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
  </ui-select>;
}

export function Switch({ label, checked, onValue }: { label: string; checked: boolean; onValue: (v: boolean) => void }) {
  const ref = useEvent('change', (el) => onValue(el.checked));
  return <ui-switch ref={ref} checked={checked}>{label}</ui-switch>;
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className={s.group}><h2 className={s.groupTitle}>{title}</h2>{children}</section>;
}

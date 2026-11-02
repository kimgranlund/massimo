// React side of the data-* state contract (dom/state.ts): the field state a web component's
// UIFormElement sets on its host (data-disabled, data-readonly, data-required, data-valid /
// data-invalid once shown, data-dirty, data-touched, data-filled, data-focused), kept here from the
// host's own events. A host with a native control (input, select) reads it on focus, blur, input,
// change, invalid and form reset; a host without one (Listbox, Palette) passes its value.
// Choices also get data-checked / data-unchecked / data-indeterminate from the native input, so a
// radio follows its group: a change on any radio of the same name rereads this one.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FocusEvent } from 'react';
import { checkedDataAttrs, fieldDataAttrs, toReactProps } from '../dom/index.ts';

/** A disabled Fieldset around a host (fieldset.react.tsx provides it): the host's data-disabled follows it, as the native <fieldset disabled> disables its native control. */
export const FieldsetDisabledCtx = createContext(false);

type Control = HTMLInputElement | HTMLSelectElement;
const controlOf = (host: Element | null) => host?.querySelector<Control>('input:not([type=hidden]), select') ?? null;
const isChoice = (c: Control): c is HTMLInputElement => c.localName === 'input' && (c.type === 'checkbox' || c.type === 'radio');
const valueOf = (c: Control) =>
  c.localName === 'select' ? [...(c as HTMLSelectElement).selectedOptions].map((o) => o.value).join('\n') : isChoice(c) ? String(c.checked) : c.value;
const filledOf = (c: Control) => (isChoice(c) ? c.checked : c.value !== '');

export interface FieldStateOptions {
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** An author error: data-invalid at once. */
  error?: boolean;
  /** Filled at first render (from value / defaultValue / checked). */
  defaultFilled?: boolean;
  /** Controlled filled (a value prop): wins over what the control reports. */
  filled?: boolean;
  /** Hosts without a native control: the current value (dirty, filled) and whether it is missing (validity). */
  value?: string;
  missing?: boolean;
  /** Choices: checked / indeterminate from props (a controlled value wins; else the input's). */
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
}

interface Inner { focused: boolean; touched: boolean; shown: boolean; dirty: boolean; filled: boolean; valid: boolean; checked?: boolean; indeterminate?: boolean }

/**
 * Field state for a React host. Spread `attrs` and `handlers` on the host element, put `ref` on it,
 * and `controlProps` on the native control (React delivers `invalid` only to the target).
 */
export function useFieldState<T extends HTMLElement = HTMLElement>(o: FieldStateOptions) {
  const fieldsetDisabled = useContext(FieldsetDisabledCtx);
  if (fieldsetDisabled && !o.disabled) o = { ...o, disabled: true };
  const ref = useRef<T>(null);
  const initial = useRef<string | undefined>(o.value);
  const [s, set] = useState<Inner>(() => ({ focused: false, touched: false, shown: false, dirty: false, filled: !!o.defaultFilled, valid: true }));
  const opts = useRef(o);
  opts.current = o;

  /** Reread the control (or the value) and merge `patch`. */
  const read = useCallback((patch: Partial<Inner> = {}) => {
    const c = controlOf(ref.current);
    set((p) => {
      const n = { ...p, ...patch };
      if (opts.current.value !== undefined) {
        n.dirty = opts.current.value !== initial.current;
        n.filled = opts.current.value !== '';
        n.valid = !opts.current.missing;
      } else if (c) {
        if (initial.current === undefined) initial.current = valueOf(c);
        n.dirty = valueOf(c) !== initial.current;
        n.filled = filledOf(c);
        n.valid = c.validity.valid;
        if (isChoice(c)) { n.checked = c.checked; n.indeterminate = c.indeterminate; }
      }
      return n;
    });
  }, []);

  useEffect(() => {
    const c = controlOf(ref.current);
    if (opts.current.value === undefined && c) initial.current = valueOf(c);
    read();
    const form = c?.form;
    const onReset = () => setTimeout(() => read({ touched: false, shown: false }));
    form?.addEventListener('reset', onReset);
    // A radio is unchecked by a change on another radio of its group: reread on any change to its name.
    const group = c && isChoice(c) && c.type === 'radio' && c.name ? c.name : '';
    const onGroup = (e: Event) => { const t = e.target as HTMLInputElement; if (t !== c && t.type === 'radio' && t.name === group) read(); };
    if (group) document.addEventListener('change', onGroup, true);
    return () => { form?.removeEventListener('reset', onReset); if (group) document.removeEventListener('change', onGroup, true); };
  }, [read]);

  // indeterminate is a property, not an attribute: set it on the input, then reread.
  useEffect(() => {
    const c = controlOf(ref.current);
    if (c && isChoice(c) && o.indeterminate !== undefined) c.indeterminate = o.indeterminate;
    read();
  }, [read, o.indeterminate]);
  // Controlled props change without a DOM event: reread after the commit.
  useEffect(() => { read(); }, [read, o.value, o.missing, o.checked, o.filled]);

  const handlers = {
    onFocus: () => set((p) => (p.focused ? p : { ...p, focused: true })),
    onBlur: (e: FocusEvent) => { if (!(e.relatedTarget instanceof Node && ref.current?.contains(e.relatedTarget))) read({ focused: false, touched: true, shown: true }); },
    onInput: () => read(),
    onChange: () => read(),
  };
  const controlProps = { onInvalid: () => read({ shown: true }) };

  const valid = o.error ? false : s.shown && !o.disabled ? (o.value !== undefined ? !o.missing : s.valid) : null;
  const checked = o.checked ?? s.checked ?? !!o.defaultChecked;
  const indeterminate = s.indeterminate ?? !!o.indeterminate;
  // A host that passes its value knows dirty and filled at render (also server-side).
  const known = o.value !== undefined;
  const attrs = toReactProps(fieldDataAttrs({
    disabled: o.disabled, readonly: o.readOnly, required: o.required, valid,
    dirty: known ? o.value !== initial.current : s.dirty, touched: s.touched,
    filled: o.filled ?? (known ? o.value !== '' : s.filled), focused: s.focused,
  }));
  return {
    ref, attrs, handlers, controlProps, focused: s.focused,
    /** data-checked / data-unchecked / data-indeterminate for a choice host. */
    checkedAttrs: toReactProps(checkedDataAttrs(checked, indeterminate)),
  };
}

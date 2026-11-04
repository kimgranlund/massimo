// React <OTPField>: the same anatomy, ARIA, data-* and recipe classes as <ui-otp-field>, on native
// <input>s (one character each; the first carries autoComplete="one-time-code", so the platform can
// offer an SMS code, which is then distributed over the cells) and a hidden input with the value for
// the form, as in Base UI. Editing, keys and validation are the web component's (dom/otp.ts).
// Compound parts (Base UI OTPField): OTPField.Root, OTPField.Input, OTPField.Separator; the Root
// numbers its OTPField.Input direct children in order. The preset <OTPField length={6} /> is the
// Root with `length` Inputs.
import {
  Children, cloneElement, createContext, isValidElement, useContext, useEffect, useRef, useState,
  type ChangeEvent, type ClipboardEvent, type FocusEvent, type HTMLAttributes, type InputHTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode,
} from 'react';
import { eventDetails, type ChangeDetails, type ChangeReason } from '../../dom/events.ts';
import { otpCellAttrs, otpDelete, otpFocusable, otpInputMode, otpInsert, otpKey, type OtpValidation } from '../../dom/otp.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { useFieldState } from '../state.react.ts';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { otpField } from '../../styled-system/recipes/otp-field.js';

export interface OTPFieldRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'defaultValue' | 'onChange' | 'inputMode'>, PartBase {
  /** Number of cells (Base UI length). */
  length: number;
  /** Controlled value (Base UI value). */
  value?: string;
  /** Uncontrolled initial value (Base UI defaultValue). */
  defaultValue?: string;
  /** Every change (Base UI onValueChange): reason input-change, input-clear, input-paste or keyboard. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** The value became complete, or a complete value was pasted again (Base UI onValueComplete). */
  onValueComplete?: (value: string, details: ChangeDetails) => void;
  /** Characters were rejected by validationType (Base UI onValueInvalid); value is the attempted text. */
  onValueInvalid?: (value: string, details: ChangeDetails) => void;
  /** Accepted characters (Base UI validationType, default numeric). */
  validationType?: OtpValidation;
  /** Maps accepted text before it is applied (Base UI normalizeValue). */
  normalizeValue?: (value: string) => string;
  /** Hide the characters (Base UI mask): password inputs. */
  mask?: boolean;
  /** Submit the owning form once complete (Base UI autoSubmit). */
  autoSubmit?: boolean;
  /** The first input's autocomplete (Base UI autoComplete, default one-time-code). */
  autoComplete?: string;
  /** The virtual keyboard (Base UI inputMode); default from validationType. */
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** The group's accessible name (aria-label) when nothing else names it. */
  label?: string;
  /** Unit u in px for this element. */
  size?: number;
  /** OTPField.Root: OTPField.Input and OTPField.Separator children. Ignored by the preset. */
  children?: ReactNode;
}

interface Ctx {
  c: Record<string, string>; state: PartState; value: string; length: number; focused: boolean; disabled: boolean; readOnly: boolean; invalid: boolean;
  required: boolean; mask: boolean; autoComplete: string; inputMode: string;
  refs: { current: (HTMLInputElement | null)[] };
  onChange: (i: number, e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (i: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (i: number, e: ClipboardEvent<HTMLInputElement>) => void;
  onFocus: (i: number, e: FocusEvent<HTMLInputElement>) => void;
}
const OTPCtx = createContext<Ctx | null>(null);
const useOTP = (part: string) => {
  const v = useContext(OTPCtx);
  if (!v) throw new Error(`<${part}> must be inside OTPField.Root`);
  return v;
};

/** OTPField.Root: role=group; owns the value and numbers its Inputs. */
export function OTPFieldRoot(props: OTPFieldRootProps) {
  const {
    length, value: controlledValue, defaultValue, onValueChange, onValueComplete, onValueInvalid, validationType = 'numeric', normalizeValue, mask = false,
    autoSubmit, autoComplete = 'one-time-code', inputMode, name, form, required, disabled, readOnly, label, size, className, render, children, ...rest
  } = props;
  const controlled = controlledValue !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const value = [...(controlled ? controlledValue ?? '' : inner)].slice(0, length).join('');
  const valueRef = useRef(value);
  valueRef.current = value;
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const hidden = useRef<HTMLInputElement>(null);
  const len = [...value].length;
  const problem = !len ? (required ? 'Enter the code.' : '') : len < length ? `Enter all ${length} characters.` : '';
  const f = useFieldState<HTMLDivElement>({ disabled, readOnly, required, value, missing: !!problem });
  // A blocked submit points at the first cell (the native inputs know nothing of the whole code).
  useEffect(() => { refs.current[0]?.setCustomValidity(len && problem ? problem : ''); }, [len, problem]);
  const editable = !disabled && !readOnly;
  const focusTo = (i: number) => { const at = otpFocusable(valueRef.current, i, length); const el = refs.current[at]; if (el && document.activeElement !== el) el.focus(); };
  const set = (next: string, reason: ChangeReason, event: Event, opts: { attempted?: string; invalid?: boolean; paste?: boolean } = {}) => {
    if (opts.invalid) onValueInvalid?.(opts.attempted ?? '', eventDetails(reason, event));
    const changed = next !== valueRef.current;
    if (changed) {
      valueRef.current = next;
      if (!controlled) setInner(next);
      if (hidden.current) hidden.current.value = next;
      onValueChange?.(next, eventDetails(reason, event));
    }
    if ([...next].length >= length && (changed || opts.paste) && (reason === 'input-change' || reason === 'input-paste')) {
      onValueComplete?.(next, eventDetails(reason, event));
      if (autoSubmit && !disabled) hidden.current?.form?.requestSubmit();
    }
  };
  const insert = (i: number, text: string, reason: ChangeReason, event: Event) => {
    const r = otpInsert(valueRef.current, i, text, length, validationType, normalizeValue);
    set(r.value, reason, event, { attempted: text, invalid: r.invalid, paste: reason === 'input-paste' });
    focusTo(r.accepted ? r.focus : i);
  };
  const ctx: Ctx = {
    c: otpField(), state: {}, value, length, focused: f.focused, disabled: !!disabled, readOnly: !!readOnly, invalid: f.attrs['data-invalid'] !== undefined,
    required: !!required, mask, autoComplete, inputMode: inputMode ?? otpInputMode(validationType), refs,
    onChange: (i, e) => {
      if (!editable) return;
      const prev = [...valueRef.current][i] ?? '', text = e.target.value;
      if (!text) { const r = otpDelete(valueRef.current, i, false); set(r.value, 'input-clear', e.nativeEvent); return; }
      // The new characters: all of them when the cell was empty or the text was replaced (autofill puts the whole code in the first cell).
      const added = prev && text.startsWith(prev) && text.length > prev.length ? text.slice(prev.length) : prev && text.endsWith(prev) && text.length > prev.length ? text.slice(0, -prev.length) : text;
      insert(i, added, 'input-change', e.nativeEvent);
    },
    onKeyDown: (i, e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') return; // the form submits natively
      const k = otpKey(e.key, getComputedStyle(e.currentTarget).direction === 'rtl');
      if (!k) return;
      if ('delete' in k) {
        if (!editable) return;
        e.preventDefault();
        const r = otpDelete(valueRef.current, i, k.delete === 'backward');
        set(r.value, k.delete === 'backward' ? 'input-clear' : 'keyboard', e.nativeEvent);
        focusTo(r.focus);
        return;
      }
      e.preventDefault();
      focusTo('move' in k ? Math.max(0, Math.min(length - 1, i + k.move)) : k.to === 'first' ? 0 : length - 1);
    },
    onPaste: (i, e) => {
      e.preventDefault();
      if (editable) insert(i, e.clipboardData.getData('text/plain'), 'input-paste', e.nativeEvent);
    },
    onFocus: (i, e) => {
      const at = otpFocusable(valueRef.current, i, length);
      if (at !== i) { refs.current[at]?.focus(); return; }
      e.currentTarget.select();
    },
  };
  const attrs = { ...f.attrs, 'data-complete': len >= length ? '' : undefined };
  ctx.state = stateOf(attrs);
  // Number the Input direct children in order.
  let n = 0;
  const parts = Children.map(children, (ch) => (isValidElement(ch) && ch.type === OTPFieldInput ? cloneElement(ch as ReactElement<{ index?: number }>, { index: n++ }) : ch));
  return (
    <OTPCtx.Provider value={ctx}>
      {renderPart('div', ctx.c.root, {
        ref: f.ref, 'data-ui': 'otp-field', 'data-size': size, role: 'group', 'aria-label': label || undefined, 'aria-disabled': disabled ? 'true' : undefined,
        ...attrs, ...f.handlers, ...rest, className, render,
        children: <>{parts}<input ref={hidden} type="hidden" name={name} form={form} value={value} disabled={disabled} /></>,
      }, ctx.state)}
    </OTPCtx.Provider>
  );
}

export interface OTPFieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'value' | 'defaultValue' | 'type'>, PartBase {
  /** The cell's position; the Root sets it from the order of its Input children. */
  index?: number;
}

/** OTPField.Input: one cell, a native input holding one character. */
export function OTPFieldInput({ index = 0, className, render, ...rest }: OTPFieldInputProps) {
  const t = useOTP('OTPField.Input');
  const focusIndex = otpFocusable(t.value, t.length, t.length);
  const own = toReactProps(otpCellAttrs({ index, length: t.length, value: t.value, focusIndex, disabled: t.disabled, readonly: t.readOnly, focused: t.focused }));
  return renderPart('input', t.c.input, {
    'data-part': 'input', ...own, type: t.mask ? 'password' : 'text', inputMode: t.inputMode,
    autoComplete: index === 0 ? t.autoComplete : 'off', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false,
    required: t.required && index === 0 ? true : undefined, disabled: t.disabled || undefined, readOnly: t.readOnly || undefined,
    'aria-invalid': t.invalid ? 'true' : undefined,
    value: [...t.value][index] ?? '',
    ref: (el: HTMLInputElement | null) => { t.refs.current[index] = el; },
    onChange: (e: ChangeEvent<HTMLInputElement>) => t.onChange(index, e),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => t.onKeyDown(index, e),
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => t.onPaste(index, e),
    onFocus: (e: FocusEvent<HTMLInputElement>) => t.onFocus(index, e),
    className, ...rest, render,
  }, stateOf(own));
}

export interface OTPFieldSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  orientation?: 'horizontal' | 'vertical';
}

/** OTPField.Separator: a dash between groups of cells (role=separator). */
export function OTPFieldSeparator({ orientation = 'horizontal', className, render, ...rest }: OTPFieldSeparatorProps) {
  const t = useOTP('OTPField.Separator');
  return renderPart('div', t.c.separator, { 'data-part': 'separator', role: 'separator', 'aria-orientation': orientation, 'data-orientation': orientation, className, ...rest, render }, { ...t.state, orientation });
}

/** Preset: the Root with `length` Inputs. */
export function OTPField({ children: _parts, ...rest }: OTPFieldRootProps) {
  return <OTPFieldRoot {...rest}>{Array.from({ length: rest.length }, (_, i) => <OTPFieldInput key={i} />)}</OTPFieldRoot>;
}
OTPField.Root = OTPFieldRoot;
OTPField.Input = OTPFieldInput;
OTPField.Separator = OTPFieldSeparator;

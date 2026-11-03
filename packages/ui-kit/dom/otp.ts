// Headless OTP field (Base UI OTPField), shared by <ui-otp-field> and the React OTPField: one value
// over N cells. The value is contiguous (cell i shows character i); typing overwrites the focused
// cell and moves on, a paste or autofill distributes from the focused cell, Backspace clears the
// focused cell or the one before. Characters are checked by the validation type; rejected ones are
// reported (Base UI onValueInvalid). No DOM access.
import type { Attrs } from './attrs.ts';

export type OtpValidation = 'numeric' | 'alpha' | 'alphanumeric' | 'none';

const ALLOWED: Record<OtpValidation, RegExp> = {
  numeric: /^\p{Nd}$/u,
  alpha: /^\p{L}$/u,
  alphanumeric: /^[\p{L}\p{Nd}]$/u,
  none: /^\S$/u,
};

/** Whether one character is accepted by the validation type (whitespace never is). */
export const otpAllowed = (c: string, type: OtpValidation = 'numeric') => (ALLOWED[type] ?? ALLOWED.numeric).test(c);

export interface OtpInsert {
  /** The new value. */
  value: string;
  /** The cell to focus next. */
  focus: number;
  /** Characters were rejected (the attempted text had some the type does not take). */
  invalid: boolean;
  /** The accepted characters (after normalizeValue). */
  accepted: string;
}

/**
 * Insert text at a cell: the accepted characters overwrite from `index` (never past the first
 * empty cell, so the value stays contiguous), the value is cut to `length`, and focus moves after
 * the last character written.
 */
export function otpInsert(value: string, index: number, text: string, length: number, type: OtpValidation = 'numeric', normalize?: (v: string) => string): OtpInsert {
  const chars = [...text].filter((c) => !/\s/.test(c));
  let ok = chars.filter((c) => otpAllowed(c, type)).join('');
  if (normalize) ok = [...normalize(ok)].filter((c) => otpAllowed(c, type)).join('');
  const invalid = ok.length < chars.length;
  const at = Math.max(0, Math.min(index, value.length));
  const cur = [...value];
  const add = [...ok].slice(0, length - at);
  const next = [...cur.slice(0, at), ...add, ...cur.slice(at + add.length)].slice(0, length).join('');
  return { value: next, focus: Math.min(at + add.length, length - 1), invalid, accepted: ok };
}

/** Backspace (backward) or Delete at a cell: clear it, or (Backspace on an empty cell) the one before. */
export function otpDelete(value: string, index: number, backward: boolean): { value: string; focus: number } {
  const cur = [...value];
  if (index < cur.length) { cur.splice(index, 1); return { value: cur.join(''), focus: index }; }
  if (backward && index > 0 && cur.length) { const at = Math.min(index - 1, cur.length - 1); cur.splice(at, 1); return { value: cur.join(''), focus: at }; }
  return { value, focus: index };
}

/** Where focus may land: never past the first empty cell (Base UI). */
export const otpFocusable = (value: string, index: number, length: number) => Math.min(index, [...value].length, length - 1);

/** What a key does on a cell, with RTL mirroring for the arrows. */
export function otpKey(key: string, rtl = false): { move: -1 | 1 } | { to: 'first' | 'last' } | { delete: 'backward' | 'forward' } | null {
  if (key === 'ArrowLeft') return { move: rtl ? 1 : -1 };
  if (key === 'ArrowRight') return { move: rtl ? -1 : 1 };
  if (key === 'Home') return { to: 'first' };
  if (key === 'End') return { to: 'last' };
  if (key === 'Backspace') return { delete: 'backward' };
  if (key === 'Delete') return { delete: 'forward' };
  return null;
}

/** The platform keyboard for a validation type. */
export const otpInputMode = (type: OtpValidation) => (type === 'numeric' ? 'numeric' : 'text');

export interface OtpCellState { index: number; length: number; value: string; focusIndex: number; disabled: boolean; readonly: boolean; focused: boolean }

/** ARIA and data-* of one cell: Character i of n, the roving tab stop, Base UI's input state. */
export function otpCellAttrs(s: OtpCellState): Attrs {
  const filled = s.index < [...s.value].length;
  return {
    'aria-label': `Character ${s.index + 1} of ${s.length}`,
    tabindex: s.disabled ? -1 : s.index === s.focusIndex ? 0 : -1,
    'data-filled': filled || undefined,
    'data-complete': [...s.value].length >= s.length || undefined,
    'data-disabled': s.disabled || undefined,
    'data-readonly': s.readonly || undefined,
    'data-focused': s.focused || undefined,
  };
}

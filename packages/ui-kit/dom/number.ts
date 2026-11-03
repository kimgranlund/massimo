// Headless number field (Base UI NumberField), shared by <ui-number-field> and the React NumberField:
// locale parsing, formatNumber display, stepping (step, small step, large step, snap, clamp), the
// ARIA of the input and the steppers, and the two pointer gestures (press-and-hold steppers, the
// scrub area). The pure parts touch no DOM; the gestures listen on the window while a pointer is down.
import type { Attrs } from './attrs.ts';
import { MINUS, formatNumber, type FormatNumberOptions } from '../tokens/typography/format.ts';

export interface NumberFormatInput {
  /** BCP 47 locale (Base UI locale); default the runtime's. */
  locale?: string;
  /** Intl.NumberFormat options (Base UI format), through formatNumber. */
  format?: FormatNumberOptions | null;
  /** The step: its decimals widen the default maximumFractionDigits (3). */
  step?: number;
}

const decimals = (n: number | null | undefined) => {
  if (n == null || !Number.isFinite(n)) return 0;
  const s = String(n);
  const e = s.match(/e-(\d+)$/);
  if (e) return +e[1] + (s.split('e')[0].split('.')[1]?.length ?? 0);
  return s.split('.')[1]?.length ?? 0;
};

/** The formatNumber options for a field: its format, else decimal with the step's precision. */
export function numberFormatOptions({ locale, format, step }: NumberFormatInput): FormatNumberOptions {
  const o: FormatNumberOptions = { locale, ...(format ?? {}) };
  if (o.maximumFractionDigits == null && o.maximumSignificantDigits == null && (o.style ?? 'decimal') === 'decimal') {
    o.maximumFractionDigits = Math.max(3, decimals(step), o.minimumFractionDigits ?? 0);
  }
  return o;
}

/** The text a value shows (empty for no value): formatNumber, U+2212 minus, the locale's grouping. */
export function formatNumberValue(value: number | null | undefined, input: NumberFormatInput = {}): string {
  return value == null || !Number.isFinite(value) ? '' : formatNumber(value, numberFormatOptions(input));
}

interface Symbols { group: string; decimal: string; digits: Map<string, string>; extra: Set<string> }
const symbolCache = new Map<string, Symbols>();

/** The locale's group and decimal separators, its digits, and the other characters its format writes (currency, unit, percent). */
export function numberSymbols(input: NumberFormatInput = {}): Symbols {
  const key = JSON.stringify([input.locale ?? '', input.format ?? null]);
  const hit = symbolCache.get(key);
  if (hit) return hit;
  const nf = new Intl.NumberFormat(input.locale, { useGrouping: true });
  const parts = nf.formatToParts(-12345.6);
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  const digits = new Map<string, string>();
  for (let d = 0; d <= 9; d++) digits.set(new Intl.NumberFormat(input.locale, { useGrouping: false }).format(d), String(d));
  const extra = new Set<string>();
  try { for (const c of formatNumber(-12345.6, numberFormatOptions(input))) extra.add(c); } catch { /* an invalid format: digits only */ }
  const out = { group, decimal, digits, extra };
  symbolCache.set(key, out);
  return out;
}

const SPACES = /[\s   ']/g;
const MINUSES = new RegExp(`[${MINUS}‒–—﹣－]`, 'g');

/**
 * Parse text typed in the locale (Base UI parse): the locale's digits and separators, U+2212 or a
 * hyphen for minus, grouping spaces, currency and unit text ignored, a percent format divided by 100.
 * Returns null for empty text and NaN for text that is not a number.
 */
export function parseNumber(text: string, input: NumberFormatInput = {}): number | null {
  let t = text.trim();
  if (!t) return null;
  const s = numberSymbols(input);
  t = [...t].map((c) => s.digits.get(c) ?? c).join('').replace(MINUSES, '-');
  const percent = t.includes('%') || t.includes('٪') || input.format?.style === 'percent';
  // Grouping first (it may be '.'), then the decimal separator becomes '.'.
  if (s.group.trim()) t = t.split(s.group).join('');
  t = t.replace(SPACES, '');
  if (s.decimal !== '.') t = t.split(s.decimal).join('.');
  // Keep an exponent (1e3; 6.02×10²³ is display only), drop the text the format writes (currency,
  // unit, percent sign); anything else makes the text not a number.
  t = t.replace(/(\d)[eE]([+-]?\d)/g, '$1\u0001$2');
  t = [...t].filter((c) => !(s.extra.has(c) && !/[\d.+\-]/.test(c)) && c !== '%' && c !== '\u066a').join('').replace('\u0001', 'e');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(t)) return NaN;
  const n = Number(t);
  return percent ? Number((n / 100).toPrecision(15)) : n;
}

/** Whether a character may be typed into the field: digits, separators, signs, an exponent, or a character its format writes. */
export function isNumberChar(c: string, input: NumberFormatInput = {}) {
  const s = numberSymbols(input);
  return /[\d\s.,+\-eE%   ]/.test(c) || c === MINUS || s.digits.has(c) || c === s.group || c === s.decimal || s.extra.has(c);
}

/** Text with the characters the field does not take removed (a paste). */
export const sanitizeNumberText = (text: string, input: NumberFormatInput = {}) => [...text.replace(/[\r\n]+/g, '')].filter((c) => isNumberChar(c, input)).join('');

export interface StepInput {
  min?: number | null;
  max?: number | null;
  /** Snap to multiples of the step from min (or 0) when stepping (Base UI snapOnStep). */
  snapOnStep?: boolean;
}

/** Round away binary noise to the precision of the operands. */
const tidy = (n: number, ...ops: (number | null | undefined)[]) => {
  const d = Math.min(20, Math.max(...ops.map(decimals)));
  return Number(n.toFixed(d));
};

/** Clamp to [min, max] (either may be absent). */
export function clampNumber(value: number, { min, max }: StepInput = {}) {
  let v = value;
  if (max != null && v > max) v = max;
  if (min != null && v < min) v = min;
  return v;
}

/**
 * The value one step away (Base UI increment / decrement): `amount` up (dir 1) or down (dir −1)
 * from `value` (an empty field starts from 0), snapped to the step grid with snapOnStep, clamped.
 */
export function stepNumber(value: number | null | undefined, dir: 1 | -1, amount: number, s: StepInput = {}) {
  const base = value == null || !Number.isFinite(value) ? 0 : value;
  const a = Number.isFinite(amount) && amount > 0 ? amount : 1;
  let next: number;
  if (s.snapOnStep) {
    const origin = s.min ?? 0;
    const k = (base - origin) / a, eps = 1e-9;
    next = origin + (dir > 0 ? Math.floor(k + eps) + 1 : Math.ceil(k - eps) - 1) * a;
    next = tidy(next, origin, a);
  } else next = tidy(base + dir * a, base, a);
  return clampNumber(next, s);
}

/** Snap to the nearest multiple of the step from min (or 0): commits with snapOnStep. */
export function snapNumber(value: number, step: number, min?: number | null) {
  if (!Number.isFinite(step) || step <= 0) return value;
  const origin = min ?? 0;
  return tidy(origin + Math.round((value - origin) / step) * step, origin, step);
}

/** The step a key or gesture uses: Shift the large step, Alt the small one (Base UI). */
export function stepAmount(e: { shiftKey?: boolean; altKey?: boolean }, steps: { step: number; smallStep: number; largeStep: number }) {
  const step = Number.isFinite(steps.step) && steps.step > 0 ? steps.step : 1;
  return e.shiftKey ? steps.largeStep : e.altKey ? steps.smallStep : step;
}

/** The keyboard the platform offers: digits only for whole non-negative steps, decimal for fractions, text where a minus is needed. */
export function numberInputMode(min: number | null | undefined, step: number): 'numeric' | 'decimal' | 'text' {
  if (min == null || min < 0) return 'text';
  return Number.isInteger(step) ? 'numeric' : 'decimal';
}

/** What a key does in the input: a step (dir with the amount from stepAmount), the min or max, or nothing. */
export function numberKey(key: string): { dir: 1 | -1 } | { to: 'min' | 'max' } | null {
  if (key === 'ArrowUp') return { dir: 1 };
  if (key === 'ArrowDown') return { dir: -1 };
  if (key === 'Home') return { to: 'min' };
  if (key === 'End') return { to: 'max' };
  return null;
}

export interface StepperState { disabled: boolean; readonly: boolean; value: number | null; min?: number | null; max?: number | null }

/** A stepper is inactive while the field is disabled or read-only, or the value sits at the limit it moves toward. */
export function stepperDisabled(dir: 1 | -1, s: StepperState) {
  if (s.disabled || s.readonly) return true;
  if (s.value == null) return false;
  return dir > 0 ? s.max != null && s.value >= s.max : s.min != null && s.value <= s.min;
}

/** ARIA of a stepper (role=button on the web component; a native button in React): not a tab stop, named Increase / Decrease. */
export function stepperAttrs(dir: 1 | -1, controls: string, inactive: boolean): Attrs {
  return {
    'aria-label': dir > 0 ? 'Increase' : 'Decrease',
    'aria-controls': controls,
    tabindex: -1,
    'data-disabled': inactive || undefined,
  };
}

// ── Gestures ──

/** Base UI's press-and-hold: a step on press, then after 400 ms one every 60 ms until release. */
export const HOLD_DELAY = 400;
export const HOLD_INTERVAL = 60;

/**
 * Press and hold a stepper: `onStep` now and repeatedly while the primary pointer stays down, then
 * `onEnd` once on release, cancel or blur. Returns a stop function.
 */
export function holdStepper(onStep: () => boolean | void, onEnd: (event: Event) => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timer = setTimeout(() => { interval = setInterval(() => { if (onStep() === false) stop(new Event('pointerup')); }, HOLD_INTERVAL); }, HOLD_DELAY);
  const stop = (ev: Event) => {
    clearTimeout(timer); clearInterval(interval);
    for (const t of ['pointerup', 'pointercancel', 'blur'] as const) window.removeEventListener(t, stop);
    onEnd(ev);
  };
  for (const t of ['pointerup', 'pointercancel', 'blur'] as const) window.addEventListener(t, stop);
  onStep();
  return () => stop(new Event('pointercancel'));
}

export interface ScrubOptions {
  /** Which pointer axis changes the value (Base UI direction). */
  direction?: 'horizontal' | 'vertical';
  /** Pixels of movement per step (Base UI pixelSensitivity, default 2). */
  pixelSensitivity?: number;
  /** One step: dir 1 (right or up) or −1, with the move event (modifier keys pick the amount). */
  onStep: (dir: 1 | -1, event: PointerEvent) => void;
  /** Scrubbing started (the pointer moved past one step): data-scrubbing on. */
  onStart: () => void;
  /** Released: whether it scrubbed, and the event. */
  onEnd: (scrubbed: boolean, event: PointerEvent) => void;
}

/** Drag on the scrub area (Base UI ScrubArea): every pixelSensitivity px along the direction is a step. */
export function startScrub(e: PointerEvent, o: ScrubOptions) {
  const vertical = o.direction === 'vertical', px = Math.max(0.5, o.pixelSensitivity ?? 2);
  let last = vertical ? e.clientY : e.clientX, carry = 0, scrubbed = false;
  const move = (ev: PointerEvent) => {
    const at = vertical ? ev.clientY : ev.clientX;
    carry += vertical ? last - at : (at - last) * (getComputedStyle(e.target as Element).direction === 'rtl' ? -1 : 1);
    last = at;
    while (Math.abs(carry) >= px) {
      if (!scrubbed) { scrubbed = true; o.onStart(); }
      const dir = carry > 0 ? 1 : -1;
      carry -= dir * px;
      o.onStep(dir, ev);
    }
  };
  const up = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    o.onEnd(scrubbed, ev);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

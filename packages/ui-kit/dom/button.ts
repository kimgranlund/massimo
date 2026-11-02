// Headless button: ARIA state and keyboard activation for any element acting as a button.
import type { Attrs } from './attrs.ts';

export interface ButtonState {
  disabled?: boolean;
  /** Busy state: announced and blocks activation, but stays focusable. */
  loading?: boolean;
  pressed?: boolean;
  /** True when the element is a native <button>, which needs no role or tabindex. */
  native?: boolean;
}

export function buttonAttrs(s: ButtonState): Attrs {
  const blocked = !!(s.disabled || s.loading);
  return {
    role: s.native ? undefined : 'button',
    tabindex: s.native ? undefined : s.disabled ? -1 : 0,
    // aria-disabled keeps a native button focusable; real `disabled` would drop it from tab order.
    'aria-disabled': blocked ? 'true' : undefined,
    'aria-busy': s.loading ? 'true' : undefined,
    'aria-pressed': s.pressed === undefined ? undefined : String(s.pressed),
    'data-disabled': s.disabled || undefined,
    'data-loading': s.loading || undefined,
  };
}

export const isInactive = (s: ButtonState) => !!(s.disabled || s.loading);

/** Swallow a native activation event while disabled or loading. Returns true when blocked. */
export function blockIfInactive(e: Event, s: ButtonState): boolean {
  if (!isInactive(s)) return false;
  e.preventDefault();
  e.stopImmediatePropagation();
  return true;
}

/** Enter and Space activate a non-native button the way a <button> does. */
export function onButtonKeydown(e: KeyboardEvent, s: ButtonState, activate: () => void) {
  if (s.native || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  if (!s.disabled && !s.loading) activate();
}

// Headless menubar (Base UI Menubar, WAI-ARIA APG menubar): the bar's ARIA and data-*, and what a
// key means on it. Shared by <ui-menubar> and the React Menubar. The bar holds menus whose triggers
// are its items (role=menuitem); one trigger is the tab stop (roving tabindex).
import type { Attrs } from './attrs.ts';

const on = (v: unknown) => (v ? '' : undefined);
export type MenubarOrientation = 'horizontal' | 'vertical';

/** Menubar root: role=menubar, aria-orientation; data-orientation and data-has-submenu-open (a menu of the bar is open). */
export function menubarAttrs(s: { orientation: MenubarOrientation; open: boolean; label?: string; disabled?: boolean }): Attrs {
  return {
    role: 'menubar',
    'aria-orientation': s.orientation,
    'aria-label': s.label || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'data-orientation': s.orientation,
    'data-has-submenu-open': on(s.open),
    'data-disabled': on(s.disabled),
  };
}

export type MenubarIntent = 'next' | 'prev' | 'first' | 'last' | 'open-first' | 'open-last';

/**
 * What a key means on a menubar trigger, or inside the open popup of one of its menus (`inPopup`):
 * along the bar (ArrowRight / ArrowLeft, mirrored in RTL; ArrowDown / ArrowUp when vertical) move to
 * the next / previous trigger (wrapping), Home / End to the first / last; across it (ArrowDown /
 * ArrowUp on a horizontal bar, ArrowRight on a vertical one) open the menu. In a popup only the keys
 * along a horizontal bar move (the popup's own arrows move between its items).
 */
export function menubarKeyIntent(key: string, o: { orientation: MenubarOrientation; rtl?: boolean; inPopup?: boolean }): MenubarIntent | undefined {
  const vertical = o.orientation === 'vertical';
  const next = vertical ? 'ArrowDown' : o.rtl ? 'ArrowLeft' : 'ArrowRight';
  const prev = vertical ? 'ArrowUp' : o.rtl ? 'ArrowRight' : 'ArrowLeft';
  if (o.inPopup) {
    if (vertical) return undefined;
    return key === next ? 'next' : key === prev ? 'prev' : undefined;
  }
  if (key === next) return 'next';
  if (key === prev) return 'prev';
  if (key === 'Home') return 'first';
  if (key === 'End') return 'last';
  if (vertical ? key === (o.rtl ? 'ArrowLeft' : 'ArrowRight') : key === 'ArrowDown') return 'open-first';
  if (!vertical && key === 'ArrowUp') return 'open-last';
  return undefined;
}

/** The index a move intent lands on among `count` triggers (disabled ones skipped), wrapping. */
export function menubarStep(disabled: boolean[], from: number, intent: 'next' | 'prev' | 'first' | 'last'): number {
  const n = disabled.length;
  if (!n) return -1;
  if (intent === 'first' || intent === 'last') {
    const order = intent === 'first' ? [...disabled.keys()] : [...disabled.keys()].reverse();
    return order.find((i) => !disabled[i]) ?? -1;
  }
  const dir = intent === 'next' ? 1 : -1;
  for (let k = 1; k <= n; k++) {
    const i = (((from + dir * k) % n) + n) % n;
    if (!disabled[i]) return i;
  }
  return from;
}

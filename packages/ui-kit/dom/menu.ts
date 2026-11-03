// Headless menu (Base UI Menu, WAI-ARIA APG menu button): ARIA and data-* for the trigger, popup,
// items, separators and indicators, the item list of one popup, and its navigation keys. Shared by
// <ui-menu> / <ui-context-menu> / <ui-menubar> and the React Menu, ContextMenu and Menubar, so both
// renderers set the same roles and state and move focus alike. Focus model: real focus moves to the
// highlighted item (roving, every item tabindex -1); the highlighted item carries data-highlighted.
import type { Attrs } from './attrs.ts';
import { checkedDataAttrs, popupDataAttrs } from './state.ts';
import { firstEnabled, lastEnabled, navigate, type OptionItem } from './listbox.ts';
import type { Align, Side } from './floating.ts';

const on = (v: unknown) => (v ? '' : undefined);

/** Item parts (data-part): plain, checkbox, radio, and the trigger of a submenu. */
export type MenuItemKind = 'item' | 'checkbox-item' | 'radio-item' | 'submenu-trigger';
export const MENU_ITEM_PARTS: readonly MenuItemKind[] = ['item', 'checkbox-item', 'radio-item', 'submenu-trigger'];
export const MENU_ITEM_SELECTOR = MENU_ITEM_PARTS.map((p) => `[data-part=${p}]`).join(', ');
const ROLE: Record<MenuItemKind, string> = { item: 'menuitem', 'checkbox-item': 'menuitemcheckbox', 'radio-item': 'menuitemradio', 'submenu-trigger': 'menuitem' };

/** The items that belong to one popup, in document order (a nested submenu's items are its own). */
export function menuItems(popup: Element | null | undefined): HTMLElement[] {
  if (!popup) return [];
  return [...popup.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)].filter((el) => el.parentElement?.closest('[data-part=popup]') === popup);
}

/** An item's text for typeahead: its contents part, else its text. */
export const menuItemLabel = (el: Element) => ((el.querySelector(':scope > [data-part=contents]') ?? el).textContent ?? '').trim();
/** Whether an item is disabled (the disabled attribute, or data-disabled / aria-disabled set by a renderer). */
export const menuItemDisabled = (el: Element) => el.hasAttribute('disabled') || el.hasAttribute('data-disabled') || el.getAttribute('aria-disabled') === 'true';
/** Items as listbox OptionItems (navigate, typeahead). */
export const menuOptionItems = (items: Element[]): OptionItem[] => items.map((el) => ({ value: '', label: menuItemLabel(el), disabled: menuItemDisabled(el) }));

/**
 * The index after a navigation key in a vertical menu (or a horizontal menubar): ArrowDown / ArrowUp
 * (ArrowRight / ArrowLeft, mirrored in RTL, when horizontal), Home, End; disabled items are skipped
 * and the ends wrap (Base UI loopFocus). Undefined when the key does not navigate.
 */
export function menuNavigate(items: OptionItem[], from: number, key: string, o: { horizontal?: boolean; rtl?: boolean; loop?: boolean } = {}): number | undefined {
  const orientation = o.horizontal ? 'horizontal' : 'vertical';
  const i = navigate(items, from, key, { orientation, rtl: o.rtl });
  if (i === undefined || o.loop === false || from < 0 || i !== from) return i;
  const next = o.horizontal ? (o.rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
  const prev = o.horizontal ? (o.rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
  return key === next ? firstEnabled(items) : key === prev ? lastEnabled(items) : i;
}

/** Whether an element lays out right to left (its computed direction, or the nearest dir attribute). */
export const isRtl = (el: Element) => {
  const d = el.closest('[dir]')?.getAttribute('dir');
  return d ? d === 'rtl' : typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
};

/** The keys that open and close a submenu: ArrowRight / ArrowLeft, swapped in RTL. */
export const submenuKeys = (rtl = false) => ({ open: rtl ? 'ArrowLeft' : 'ArrowRight', close: rtl ? 'ArrowRight' : 'ArrowLeft' });

/** Menu.Trigger: a button that opens the menu (aria-haspopup=menu), pressed while open. */
export function menuTriggerAttrs(s: { open: boolean; popupId: string; disabled?: boolean; role?: string }): Attrs {
  return {
    role: s.role ?? 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': String(s.open),
    'aria-controls': s.popupId,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'data-popup-open': on(s.open),
    'data-pressed': on(s.open),
    'data-disabled': on(s.disabled),
  };
}

/** Menu.Popup: role=menu, focusable (tabindex -1), with the positioner state (popupDataAttrs). */
export function menuPopupAttrs(s: { id: string; open: boolean; side: Side; align: Align; labelledBy?: string }): Attrs {
  return { id: s.id, role: 'menu', tabindex: -1, 'aria-labelledby': s.labelledBy, ...popupDataAttrs(s) };
}

/**
 * Menu.Item, CheckboxItem, RadioItem, SubmenuTrigger: the role, tabindex -1, aria-checked for the
 * checkable ones, aria-haspopup / aria-expanded for a submenu trigger, and Base UI's data-*.
 */
export function menuItemAttrs(kind: MenuItemKind, s: { highlighted?: boolean; disabled?: boolean; checked?: boolean; open?: boolean; popupId?: string }): Attrs {
  const checkable = kind === 'checkbox-item' || kind === 'radio-item';
  return {
    role: ROLE[kind],
    tabindex: -1,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-checked': checkable ? String(!!s.checked) : undefined,
    'aria-haspopup': kind === 'submenu-trigger' ? 'menu' : undefined,
    'aria-expanded': kind === 'submenu-trigger' ? String(!!s.open) : undefined,
    'aria-controls': kind === 'submenu-trigger' ? s.popupId : undefined,
    ...(checkable ? checkedDataAttrs(!!s.checked) : {}),
    'data-popup-open': kind === 'submenu-trigger' ? on(s.open) : undefined,
    'data-highlighted': on(s.highlighted),
    'data-disabled': on(s.disabled),
  };
}

/** CheckboxItemIndicator / RadioItemIndicator: decorative, with the item's checked state. */
export const menuIndicatorAttrs = (checked: boolean, disabled?: boolean): Attrs => ({ 'aria-hidden': 'true', ...checkedDataAttrs(checked), 'data-disabled': on(disabled) });

/** Menu.Separator: a horizontal rule (Base UI Separator). */
export const menuSeparatorAttrs = (): Attrs => ({ role: 'separator', 'aria-orientation': 'horizontal', 'data-orientation': 'horizontal' });

/** Menu.Group (and RadioGroup): role=group named by its GroupLabel. */
export const menuGroupAttrs = (labelledBy?: string): Attrs => ({ role: 'group', 'aria-labelledby': labelledBy });

/** A zero-size anchor at a viewport point (the context menu's; the script positioner reads only its box); focus goes to `focusTarget`. */
export function pointAnchor(x: number, y: number, focusTarget?: () => HTMLElement | null | undefined) {
  return {
    getBoundingClientRect: () => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0, x, y, toJSON() { return this; } }) as DOMRect,
    focus: (o?: FocusOptions) => focusTarget?.()?.focus(o),
    // Nothing is inside a point (the dismiss layer asks).
    contains: () => false,
  } as unknown as HTMLElement;
}

// ── Submenu safe triangle ──

export interface Point { x: number; y: number }
type Box = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;

const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
/** Whether q lies in the triangle abc, its edges included. */
export function inTriangle(q: Point, a: Point, b: Point, c: Point): boolean {
  const d1 = cross(a, b, q), d2 = cross(b, c, q), d3 = cross(c, a, q);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/**
 * The hover safe triangle (Base UI's safePolygon): a pointer moving from `from` to `to` aims at an
 * open submenu when `to` lies in the triangle between `from` and the submenu's near edge (with a
 * small bleed above and below). A pointer already over the submenu's columns does not aim.
 */
export function aimsAtSubmenu(from: Point, to: Point, sub: Box, bleed = 4): boolean {
  if (sub.bottom <= sub.top || (to.x === from.x && to.y === from.y)) return false;
  const right = sub.left >= from.x, left = sub.right <= from.x;
  if (!right && !left) return false;
  const x = right ? sub.left : sub.right;
  return inTriangle(to, from, { x, y: sub.top - bleed }, { x, y: sub.bottom + bleed });
}

/**
 * Hover intent toward an open submenu, for a parent popup's pointermove: `hold` says whether this
 * move aims at the submenu (then the parent leaves its highlight and the submenu as they are) and
 * runs `rest` once the pointer stops there for `delay` ms; any later move cancels that.
 */
export function createSubmenuAim(delay = 300) {
  let last: Point | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    hold(e: { clientX: number; clientY: number }, sub: Box | null | undefined, rest: () => void): boolean {
      clearTimeout(timer);
      const to = { x: e.clientX, y: e.clientY }, from = last;
      last = to;
      if (!sub || !from || !aimsAtSubmenu(from, to, sub)) return false;
      timer = setTimeout(rest, delay);
      return true;
    },
    /** The pointer reached the submenu or left: forget the path. */
    cancel() { clearTimeout(timer); timer = undefined; },
  };
}

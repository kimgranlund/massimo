// Headless listbox: navigation, type-to-search and ARIA for listbox, segmented control and select.
// Focus model: the focusable element keeps focus and points at the active option with
// aria-activedescendant; options are never focused themselves.
import type { Attrs } from './attrs.ts';
import { placeFloating, positionerVars, type AnchorRect, type Placement, type Viewport } from './floating.ts';

export interface OptionItem { value: string; label: string; disabled?: boolean }
export type Orientation = 'vertical' | 'horizontal';

function step(items: OptionItem[], from: number, dir: 1 | -1): number | undefined {
  for (let i = from + dir; i >= 0 && i < items.length; i += dir) if (!items[i].disabled) return i;
  return undefined;
}
export const firstEnabled = (items: OptionItem[]) => step(items, -1, 1);
export const lastEnabled = (items: OptionItem[]) => step(items, items.length, -1);

/**
 * Index after a navigation key, skipping disabled options and stopping at the ends.
 * Returns undefined when the key is not a navigation key.
 */
export function navigate(items: OptionItem[], from: number, key: string, o: { orientation?: Orientation; rtl?: boolean } = {}): number | undefined {
  const horizontal = o.orientation === 'horizontal';
  const prev = horizontal ? (o.rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
  const next = horizontal ? (o.rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
  if (key === 'Home') return firstEnabled(items);
  if (key === 'End') return lastEnabled(items);
  if (key === next) return from < 0 ? firstEnabled(items) : step(items, from, 1) ?? from;
  if (key === prev) return from < 0 ? lastEnabled(items) : step(items, from, -1) ?? from;
  return undefined;
}

export const isPrintableKey = (e: { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }) =>
  e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

export interface Typeahead {
  (items: OptionItem[], from: number, char: string, now?: number): number | undefined;
  /** True while a search is in progress, so Space continues it instead of selecting. */
  busy(now?: number): boolean;
}

/** Type-to-search: letters typed within `timeout` ms build one query; repeating one letter cycles. */
export function createTypeahead(timeout = 500): Typeahead {
  let buffer = '', last = 0;
  const search = ((items, from, char, now = Date.now()) => {
    if (char.length !== 1 || (char === ' ' && !search.busy(now))) return undefined;
    buffer = now - last > timeout ? char : buffer + char;
    last = now;
    const q = buffer.toLowerCase();
    const cycling = q.length > 1 && [...q].every((c) => c === q[0]);
    const needle = cycling ? q[0] : q;
    const start = cycling || q.length === 1 ? from + 1 : Math.max(from, 0);
    for (let k = 0; k < items.length; k++) {
      const i = (((start + k) % items.length) + items.length) % items.length;
      if (!items[i].disabled && items[i].label.trim().toLowerCase().startsWith(needle)) return i;
    }
    return undefined;
  }) as Typeahead;
  search.busy = (now = Date.now()) => buffer !== '' && now - last <= timeout;
  return search;
}

export function listboxAttrs(s: { orientation?: Orientation; activeId?: string; disabled?: boolean; required?: boolean; invalid?: boolean; label?: string; focusable?: boolean }): Attrs {
  return {
    role: 'listbox',
    'aria-orientation': s.orientation === 'horizontal' ? 'horizontal' : undefined,
    'aria-activedescendant': s.activeId,
    'aria-label': s.label || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-required': s.required ? 'true' : undefined,
    'aria-invalid': s.invalid ? 'true' : undefined,
    tabindex: s.focusable === false ? undefined : s.disabled ? -1 : 0,
    'data-orientation': s.orientation,
  };
}

/** An option: ARIA, plus data-selected, data-highlighted (the active option) and data-disabled (Base UI Select.Item). */
export function optionAttrs(s: { id: string; selected: boolean; disabled?: boolean; active?: boolean }): Attrs {
  return {
    role: 'option',
    id: s.id,
    'aria-selected': String(s.selected),
    'aria-disabled': s.disabled ? 'true' : undefined,
    'data-selected': s.selected ? '' : undefined,
    'data-highlighted': s.active ? '' : undefined,
    'data-disabled': s.disabled ? '' : undefined,
  };
}

// ── Select-only combobox ──

export function comboboxAttrs(s: { open: boolean; popupId: string; activeId?: string; labelledBy?: string; describedBy?: string; disabled?: boolean; required?: boolean; invalid?: boolean }): Attrs {
  return {
    role: 'combobox',
    'aria-haspopup': 'listbox',
    'aria-expanded': String(s.open),
    'aria-controls': s.popupId,
    'aria-activedescendant': s.open ? s.activeId : undefined,
    'aria-labelledby': s.labelledBy,
    'aria-describedby': s.describedBy || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-required': s.required ? 'true' : undefined,
    'aria-invalid': s.invalid ? 'true' : undefined,
    tabindex: s.disabled ? -1 : 0,
    // Base UI Select.Trigger: open (data-popup-open; the trigger holds its pressed look while open,
    // data-pressed) and disabled.
    'data-popup-open': s.open ? '' : undefined,
    'data-pressed': s.open ? '' : undefined,
    'data-disabled': s.disabled ? '' : undefined,
  };
}

export type SelectIntent = 'open' | 'open-first' | 'open-last' | 'close' | 'commit' | 'commit-tab' | 'move';

/** What a key means for a select-only combobox (WAI-ARIA APG). Typing is handled separately. */
export function selectKeyIntent(open: boolean, e: { key: string; altKey?: boolean }, searching = false): SelectIntent | undefined {
  if (!open) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') return 'open';
    if (e.key === 'Home') return 'open-first';
    if (e.key === 'End') return 'open-last';
    return undefined;
  }
  if (e.key === 'Escape') return 'close';
  if (e.key === 'Tab') return 'commit-tab';
  if (e.key === 'Enter' || (e.key === ' ' && !searching) || (e.key === 'ArrowUp' && e.altKey)) return 'commit';
  if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return 'move';
  return undefined;
}

/**
 * Place a select popup under its anchor (or above when there is more room there), within the
 * viewport: the floating positioner's script placement (floating.ts placeFloating) at side bottom,
 * align start. Apply the result as fixed-position insets and, through popupVars, as Base UI's
 * positioner variables.
 */
export function placePopup(anchor: AnchorRect, viewport: Viewport, gap = 4, margin = 8): Placement {
  return placeFloating(anchor, viewport, { side: 'bottom', align: 'start', offset: gap, margin });
}

/**
 * Base UI's positioner variables (Select.Positioner: --anchor-width, --anchor-height,
 * --available-width, --available-height, --transform-origin) for a placePopup result, in px.
 */
export const popupVars = positionerVars;

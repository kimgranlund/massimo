// Headless combobox (Base UI Combobox, Autocomplete): an editable input that filters a listbox
// popup. Focus stays in the input; aria-activedescendant points at the highlighted option, which
// is never focused itself (the listbox model of dom/listbox.ts). Shared by ui-combobox,
// ui-autocomplete and their React renderers.
import type { Attrs } from './attrs.ts';
import type { OptionItem } from './listbox.ts';

/** Base UI Autocomplete mode: whether the list filters and whether the input completes inline. */
export type AutocompleteMode = 'list' | 'both' | 'inline' | 'none';

/** Case- and accent-insensitive form of a label or query (Base UI's default collator filter). */
export const foldText = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Base UI's default filter: the item's label contains the query (case- and accent-insensitive); an empty query matches all. */
export function matchesQuery(label: string, query: string): boolean {
  const q = foldText(query);
  return !q || foldText(label).includes(q);
}

/**
 * Inline completion (Autocomplete mode both / inline): the first enabled item whose label starts
 * with the query, when it is longer than the query. The input then shows the query followed by the
 * rest of that label, the rest selected, so typing on replaces it.
 */
export function inlineCompletion(items: OptionItem[], query: string): number | undefined {
  const q = foldText(query);
  if (!q) return undefined;
  const i = items.findIndex((it) => !it.disabled && foldText(it.label).startsWith(q) && it.label.length > query.length);
  return i >= 0 ? i : undefined;
}

/** The rest of a label after a typed prefix (its own letters, so the case the author wrote shows). */
export const completionOf = (label: string, query: string) => query + label.slice(query.length);

/** Navigation items over the visible options: a filtered-out option counts as disabled. */
export const visibleItems = (items: OptionItem[], shown: boolean[]): OptionItem[] =>
  items.map((it, i) => (shown[i] ? it : { ...it, disabled: true }));

export interface ComboboxInputState {
  open: boolean;
  popupId: string;
  activeId?: string;
  labelledBy?: string;
  describedBy?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** aria-autocomplete: list (filters), both (filters and completes inline), inline, none. */
  autocomplete?: AutocompleteMode;
  /** No option matches the query (Base UI data-list-empty). */
  empty?: boolean;
}

/** The input (Base UI Combobox.Input): role=combobox on an editable element, wired to the popup. */
export function comboboxInputAttrs(s: ComboboxInputState): Attrs {
  return {
    role: 'combobox',
    'aria-autocomplete': s.autocomplete ?? 'list',
    'aria-expanded': String(s.open),
    'aria-controls': s.popupId,
    'aria-haspopup': 'listbox',
    'aria-activedescendant': s.open ? s.activeId : undefined,
    'aria-labelledby': s.labelledBy,
    'aria-describedby': s.describedBy || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-readonly': s.readonly ? 'true' : undefined,
    'aria-required': s.required ? 'true' : undefined,
    'aria-invalid': s.invalid ? 'true' : undefined,
    'data-popup-open': s.open ? '' : undefined,
    'data-list-empty': s.empty ? '' : undefined,
    'data-disabled': s.disabled ? '' : undefined,
    'data-readonly': s.readonly ? '' : undefined,
  };
}

/** The trigger (Base UI Combobox.Trigger): a press toggles the popup; not a tab stop (focus stays in the input). */
export function comboboxTriggerAttrs(s: { open: boolean; popupId: string; disabled?: boolean; label?: string }): Attrs {
  return {
    role: 'button',
    tabindex: -1,
    'aria-label': s.label ?? 'Show options',
    'aria-expanded': String(s.open),
    'aria-controls': s.popupId,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'data-popup-open': s.open ? '' : undefined,
    'data-pressed': s.open ? '' : undefined,
    'data-disabled': s.disabled ? '' : undefined,
  };
}

/** A press button inside the input row (Combobox.Clear, Combobox.ChipRemove): not a tab stop. */
export function comboboxButtonAttrs(s: { label: string; disabled?: boolean }): Attrs {
  return { role: 'button', tabindex: -1, 'aria-label': s.label, 'aria-disabled': s.disabled ? 'true' : undefined, 'data-disabled': s.disabled ? '' : undefined };
}

export type ComboboxIntent = 'open' | 'move' | 'commit' | 'close' | 'close-tab' | 'remove-last';

/**
 * What a key in the input means (WAI-ARIA APG editable combobox, Base UI). Home / End stay with the
 * caret; printable keys edit the text (the input event filters).
 * - ArrowDown / ArrowUp: open (closed; Alt+ArrowDown opens without moving) or move the highlight
 * - Enter: commit the highlighted option (open)
 * - Escape: close (open)
 * - Tab: close, keeping the text (open)
 * - Backspace on an empty input: remove the last chip (multiple)
 */
export function comboboxKeyIntent(open: boolean, e: { key: string; altKey?: boolean }, o: { empty?: boolean; multiple?: boolean } = {}): ComboboxIntent | undefined {
  if (e.key === 'Backspace' && o.multiple && o.empty) return 'remove-last';
  if (!open) return e.key === 'ArrowDown' || e.key === 'ArrowUp' ? 'open' : undefined;
  if (e.key === 'Escape') return 'close';
  if (e.key === 'Tab') return 'close-tab';
  if (e.key === 'Enter') return 'commit';
  if (e.key === 'ArrowUp' && e.altKey) return 'close';
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp') return 'move';
  return undefined;
}

/** A multiple combobox's value as a list (the attribute form is comma-separated, like ui-accordion's). */
export const splitValues = (v: string | null | undefined) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

/// <reference path="../jsx.d.ts" />
// React <Combobox>: the web component's anatomy and behavior (Base UI Combobox) on a native text
// <input role="combobox">: typing filters the items (dom/combobox.ts matchesQuery), arrows move the
// highlight (aria-activedescendant; the items are never focused), Enter or a press commits,
// `multiple` keeps chips. The popup is the kit's floating layer (components/floating.react.ts:
// positioner, outside-press dismissal, top layer), styled by the same recipe as ui-combobox.
// The host carries the field state as data-* (state.react.ts), like ui-combobox's host.
// Compound parts (Base UI Combobox): Combobox.Root, Combobox.Label, Combobox.Control (ours: the input
// row), Combobox.Input, Combobox.Chips, Combobox.Chip, Combobox.ChipRemove, Combobox.Clear,
// Combobox.Trigger, Combobox.Positioner (no element: the popup is its own positioner, as on the web
// component), Combobox.Popup, Combobox.List, Combobox.Item (with Combobox.ItemText /
// Combobox.ItemIndicator), Combobox.Empty, plus Combobox.Description and Combobox.Error. Root reads
// its items (value, label, disabled) from the tree. The preset <Combobox label leading prefix suffix
// placeholder emptyText description error>{items}</Combobox> is Root + parts.
// The Autocomplete (components/autocomplete) is this Root with free text (`freeText`, `mode`).
import { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import {
  comboboxButtonAttrs, comboboxInputAttrs, comboboxKeyIntent, comboboxTriggerAttrs, completionOf, eventDetails, fieldAttrs, firstEnabled,
  inlineCompletion, lastEnabled, listboxAttrs, matchesQuery, navigate, optionAttrs, toReactProps, visibleItems,
  type AutocompleteMode, type ChangeDetails, type ChangeReason, type OptionItem,
} from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import type { PartProps } from '../parts.react.tsx';
import { useFieldState } from '../state.react.ts';
import { useFloatingLayer } from '../floating.react.ts';
import { isPartOf, renderPart, splitParts, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { ItemContext, ItemIndicator, ItemParts, ItemText } from '../listbox/listbox.react.tsx';
import { combobox as comboboxRecipe, option } from '../../styled-system/recipes/index.js';

export interface ComboboxRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'className' | 'children' | 'prefix'>, PartBase {
  /** The selected value (Base UI value); string[] with multiple. */
  value?: string | string[];
  defaultValue?: string | string[];
  /** A value was chosen, removed or cleared (Base UI onValueChange): reason item-press, chip-remove-press, clear-press, input-clear or keyboard. */
  onValueChange?: (value: any, details: ChangeDetails) => void;
  /** The input's text (Base UI inputValue); single selection shows the selected label. */
  inputValue?: string;
  defaultInputValue?: string;
  /** The text changed (Base UI onInputValueChange): reason input-change, input-clear, item-press or clear-press. */
  onInputValueChange?: (value: string, details: ChangeDetails) => void;
  open?: boolean;
  defaultOpen?: boolean;
  /** The popup opened or closed (Base UI onOpenChange). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Form field name: one hidden input per selected value. */
  name?: string;
  /** Highlight the first match while typing (Base UI autoHighlight). */
  autoHighlight?: boolean;
  /** Author error, shown at once. */
  error?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  size?: number;
  gap?: number;
  /** The parts (Combobox.Label, Control, Positioner › Popup › List › Item, Empty, Description, Error). */
  children?: ReactNode;
  /** Autocomplete: the value is the input's text; the items are suggestions. */
  freeText?: boolean;
  /** Autocomplete mode (filtering, inline completion); the combobox filters (list). */
  mode?: AutocompleteMode;
  /** Data-ui and the internal kind (combobox | autocomplete). */
  kind?: 'combobox' | 'autocomplete';
}

interface ItemInfo extends OptionItem { node: ReactElement<ComboboxItemProps> }
type Wiring = ReturnType<typeof fieldAttrs>;
interface ComboboxContext {
  c: Record<string, string>; state: PartState; a: Wiring; popupId: string;
  open: boolean; values: string[]; multiple: boolean; text: string; items: ItemInfo[]; shown: boolean[]; active: number; empty: boolean;
  editable: boolean; disabled: boolean; readOnly: boolean; required: boolean; freeText: boolean; mode: AutocompleteMode; hasEmpty: boolean;
  idOf: (i: number) => string; labelOf: (v: string) => string;
  layer: ReturnType<typeof useFloatingLayer<HTMLDivElement, HTMLDivElement>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setActive: (i: number) => void;
  commit: (i: number, reason: ChangeReason, e: Event) => void;
  removeValue: (v: string, reason: ChangeReason, e: Event) => void;
  clear: (e: Event) => void;
  toggle: (reason: ChangeReason, e: Event) => void;
  onText: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
}
const Ctx = createContext<ComboboxContext | null>(null);
const useCombobox = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Combobox.Root`);
  return v;
};

const textOf = (n: ReactNode): string => typeof n === 'string' || typeof n === 'number' ? String(n)
  : Array.isArray(n) ? n.map(textOf).join('')
  : isValidElement<{ children?: ReactNode }>(n) && n.type === ItemText ? textOf(n.props.children) : '';

/** Items and whether an Empty part has content, from the parts tree (through Control, Positioner, Popup, List). */
function scan(children: ReactNode, out: { items: ItemInfo[]; hasEmpty: boolean } = { items: [], hasEmpty: false }) {
  for (const n of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode }>(n)) continue;
    if (n.type === ComboboxItem) {
      const p = n.props as ComboboxItemProps;
      const label = (textOf(p.children) || p.value).trim();
      out.items.push({ value: p.value, label, disabled: !!p.disabled, node: n as ReactElement<ComboboxItemProps> });
    } else if (n.type === ComboboxEmpty) out.hasEmpty = n.props.children != null && n.props.children !== '';
    else if (holders.includes(n.type)) scan(n.props.children, out);
  }
  return out;
}
const asList = (v: string | string[] | undefined) => (v === undefined ? undefined : Array.isArray(v) ? v : v ? [v] : []);

/** Combobox.Root: the host; owns the value, the text, the open state and the highlight. */
export function ComboboxRoot({
  value, defaultValue, onValueChange, inputValue, defaultInputValue, onInputValueChange, open: openProp, defaultOpen, onOpenChange,
  multiple = false, disabled = false, readOnly = false, required = false, name, autoHighlight, error, hideLabel, size, gap,
  freeText = false, mode = freeText ? 'list' : 'list', kind = 'combobox', id, className, render, style, children, onFocus, onBlur, ...rest
}: ComboboxRootProps) {
  const auto = useId();
  const base = id ?? auto;
  const { items, hasEmpty } = scan(children);
  const labelOf = (v: string) => items.find((it) => it.value === v)?.label ?? v;
  const [innerValues, setInnerValues] = useState<string[]>(() => asList(defaultValue) ?? []);
  const values = freeText ? [] : asList(value) ?? innerValues;
  const firstText = () => defaultInputValue ?? (freeText ? String(value ?? defaultValue ?? '') : multiple ? '' : values[0] ? labelOf(values[0]) : '');
  const [innerText, setInnerText] = useState(firstText);
  const text = inputValue ?? (freeText && value !== undefined ? String(value) : innerText);
  const [innerOpen, setInnerOpen] = useState(!!defaultOpen);
  const open = openProp ?? innerOpen;
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const filters = mode === 'list' || mode === 'both';
  const shown = items.map((it) => !filters || query === null || matchesQuery(it.label, query));
  const empty = !shown.some(Boolean);
  const nav = visibleItems(items, shown);
  const editable = !disabled && !readOnly;
  const idOf = (i: number) => `${base}-opt-${i}`;
  const popupId = `${base}-popup`;

  // Single selection: a new value (controlled, or committed) rewrites the text once.
  const shownFor = useRef<string | null>(freeText ? null : values[0] ?? '');
  useEffect(() => {
    if (freeText || multiple || query !== null) return;
    const v = values[0] ?? '';
    if (shownFor.current === v) return;
    shownFor.current = v;
    setInnerText(v ? labelOf(v) : '');
  });

  const emitText = (t: string, reason: ChangeReason, e: Event) => { setInnerText(t); onInputValueChange?.(t, eventDetails(reason, e)); };
  const emitValue = (vs: string[], reason: ChangeReason, e: Event) => {
    setInnerValues(vs);
    onValueChange?.(multiple ? vs : vs[0] ?? '', eventDetails(reason, e));
  };
  const setOpen = (next: boolean, reason: ChangeReason, e: Event) => {
    if (next === open || (next && !editable)) return;
    setInnerOpen(next);
    onOpenChange?.(next, eventDetails(reason, e));
    if (!next) { setActive(-1); setQuery(null); if (!freeText && !multiple) { shownFor.current = null; } }
  };
  const layer = useFloatingLayer<HTMLDivElement, HTMLDivElement>({
    open: open && (!empty || hasEmpty), escapeKey: false, inside: () => [hostRef.current],
    onOpenChange: (_o, d) => setOpen(false, d.reason, d.event!),
  });

  const commit = (i: number, reason: ChangeReason, e: Event) => {
    const it = items[i];
    if (!it || it.disabled) return;
    setQuery(null);
    if (freeText) {
      if (text !== it.label) { emitText(it.label, reason, e); onValueChange?.(it.label, eventDetails(reason, e)); }
      setOpen(false, reason, e);
      return;
    }
    if (multiple) {
      emitValue(values.includes(it.value) ? values.filter((v) => v !== it.value) : [...values, it.value], reason, e);
      if (text) emitText('', reason, e);
      return;
    }
    if (values[0] !== it.value) emitValue([it.value], reason, e);
    if (text !== it.label) emitText(it.label, reason, e);
    shownFor.current = it.value;
    setOpen(false, reason, e);
  };
  const removeValue = (v: string, reason: ChangeReason, e: Event) => emitValue(values.filter((x) => x !== v), reason, e);
  const clear = (e: Event) => {
    if (freeText) { if (text) { emitText('', 'clear-press', e); onValueChange?.('', eventDetails('clear-press', e)); } }
    else {
      if (values.length) emitValue([], 'clear-press', e);
      if (text) emitText('', 'clear-press', e);
      shownFor.current = '';
    }
    setQuery(open ? '' : null);
    setActive(-1);
  };
  const current = () => {
    if (active >= 0) return active;
    const sel = items.findIndex((it) => it.value === values[0]);
    return sel >= 0 && !nav[sel].disabled ? sel : -1;
  };
  const toggle = (reason: ChangeReason, e: Event) => {
    if (open) setOpen(false, reason, e);
    else { setQuery(null); setActive(current()); setOpen(true, reason, e); }
  };
  /** Autocomplete inline completion: the input shows the label, the completed rest selected. */
  const completeTo = (label: string, from: number) => requestAnimationFrame(() => inputRef.current?.setSelectionRange(from, label.length));
  const onText = (e: ChangeEvent<HTMLInputElement>) => {
    let t = e.target.value;
    const native = e.nativeEvent as InputEvent;
    const q = t;
    setQuery(q);
    let hl = -1;
    if (freeText && (mode === 'inline' || mode === 'both') && native.inputType === 'insertText') {
      const qShown = items.map((it) => !filters || matchesQuery(it.label, q));
      const i = inlineCompletion(visibleItems(items, qShown), q);
      if (i !== undefined) { hl = i; t = completionOf(items[i].label, q); completeTo(t, q.length); }
    }
    emitText(t, t ? 'input-change' : 'input-clear', e.nativeEvent);
    if (freeText) onValueChange?.(t, eventDetails(t ? 'input-change' : 'input-clear', e.nativeEvent));
    else if (!multiple && !t && values.length) emitValue([], 'input-clear', e.nativeEvent);
    if (hl < 0 && autoHighlight) {
      const qShown = items.map((it) => !filters || matchesQuery(it.label, q));
      hl = firstEnabled(visibleItems(items, qShown)) ?? -1;
    }
    setActive(hl);
    if (!open) setOpen(true, 'input-change', e.nativeEvent);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const ev = e.nativeEvent;
    switch (comboboxKeyIntent(open, ev, { empty: !text, multiple })) {
      case 'open': {
        if (readOnly) return;
        e.preventDefault();
        setActive(e.altKey ? -1 : e.key === 'ArrowUp' ? lastEnabled(nav) ?? -1 : current() >= 0 ? current() : firstEnabled(nav) ?? -1);
        setQuery(null);
        setOpen(true, 'list-navigation', ev);
        return;
      }
      case 'move': {
        e.preventDefault();
        const k = e.key === 'PageDown' ? 'End' : e.key === 'PageUp' ? 'Home' : e.key;
        const i = navigate(nav, active, k);
        if (i === undefined) return;
        setActive(i);
        // Autocomplete inline modes: the input shows the highlighted suggestion.
        if (freeText && (mode === 'inline' || mode === 'both')) { emitText(items[i].label, 'keyboard', ev); onValueChange?.(items[i].label, eventDetails('keyboard', ev)); }
        document.getElementById(idOf(i))?.scrollIntoView?.({ block: 'nearest' });
        return;
      }
      case 'commit':
        if (freeText && active < 0) { setOpen(false, 'none', ev); return; }
        e.preventDefault();
        if (active >= 0 && !nav[active]?.disabled) commit(active, 'item-press', ev);
        return;
      case 'close': e.preventDefault(); setOpen(false, 'escape-key', ev); return;
      case 'close-tab': setOpen(false, 'focus-out', ev); return;
      case 'remove-last':
        if (readOnly || !values.length) return;
        e.preventDefault();
        emitValue(values.slice(0, -1), 'keyboard', ev);
        return;
    }
  };
  const a = fieldAttrs({ id: base, hasDescription: !!findDeep(children, ComboboxDescription), error, required, disabled, readonly: readOnly, native: true });
  const f = useFieldState<HTMLDivElement>({ disabled, readOnly, required, error: !!error, value: freeText ? text : values.join(','), missing: required && (freeText ? !text : !values.length) });
  const onInputBlur = (e: FocusEvent<HTMLInputElement>) => setOpen(false, 'focus-out', e.nativeEvent);
  const c = comboboxRecipe();
  const state = stateOf(f.attrs);
  const hostProps = {
    ...rest, ref: (n: HTMLDivElement | null) => { hostRef.current = n; (f.ref as { current: HTMLDivElement | null }).current = n; },
    'data-ui': kind, 'data-size': size, 'data-hide-label': hideLabel || undefined, ...f.attrs, style, className, render,
    ...(gap !== undefined ? { gap: String(gap) } : {}),
    onFocus: (e: FocusEvent<HTMLDivElement>) => { f.handlers.onFocus(); onFocus?.(e); },
    onBlur: (e: FocusEvent<HTMLDivElement>) => { f.handlers.onBlur(e); onBlur?.(e); },
    children: <>
      {children}
      {name && (freeText ? [text] : values).map((v, i) => <input key={i} type="hidden" name={name} value={v} disabled={disabled} />)}
    </>,
  };
  const ctx: ComboboxContext = {
    c, state, a, popupId, open, values, multiple, text, items, shown, active, empty, editable, disabled, readOnly, required, freeText, mode, hasEmpty,
    idOf, labelOf, layer, inputRef, setActive, commit, removeValue, clear, toggle, onText, onKeyDown, onBlur: onInputBlur,
  };
  return <Ctx.Provider value={ctx}>{renderPart('div', c.root, hostProps, state)}</Ctx.Provider>;
}

/** The first part of `type` anywhere among the parts. */
function findDeep(children: ReactNode, type: unknown): boolean {
  return Children.toArray(children).some((n) => isValidElement<{ children?: ReactNode }>(n) && (n.type === type || (holders.includes(n.type) && findDeep(n.props.children, type))));
}

export interface ComboboxTextPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Combobox.Label: the visible label, a native <label> for the input. */
export function ComboboxLabel({ className, render, ...rest }: ComboboxTextPartProps) {
  const s = useCombobox('Combobox.Label');
  return renderPart('label', s.c.label, { 'data-part': 'label', className, ...toReactProps(s.a.label), ...rest, render }, s.state);
}

export interface ComboboxControlProps extends Omit<PartProps, 'trailing'>, Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'prefix'>, PartBase {
  /** Combobox.Chips, Combobox.Input, Combobox.Clear and Combobox.Trigger; all four when omitted. */
  children?: ReactNode;
}

/** Combobox.Control (ours): the input row, [leading] [prefix] [chips] [input] [suffix] [clear] [trigger]. */
export function ComboboxControl({ leading, prefix, suffix, children, className, render, ...rest }: ComboboxControlProps) {
  const s = useCombobox('Combobox.Control');
  const { c } = s;
  const [end, middle] = splitParts(children ?? [<ComboboxChips key="chips" />, <ComboboxInput key="input" />, <ComboboxClear key="clear" />, <ComboboxTrigger key="trigger" />], [ComboboxClear, ComboboxTrigger]);
  const keep = (e: MouseEvent) => { if (e.target !== s.inputRef.current) e.preventDefault(); };
  return renderPart('div', c.control, {
    'data-part': 'control', ref: s.layer.anchorRef, className, ...rest, render,
    onMouseDown: keep,
    onClick: (e: MouseEvent) => { if (e.target !== s.inputRef.current && !s.disabled) s.inputRef.current?.focus(); },
    children: <>
      {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
      {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
      {middle}
      {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
      {end}
    </>,
  }, s.state);
}

export interface ComboboxInputProps extends Omit<HTMLAttributes<HTMLInputElement>, 'className' | 'children' | 'defaultValue'>, PartBase {
  placeholder?: string;
}

/** Combobox.Input: the native text input (role=combobox), wired to the popup and the highlight. */
export function ComboboxInput({ className, render, placeholder, onChange, onKeyDown, onBlur, ...rest }: ComboboxInputProps) {
  const s = useCombobox('Combobox.Input');
  const attrs = toReactProps(comboboxInputAttrs({
    open: s.open, popupId: s.popupId, activeId: s.active >= 0 && s.shown[s.active] ? s.idOf(s.active) : undefined,
    describedBy: s.a.control['aria-describedby'] as string | undefined, readonly: s.readOnly, disabled: s.disabled,
    invalid: !!s.a.control['aria-invalid'], autocomplete: s.mode, empty: s.empty,
  }));
  delete attrs['aria-disabled']; delete attrs['aria-readonly'];
  return renderPart('input', s.c.input, {
    'data-part': 'input', ref: s.inputRef, type: 'text', autoComplete: 'off', className, ...attrs,
    id: s.a.control.id, required: s.required || undefined, disabled: s.disabled || undefined, readOnly: s.readOnly || undefined,
    'aria-describedby': attrs['aria-describedby'], 'aria-invalid': attrs['aria-invalid'],
    placeholder: s.multiple && s.values.length ? undefined : placeholder || undefined, value: s.text, ...rest, render,
    onChange: (e: ChangeEvent<HTMLInputElement>) => { s.onText(e); onChange?.(e); },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => { onKeyDown?.(e); if (!e.defaultPrevented) s.onKeyDown(e); },
    onBlur: (e: FocusEvent<HTMLInputElement>) => { s.onBlur(e); onBlur?.(e); },
  }, s.state);
}

export interface ComboboxButtonPartProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  /** The icon; the kit's when omitted. */
  children?: ReactNode;
}

/** Combobox.Trigger: a press toggles the popup (caret-down; turns while open). Not a tab stop. */
export function ComboboxTrigger({ className, render, children, onClick, ...rest }: ComboboxButtonPartProps) {
  const s = useCombobox('Combobox.Trigger');
  const attrs = toReactProps(comboboxTriggerAttrs({ open: s.open, popupId: s.popupId, disabled: s.disabled }));
  return renderPart('span', s.c.trigger, {
    'data-part': 'trigger', className, ...attrs, ...rest, render, children: children ?? <i name="caret-down" />,
    onClick: (e: MouseEvent<HTMLSpanElement>) => { onClick?.(e); if (!s.disabled) { s.toggle('trigger-press', e.nativeEvent); s.inputRef.current?.focus(); } },
  }, stateOf(attrs));
}

/** Combobox.Clear: removes the value and the text (reason clear-press); shown while there is either. */
export function ComboboxClear({ className, render, children, onClick, ...rest }: ComboboxButtonPartProps) {
  const s = useCombobox('Combobox.Clear');
  const attrs = toReactProps(comboboxButtonAttrs({ label: 'Clear', disabled: s.disabled }));
  return renderPart('span', s.c.clear, {
    'data-part': 'clear', className, ...attrs, hidden: !s.editable || (!s.values.length && !s.text) || undefined, ...rest, render, children: children ?? <i name="x" />,
    onClick: (e: MouseEvent<HTMLSpanElement>) => { onClick?.(e); if (s.editable) { s.clear(e.nativeEvent); s.inputRef.current?.focus(); } },
  }, stateOf(attrs));
}

/** Combobox.Chips: the chips of a multiple combobox (one Combobox.Chip per value when no children); no box of its own. */
export function ComboboxChips({ className, render, children, ...rest }: ComboboxTextPartProps) {
  const s = useCombobox('Combobox.Chips');
  return renderPart('span', s.c.chips, {
    'data-part': 'chips', className, hidden: !s.multiple || undefined, ...rest, render,
    children: children ?? (s.multiple ? s.values.map((v) => <ComboboxChip key={v} value={v} />) : null),
  }, s.state);
}

export interface ComboboxChipProps extends ComboboxTextPartProps {
  /** The selected value this chip shows. */
  value: string;
}

/** Combobox.Chip: one selected value's label and its remove button (children replace both). */
export function ComboboxChip({ value, className, render, children, ...rest }: ComboboxChipProps) {
  const s = useCombobox('Combobox.Chip');
  return renderPart('span', s.c.chip, {
    'data-part': 'chip', 'data-value': value, 'data-disabled': s.disabled ? '' : undefined, className, ...rest, render,
    children: children ?? <><span data-part="contents">{s.labelOf(value)}</span>{s.editable && <ComboboxChipRemove value={value} />}</>,
  }, s.state);
}

/** Combobox.ChipRemove: removes its chip's value (reason chip-remove-press). */
export function ComboboxChipRemove({ value, className, render, children, onClick, ...rest }: ComboboxChipProps) {
  const s = useCombobox('Combobox.ChipRemove');
  const attrs = toReactProps(comboboxButtonAttrs({ label: `Remove ${s.labelOf(value)}` }));
  return renderPart('span', s.c['chip-remove'], {
    'data-part': 'chip-remove', className, ...attrs, ...rest, render, children: children ?? <i name="x" />,
    onClick: (e: MouseEvent<HTMLSpanElement>) => { onClick?.(e); if (s.editable) { s.removeValue(value, 'chip-remove-press', e.nativeEvent); s.inputRef.current?.focus(); } },
  }, s.state);
}

export interface ComboboxGroupPartProps { children?: ReactNode }

/** Combobox.Positioner: no element of its own; the popup is placed by the kit's positioner (data-side, the positioner variables). */
export function ComboboxPositioner({ children }: ComboboxGroupPartProps) { useCombobox('Combobox.Positioner'); return <>{children}</>; }

export interface ComboboxPopupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Combobox.Popup: the floating listbox (top layer; data-open / data-closed, data-side, data-align, data-empty). */
export function ComboboxPopup({ className, render, children, ...rest }: ComboboxPopupProps) {
  const s = useCombobox('Combobox.Popup');
  const attrs = { id: s.popupId, ...toReactProps(listboxAttrs({ focusable: false })), 'aria-multiselectable': s.multiple ? 'true' : undefined, ...s.layer.popupProps, 'data-empty': s.empty ? '' : undefined };
  return renderPart('div', s.c.popup, {
    'data-part': 'popup', ref: s.layer.popupRef, popover: 'manual', className, ...attrs, ...rest, render, children,
    onMouseDown: (e: MouseEvent) => e.preventDefault(),
  }, stateOf(attrs));
}

/** Combobox.List: the items' parent (data-empty when nothing matches). */
export function ComboboxList({ className, render, children, ...rest }: ComboboxPopupProps) {
  const s = useCombobox('Combobox.List');
  const attrs = { 'data-empty': s.empty ? '' : undefined };
  return renderPart('div', s.c.list, { 'data-part': 'list', className, ...attrs, ...rest, render, children }, stateOf(attrs));
}

/** Combobox.Empty: shown when no item matches the text (role=status). */
export function ComboboxEmpty({ className, render, children, ...rest }: ComboboxTextPartProps) {
  const s = useCombobox('Combobox.Empty');
  const on = s.empty && children != null && children !== '';
  return renderPart('div', s.c.empty, { 'data-part': 'empty', className, role: on ? 'status' : undefined, hidden: !on || undefined, ...rest, render, children }, s.state);
}

export interface ComboboxItemProps extends PartProps, Omit<HTMLAttributes<HTMLDivElement>, 'prefix' | 'className'>, PartBase {
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  /** The label (contents), or Combobox.ItemText / Combobox.ItemIndicator parts. */
  children?: ReactNode;
}

/** Combobox.Item: one option (role=option; data-selected, data-highlighted, data-disabled); hidden while filtered out. */
export function ComboboxItem({ value, disabled: _d, iconSize, leading, prefix, suffix, trailing, children, className, render, onClick, onPointerMove, ...rest }: ComboboxItemProps) {
  const s = useCombobox('Combobox.Item');
  const i = s.items.findIndex((it) => it.value === value);
  const it = s.items[i];
  const selected = s.values.includes(value);
  const attrs = toReactProps(optionAttrs({ id: s.idOf(i), selected, disabled: it?.disabled, active: s.open && i === s.active && s.shown[i] }));
  const state = stateOf(attrs);
  const c = option();
  return (
    <ItemContext.Provider value={{ c, state, selected }}>
      {renderPart('div', c.root, {
        ...rest, className, 'data-ui': 'option', 'data-icon-size': iconSize, ...attrs, hidden: !s.shown[i] || undefined, render,
        onClick: (e: MouseEvent<HTMLDivElement>) => { onClick?.(e); s.commit(i, 'item-press', e.nativeEvent); s.inputRef.current?.focus(); },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => { onPointerMove?.(e); if (!it?.disabled && i !== s.active) s.setActive(i); },
        children: <ItemParts c={c} {...{ leading, prefix, suffix, trailing }}>{children}</ItemParts>,
      }, state)}
    </ItemContext.Provider>
  );
}

/** Combobox.Description: help text, wired with aria-describedby. */
export function ComboboxDescription({ className, render, ...rest }: ComboboxTextPartProps) {
  const s = useCombobox('Combobox.Description');
  return renderPart('span', s.c.description, { 'data-part': 'description', className, ...toReactProps(s.a.description), ...rest, render }, s.state);
}

/** Combobox.Error: the author error, shown at once (data-invalid on the host). */
export function ComboboxError({ className, render, ...rest }: ComboboxTextPartProps) {
  const s = useCombobox('Combobox.Error');
  return renderPart('span', s.c.error, { 'data-part': 'error', className, ...toReactProps(s.a.error), ...rest, render }, s.state);
}

const holders: unknown[] = [ComboboxControl, ComboboxPositioner, ComboboxPopup, ComboboxList];
export const isComboboxPart = isPartOf([ComboboxLabel, ComboboxControl, ComboboxPositioner, ComboboxDescription, ComboboxError]);

export interface ComboboxProps extends Omit<ComboboxRootProps, 'freeText' | 'mode' | 'kind'>, Omit<PartProps, 'trailing'> {
  label?: string;
  description?: string;
  placeholder?: string;
  /** What the popup says when nothing matches; '' for nothing. Default "No results.". */
  emptyText?: string;
  /** Combobox.Item children. */
  children?: ReactNode;
}

/** Preset: Root with a Label, the Control (chips, input, clear, trigger and adornments), Positioner › Popup › List › items, Empty, Description and Error. */
export function Combobox({ label, description, error, leading, prefix, suffix, placeholder, emptyText = 'No results.', children, ...rest }: ComboboxProps) {
  return (
    <ComboboxRoot error={error} {...rest}>
      {label && <ComboboxLabel>{label}</ComboboxLabel>}
      <ComboboxControl {...{ leading, prefix, suffix }}>
        <ComboboxChips /><ComboboxInput placeholder={placeholder} /><ComboboxClear /><ComboboxTrigger />
      </ComboboxControl>
      <ComboboxPositioner><ComboboxPopup><ComboboxList>{children}</ComboboxList><ComboboxEmpty>{emptyText}</ComboboxEmpty></ComboboxPopup></ComboboxPositioner>
      {description && <ComboboxDescription>{description}</ComboboxDescription>}
      {error && <ComboboxError>{error}</ComboboxError>}
    </ComboboxRoot>
  );
}
Combobox.Root = ComboboxRoot;
Combobox.Label = ComboboxLabel;
Combobox.Control = ComboboxControl;
Combobox.Input = ComboboxInput;
Combobox.Chips = ComboboxChips;
Combobox.Chip = ComboboxChip;
Combobox.ChipRemove = ComboboxChipRemove;
Combobox.Clear = ComboboxClear;
Combobox.Trigger = ComboboxTrigger;
Combobox.Positioner = ComboboxPositioner;
Combobox.Popup = ComboboxPopup;
Combobox.List = ComboboxList;
Combobox.Item = ComboboxItem;
Combobox.ItemText = ItemText;
Combobox.ItemIndicator = ItemIndicator;
Combobox.Empty = ComboboxEmpty;
Combobox.Description = ComboboxDescription;
Combobox.Error = ComboboxError;

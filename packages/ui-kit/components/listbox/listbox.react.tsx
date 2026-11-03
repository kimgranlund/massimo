/// <reference path="../jsx.d.ts" />
// React <Listbox>, <Segmented>, <Option>: ARIA listboxes with the web components' semantics, built on
// the same headless helpers (dom/listbox.ts). The host is the single tab stop (role=listbox) and
// tracks the highlighted option with aria-activedescendant; arrow keys, Home/End and typeahead move
// and select (selection follows focus). A hidden input carries the form value when `name` is set.
// The host carries the field state as data-* (state.react.ts) and options data-selected,
// data-highlighted and data-disabled (optionAttrs), as on the web components.
// Compound parts: Listbox.Root / Listbox.Item and Segmented.Root / Segmented.Item (Base UI
// Select.List / Select.Item names; Base UI has no listbox), with ItemText and ItemIndicator shared
// with the Select (ItemText: the contents part; ItemIndicator: a trailing part on the selected item
// only). Items are direct children of the Root, which reads their value, label and disabled. The
// presets <Listbox>, <Segmented> and <Option> are these same components.
import { Children, createContext, isValidElement, useContext, useId, useRef, useState, type FocusEvent, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { createTypeahead, eventDetails, firstEnabled, isPrintableKey, listboxAttrs, navigate, optionAttrs, toReactProps, type ChangeDetails, type ChangeReason, type OptionItem } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { useFieldState, useFormChanged, useFormError } from '../state.react.ts';
import { isPartOf, renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { listbox, segmented, option } from '../../styled-system/recipes/index.js';

interface OptionState { id: string; selected: boolean; disabled: boolean; active: boolean; select: (event: Event) => void }
const OptionContext = createContext<OptionState | null>(null);

export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'className'>, PartBase {
  name?: string;
  value?: string;
  defaultValue?: string;
  /** An option was chosen (Base UI onValueChange): reason 'item-press' (pointer) or 'keyboard' (arrows, Home / End, typeahead). */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** Accessible name (aria-label). */
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  required?: boolean;
  /** Show the invalid state now (author error). */
  invalid?: boolean;
  gap?: number;
  size?: number;
  /** inset="none": attached. Children touch the edge and each other with no curvature (outer corners follow the container); thumbs fill the track. */
  inset?: 'none';
  /** <Option> (Listbox.Item) children. */
  children?: ReactNode;
}

export interface OptionProps extends PartProps, Omit<HTMLAttributes<HTMLDivElement>, 'prefix' | 'className'>, PartBase {
  /** Submitted value. */
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  children?: ReactNode;
}

const textOf = (n: ReactNode): string => typeof n === 'string' || typeof n === 'number' ? String(n)
  : Array.isArray(n) ? n.map(textOf).join('')
  : isValidElement<{ children?: ReactNode }>(n) && n.type === ItemText ? textOf(n.props.children) : '';

function List({ kind, name, value, defaultValue = '', onValueChange, label, orientation, disabled, required, invalid, gap, size, inset, children, onKeyDown, onFocus, onBlur, className, render, ...rest }: ListboxProps & { kind: 'listbox' | 'segmented' }) {
  const base = useId();
  const [inner, setInner] = useState(defaultValue);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const typeahead = useRef(createTypeahead()).current;
  const current = value ?? inner;
  const orient = orientation ?? (kind === 'segmented' ? 'horizontal' : 'vertical');
  const options = Children.toArray(children).filter(isValidElement) as ReactElement<OptionProps>[];
  const items: OptionItem[] = options.map((o) => ({ value: o.props.value, label: textOf(o.props.children) || o.props.value, disabled: !!o.props.disabled || !!disabled }));
  const idOf = (i: number) => `${base}-opt-${i}`;
  // A form error for this name shows on the host and clears on the next change (no native control fires change).
  const formError = useFormError(name);
  const formChanged = useFormChanged();

  const select = (i: number, reason: ChangeReason, event: Event) => {
    const it = items[i];
    if (!it || it.disabled) return;
    setActive(i);
    if (it.value === current) return;
    if (value === undefined) setInner(it.value);
    formChanged?.(name);
    onValueChange?.(it.value, eventDetails(reason, event));
  };

  const shown = focused ? active : -1;
  const f = useFieldState<HTMLDivElement>({ disabled, required, error: invalid || !!formError, value: current, missing: !!required && !current });
  const listAttrs = toReactProps(listboxAttrs({ orientation: orient, activeId: shown >= 0 ? idOf(shown) : undefined, label, disabled, required, invalid: f.attrs['data-invalid'] !== undefined }));
  const state = stateOf({ ...listAttrs, ...f.attrs });
  return renderPart('div', (kind === 'segmented' ? segmented : listbox)().root, {
    ...rest, ref: f.ref, className, 'data-ui': kind, 'data-size': size, 'data-inset': inset, ...(gap !== undefined ? { gap: String(gap) } : {}),
    ...listAttrs,
    ...f.attrs,
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      setFocused(true);
      f.handlers.onFocus();
      if (active < 0) { const sel = items.findIndex((it) => it.value === current); setActive(sel >= 0 ? sel : firstEnabled(items) ?? -1); }
      onFocus?.(e);
    },
    onBlur: (e: FocusEvent<HTMLDivElement>) => { setFocused(false); f.handlers.onBlur(e); onBlur?.(e); },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (disabled || e.defaultPrevented) return;
      const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
      // Start from the highlighted option, else the selected one (a key can arrive before focus state renders).
      const from = active >= 0 ? active : items.findIndex((it) => it.value === current);
      let i = navigate(items, from, e.key, { orientation: orient, rtl });
      if (i === undefined && isPrintableKey(e.nativeEvent)) i = typeahead(items, from, e.key);
      if (i === undefined) return;
      e.preventDefault();
      select(i, 'keyboard', e.nativeEvent); // selection follows focus
      document.getElementById(idOf(i))?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    },
    render,
    children: <>
      {options.map((o, i) => (
        <OptionContext.Provider key={o.key ?? i} value={{ id: idOf(i), selected: o.props.value === current, disabled: items[i].disabled ?? false, active: i === shown, select: (event) => select(i, 'item-press', event) }}>
          {o}
        </OptionContext.Provider>
      ))}
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
    </>,
  }, state);
}

/** Preset and part: the listbox host (Listbox.Root) with its <Option> (Listbox.Item) children. */
export function Listbox(props: ListboxProps) { return <List kind="listbox" {...props} />; }
/** Preset and part: the segmented host (Segmented.Root) with its <Option> (Segmented.Item) children. */
export function Segmented(props: ListboxProps) { return <List kind="segmented" {...props} />; }

/** Listbox.Item / Segmented.Item (and the preset <Option>): one option; children are its label (contents), or ItemText / ItemIndicator parts. */
export function Option({ value: _value, disabled: _disabled, leading, prefix, suffix, trailing, iconSize, children, onClick, className, render, ...rest }: OptionProps) {
  const o = useContext(OptionContext);
  if (!o) throw new Error('<Option> must be inside <Listbox> or <Segmented>');
  const c = option();
  const attrs = toReactProps(optionAttrs({ id: o.id, selected: o.selected, disabled: o.disabled, active: o.active }));
  const state = stateOf(attrs);
  return (
    <ItemContext.Provider value={{ c, state, selected: o.selected }}>
      {renderPart('div', c.root, {
        ...rest, className, 'data-ui': 'option', 'data-icon-size': iconSize, ...attrs,
        onClick: (e: MouseEvent<HTMLDivElement>) => { o.select(e.nativeEvent); onClick?.(e); }, render,
        children: <ItemParts c={c} {...{ leading, prefix, suffix, trailing }}>{children}</ItemParts>,
      }, state)}
    </ItemContext.Provider>
  );
}

/** What an item shares with its ItemText and ItemIndicator: the option recipe, its state and whether it is selected. */
interface ItemContextValue { c: Record<string, string>; state: PartState; selected: boolean }
export const ItemContext = createContext<ItemContextValue | null>(null);
const useItem = (part: string) => {
  const v = useContext(ItemContext);
  if (!v) throw new Error(`<${part}> must be inside an item`);
  return v;
};

export interface ItemPartProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** ItemText (Base UI Select.ItemText): the item's label, its contents part. */
export function ItemText({ className, render, ...rest }: ItemPartProps) {
  const t = useItem('ItemText');
  return renderPart('span', t.c.contents, { 'data-part': 'contents', className, ...rest, render }, t.state);
}

/** ItemIndicator (Base UI Select.ItemIndicator): a check in the trailing slot, rendered on the selected item only. */
export function ItemIndicator({ className, render, children, ...rest }: ItemPartProps) {
  const t = useItem('ItemIndicator');
  if (!t.selected) return null;
  return renderPart('span', t.c.trailing, { 'data-part': 'trailing', 'data-mark': 'selected', 'aria-hidden': 'true', className, ...rest, render, children: children ?? <i name="check" /> }, t.state);
}

const isItemPart = isPartOf([ItemText, ItemIndicator]);

/**
 * An item's construction pattern: [leading] [prefix] [contents] [suffix] [trailing]. Composed
 * children (an ItemText or ItemIndicator among them) render as written between the adornments;
 * otherwise the children are the contents.
 */
export function ItemParts({ c, children, leading, prefix, suffix, trailing }: PartProps & { c: Record<string, string>; children?: ReactNode }) {
  if (!Children.toArray(children).some(isItemPart)) return <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>;
  return <><Parts classes={c} {...{ leading, prefix }} />{children}<Parts classes={c} {...{ suffix, trailing }} /></>;
}

Listbox.Root = Listbox;
Listbox.Item = Option;
Listbox.ItemText = ItemText;
Listbox.ItemIndicator = ItemIndicator;
Segmented.Root = Segmented;
Segmented.Item = Option;
Segmented.ItemText = ItemText;

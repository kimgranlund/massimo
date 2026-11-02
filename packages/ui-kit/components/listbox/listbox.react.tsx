/// <reference path="../jsx.d.ts" />
// React <Listbox>, <Segmented>, <Option>: ARIA listboxes with the web components' semantics, built on
// the same headless helpers (dom/listbox.ts). The host is the single tab stop (role=listbox) and
// tracks the highlighted option with aria-activedescendant; arrow keys, Home/End and typeahead move
// and select (selection follows focus). A hidden input carries the form value when `name` is set.
// The host carries the field state as data-* (state.react.ts) and options data-selected,
// data-highlighted and data-disabled (optionAttrs), as on the web components.
import { Children, createContext, isValidElement, useContext, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { createTypeahead, eventDetails, firstEnabled, isPrintableKey, listboxAttrs, navigate, optionAttrs, toReactProps, type ChangeDetails, type ChangeReason, type OptionItem } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { useFieldState } from '../state.react.ts';
import { cx } from '../../styled-system/css/cx.js';
import { listbox, segmented, option } from '../../styled-system/recipes/index.js';

interface OptionState { id: string; selected: boolean; disabled: boolean; active: boolean; select: (event: Event) => void }
const OptionContext = createContext<OptionState | null>(null);

export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
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
  /** <Option> children. */
  children?: ReactNode;
}

export interface OptionProps extends PartProps, Omit<HTMLAttributes<HTMLDivElement>, 'prefix'> {
  /** Submitted value. */
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  children?: ReactNode;
}

const textOf = (n: ReactNode): string => typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(textOf).join('') : '';

function List({ kind, name, value, defaultValue = '', onValueChange, label, orientation, disabled, required, invalid, gap, size, children, onKeyDown, onFocus, onBlur, className, ...rest }: ListboxProps & { kind: 'listbox' | 'segmented' }) {
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

  const select = (i: number, reason: ChangeReason, event: Event) => {
    const it = items[i];
    if (!it || it.disabled) return;
    setActive(i);
    if (it.value === current) return;
    if (value === undefined) setInner(it.value);
    onValueChange?.(it.value, eventDetails(reason, event));
  };

  const shown = focused ? active : -1;
  const f = useFieldState<HTMLDivElement>({ disabled, required, error: invalid, value: current, missing: !!required && !current });
  return (
    <div
      {...rest} ref={f.ref} className={cx((kind === 'segmented' ? segmented : listbox)().root, className)} data-ui={kind} data-size={size} {...(gap !== undefined ? { gap: String(gap) } : {})}
      {...toReactProps(listboxAttrs({ orientation: orient, activeId: shown >= 0 ? idOf(shown) : undefined, label, disabled, required, invalid: f.attrs['data-invalid'] !== undefined }))}
      {...f.attrs}
      onFocus={(e) => {
        setFocused(true);
        f.handlers.onFocus();
        if (active < 0) { const sel = items.findIndex((it) => it.value === current); setActive(sel >= 0 ? sel : firstEnabled(items) ?? -1); }
        onFocus?.(e);
      }}
      onBlur={(e) => { setFocused(false); f.handlers.onBlur(e); onBlur?.(e); }}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
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
      }}
    >
      {options.map((o, i) => (
        <OptionContext.Provider key={o.key ?? i} value={{ id: idOf(i), selected: o.props.value === current, disabled: items[i].disabled ?? false, active: i === shown, select: (event) => select(i, 'item-press', event) }}>
          {o}
        </OptionContext.Provider>
      ))}
      {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
    </div>
  );
}

export function Listbox(props: ListboxProps) { return <List kind="listbox" {...props} />; }
export function Segmented(props: ListboxProps) { return <List kind="segmented" {...props} />; }

export function Option({ value: _value, disabled: _disabled, leading, prefix, suffix, trailing, iconSize, children, onClick, className, ...rest }: OptionProps) {
  const o = useContext(OptionContext);
  if (!o) throw new Error('<Option> must be inside <Listbox> or <Segmented>');
  const c = option();
  return (
    <div {...rest} className={cx(c.root, className)} data-ui="option" data-icon-size={iconSize}
      {...toReactProps(optionAttrs({ id: o.id, selected: o.selected, disabled: o.disabled, active: o.active }))}
      onClick={(e) => { o.select(e.nativeEvent); onClick?.(e); }}>
      <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>
    </div>
  );
}

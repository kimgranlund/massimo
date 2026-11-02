// React <Listbox>, <Segmented>, <Option>: native radio groups with the web components' anatomy. The
// host is a <div data-ui="listbox|segmented" role="radiogroup">; each option is a <label data-ui=
// "option"> around a native radio and the construction-pattern parts. The browser owns arrow keys
// (move and select, like the web component's selection-follows-focus), the tab stop and the form value.
import { createContext, useContext, useId, useState, type ChangeEvent, type HTMLAttributes, type ReactNode } from 'react';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts, type PartProps } from '../parts.react.tsx';

interface ListState { name: string; value: string; set: (v: string) => void; disabled?: boolean; required?: boolean }
const ListContext = createContext<ListState | null>(null);

export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name (aria-label). */
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  required?: boolean;
  /** Show the invalid state now (author error). */
  invalid?: boolean;
  gap?: number;
  size?: number;
  children?: ReactNode;
}

function List({ kind, name, value, defaultValue = '', onValueChange, label, orientation, disabled, required, invalid, gap, size, children, ...rest }: ListboxProps & { kind: 'listbox' | 'segmented' }) {
  const auto = useId();
  const [inner, setInner] = useState(defaultValue);
  const state: ListState = {
    name: name ?? auto, value: value ?? inner, disabled, required,
    set: (v) => { if (value === undefined) setInner(v); onValueChange?.(v); },
  };
  return (
    <div {...rest} data-ui={kind} data-size={size} {...(gap !== undefined ? { gap: String(gap) } : {})}
      data-disabled={disabled || undefined} data-invalid={invalid || undefined}
      role="radiogroup" aria-label={label || undefined} aria-orientation={orientation ?? (kind === 'segmented' ? 'horizontal' : 'vertical')}>
      <ListContext.Provider value={state}>{children}</ListContext.Provider>
    </div>
  );
}

export function Listbox(props: ListboxProps) { return <List kind="listbox" {...props} />; }
export function Segmented(props: ListboxProps) { return <List kind="segmented" {...props} />; }

export interface OptionProps extends PartProps, Omit<HTMLAttributes<HTMLLabelElement>, 'prefix'> {
  /** Submitted value. */
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  children?: ReactNode;
}

export function Option({ value, disabled, leading, prefix, suffix, trailing, iconSize, children, ...rest }: OptionProps) {
  const list = useContext(ListContext);
  if (!list) throw new Error('<Option> must be inside <Listbox> or <Segmented>');
  return (
    <label {...rest} data-ui="option" data-icon-size={iconSize}>
      <input type="radio" name={list.name} value={value} checked={list.value === value} disabled={disabled || list.disabled} required={list.required}
        onChange={(e: ChangeEvent<HTMLInputElement>) => list.set(e.target.value)} />
      <Parts {...{ leading, prefix, suffix, trailing }}>{children}</Parts>
    </label>
  );
}

/// <reference path="../jsx.d.ts" />
// React <Select> and <SelectOption>: a native <select> with customizable-select styling (appearance:
// base-select, Chromium 135+) and the web component's anatomy: label, trigger (the select's <button>:
// leading, prefix, value = <selectedcontent>, suffix, icon = chevron), popup (::picker(select)) and rich
// <option>s with construction-pattern parts. The select owns value, keys, typeahead, the popup and
// the form value; browsers without base-select show the platform select.
// The host carries the field state as data-* (state.react.ts), like ui-select's host. The open state
// and the highlighted option stay native (select:open, the options' :checked and :focus): the
// browser owns the picker and reports neither to script.
// Compound parts (Base UI Select): Select.Root, Select.Label, Select.Trigger, Select.Value,
// Select.Icon, Select.Popup, Select.List, Select.Item, Select.ItemText, Select.ItemIndicator, plus
// Select.Description and Select.Error (Base UI Field.Description / Field.Error on the select's
// recipe). Select.Root renders the native <select> and puts its Trigger and Popup children inside it
// (the trigger is the select's <button>, the items its <option>s); Label goes before it, Description
// and Error after. Select.Popup and Select.List render no element: the browser draws the picker
// (::picker(select)) and the options sit in the select directly, so neither takes render or
// className. The preset <Select label leading prefix suffix description error> is Root + parts.
import { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type HTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { eventDetails, fieldAttrs, isOutside, toReactProps, type ChangeDetails, type ChangeReason } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
import type { PartProps } from '../parts.react.tsx';
import { findPart, isPartOf, renderPart, splitParts, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { ItemContext, ItemIndicator, ItemParts, ItemText } from '../listbox/listbox.react.tsx';
import { select as selectRecipe, option } from '../../styled-system/recipes/index.js';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix' | 'className'>, PartBase {
  label?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  description?: string;
  /** Author error, shown at once; native :user-invalid shows built-in problems after interaction. */
  error?: string;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  gap?: number;
  size?: number;
  /** <SelectOption> children (Select.Root: the parts). */
  children?: ReactNode;
  /** An option was chosen (Base UI onValueChange; reason 'item-press'). The native onChange still fires. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** Open the picker (Base UI open). Opening needs user activation (showPicker); a native picker cannot be closed from script. */
  open?: boolean;
  /** Open the picker on mount (Base UI defaultOpen); with the same user-activation limit. */
  defaultOpen?: boolean;
  /** The picker opened or closed (Base UI onOpenChange), read from select:open after each interaction. */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
}

/** Select.Root's props: the preset's without the content its parts carry (label, description, adornments). */
export type SelectRootProps = Omit<SelectProps, 'label' | 'description' | 'leading' | 'prefix' | 'suffix'>;

/** select:open, false where the browser does not know the pseudo-class. */
const isOpen = (el: HTMLSelectElement) => { try { return el.matches(':open'); } catch { return false; } };
const showPicker = (el: HTMLSelectElement) => { try { el.showPicker?.(); } catch { /* needs user activation */ } };

/**
 * Report the native picker's open state through onOpenChange: the browser owns the picker and fires
 * no event for it, so the state is reread after each interaction that can open or close it. The
 * picker is the browser's floating layer (its top layer, positioning and light dismiss): the kit's
 * positioner reaches it only as CSS (select.recipe.ts anchoredPopup on ::picker(select)), and the
 * dismissals are named with the floating layer's reasons (dom/floating.ts: outside-press,
 * escape-key, focus-out; isOutside decides what an outside press is).
 */
function useOpenState(el: { current: HTMLSelectElement | null }, onOpenChange: SelectProps['onOpenChange'], open: boolean | undefined, defaultOpen: boolean | undefined) {
  const cb = useRef(onOpenChange);
  cb.current = onOpenChange;
  const was = useRef(false);
  useEffect(() => {
    const s = el.current;
    if (!s) return;
    if (defaultOpen) showPicker(s);
    const check = (reason: ChangeReason, event: Event) => requestAnimationFrame(() => {
      const now = isOpen(s);
      if (now !== was.current) { was.current = now; cb.current?.(now, eventDetails(reason, event)); }
    });
    const onPointer = (e: Event) => check(!isOutside(e.target, [s]) ? (was.current ? 'item-press' : 'trigger-press') : 'outside-press', e);
    const onKey = (e: KeyboardEvent) => check(e.key === 'Escape' ? 'escape-key' : was.current ? 'item-press' : e.key === 'Enter' || e.key === ' ' ? 'trigger-press' : 'list-navigation', e);
    const onChange = (e: Event) => check('item-press', e);
    const onBlur = (e: Event) => check('focus-out', e);
    document.addEventListener('pointerup', onPointer, true);
    s.addEventListener('keydown', onKey);
    s.addEventListener('change', onChange);
    s.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('pointerup', onPointer, true);
      s.removeEventListener('keydown', onKey);
      s.removeEventListener('change', onChange);
      s.removeEventListener('blur', onBlur);
    };
  }, []);
  useEffect(() => { if (open && el.current && !isOpen(el.current)) showPicker(el.current); }, [open]);
}

type Wiring = ReturnType<typeof fieldAttrs>;
interface SelectContext { c: Record<string, string>; state: PartState; a: Wiring; value: string }
const Ctx = createContext<SelectContext | null>(null);
const useSelect = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Select.Root`);
  return v;
};

/** Select.Root: the host and the native <select>, which holds the Trigger and the Popup's items. */
export function SelectRoot({ hideLabel, error: rootError, gap, size, className, render, style, id, required, disabled, children, onInvalid, onChange, onValueChange, open, defaultOpen, onOpenChange, ...select }: SelectRootProps) {
  const auto = useId();
  const native = useRef<HTMLSelectElement>(null);
  useOpenState(native, onOpenChange, open, defaultOpen);
  const err = findPart<SelectTextPartProps>(children, [SelectError]);
  const error = rootError ?? (err ? String(err.props.children ?? '') || undefined : undefined);
  const a = fieldAttrs({ id: id ?? auto, hasLabel: !!findPart(children, [SelectLabel]), hasDescription: !!findPart(children, [SelectDescription]), error, required, disabled, native: true });
  // Without a value the select shows its first option; filled follows that option's value.
  const [current, setCurrent] = useState(() => String(select.value ?? select.defaultValue ?? firstValue(children)));
  const value = select.value !== undefined ? String(select.value) : current;
  const f = useFieldState<HTMLDivElement>({
    disabled, required, error: !!error,
    filled: select.value !== undefined ? String(select.value) !== '' : undefined,
    defaultFilled: String(select.value ?? select.defaultValue ?? firstValue(children)) !== '',
  });
  const c = selectRecipe();
  const state = stateOf(f.attrs);
  // Trigger and Popup go inside the native select; the other parts before (Label) or after it.
  const before: ReactNode[] = [], inside: ReactNode[] = [], after: ReactNode[] = [];
  for (const n of Children.toArray(children)) (isInSelect(n) ? inside : inside.length ? after : before).push(n);
  return (
    <Ctx.Provider value={{ c, state, a, value }}>
      {renderPart('div', c.root, {
        ref: f.ref, 'data-ui': 'select', 'data-size': size, 'data-hide-label': hideLabel || undefined, ...f.attrs, ...f.handlers, className, style, ...(gap !== undefined ? { gap: String(gap) } : {}), render,
        children: <>
          {before}
          <select ref={native} {...toReactProps(a.control)} required={required} disabled={disabled} {...select}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => { setCurrent(e.target.value); onValueChange?.(e.target.value, eventDetails('item-press', e.nativeEvent)); onChange?.(e); }}
            onInvalid={(e: FormEvent<HTMLSelectElement>) => { f.controlProps.onInvalid(); onInvalid?.(e); }}>
            {inside}
          </select>
          {after}
        </>,
      }, state)}
    </Ctx.Provider>
  );
}

export interface SelectTextPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Select.Label: the visible label (a native <label> for the select). */
export function SelectLabel({ className, render, ...rest }: SelectTextPartProps) {
  const s = useSelect('Select.Label');
  return renderPart('label', s.c.label, { 'data-part': 'label', className, ...toReactProps(s.a.label), ...rest, render }, s.state);
}

export interface SelectTriggerProps extends Omit<PartProps, 'trailing'>, Omit<HTMLAttributes<HTMLButtonElement>, 'className' | 'prefix'>, PartBase {
  /** Select.Value and Select.Icon; both when omitted. */
  children?: ReactNode;
}

/** Select.Trigger: the select's <button>, [leading] [prefix] [value] [suffix] [icon]. */
export function SelectTrigger({ leading, prefix, suffix, children, className, render, ...rest }: SelectTriggerProps) {
  const s = useSelect('Select.Trigger');
  const { c } = s;
  // The icon takes the trailing place, after the suffix.
  const [icon, value] = splitParts(children ?? [<SelectValue key="value" />, <SelectIcon key="icon" />], [SelectIcon]);
  return renderPart('button', c.trigger, {
    'data-part': 'trigger', type: 'button', className, ...rest, render,
    children: <>
      {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
      {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
      {value}
      {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
      {icon}
    </>,
  }, s.state);
}

/** Select.Value: <selectedcontent>, the browser's copy of the selected option's content. */
export function SelectValue({ className, render, ...rest }: SelectTextPartProps) {
  const s = useSelect('Select.Value');
  return renderPart('selectedcontent', s.c.value, { 'data-part': 'value', className, ...rest, render }, s.state);
}

/** Select.Icon: the chevron (caret-down unless children replace it). */
export function SelectIcon({ className, render, children, ...rest }: SelectTextPartProps) {
  const s = useSelect('Select.Icon');
  return renderPart('span', s.c.icon, { 'data-part': 'icon', 'aria-hidden': 'true', className, ...rest, render, children: children ?? <i name="caret-down" /> }, s.state);
}

export interface SelectGroupPartProps {
  /** Select.Popup: a Select.List; Select.List: the Select.Item children. */
  children?: ReactNode;
}

/** Select.Popup: no element of its own (the browser's ::picker(select)); holds Select.List. */
export function SelectPopup({ children }: SelectGroupPartProps) { useSelect('Select.Popup'); return <>{children}</>; }
/** Select.List: no element of its own (the options are the select's children); holds the items. */
export function SelectList({ children }: SelectGroupPartProps) { useSelect('Select.List'); return <>{children}</>; }

/** Select.Description: help text, wired with aria-describedby. */
export function SelectDescription({ className, render, ...rest }: SelectTextPartProps) {
  const s = useSelect('Select.Description');
  return renderPart('span', s.c.description, { 'data-part': 'description', className, ...toReactProps(s.a.description), ...rest, render }, s.state);
}

/** Select.Error: the author error, shown at once (data-invalid on the host). */
export function SelectError({ className, render, ...rest }: SelectTextPartProps) {
  const s = useSelect('Select.Error');
  return renderPart('span', s.c.error, { 'data-part': 'error', className, ...toReactProps(s.a.error), ...rest, render }, s.state);
}

export interface SelectOptionProps extends PartProps, PartBase {
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  /** The label (contents), or Select.ItemText / Select.ItemIndicator parts. */
  children?: ReactNode;
}

/** Select.Item (and the preset <SelectOption>): a rich native <option> with the construction pattern. */
export function SelectItem({ value, disabled, iconSize, leading, prefix, suffix, trailing, children, className, render }: SelectOptionProps) {
  const s = useContext(Ctx);
  const c = option();
  const selected = s?.value === value;
  // A native option reports selection and highlight only as :checked and :focus; data-disabled mirrors disabled.
  const state: PartState = { ...(selected ? { selected: true } : {}), ...(disabled ? { disabled: true } : {}) };
  return (
    <ItemContext.Provider value={{ c, state, selected }}>
      {renderPart('option', c.root, {
        className, 'data-ui': 'option', 'data-icon-size': iconSize, value, disabled, render,
        children: <ItemParts c={c} {...{ leading, prefix, suffix, trailing }}>{children}</ItemParts>,
      }, state)}
    </ItemContext.Provider>
  );
}
/** The preset name of Select.Item. */
export const SelectOption = SelectItem;

const isInSelect = isPartOf([SelectTrigger, SelectPopup]);
const isItemHolder = isPartOf([SelectPopup, SelectList]);

/** The first item's value (undefined without items). Items sit in Popup › List, or directly in the Root. */
function findFirst(children: ReactNode): string | undefined {
  for (const n of Children.toArray(children)) {
    if (!isValidElement<{ value?: string; children?: ReactNode }>(n)) continue;
    if (isItemHolder(n)) { const v = findFirst(n.props.children); if (v !== undefined) return v; continue; }
    if (n.type === SelectItem) return n.props.value ?? '';
  }
  return undefined;
}
/** What a select without a value shows: its first option's value. */
const firstValue = (children: ReactNode) => findFirst(children) ?? '';

/** Preset: Select.Root with a Label, the Trigger (Value and Icon, adornments), Popup › List of items, Description and Error. */
export function Select({ label, description, error, leading, prefix, suffix, children, ...rest }: SelectProps) {
  return (
    <SelectRoot error={error} {...rest}>
      {label && <SelectLabel>{label}</SelectLabel>}
      <SelectTrigger {...{ leading, prefix, suffix }}><SelectValue /><SelectIcon /></SelectTrigger>
      <SelectPopup><SelectList>{children}</SelectList></SelectPopup>
      {description && <SelectDescription>{description}</SelectDescription>}
      {error && <SelectError>{error}</SelectError>}
    </SelectRoot>
  );
}
Select.Root = SelectRoot;
Select.Label = SelectLabel;
Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Icon = SelectIcon;
Select.Popup = SelectPopup;
Select.List = SelectList;
Select.Item = SelectItem;
Select.ItemText = ItemText;
Select.ItemIndicator = ItemIndicator;
Select.Description = SelectDescription;
Select.Error = SelectError;

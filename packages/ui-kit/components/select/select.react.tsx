/// <reference path="../jsx.d.ts" />
// React <Select> and <SelectOption>: a native <select> with customizable-select styling (appearance:
// base-select, Chromium 135+) and the web component's anatomy: label, trigger (the select's <button>:
// leading, prefix, value = <selectedcontent>, suffix, icon = chevron), popup (::picker(select)) and rich
// <option>s with construction-pattern parts. The select owns value, keys, typeahead, the popup and
// the form value; browsers without base-select show the platform select.
// The host carries the field state as data-* (state.react.ts), like ui-select's host. The open state
// and the highlighted option stay native (select:open, the options' :checked and :focus): the
// browser owns the picker and reports neither to script.
import { Children, isValidElement, useEffect, useId, useRef, type ReactElement, type ReactNode, type SelectHTMLAttributes } from 'react';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { eventDetails, fieldAttrs, toReactProps, type ChangeDetails, type ChangeReason } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { cx } from '../../styled-system/css/cx.js';
import { select as selectRecipe, option } from '../../styled-system/recipes/index.js';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix'> {
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
  /** <SelectOption> children. */
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

/** select:open, false where the browser does not know the pseudo-class. */
const isOpen = (el: HTMLSelectElement) => { try { return el.matches(':open'); } catch { return false; } };
const showPicker = (el: HTMLSelectElement) => { try { el.showPicker?.(); } catch { /* needs user activation */ } };

/**
 * Report the native picker's open state through onOpenChange: the browser owns the picker and fires
 * no event for it, so the state is reread after each interaction that can open or close it.
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
    const onPointer = (e: Event) => check(s.contains(e.target as Node) ? (was.current ? 'item-press' : 'trigger-press') : 'outside-press', e);
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

export function Select({ label, hideLabel, description, error, leading, prefix, suffix, gap, size, className, style, id, required, disabled, children, onInvalid, onChange, onValueChange, open, defaultOpen, onOpenChange, ...select }: SelectProps) {
  const auto = useId();
  const native = useRef<HTMLSelectElement>(null);
  useOpenState(native, onOpenChange, open, defaultOpen);
  const a = fieldAttrs({ id: id ?? auto, hasLabel: !!label, hasDescription: !!description, error, required, disabled, native: true });
  const f = useFieldState<HTMLDivElement>({
    disabled, required, error: !!error,
    filled: select.value !== undefined ? String(select.value) !== '' : undefined,
    // Without a value the select shows its first option; filled follows that option's value.
    defaultFilled: String(select.value ?? select.defaultValue ?? firstValue(children)) !== '',
  });
  const c = selectRecipe();
  return (
    <div ref={f.ref} data-ui="select" data-size={size} data-hide-label={hideLabel || undefined} {...f.attrs} {...f.handlers} className={cx(c.root, className)} style={style} {...(gap !== undefined ? { gap: String(gap) } : {})}>
      {label && <label data-part="label" className={c.label} {...toReactProps(a.label)}>{label}</label>}
      <select ref={native} {...toReactProps(a.control)} required={required} disabled={disabled} {...select}
        onChange={(e) => { onValueChange?.(e.target.value, eventDetails('item-press', e.nativeEvent)); onChange?.(e); }}
        onInvalid={(e) => { f.controlProps.onInvalid(); onInvalid?.(e); }}>
        <button data-part="trigger" type="button" className={c.trigger}>
          {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
          {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
          <selectedcontent data-part="value" className={c.value} />
          {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
          <span data-part="icon" aria-hidden="true" className={c.icon}><i name="caret-down" /></span>
        </button>
        {children}
      </select>
      {description && <span data-part="description" className={c.description} {...toReactProps(a.description)}>{description}</span>}
      {error && <span data-part="error" className={c.error} {...toReactProps(a.error)}>{error}</span>}
    </div>
  );
}

/** The first <SelectOption>'s value: what a select without a value shows. */
function firstValue(children: ReactNode): string {
  const first = Children.toArray(children).find(isValidElement) as ReactElement<{ value?: string }> | undefined;
  return first?.props.value ?? '';
}

export interface SelectOptionProps extends PartProps {
  value: string;
  disabled?: boolean;
  iconSize?: IconSize;
  children?: ReactNode;
}

export function SelectOption({ value, disabled, iconSize, leading, prefix, suffix, trailing, children }: SelectOptionProps) {
  const c = option();
  return (
    <option className={c.root} data-ui="option" data-icon-size={iconSize} value={value} disabled={disabled}>
      <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>
    </option>
  );
}

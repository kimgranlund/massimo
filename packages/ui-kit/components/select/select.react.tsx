/// <reference path="../jsx.d.ts" />
// React <Select> and <SelectOption>: a native <select> with customizable-select styling (appearance:
// base-select, Chromium 135+) and the web component's anatomy: label, trigger (the select's <button>:
// leading, prefix, value = <selectedcontent>, suffix, chevron), popup (::picker(select)) and rich
// <option>s with construction-pattern parts. The select owns value, keys, typeahead, the popup and
// the form value; browsers without base-select show the platform select.
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { fieldAttrs, toReactProps } from '../../dom/index.ts';
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
}

export function Select({ label, hideLabel, description, error, leading, prefix, suffix, gap, size, className, style, id, required, disabled, children, ...select }: SelectProps) {
  const auto = useId();
  const a = fieldAttrs({ id: id ?? auto, hasLabel: !!label, hasDescription: !!description, error, required, disabled, native: true });
  const c = selectRecipe();
  return (
    <div data-ui="select" data-size={size} data-hide-label={hideLabel || undefined} data-invalid={error ? true : undefined} className={cx(c.root, className)} style={style} {...(gap !== undefined ? { gap: String(gap) } : {})}>
      {label && <label data-part="label" className={c.label} {...toReactProps(a.label)}>{label}</label>}
      <select {...toReactProps(a.control)} required={required} disabled={disabled} {...select}>
        <button data-part="trigger" type="button" className={c.trigger}>
          {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
          {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
          <selectedcontent data-part="contents" className={c.contents} />
          {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
          <span data-part="trailing" aria-hidden="true" className={c.trailing}><i name="caret-down" /></span>
        </button>
        {children}
      </select>
      {description && <span data-part="description" className={c.description} {...toReactProps(a.description)}>{description}</span>}
      {error && <span data-part="error" className={c.error} {...toReactProps(a.error)}>{error}</span>}
    </div>
  );
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

// React <Swatch> and <Palette>: native elements with data-ui hosts. A swatch is a <span role="img">;
// a selectable palette (name or selectable) is a radio group whose swatches are <label>s around
// native radios, so selection, arrow keys and the form value are the browser's. The color reaches
// CSS as --ui-swatch-color (a continuous value set as a custom property).
import { Children, cloneElement, isValidElement, useId, useState, type ChangeEvent, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { isTranslucent, validColor } from './color.ts';
import { cx } from '../../styled-system/css/cx.js';
import { swatch, palette } from '../../styled-system/recipes/index.js';

export interface SwatchProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  color?: string;
  label?: string;
  size?: number;
}

const swatchState = (color = '') => {
  const ok = validColor(color);
  return { ok, attrs: { 'data-invalid': (!!color && !ok) || undefined, 'data-alpha': (!ok || isTranslucent(color)) || undefined } };
};

export function Swatch({ color = '', label, size, style, className, ...rest }: SwatchProps) {
  const { ok, attrs } = swatchState(color);
  return (
    <span {...rest} className={cx(swatch().root, className)} data-ui="swatch" data-size={size} role="img" aria-label={label || color || undefined} {...attrs}
      style={{ ...style, ...(ok ? { '--ui-swatch-color': color } : {}) } as CSSProperties} />
  );
}

export interface PaletteProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Form field name; also makes the palette selectable. */
  name?: string;
  selectable?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  size?: number;
  /** <Swatch> children. */
  children?: ReactNode;
}

export function Palette({ name, selectable, value, defaultValue = '', onValueChange, label, orientation, disabled, required, invalid, size, children, className, ...rest }: PaletteProps) {
  const auto = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const isSelectable = selectable || !!name;
  const swatches = Children.toArray(children).filter(isValidElement) as ReactElement<SwatchProps>[];
  return (
    <div {...rest} className={cx(palette({ selectable: isSelectable, orientation: orientation === 'vertical' ? 'vertical' : 'horizontal' }).root, className)} data-ui="palette" data-size={size} data-selectable={isSelectable || undefined} data-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      data-disabled={disabled || undefined} data-invalid={invalid || undefined}
      role={isSelectable ? 'radiogroup' : 'group'} aria-label={label || undefined} aria-orientation={isSelectable ? orientation ?? 'horizontal' : undefined}>
      {isSelectable
        ? swatches.map((s, i) => {
          const color = s.props.color ?? '';
          const { ok, attrs } = swatchState(color);
          return (
            <label key={s.key ?? i} className={swatch().root} data-ui="swatch" {...attrs} style={ok ? ({ '--ui-swatch-color': color } as CSSProperties) : undefined}>
              <input type="radio" name={name ?? auto} value={color} aria-label={s.props.label || color} checked={current === color} disabled={disabled} required={required}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { if (value === undefined) setInner(e.target.value); onValueChange?.(e.target.value); }} />
            </label>
          );
        })
        : swatches.map((s, i) => cloneElement(s, { key: s.key ?? i }))}
    </div>
  );
}

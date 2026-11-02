// React <Swatch> and <Palette>: native elements with data-ui hosts. A swatch is a <span role="img">;
// a selectable palette (name or selectable) is a radio group whose swatches are <label>s around
// native radios, so selection, arrow keys and the form value are the browser's. The color reaches
// CSS as --ui-swatch-color (a continuous value set as a custom property). The host carries the field
// state and data-orientation, each swatch data-selected and data-highlighted (its radio has focus),
// as on ui-palette.
import { Children, cloneElement, isValidElement, useId, useRef, useState, type ChangeEvent, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { isTranslucent, validColor } from './color.ts';
import { eventDetails, type ChangeDetails, type ChangeReason } from '../../dom/events.ts';
import { useFieldState } from '../state.react.ts';
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
  /** A swatch was chosen (Base UI onValueChange): reason 'item-press' (pointer) or 'keyboard'. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
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
  const [focus, setFocus] = useState(-1);
  // The native radios report no cause: the last pointer or key on the palette names it.
  const via = useRef<ChangeReason>('item-press');
  const current = value ?? inner;
  const isSelectable = selectable || !!name;
  const orient = orientation === 'vertical' ? 'vertical' : 'horizontal';
  const swatches = Children.toArray(children).filter(isValidElement) as ReactElement<SwatchProps>[];
  const f = useFieldState<HTMLDivElement>({ disabled, required, error: invalid, value: isSelectable ? current : '', missing: isSelectable && !!required && !current });
  return (
    <div {...rest} ref={f.ref} className={cx(palette({ selectable: isSelectable, orientation: orient }).root, className)} data-ui="palette" data-size={size} data-selectable={isSelectable || undefined} data-orientation={orient}
      {...(isSelectable ? { ...f.attrs, ...f.handlers } : { 'data-disabled': f.attrs['data-disabled'], 'data-required': f.attrs['data-required'], 'data-invalid': invalid ? '' : undefined })}
      onPointerDownCapture={() => { via.current = 'item-press'; }} onKeyDownCapture={() => { via.current = 'keyboard'; }}
      role={isSelectable ? 'radiogroup' : 'group'} aria-label={label || undefined} aria-orientation={isSelectable ? orientation ?? 'horizontal' : undefined}>
      {isSelectable
        ? swatches.map((s, i) => {
          const color = s.props.color ?? '';
          const { ok, attrs } = swatchState(color);
          return (
            <label key={s.key ?? i} className={swatch().root} data-ui="swatch" {...attrs} data-selected={current === color ? '' : undefined} data-highlighted={focus === i ? '' : undefined}
              style={ok ? ({ '--ui-swatch-color': color } as CSSProperties) : undefined}>
              <input type="radio" name={name ?? auto} value={color} aria-label={s.props.label || color} checked={current === color} disabled={disabled} required={required}
                onFocus={() => setFocus(i)} onBlur={() => setFocus(-1)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { if (value === undefined) setInner(e.target.value); onValueChange?.(e.target.value, eventDetails(via.current, e.nativeEvent)); }} />
            </label>
          );
        })
        : swatches.map((s, i) => cloneElement(s, { key: s.key ?? i }))}
    </div>
  );
}

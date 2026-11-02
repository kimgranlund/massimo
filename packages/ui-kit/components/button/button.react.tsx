// React <Button>: a native <button> with the same leading / prefix / contents / suffix / trailing anatomy,
// headless state and slot recipe (button.recipe.ts) as <ui-button>.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts } from '../parts.react.tsx';
import { cx } from '../../styled-system/css/cx.js';
import { button } from '../../styled-system/recipes/button.js';

// `prefix` is an RDFa attribute in React's types; here it is the text adornment part.
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  loading?: boolean;
  /** primary: the primary solid with contrast text; neutral (default) the muted fill. */
  variant?: 'neutral' | 'primary';
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  iconSize?: IconSize;
  /** Unit u in px (2..4.5); control height is 8u. */
  size?: number;
}

export function Button({ loading, disabled, onClick, type = 'button', variant = 'neutral', leading, prefix, suffix, trailing, iconSize, size, children, className, ...rest }: ButtonProps) {
  const state = { disabled, loading, native: true };
  const c = button({ variant });
  return (
    <button
      type={type}
      className={cx(c.root, className)}
      data-ui="button"
      data-size={size}
      data-icon-size={iconSize}
      {...toReactProps(buttonAttrs(state))}
      {...rest}
      onClick={(e) => {
        // aria-disabled instead of `disabled` keeps it focusable, so block activation here.
        if (isInactive(state)) { e.preventDefault(); return; }
        onClick?.(e);
      }}
    >
      <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>
    </button>
  );
}

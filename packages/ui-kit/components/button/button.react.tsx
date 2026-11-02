// React <Button>: a native <button> with the same leading / prefix / contents / suffix / trailing anatomy,
// headless state and default styles as <ui-button>.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';

// `prefix` is an RDFa attribute in React's types; here it is the text adornment part.
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  loading?: boolean;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  iconSize?: IconSize;
  /** Unit u in px (2..4.5); control height is 8u. */
  size?: number;
}

export function Button({ loading, disabled, onClick, type = 'button', leading, prefix, suffix, trailing, iconSize, size, children, ...rest }: ButtonProps) {
  const state = { disabled, loading, native: true };
  return (
    <button
      type={type}
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
      {leading != null && <span data-part="leading">{leading}</span>}
      {prefix != null && <span data-part="prefix">{prefix}</span>}
      {children != null && children !== '' && <span data-part="contents">{children}</span>}
      {suffix != null && <span data-part="suffix">{suffix}</span>}
      {trailing != null && <span data-part="trailing">{trailing}</span>}
    </button>
  );
}

// React <Button>: a native <button> with the same leading / contents / trailing anatomy,
// headless state and default styles as <ui-button>.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  iconSize?: IconSize;
  /** Unit u in px (2..4.5); control height is 8u. */
  size?: number;
}

export function Button({ loading, disabled, onClick, type = 'button', leading, trailing, iconSize, size, children, ...rest }: ButtonProps) {
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
      {children != null && children !== '' && <span data-part="contents">{children}</span>}
      {trailing != null && <span data-part="trailing">{trailing}</span>}
    </button>
  );
}

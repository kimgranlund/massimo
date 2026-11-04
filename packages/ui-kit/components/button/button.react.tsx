// React <Button>: a native <button> with the same leading / prefix / contents / suffix / trailing anatomy,
// headless state and slot recipe (button.recipe.ts) as <ui-button>. One part (Base UI Button): it
// takes `render` and a className function of its state (compound.react.tsx).
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { buttonAttrs, isInactive } from '../../dom/button.ts';
import { toReactProps } from '../../dom/attrs.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts } from '../parts.react.tsx';
import { button } from '../../styled-system/recipes/button.js';

// `prefix` is an RDFa attribute in React's types; here it is the text adornment part.
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix' | 'className'>, PartBase {
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

export function Button({ loading, disabled, onClick, type = 'button', variant = 'neutral', leading, prefix, suffix, trailing, iconSize, size, children, className, render, ...rest }: ButtonProps) {
  const state = { disabled, loading, native: true };
  const c = button({ variant });
  const attrs = toReactProps(buttonAttrs(state));
  return renderPart('button', c.root, {
    type, className, 'data-ui': 'button', 'data-size': size, 'data-icon-size': iconSize, ...attrs, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // aria-disabled instead of `disabled` keeps it focusable, so block activation here.
      if (isInactive(state)) { e.preventDefault(); return; }
      onClick?.(e);
    },
    children: <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    render,
  }, { ...stateOf(attrs), variant });
}

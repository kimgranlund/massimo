// React <ButtonLink>: a real link with the look and geometry of Button, in the same host and anchor
// shape as <ui-button-link>. For a router's link, use Button with its render prop.
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { linkAttrs } from '../../dom/button-link.ts';
import { toReactProps } from '../../dom/attrs.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts } from '../parts.react.tsx';
import { button } from '../../styled-system/recipes/button.js';
import { buttonLink } from '../../styled-system/recipes/button-link.js';

export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
  href: string;
  /** primary: the primary solid; neutral (default) the muted fill; ghost no resting fill. */
  variant?: 'neutral' | 'primary' | 'ghost';
  /** Drops the href, so it can't be followed. */
  disabled?: boolean;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  iconSize?: IconSize;
  /** Unit u in px. */
  size?: number;
}

export function ButtonLink({ href, target, rel, variant = 'neutral', disabled, leading, prefix, suffix, trailing, iconSize, size, className, children, onClick, ...rest }: ButtonLinkProps) {
  const c = button({ variant }) as unknown as Record<string, string>, b = buttonLink();
  return (
    <span data-ui="button-link" data-size={size} data-icon-size={iconSize} className={b.root}>
      <a {...rest} {...toReactProps(linkAttrs({ href, target, rel, disabled }))} data-part="link" data-ui="button" className={[c.root, b.link, className].filter(Boolean).join(' ')}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => { if (disabled) { e.preventDefault(); return; } onClick?.(e); }}>
        <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>
      </a>
    </span>
  );
}

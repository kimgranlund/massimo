/// <reference path="../jsx.d.ts" />
// React <Badge>, <Tag>, <Chip>: native elements with the web components' anatomy, styled by the same
// slot recipes (btg.recipe.ts); data-ui names the host.
// Badge and Tag are <span>s; Chip is a native <button> (aria-pressed when selectable). A removable
// chip's x is a click target inside it, not a nested button; Delete or Backspace also remove it.
import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { buttonAttrs, eventDetails, isInactive, toReactProps, type ChangeDetails } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { cx } from '../../styled-system/css/cx.js';
import { badge, tag, chip } from '../../styled-system/recipes/index.js';

interface Common extends PartProps { iconSize?: IconSize; size?: number; children?: ReactNode }

export function Badge({ leading, prefix, suffix, trailing, iconSize, size, children, className, ...rest }: Common & Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'>) {
  const c = badge();
  return <span {...rest} className={cx(c.root, className)} data-ui="badge" data-size={size} data-icon-size={iconSize}><Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts></span>;
}

export function Tag({ leading, prefix, suffix, trailing, iconSize, size, children, className, ...rest }: Common & Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'>) {
  const c = tag();
  return <span {...rest} className={cx(c.root, className)} data-ui="tag" data-size={size} data-icon-size={iconSize}><Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts></span>;
}

export interface ChipProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix' | 'onSelect'> {
  /** Toggle button (aria-pressed). */
  selectable?: boolean;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean, details: ChangeDetails) => void;
  /** Adds the trailing x and the Delete / Backspace gesture; calls onRemove. */
  removable?: boolean;
  onRemove?: () => void;
}

export function Chip({ leading, prefix, suffix, trailing, iconSize, size, children, selectable, selected, defaultSelected = false, onSelectedChange, removable, onRemove, disabled, onClick, onKeyDown, className, ...rest }: ChipProps) {
  const c = chip({ selectable: !!selectable });
  const [inner, setInner] = useState(defaultSelected);
  const pressed = selectable ? (selected ?? inner) : undefined;
  const state = { disabled, pressed, native: true };
  const toggle = (event: Event) => { const next = !pressed; if (selected === undefined) setInner(next); onSelectedChange?.(next, eventDetails('none', event)); };
  return (
    <button
      type="button" {...rest} className={cx(c.root, className)} data-ui="chip" data-size={size} data-icon-size={iconSize} data-selectable={selectable || undefined}
      {...toReactProps(buttonAttrs(state))}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (isInactive(state)) { e.preventDefault(); return; }
        if ((e.target as Element).closest?.('[data-remove]')) { onRemove?.(); return; }
        if (selectable) toggle(e.nativeEvent);
        onClick?.(e);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (removable && !isInactive(state) && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); onRemove?.(); return; }
        onKeyDown?.(e);
      }}
      aria-keyshortcuts={removable ? 'Delete' : undefined}
    >
      <Parts classes={c} {...{ leading, prefix, suffix }} trailing={removable ? <>{trailing}<i name="x" data-remove="" className={c.remove} /></> : trailing}>{children}</Parts>
    </button>
  );
}

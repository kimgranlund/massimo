// React <Badge>, <Tag>, <Chip>: native elements with the web components' anatomy and data-ui hosts.
// Badge and Tag are <span>s; Chip is a native <button> (aria-pressed when selectable). A removable
// chip's x is a click target inside it, not a nested button; Delete or Backspace also remove it.
import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts, type PartProps } from '../parts.react.tsx';

interface Common extends PartProps { iconSize?: IconSize; size?: number; children?: ReactNode }

export function Badge({ leading, prefix, suffix, trailing, iconSize, size, children, ...rest }: Common & Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'>) {
  return <span {...rest} data-ui="badge" data-size={size} data-icon-size={iconSize}><Parts {...{ leading, prefix, suffix, trailing }}>{children}</Parts></span>;
}

export function Tag({ leading, prefix, suffix, trailing, iconSize, size, children, ...rest }: Common & Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'>) {
  return <span {...rest} data-ui="tag" data-size={size} data-icon-size={iconSize}><Parts {...{ leading, prefix, suffix, trailing }}>{children}</Parts></span>;
}

export interface ChipProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix' | 'onSelect'> {
  /** Toggle button (aria-pressed). */
  selectable?: boolean;
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Adds the trailing x and the Delete / Backspace gesture; calls onRemove. */
  removable?: boolean;
  onRemove?: () => void;
}

export function Chip({ leading, prefix, suffix, trailing, iconSize, size, children, selectable, selected, defaultSelected = false, onSelectedChange, removable, onRemove, disabled, onClick, onKeyDown, ...rest }: ChipProps) {
  const [inner, setInner] = useState(defaultSelected);
  const pressed = selectable ? (selected ?? inner) : undefined;
  const state = { disabled, pressed, native: true };
  const toggle = () => { const next = !pressed; if (selected === undefined) setInner(next); onSelectedChange?.(next); };
  return (
    <button
      type="button" {...rest} data-ui="chip" data-size={size} data-icon-size={iconSize} data-selectable={selectable || undefined}
      {...toReactProps(buttonAttrs(state))}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (isInactive(state)) { e.preventDefault(); return; }
        if ((e.target as Element).closest?.('[data-remove]')) { onRemove?.(); return; }
        if (selectable) toggle();
        onClick?.(e);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (removable && !isInactive(state) && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); onRemove?.(); return; }
        onKeyDown?.(e);
      }}
      aria-keyshortcuts={removable ? 'Delete' : undefined}
    >
      <Parts {...{ leading, prefix, suffix }} trailing={removable ? <>{trailing}<i name="x" data-remove="" /></> : trailing}>{children}</Parts>
    </button>
  );
}

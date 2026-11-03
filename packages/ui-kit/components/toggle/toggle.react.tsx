// React <Toggle>: a native <button aria-pressed> with the construction pattern, headless state and
// slot recipe (toggle.recipe.ts) of <ui-toggle>. One part (Base UI Toggle): it takes `render` and a
// className function of its state ({ pressed, disabled }). pressed / defaultPressed /
// onPressedChange(pressed, { reason: 'none', event }); the native onClick still fires.
// Inside a ToggleGroup (toggle-group.react.tsx, through ToggleGroupContext) a toggle with a `value`
// takes its pressed state from the group, reports presses to it and is disabled with it; the group
// sets the roving tab index on the buttons.
import { createContext, useContext, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { buttonAttrs, eventDetails, isInactive, toReactProps, type ChangeDetails } from '../../dom/index.ts';
import type { IconSize } from '../../tokens/geometry/resolve.ts';
import { Parts } from '../parts.react.tsx';
import { toggle } from '../../styled-system/recipes/toggle.js';

/** What a ToggleGroup shares with its toggles: the pressed values, the press handler and disabled. */
export interface ToggleGroupContextValue { values: string[]; press: (value: string, pressed: boolean, event: Event) => void; disabled: boolean }
export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix' | 'className' | 'value'>, PartBase {
  /** Controlled pressed state (Base UI pressed). */
  pressed?: boolean;
  /** Uncontrolled initial pressed state (Base UI defaultPressed). */
  defaultPressed?: boolean;
  /** Every user toggle (Base UI onPressedChange): reason 'none'. */
  onPressedChange?: (pressed: boolean, details: ChangeDetails) => void;
  /** Identifies the toggle inside a toggle group (Base UI value). */
  value?: string;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  iconSize?: IconSize;
  /** Unit u in px (2..12); control height is 8u. */
  size?: number;
}

export function Toggle({ pressed, defaultPressed = false, onPressedChange, value, disabled, onClick, leading, prefix, suffix, trailing, iconSize, size, children, className, render, ...rest }: ToggleProps) {
  const [inner, setInner] = useState(defaultPressed);
  const group = useContext(ToggleGroupContext);
  const grouped = group && value !== undefined ? group : null;
  const on = grouped ? grouped.values.includes(value!) : pressed ?? inner;
  if (grouped?.disabled) disabled = true;
  const state = { disabled, pressed: on, native: true };
  const c = toggle();
  const attrs = toReactProps(buttonAttrs(state));
  return renderPart('button', c.root, {
    type: 'button', 'data-ui': 'toggle', 'data-size': size, 'data-icon-size': iconSize, ...attrs, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // aria-disabled instead of `disabled` keeps it focusable, so block activation here.
      if (isInactive(state)) { e.preventDefault(); return; }
      const next = !on;
      if (grouped) grouped.press(value!, next, e.nativeEvent);
      else if (pressed === undefined) setInner(next);
      onPressedChange?.(next, eventDetails('none', e.nativeEvent));
      onClick?.(e);
    },
    children: <Parts classes={c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    className, render,
  }, { ...stateOf(attrs), pressed: !!on, disabled: !!disabled });
}

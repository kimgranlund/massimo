// React <ToggleGroup>: the anatomy, classes and data-* of <ui-toggle-group> (Base UI ToggleGroup).
// One part, the group (role=group, data-ui=toggle-group); its toggles are <Toggle value="…">
// children, which read the pressed values from ToggleGroupContext (toggle.react.tsx) and report
// presses to it. value / defaultValue / onValueChange(value[], { reason: 'none', event }),
// multiple, disabled, orientation. Roving focus like the web component: one tab stop (the last
// focused toggle, else the first pressed, else the first enabled), set on the buttons after each
// render; arrow keys (Left / Right mirrored in RTL; Up / Down when vertical), Home and End move
// focus among enabled toggles, wrapping.
import { useLayoutEffect, useRef, useState, type FocusEvent, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { ToggleGroupContext } from '../toggle/toggle.react.tsx';
import { toggleGroup } from '../../styled-system/recipes/toggle-group.js';

const on = (v: unknown) => (v ? '' : undefined);
const TOGGLES = ':scope > [data-ui=toggle]';

export interface ToggleGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'defaultValue'>, PartBase {
  /** Controlled pressed toggle values. */
  value?: string[];
  /** Pressed toggle values at first render (uncontrolled). */
  defaultValue?: string[];
  /** Called when a press changes the pressed toggles, with Base UI's details ({ reason: 'none', event }). */
  onValueChange?: (value: string[], details: ChangeDetails) => void;
  /** Several toggles may be pressed at once (default: pressing one releases the others). */
  multiple?: boolean;
  /** Every toggle ignores presses. */
  disabled?: boolean;
  /** horizontal (default): Left / Right move focus; vertical: Up / Down. */
  orientation?: 'horizontal' | 'vertical';
  /** Unit u in px; the row is 8u with 7u toggles. */
  size?: number;
  /** inset="none": attached. Children touch the edge and each other with no curvature (outer corners follow the container); thumbs fill the track. */
  inset?: 'none';
  children?: ReactNode;
}

/** The toggle group: Toggle children with values share its pressed state. */
export function ToggleGroup({ value, defaultValue = [], onValueChange, multiple = false, disabled = false, orientation = 'horizontal', size, inset, children, onKeyDown, onFocus, className, render, ...rest }: ToggleGroupProps) {
  const [own, setOwn] = useState<string[]>(() => (multiple ? defaultValue : defaultValue.slice(0, 1)));
  const values = value ?? own;
  const root = useRef<HTMLDivElement>(null);
  const stop = useRef<Element | null>(null);
  const press = (v: string, pressed: boolean, event: Event) => {
    const rest = values.filter((x) => x !== v);
    const next = pressed ? (multiple ? [...rest, v] : [v]) : rest;
    onValueChange?.(next, eventDetails('none', event));
    if (value === undefined) setOwn(next);
  };
  const enabled = () => [...(root.current?.querySelectorAll<HTMLElement>(TOGGLES) ?? [])].filter((b) => !b.hasAttribute('data-disabled'));
  /** Roving tab index on the buttons: the kept stop, else the first pressed, else the first enabled. */
  const rove = () => {
    const all = [...(root.current?.querySelectorAll<HTMLElement>(TOGGLES) ?? [])], list = enabled();
    const kept = stop.current && list.includes(stop.current as HTMLElement) ? stop.current : null;
    const to = kept ?? list.find((b) => b.getAttribute('aria-pressed') === 'true') ?? list[0];
    for (const b of all) b.tabIndex = b === to ? 0 : -1;
  };
  useLayoutEffect(rove);
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const t = (e.target as Element).closest('[data-ui=toggle]');
    if (!t || t.parentElement !== e.currentTarget) return;
    const vertical = orientation === 'vertical', rtl = !vertical && getComputedStyle(e.currentTarget).direction === 'rtl';
    const step = (vertical ? { ArrowDown: 1, ArrowUp: -1 } : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } as Record<string, number>)[e.key as 'ArrowDown'];
    const list = enabled(), at = list.indexOf(t as HTMLElement);
    const to = step ? (at + step + list.length) % list.length : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : -1;
    if (to < 0 || !list.length) return;
    e.preventDefault();
    list[to].focus();
  };
  const focus = (e: FocusEvent<HTMLDivElement>) => {
    onFocus?.(e);
    const t = (e.target as Element).closest('[data-ui=toggle]');
    if (t && t.parentElement === e.currentTarget) { stop.current = t; rove(); }
  };
  const c = toggleGroup();
  const attrs = { 'data-orientation': orientation, 'data-disabled': on(disabled), 'data-multiple': on(multiple) };
  return (
    <ToggleGroupContext.Provider value={{ values, press, disabled }}>
      {renderPart('div', c.root, { ref: root, role: 'group', ...rest, 'data-ui': 'toggle-group', 'data-size': size, 'data-inset': inset, ...attrs, onKeyDown: keys, onFocus: focus, className, render, children }, stateOf(attrs))}
    </ToggleGroupContext.Provider>
  );
}

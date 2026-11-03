// React <CheckboxGroup>: a <div role="group" data-ui="checkbox-group"> around Checkbox children, the
// anatomy and classes of <ui-checkbox-group>. The group owns the value array (value / defaultValue,
// onValueChange(value, details) with reason 'none', as Base UI); its checkboxes are native
// checkboxes that take the group's name (each checked one submits name=value), checked state and
// disabled from context. A `parent` Checkbox is checked when every value in allValues (or every
// member that registered) is, mixed when some are, and checks or clears them all. The host carries
// the field state from the value (state.react.ts) and data-orientation. Like Base UI, CheckboxGroup
// is a single part; `render` and a state `className` apply to it.
import { useCallback, useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useFieldState } from '../state.react.ts';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { CheckboxGroupCtx } from '../choice/group.react.ts';
import { checkboxGroup } from '../../styled-system/recipes/index.js';

export interface CheckboxGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'>, PartBase {
  /** Form name of the checkboxes: each checked one submits name=value. */
  name?: string;
  /** The checked values (controlled). */
  value?: string[];
  /** The first values when uncontrolled, and the reset value. */
  defaultValue?: string[];
  /** The user toggled a checkbox (Base UI onValueChange; reason 'none'). */
  onValueChange?: (value: string[], details: ChangeDetails) => void;
  /** Every value the parent checkbox sets; default: the member checkboxes' values (they register on mount). */
  allValues?: string[];
  disabled?: boolean;
  /** At least one value must be checked to submit (shown on the group). */
  required?: boolean;
  /** vertical: one checkbox per row; horizontal: a wrapping row. */
  orientation?: 'vertical' | 'horizontal';
  /** list: choice rows; card: each choice is a card surface holding any content (plan pickers, rich choices). */
  variant?: 'list' | 'card';
  /** Accessible name when no Field label or Fieldset legend names the group (aria-label). */
  label?: string;
  /** Unit u in px for the group and its checkboxes. */
  size?: number;
  /** Checkbox children. */
  children?: ReactNode;
}

/** CheckboxGroup: the group host; its Checkbox children take their name and checked state from it. */
export function CheckboxGroup({ name, value, defaultValue, onValueChange, allValues, disabled = false, required = false, orientation = 'vertical', variant = 'list', label, size, className, render, children, ...rest }: CheckboxGroupProps) {
  const [own, setOwn] = useState<string[]>(defaultValue ?? []);
  const [members, setMembers] = useState<string[]>([]);
  const current = value ?? own;
  const f = useFieldState<HTMLDivElement>({ disabled, required, value: current.join('\n'), missing: required && !current.length });
  useEffect(() => {
    const host = f.ref.current;
    const onInvalid = () => f.controlProps.onInvalid();
    host?.addEventListener('invalid', onInvalid, true);
    const form = host?.closest('form');
    const onReset = () => setOwn(defaultValue ?? []);
    form?.addEventListener('reset', onReset);
    return () => { host?.removeEventListener('invalid', onInvalid, true); form?.removeEventListener('reset', onReset); };
  }, [f.ref, defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps (controlProps.onInvalid is stable: it rereads)
  const change = useCallback((next: string[], event: Event) => {
    if (disabled) return;
    setOwn(next);
    onValueChange?.(next, eventDetails('none', event));
  }, [disabled, onValueChange]);
  const every = allValues ?? members;
  const toggle = useCallback((v: string, checked: boolean, event: Event) => {
    change(checked ? (current.includes(v) ? current : [...current, v]) : current.filter((x) => x !== v), event);
  }, [change, current]);
  const setAll = useCallback((checked: boolean, event: Event) => change(checked ? [...every] : [], event), [change, every]);
  const register = useCallback((v: string) => {
    setMembers((m) => (m.includes(v) ? m : [...m, v]));
    return () => setMembers((m) => m.filter((x) => x !== v));
  }, []);
  const c = checkboxGroup({ orientation, variant });
  const attrs: Record<string, unknown> = { ...f.attrs, 'data-orientation': orientation, 'data-variant': variant === 'card' ? 'card' : undefined };
  return (
    <CheckboxGroupCtx.Provider value={{ name, value: current, allValues: every, disabled, toggle, setAll, register }}>
      {renderPart('div', c.root, {
        ref: f.ref, role: 'group', 'data-ui': 'checkbox-group', 'data-size': size, 'aria-label': label || undefined,
        'aria-disabled': disabled || undefined, 'aria-invalid': attrs['data-invalid'] !== undefined || undefined,
        ...attrs, ...f.handlers, className, ...rest, render, children,
      }, stateOf(attrs))}
    </CheckboxGroupCtx.Provider>
  );
}

// React <RadioGroup>: a <div role="radiogroup" data-ui="radio-group"> around Radio children, the
// anatomy and classes of <ui-radio-group>. The group owns the value (value / defaultValue,
// onValueChange(value, details) with reason 'none', as Base UI); its radios are native radios
// sharing the group's name (generated when omitted), so the browser keeps arrow keys, the roving tab
// stop and the form value. The host carries the field state from the value (state.react.ts) and
// data-orientation. Like Base UI, RadioGroup is a single part (its radios are Radio.Root / Radio);
// `render` and a state `className` apply to it.
import { useCallback, useEffect, useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { useFieldState } from '../state.react.ts';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { RadioGroupCtx } from '../choice/group.react.ts';
import { radioGroup } from '../../styled-system/recipes/radio-group.js';

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'>, PartBase {
  /** Form name of the radios; generated when omitted (they still group). */
  name?: string;
  /** The checked radio's value (controlled). */
  value?: string;
  /** The first value when uncontrolled, and the reset value. */
  defaultValue?: string;
  /** The user picked a radio (Base UI onValueChange; reason 'none'). */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  disabled?: boolean;
  /** Radios can be focused but not changed. */
  readOnly?: boolean;
  /** One radio must be checked to submit. */
  required?: boolean;
  /** vertical: one radio per row; horizontal: a wrapping row. */
  orientation?: 'vertical' | 'horizontal';
  /** list: choice rows; card: each choice is a card surface holding any content (plan pickers, rich choices). */
  variant?: 'list' | 'card';
  /** Accessible name when no Field label or Fieldset legend names the group (aria-label). */
  label?: string;
  /** Unit u in px for the group and its radios. */
  size?: number;
  /** Radio children. */
  children?: ReactNode;
}

/** RadioGroup: the radiogroup host; its Radio children take their name and checked state from it. */
export function RadioGroup({ name, value, defaultValue, onValueChange, disabled = false, readOnly = false, required = false, orientation = 'vertical', variant = 'list', label, size, className, render, children, ...rest }: RadioGroupProps) {
  const auto = useId();
  const [own, setOwn] = useState(defaultValue ?? '');
  const current = value ?? own;
  const f = useFieldState<HTMLDivElement>({ disabled, readOnly, required, value: current, missing: required && !current });
  // invalid does not bubble: a blocked submit reaches the group through the capture phase.
  useEffect(() => {
    const host = f.ref.current;
    const onInvalid = () => f.controlProps.onInvalid();
    host?.addEventListener('invalid', onInvalid, true);
    // Form reset: back to the default (the radios reset natively; the group value follows).
    const form = host?.closest('form');
    const onReset = () => setOwn(defaultValue ?? '');
    form?.addEventListener('reset', onReset);
    return () => { host?.removeEventListener('invalid', onInvalid, true); form?.removeEventListener('reset', onReset); };
  }, [f.ref, defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps (controlProps.onInvalid is stable: it rereads)
  const select = useCallback((v: string, event: Event) => {
    if (disabled || readOnly) return;
    setOwn(v);
    onValueChange?.(v, eventDetails('none', event));
  }, [disabled, readOnly, onValueChange]);
  const c = radioGroup({ orientation, variant });
  const attrs: Record<string, unknown> = { ...f.attrs, 'data-orientation': orientation, 'data-variant': variant === 'card' ? 'card' : undefined };
  return (
    <RadioGroupCtx.Provider value={{ name: name ?? `${auto}radio`, value: current, disabled, readOnly, required, select }}>
      {renderPart('div', c.root, {
        ref: f.ref, role: 'radiogroup', 'data-ui': 'radio-group', 'data-size': size, 'aria-label': label || undefined,
        'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
        'aria-disabled': disabled || undefined, 'aria-required': required || undefined, 'aria-readonly': readOnly || undefined,
        'aria-invalid': attrs['data-invalid'] !== undefined || undefined,
        ...attrs, ...f.handlers, className, ...rest, render, children,
      }, stateOf(attrs))}
    </RadioGroupCtx.Provider>
  );
}

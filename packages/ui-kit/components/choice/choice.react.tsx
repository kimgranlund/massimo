/// <reference path="../jsx.d.ts" />
// React <Checkbox>, <Radio>, <Switch>: a native <input> (checkbox; radio; checkbox with role=switch)
// inside a <label data-ui="…"> host with the same anatomy as the web components:
//   label > input, [data-part=leading] > [data-part=indicator] (switch: > [data-part=thumb]), [prefix],
//   [data-part=contents], [suffix]
// The input owns state, focus, keyboard, form value and validity; the host mirrors it as the data-*
// state contract (data-checked / data-unchecked / data-indeterminate and the field state,
// state.react.ts), the same attributes the web components set, which the slot recipes key on. A radio
// rereads itself on any change in its group, so the group stays in sync.
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Parts } from '../parts.react.tsx';
import { useFieldState } from '../state.react.ts';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { cx } from '../../styled-system/css/cx.js';
import { checkbox, radio, switchRecipe } from '../../styled-system/recipes/index.js';

const RECIPES = { checkbox, radio, switch: switchRecipe };

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'prefix'>;
export interface ChoiceProps extends Native {
  /** Text adornments beside the label (construction pattern). */
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Show the invalid state now (author error); native :user-invalid shows it after interaction anyway. */
  invalid?: boolean;
  /** Checked changed by the user (Base UI onCheckedChange; reason 'none', as Base UI). The native onChange still fires. */
  onCheckedChange?: (checked: boolean, details: ChangeDetails) => void;
  /** Unit u in px for this control. */
  size?: number;
  children?: ReactNode;
}

function Choice({ kind, prefix, suffix, invalid, size, children, className, style, indeterminate, onInvalid, onChange, onCheckedChange, ...input }: ChoiceProps & { kind: 'checkbox' | 'radio' | 'switch'; indeterminate?: boolean }) {
  const f = useFieldState<HTMLLabelElement>({
    disabled: input.disabled, required: input.required, error: invalid,
    checked: input.checked, defaultChecked: input.defaultChecked, indeterminate: kind === 'checkbox' ? indeterminate : undefined,
    defaultFilled: !!(input.checked ?? input.defaultChecked),
  });
  const c = RECIPES[kind]();
  return (
    <label ref={f.ref} data-ui={kind} data-size={size} {...f.attrs} {...f.checkedAttrs} {...f.handlers} className={cx(c.root, className)} style={style}>
      <input type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} aria-invalid={invalid || undefined} {...input}
        onChange={(e) => { onCheckedChange?.(e.target.checked, eventDetails('none', e.nativeEvent)); onChange?.(e); }}
        onInvalid={(e) => { f.controlProps.onInvalid(); onInvalid?.(e); }} />
      <span data-part="leading" className={c.leading}>
        <span data-part="indicator" aria-hidden="true" className={c.indicator}>
          {kind === 'checkbox' && <><i name="check-bold" data-mark="checked" /><i name="minus-bold" data-mark="mixed" /></>}
          {kind === 'switch' && <span data-part="thumb" className={(c as Record<string, string>).thumb} />}
        </span>
      </span>
      <Parts classes={c} {...{ prefix, suffix }}>{children}</Parts>
    </label>
  );
}

export function Checkbox(props: ChoiceProps & { indeterminate?: boolean }) { return <Choice kind="checkbox" {...props} />; }
export function Radio(props: ChoiceProps) { return <Choice kind="radio" {...props} />; }
export function Switch(props: ChoiceProps) { return <Choice kind="switch" {...props} />; }

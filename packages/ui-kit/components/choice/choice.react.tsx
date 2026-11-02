/// <reference path="../jsx.d.ts" />
// React <Checkbox>, <Radio>, <Switch>: a native <input> (checkbox; radio; checkbox with role=switch)
// inside a <label data-ui="…"> host with the same anatomy as the web components:
//   label > input, [data-part=leading] > [data-part=box], [prefix], [data-part=contents], [suffix]
// The input owns state, focus, keyboard, form value and validity; the slot recipes (choice.recipe.ts)
// read it with :has(), so radios in a group stay in sync without React bookkeeping.
import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Parts } from '../parts.react.tsx';
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
  /** Unit u in px for this control. */
  size?: number;
  children?: ReactNode;
}

function Choice({ kind, prefix, suffix, invalid, size, children, className, style, indeterminate, ...input }: ChoiceProps & { kind: 'checkbox' | 'radio' | 'switch'; indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  // indeterminate is a property, not an attribute.
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  const c = RECIPES[kind]();
  return (
    <label data-ui={kind} data-size={size} data-invalid={invalid || undefined} className={cx(c.root, className)} style={style}>
      <input ref={ref} type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} aria-invalid={invalid || undefined} {...input} />
      <span data-part="leading" className={c.leading}>
        <span data-part="box" aria-hidden="true" className={c.box}>
          {kind === 'checkbox' && <><i name="check-bold" data-mark="checked" /><i name="minus-bold" data-mark="mixed" /></>}
        </span>
      </span>
      <Parts classes={c} {...{ prefix, suffix }}>{children}</Parts>
    </label>
  );
}

export function Checkbox(props: ChoiceProps & { indeterminate?: boolean }) { return <Choice kind="checkbox" {...props} />; }
export function Radio(props: ChoiceProps) { return <Choice kind="radio" {...props} />; }
export function Switch(props: ChoiceProps) { return <Choice kind="switch" {...props} />; }

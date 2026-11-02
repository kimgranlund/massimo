/// <reference path="../jsx.d.ts" />
// React <Checkbox>, <Radio>, <Switch>: a native <input> (checkbox; radio; checkbox with role=switch)
// inside a <label data-ui="…"> host with the same anatomy as the web components:
//   label > input, [data-part=leading] > [data-part=box], [prefix], [data-part=contents], [suffix]
// The input owns state, focus, keyboard, form value and validity; the twin styles read it with :has()
// (styles/native.ts), so radios in a group stay in sync without React bookkeeping.
import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react';

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
  return (
    <label data-ui={kind} data-size={size} data-invalid={invalid || undefined} className={className} style={style}>
      <input ref={ref} type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} aria-invalid={invalid || undefined} {...input} />
      <span data-part="leading">
        <span data-part="box" aria-hidden="true">
          {kind === 'checkbox' && <><i name="check" data-mark="checked" /><i name="minus" data-mark="mixed" /></>}
        </span>
      </span>
      {prefix != null && <span data-part="prefix">{prefix}</span>}
      {children != null && children !== '' && <span data-part="contents">{children}</span>}
      {suffix != null && <span data-part="suffix">{suffix}</span>}
    </label>
  );
}

export function Checkbox(props: ChoiceProps & { indeterminate?: boolean }) { return <Choice kind="checkbox" {...props} />; }
export function Radio(props: ChoiceProps) { return <Choice kind="radio" {...props} />; }
export function Switch(props: ChoiceProps) { return <Choice kind="switch" {...props} />; }

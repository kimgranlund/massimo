/// <reference path="../jsx.d.ts" />
// React <Checkbox>, <Radio>, <Switch>: a native <input> (checkbox; radio; checkbox with role=switch)
// inside a <label data-ui="…"> host with the same anatomy as the web components:
//   label > input, [data-part=leading] > [data-part=indicator] (switch: > [data-part=thumb]), [prefix],
//   [data-part=contents], [suffix]
// The input owns state, focus, keyboard, form value and validity; the host mirrors it as the data-*
// state contract (data-checked / data-unchecked / data-indeterminate and the field state,
// state.react.ts), the same attributes the web components set, which the slot recipes key on. A radio
// rereads itself on any change in its group, so the group stays in sync.
// Compound parts (Base UI): Checkbox.Root / Checkbox.Indicator, Radio.Root / Radio.Indicator,
// Switch.Root / Switch.Thumb. The Root renders the host and its native input (which cannot be a
// separate part: the label host is what makes a press on the text toggle it); the Indicator (Thumb)
// renders the leading slot around itself; every other child is the label (contents). The presets
// <Checkbox>, <Radio>, <Switch> are Root + Indicator (Thumb) + children.
// In a RadioGroup a Radio takes its name, checked state, disabled, read-only and required from the
// group (group.react.ts) and reports a press to it; the group fires onValueChange. In a
// CheckboxGroup a Checkbox takes its name, checked state and disabled from the group's value; a
// `parent` Checkbox is checked when every value is, mixed when some are, and sets them all.
import { createContext, useContext, useEffect, type InputHTMLAttributes, type ReactNode } from 'react';
import { Parts } from '../parts.react.tsx';
import { useFieldState } from '../state.react.ts';
import { renderPart, some, splitParts, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { CheckboxGroupCtx, RadioGroupCtx } from './group.react.ts';
import { checkbox, radio, switchRecipe } from '../../styled-system/recipes/index.js';

const RECIPES = { checkbox, radio, switch: switchRecipe };
type Kind = keyof typeof RECIPES;

interface ChoiceContext { kind: Kind; c: Record<string, string>; state: PartState }
const Ctx = createContext<ChoiceContext | null>(null);
const useChoice = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside its Root`);
  return v;
};

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'prefix' | 'className'>;
export interface ChoiceProps extends Native, PartBase {
  /** Text adornments beside the label (construction pattern). */
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Show the invalid state now (author error); native :user-invalid shows it after interaction anyway. */
  invalid?: boolean;
  /** Checked changed by the user (Base UI onCheckedChange; reason 'none', as Base UI). The native onChange still fires. */
  onCheckedChange?: (checked: boolean, details: ChangeDetails) => void;
  /** Unit u in px for this control. */
  size?: number;
  /** The label; a Checkbox.Indicator (Radio.Indicator, Switch.Thumb) child goes in the leading slot. */
  children?: ReactNode;
}

export interface CheckboxRootProps extends ChoiceProps {
  /** Mixed state (aria-checked="mixed", data-indeterminate). */
  indeterminate?: boolean;
  /** In a CheckboxGroup: the parent checkbox (checked when every value is, mixed when some are; it checks or clears them all). */
  parent?: boolean;
}

/** Props of an indicator part (Checkbox.Indicator, Radio.Indicator, Switch.Thumb). */
export interface ChoiceIndicatorProps extends PartBase {
  /** Replaces the default marks (checkbox: check and minus icons). */
  children?: ReactNode;
}

function ChoiceRoot({ kind, prefix, suffix, invalid, size, children, className, render, style, indeterminate: mixedProp, parent, onInvalid, onChange, onClick, onCheckedChange, ...props }: CheckboxRootProps & { kind: Kind }) {
  const radioGroup = useContext(RadioGroupCtx), checkboxGroup = useContext(CheckboxGroupCtx);
  const rg = kind === 'radio' ? radioGroup : null, cg = kind === 'checkbox' ? checkboxGroup : null;
  const own = String(props.value ?? 'on');
  // A group member registers its value, so a parent checkbox knows the set without allValues.
  const register = cg && !parent ? cg.register : null;
  useEffect(() => register?.(own), [register, own]);
  const all = cg?.allValues ?? [];
  const anyOn = !!cg && all.some((v) => cg.value.includes(v)), every = !!cg && all.length > 0 && all.every((v) => cg.value.includes(v));
  const indeterminate = cg && parent ? anyOn && !every : mixedProp;
  // In a group the group owns name, checked, disabled (and a radio group's required): the native inputs carry them.
  const input = rg ? { ...props, name: rg.name, checked: rg.value !== '' && rg.value === own, defaultChecked: undefined, disabled: props.disabled || rg.disabled, required: rg.required }
    : cg ? { ...props, name: parent ? undefined : cg.name, checked: parent ? every : cg.value.includes(own), defaultChecked: undefined, disabled: props.disabled || cg.disabled }
    : props;
  const f = useFieldState<HTMLLabelElement>({
    disabled: input.disabled, required: props.required, error: invalid,
    checked: input.checked, defaultChecked: input.defaultChecked, indeterminate: kind === 'checkbox' ? indeterminate : undefined,
    defaultFilled: !!(input.checked ?? input.defaultChecked),
  });
  const c = RECIPES[kind]() as Record<string, string>;
  const attrs = { ...f.attrs, ...f.checkedAttrs };
  const state = stateOf(attrs);
  const [lead, label] = splitParts(children, LEADING);
  return (
    <Ctx.Provider value={{ kind, c, state }}>
      {renderPart('label', c.root, {
        ref: f.ref, 'data-ui': kind, 'data-size': size, ...attrs, ...f.handlers, className, style, render,
        children: <>
          <input type={kind === 'radio' ? 'radio' : 'checkbox'} role={kind === 'switch' ? 'switch' : undefined} aria-invalid={invalid || undefined} {...input}
            onClick={(e) => { if (rg?.readOnly) e.preventDefault(); onClick?.(e); }}
            onChange={(e) => {
              if (rg) { if (!rg.readOnly) rg.select(e.target.value, e.nativeEvent); }
              else if (cg) { if (parent) cg.setAll(e.target.checked, e.nativeEvent); else cg.toggle(own, e.target.checked, e.nativeEvent); }
              else onCheckedChange?.(e.target.checked, eventDetails('none', e.nativeEvent));
              onChange?.(e);
            }}
            onInvalid={(e) => { f.controlProps.onInvalid(); onInvalid?.(e); }} />
          {lead}
          <Parts classes={c} {...{ prefix, suffix }}>{some(label)}</Parts>
        </>,
      }, state)}
    </Ctx.Provider>
  );
}

/** The leading slot and the indicator inside it; `thumb` adds the switch's thumb (the part `render` applies to). */
function Indicator({ part, render, className, children }: ChoiceIndicatorProps & { part: string }) {
  const { kind, c, state } = useChoice(part);
  const thumb = kind === 'switch';
  const marks = kind === 'checkbox' ? <><i name="check-bold" data-mark="checked" /><i name="minus-bold" data-mark="mixed" /></> : undefined;
  const own = { render, className };
  return (
    <span data-part="leading" className={c.leading}>
      {renderPart('span', c.indicator, { 'data-part': 'indicator', 'aria-hidden': 'true', ...(thumb ? {} : own), children: thumb ? renderPart('span', c.thumb, { 'data-part': 'thumb', ...own, children }, state) : children ?? marks }, state)}
    </span>
  );
}

/** Checkbox.Root: the label host with its native checkbox; children are the label. */
export function CheckboxRoot(props: CheckboxRootProps) { return <ChoiceRoot kind="checkbox" {...props} />; }
/** Checkbox.Indicator: the box with the check and minus marks, in the leading slot. */
export function CheckboxIndicator(props: ChoiceIndicatorProps) { return <Indicator part="Checkbox.Indicator" {...props} />; }
/** Radio.Root: the label host with its native radio; radios group by name. */
export function RadioRoot(props: ChoiceProps) { return <ChoiceRoot kind="radio" {...props} />; }
/** Radio.Indicator: the circle (the dot is its ::after), in the leading slot. */
export function RadioIndicator(props: ChoiceIndicatorProps) { return <Indicator part="Radio.Indicator" {...props} />; }
/** Switch.Root: the label host with its native checkbox (role=switch). */
export function SwitchRoot(props: ChoiceProps) { return <ChoiceRoot kind="switch" {...props} />; }
/** Switch.Thumb: the thumb, inside the track (the indicator) in the leading slot; render and className apply to the thumb. */
export function SwitchThumb(props: ChoiceIndicatorProps) { return <Indicator part="Switch.Thumb" {...props} />; }

const LEADING = [CheckboxIndicator, RadioIndicator, SwitchThumb];

/** Preset: Checkbox.Root with its Indicator; children are the label. */
export function Checkbox({ children, ...props }: CheckboxRootProps) { return <CheckboxRoot {...props}><CheckboxIndicator />{children}</CheckboxRoot>; }
Checkbox.Root = CheckboxRoot;
Checkbox.Indicator = CheckboxIndicator;

/** Preset: Radio.Root with its Indicator. */
export function Radio({ children, ...props }: ChoiceProps) { return <RadioRoot {...props}><RadioIndicator />{children}</RadioRoot>; }
Radio.Root = RadioRoot;
Radio.Indicator = RadioIndicator;

/** Preset: Switch.Root with its Thumb. */
export function Switch({ children, ...props }: ChoiceProps) { return <SwitchRoot {...props}><SwitchThumb />{children}</SwitchRoot>; }
Switch.Root = SwitchRoot;
Switch.Thumb = SwitchThumb;

// React <Meter>: a <div role="meter"> with the web component's anatomy and slot recipe
// (meter.recipe.ts). Compound parts (Base UI Meter): Meter.Root, Meter.Label, Meter.Value,
// Meter.Track, Meter.Indicator. The value text is formatNumber of the value with `format` or, by
// default, the ratio as a percentage (dom/display.ts meterState); Meter.Value takes it as its
// children function (formatted, value). The preset <Meter label …> is Root + Label + Value + Track
// (with its Indicator); it always renders the label part (hidden without a label), as the web
// component does.
import { Children, createContext, isValidElement, useContext, useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { meterState, toReactProps } from '../../dom/index.ts';
import type { FormatNumberOptions } from '../../tokens/typography/format.ts';
import { meter } from '../../styled-system/recipes/meter.js';

interface MeterContext { c: Record<string, string>; state: PartState; labelId: string; formatted: string; value: number }
const Ctx = createContext<MeterContext | null>(null);
const useMeter = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Meter.Root`);
  return v;
};

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>, PartBase {
  value: number;
  min?: number;
  max?: number;
  /** Visible label (Meter.Label in the preset); names the meter. */
  label?: ReactNode;
  /** Intl.NumberFormat options for the value text (Base UI format); default the ratio as a whole percentage. */
  format?: FormatNumberOptions;
  /** BCP 47 locale for the value text. */
  locale?: string;
  /** aria-valuetext instead of the formatted value. */
  valueText?: string;
  /** Unit u in px for this element. */
  size?: number;
  /** Meter.Root: the parts (Meter.Label, Meter.Value, Meter.Track with Meter.Indicator). Ignored by the preset. */
  children?: ReactNode;
}

const isEmpty = (n: ReactNode) => n === undefined || n === null || n === '' || n === false;
/** Whether a Meter.Label with content is among the children (the Root then points aria-labelledby at it). */
const hasLabel = (children: ReactNode): boolean => Children.toArray(children).some((n) => isValidElement(n) && (n.type === MeterLabel ? !isEmpty((n.props as { children?: ReactNode }).children) : hasLabel((n.props as { children?: ReactNode }).children)));

/** Meter.Root: the meter (role=meter, aria-value*), sharing the formatted value with its parts. */
export function MeterRoot({ value, min = 0, max = 100, label: _label, format, locale, valueText, size, className, render, style, children, ...rest }: MeterProps) {
  const labelId = useId();
  const m = meterState({ value, min, max, format, locale, valueText });
  const c = meter();
  const attrs = toReactProps(m.attrs);
  const state = stateOf(attrs);
  return (
    <Ctx.Provider value={{ c, state, labelId, formatted: m.formatted, value: m.value }}>
      {renderPart('div', c.root, {
        'data-ui': 'meter', 'data-size': size, ...attrs, 'aria-labelledby': hasLabel(children) ? labelId : undefined, ...rest,
        className, render, style: { ...style, '--ui-ratio': String(m.ratio) } as CSSProperties, children,
      }, state)}
    </Ctx.Provider>
  );
}

export interface MeterPartProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Meter.Label: names the meter (aria-labelledby); hidden when empty. */
export function MeterLabel({ className, render, children, ...rest }: MeterPartProps) {
  const m = useMeter('Meter.Label');
  return renderPart('span', m.c.label, { 'data-part': 'label', id: m.labelId, hidden: isEmpty(children) || undefined, ...rest, className, render, children }, m.state);
}

export interface MeterValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>, PartBase {
  /** (formatted, value) => content (Base UI Meter.Value); default the formatted value. */
  children?: ((formatted: string, value: number) => ReactNode) | null;
}

/** Meter.Value: the formatted value (aria-hidden: the root's aria-valuetext says it). */
export function MeterValue({ className, render, children, ...rest }: MeterValueProps) {
  const m = useMeter('Meter.Value');
  return renderPart('span', m.c.value, { 'data-part': 'value', ...rest, 'aria-hidden': 'true', className, render, children: children ? children(m.formatted, m.value) : m.formatted }, m.state);
}

/** Meter.Track: the 4u track; holds Meter.Indicator. */
export function MeterTrack({ className, render, ...rest }: MeterPartProps) {
  const m = useMeter('Meter.Track');
  return renderPart('span', m.c.track, { 'data-part': 'track', ...rest, className, render }, m.state);
}

/** Meter.Indicator: the filled part (to --ui-ratio). */
export function MeterIndicator({ className, render, ...rest }: MeterPartProps) {
  const m = useMeter('Meter.Indicator');
  return renderPart('span', m.c.indicator, { 'data-part': 'indicator', ...rest, className, render }, m.state);
}

/** Preset: Meter.Root with its Label, Value and Track (with Indicator). */
export function Meter({ children: _parts, label, ...props }: MeterProps) {
  return (
    <MeterRoot {...props}>
      <MeterLabel>{label}</MeterLabel><MeterValue /><MeterTrack><MeterIndicator /></MeterTrack>
    </MeterRoot>
  );
}
Meter.Root = MeterRoot;
Meter.Label = MeterLabel;
Meter.Value = MeterValue;
Meter.Track = MeterTrack;
Meter.Indicator = MeterIndicator;

// React <Fieldset>: the anatomy and classes of <ui-fieldset> on a native <fieldset data-ui="fieldset">
// (React renderers are native HTML; the recipe resets its user-agent box). Compound parts (Base UI):
// Fieldset.Root (the fieldset: disabled, data-disabled, aria-labelledby its Legend) and
// Fieldset.Legend (a <div data-part="legend">, as Base UI renders it, with data-disabled). The native
// fieldset disables the native controls inside; FieldsetDisabledCtx gives every kit host inside its
// data-disabled too. The preset <Fieldset legend="…"> is Root + Legend + children.
import { createContext, useContext, useId, type FieldsetHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { FieldsetDisabledCtx } from '../state.react.ts';
import { findPart, renderPart, type PartBase, type PartState } from '../compound.react.tsx';
import { fieldset } from '../../styled-system/recipes/fieldset.js';

export interface FieldsetRootProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'className'>, PartBase {
  /** Disables every control inside (native fieldset disabled; data-disabled on the kit hosts inside). */
  disabled?: boolean;
  /** Unit u in px for the fieldset and its fields. */
  size?: number;
  /** Gap between the legend and the fields in u (default: the collection gap). */
  gap?: number;
  /** Fieldset.Legend and the fields. */
  children?: ReactNode;
}

export interface FieldsetProps extends FieldsetRootProps {
  /** The legend text; it names the group. */
  legend?: ReactNode;
}

interface FieldsetContext { c: Record<string, string>; state: PartState; legendId: string }
const Ctx = createContext<FieldsetContext | null>(null);

/** Fieldset.Root: the native fieldset; named by the Legend among its direct children. */
export function FieldsetRoot({ disabled = false, size, gap, className, render, style, children, ...rest }: FieldsetRootProps) {
  const legendId = `${useId()}fieldset-legend`;
  // A disabled Fieldset around this one disables it too (as nested native fieldsets do).
  const outer = useContext(FieldsetDisabledCtx);
  const off = disabled || outer;
  const c = fieldset() as Record<string, string>;
  const state: PartState = off ? { disabled: true } : {};
  const legend = findPart(children, [FieldsetLegend]);
  return (
    <Ctx.Provider value={{ c, state, legendId }}>
      <FieldsetDisabledCtx.Provider value={off}>
        {renderPart('fieldset', c.root, {
          'data-ui': 'fieldset', 'data-size': size, 'aria-labelledby': legend ? legendId : undefined, disabled: disabled || undefined,
          'data-disabled': off ? '' : undefined, style: gap === undefined ? style : { ...style, '--ui-gap': String(gap) }, className, ...rest, render, children,
        }, state)}
      </FieldsetDisabledCtx.Provider>
    </Ctx.Provider>
  );
}

export interface FieldsetLegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Fieldset.Legend: the legend text (a div, as Base UI), the fieldset's accessible name. */
export function FieldsetLegend({ className, render, ...rest }: FieldsetLegendProps) {
  const f = useContext(Ctx);
  if (!f) throw new Error('<Fieldset.Legend> must be inside Fieldset.Root');
  return renderPart('div', f.c.legend, { 'data-part': 'legend', id: f.legendId, 'data-disabled': f.state.disabled ? '' : undefined, className, ...rest, render }, f.state);
}

/** Preset: Fieldset.Root with a Legend, then the fields. */
export function Fieldset({ legend, children, ...props }: FieldsetProps) {
  return <FieldsetRoot {...props}>{legend != null && legend !== '' && <FieldsetLegend>{legend}</FieldsetLegend>}{children}</FieldsetRoot>;
}
Fieldset.Root = FieldsetRoot;
Fieldset.Legend = FieldsetLegend;

// The controls every foundation page shares: unit, density and corner scale. Numbers come from the
// kit's resolvers, and the specimens beside them take the same inputs, so the two can't disagree.
import { useState, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import { DENSITIES, GEOMETRY_DEFAULTS, SIZES, type Density } from '@massimo/ui-kit/tokens/geometry/resolve';
import { useEvent } from '../wc.ts';

export interface System { unit: number; density: Density; radiusScale: number }
export const DEFAULT_SYSTEM: System = { unit: GEOMETRY_DEFAULTS.unit, density: GEOMETRY_DEFAULTS.density, radiusScale: GEOMETRY_DEFAULTS.radiusScale };

const bar = css({ display: 'flex', flexWrap: 'wrap', gap: '3', alignItems: 'end', padding: '4', borderRadius: 'lg', bg: 'bg.subtle' });
const field = css({ display: 'flex', flexDirection: 'column', gap: '1', textStyle: 'label', minWidth: '[8rem]' });

function Choice({ label, value, options, onValue }: { label: string; value: string; options: string[]; onValue: (v: string) => void }) {
  const ref = useEvent('change', (_el, d) => onValue(d.value));
  return (
    <div className={field}>
      <span>{label}</span>
      <ui-select ref={ref} label={label} hide-label="" value={value}>{options.map((o) => <ui-option key={o} value={o}>{o}</ui-option>)}</ui-select>
    </div>
  );
}

export function useSystem() {
  return useState<System>(DEFAULT_SYSTEM);
}

export function SystemBar({ system, onChange }: { system: System; onChange: (s: System) => void }) {
  return (
    <div className={bar} role="group" aria-label="System inputs">
      <Choice label="Unit (u)" value={String(system.unit)} options={SIZES.map(String)} onValue={(v) => onChange({ ...system, unit: Number(v) })} />
      <Choice label="Density" value={system.density} options={[...DENSITIES]} onValue={(v) => onChange({ ...system, density: v as Density })} />
      <Choice label="Corner scale" value={String(system.radiusScale)} options={['0', '0.5', '1', '1.5', '2']} onValue={(v) => onChange({ ...system, radiusScale: Number(v) })} />
    </div>
  );
}

/** A subtree that takes the page's inputs: size, density and the corner scale. */
export const Live = ({ system, className, children }: { system: System; className?: string; children: ReactNode }) => (
  <div className={className} data-size={system.unit} data-density={system.density} style={{ '--ui-radius-scale': system.radiusScale } as React.CSSProperties}>{children}</div>
);

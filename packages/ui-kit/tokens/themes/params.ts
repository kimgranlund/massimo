// Theme parameters: the few numbers the geometry derives from (colors come from Spectrum).
// Each becomes a CSS custom property `--ui-<name>`, so a theme is just a set of values
// that can change at runtime without regenerating any CSS.
import { CONTAINERS } from '../geometry/resolve.ts';

export interface ParamSpec { label: string; min: number; max: number; step: number; default: number }

export const PARAMS = {
  'radius-scale':   { label: 'Corner radius',  min: 0, max: 3, step: 0.05, default: 1 },
  // corner-shape: superellipse(k). 1 = round, 2 = squircle, 0 = bevel, negative = scoop.
  'corner-shape':   { label: 'Corner shape',   min: -1, max: 4, step: 0.1, default: 1 },
  'unit':           { label: 'Unit (px)',      min: 2, max: 12, step: 0.25, default: 4.5 },
  'border':         { label: 'Border (px)',    min: 0, max: 2, step: 1, default: 0 },
  // Typography: role size = (10px + u) × ratio^step; line heights round up to rhythm × u (0 = natural).
  'type-ratio':     { label: 'Type ratio',     min: 1, max: 1.5, step: 0.001, default: 1.333 },
  'type-rhythm':    { label: 'Type rhythm (u)', min: 0, max: 1, step: 0.5, default: 1 },
  // Motion (tokens/motion): durations × scale (0 = instant); bounce 0–1 blends each overshooting
  // spring toward its critically damped twin (1 = as designed). Root-level, like saved themes.
  'motion-scale':   { label: 'Duration scale',  min: 0, max: 2, step: 0.05, default: 1 },
  'motion-bounce':  { label: 'Bounce',         min: 0, max: 1, step: 0.05, default: 1 },
  // Container ladder: padding and gap per level, in units of u (pad-card, gap-card, …).
  ...containerParams(),
} as const satisfies Record<string, ParamSpec>;

type Level = keyof typeof CONTAINERS;
function containerParams() {
  const out = {} as Record<`pad-${Level}` | `gap-${Level}`, ParamSpec>;
  for (const [level, spec] of Object.entries(CONTAINERS) as [Level, (typeof CONTAINERS)[Level]][]) {
    // Composite padding stays within the Differential Forms range so its rows can stay 8u.
    const maxPad = level === 'composite' ? 1.5 : 12;
    out[`pad-${level}`] = { label: `${level} padding (u)`, min: 0, max: maxPad, step: 0.5, default: spec.padding };
    out[`gap-${level}`] = { label: `${level} gap (u)`, min: 0, max: 12, step: 0.5, default: spec.padding };
  }
  return out;
}

export type ParamName = keyof typeof PARAMS;
export type ThemeParams = Record<ParamName, number>;

export const paramVar = (name: ParamName) => `--ui-${name}`;
export const defaultParams = Object.fromEntries(
  Object.entries(PARAMS).map(([k, s]) => [k, s.default]),
) as ThemeParams;

// Theme parameters: the few numbers every color ramp and geometry token derives from.
// Each becomes a CSS custom property `--ui-<name>`, so a theme is just a set of values
// that can change at runtime without regenerating any CSS.
export interface ParamSpec { label: string; min: number; max: number; step: number; default: number }

export const PARAMS = {
  'accent-hue':     { label: 'Accent hue',     min: 0, max: 360, step: 1, default: 265 },
  'accent-chroma':  { label: 'Accent chroma',  min: 0, max: 0.3, step: 0.005, default: 0.19 },
  'neutral-hue':    { label: 'Neutral hue',    min: 0, max: 360, step: 1, default: 260 },
  'neutral-chroma': { label: 'Neutral chroma', min: 0, max: 0.06, step: 0.001, default: 0.015 },
  'danger-hue':     { label: 'Danger hue',     min: 0, max: 360, step: 1, default: 25 },
  'radius-scale':   { label: 'Corner radius',  min: 0, max: 3, step: 0.05, default: 1 },
  'unit':           { label: 'Unit (px)',      min: 2, max: 12, step: 0.25, default: 4 },
  'border':         { label: 'Border (px)',    min: 0, max: 2, step: 1, default: 1 },
} as const satisfies Record<string, ParamSpec>;

export type ParamName = keyof typeof PARAMS;
export type ThemeParams = Record<ParamName, number>;

export const paramVar = (name: ParamName) => `--ui-${name}`;
export const defaultParams = Object.fromEntries(
  Object.entries(PARAMS).map(([k, s]) => [k, s.default]),
) as ThemeParams;

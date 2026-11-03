// Theme parameters: the few numbers the geometry derives from (colors come from Spectrum).
// Each becomes a CSS custom property `--ui-<name>`, so a theme is just a set of values
// that can change at runtime without regenerating any CSS.
import { CONTAINERS } from '../geometry/resolve.ts';
import { SPRINGS, SPRING_NAMES, INTENTS, BOUNCE_MAX, type SpringName, type IntentName } from '../motion/index.ts';

export interface ParamSpec { label: string; min: number; max: number; step: number; default: number }

export const PARAMS = {
  'radius-scale':   { label: 'Corner radius',  min: 0, max: 3, step: 0.05, default: 1 },
  // corner-shape: superellipse(k). 1 = round, 2 = squircle, 0 = bevel, negative = scoop.
  'corner-shape':   { label: 'Corner shape',   min: -1, max: 4, step: 0.1, default: 1 },
  // Container curvature: a factor t on each family's concentric radius R0 (the control radius
  // + padding): R = t × R0, 1 concentric, 0 square. [radius] sets it per element.
  'radius-group':      { label: 'Group radius (× concentric)',      min: 0, max: 1, step: 0.05, default: 1 },
  'radius-collection': { label: 'Collection radius (× concentric)', min: 0, max: 1, step: 0.05, default: 1 },
  'radius-card':       { label: 'Card radius (× concentric)',          min: 0, max: 1, step: 0.05, default: 1 },
  // Elevation (tokens/elevation, docs/specs/elevation.md): every shadow's alpha × shadow-strength; each
  // surface fill mixed toward the page fill by surface-contrast (0 one fill, shadows only); the shadow
  // each lifted level casts (0 none, 1 sm, 2 md); card-raised lifts cards to the raised level.
  'shadow-strength':  { label: 'Shadow strength',  min: 0, max: 2, step: 0.05, default: 1 },
  'surface-contrast': { label: 'Surface contrast', min: 0, max: 1, step: 0.05, default: 1 },
  'shadow-raised':    { label: 'Raised shadow',    min: 0, max: 2, step: 1, default: 1 },
  'shadow-floating':  { label: 'Floating shadow',  min: 0, max: 2, step: 1, default: 2 },
  'shadow-modal':     { label: 'Modal shadow',     min: 0, max: 2, step: 1, default: 2 },
  'card-raised':      { label: 'Raise cards',      min: 0, max: 1, step: 1, default: 0 },
  'unit':           { label: 'Unit (px)',      min: 2, max: 12, step: 0.25, default: 4.5 },
  'border':         { label: 'Border (px)',    min: 0, max: 2, step: 1, default: 0 },
  // Typography: role size = (10px + u) × ratio^step; line heights round up to rhythm × u (0 = natural).
  'type-ratio':     { label: 'Type ratio',     min: 1, max: 1.5, step: 0.001, default: 1.333 },
  'type-rhythm':    { label: 'Type rhythm (u)', min: 0, max: 1, step: 0.5, default: 1 },
  // Motion (tokens/motion, docs/specs/motion.md): two global multipliers, then per spring its
  // perceptual duration (s) and bounce, then per intent the spring it uses (index into SPRING_NAMES).
  // Durations × scale (0 = instant); every bounce × motion-bounce (0 = critically damped).
  'motion-scale':   { label: 'Duration scale',  min: 0, max: 2, step: 0.05, default: 1 },
  'motion-bounce':  { label: 'Bounce scale',   min: 0, max: 1, step: 0.05, default: 1 },
  ...springParams(),
  ...intentParams(),
  // Container ladder: padding and gap per level, in units of u (pad-card, gap-card, …).
  ...containerParams(),
} as const satisfies Record<string, ParamSpec>;

function springParams() {
  const out = {} as Record<`spring-${SpringName}-duration` | `spring-${SpringName}-bounce`, ParamSpec>;
  for (const [name, s] of Object.entries(SPRINGS) as [SpringName, (typeof SPRINGS)[SpringName]][]) {
    out[`spring-${name}-duration`] = { label: `${name} duration (s)`, min: 0.05, max: 1.5, step: 0.01, default: s.duration };
    out[`spring-${name}-bounce`] = { label: `${name} bounce`, min: 0, max: BOUNCE_MAX, step: 0.01, default: s.bounce };
  }
  return out;
}

function intentParams() {
  const out = {} as Record<`intent-${IntentName}`, ParamSpec>;
  for (const [intent, spring] of Object.entries(INTENTS) as [IntentName, SpringName][])
    out[`intent-${intent}`] = { label: `${intent} spring`, min: 0, max: SPRING_NAMES.length - 1, step: 1, default: SPRING_NAMES.indexOf(spring) };
  return out;
}

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

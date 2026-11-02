// Spacing, sizes and radii are in u: N = N·u, computed where used from the inherited --ui-unit, so they
// follow the theme unit and [size] subtrees like component geometry does. Radii also scale with
// --ui-radius-scale. Container tokens name the theme ladder: pad.<level> and gap.<level> are the
// theme's --ui-pad-<level> / --ui-gap-<level> in u; inset.<level> is the padding inside a border
// (max(0, pad − B), B = min(border, u/2)), as containers use it.
import { CONTAINERS } from './resolve.ts';
import { fontSizes } from '../typography/index.ts';

const u = (n: number | string) => `calc(${n} * var(--ui-unit) * 1px)`;
const B = 'min(calc(var(--ui-border) * 1px), calc(var(--ui-unit) * 0.5px))';
const STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
const LEVELS = Object.keys(CONTAINERS);
const ladder = (fn: (level: string) => string) => Object.fromEntries(LEVELS.map((l) => [l, { value: fn(l) }]));

export const spacing = {
  ...Object.fromEntries(STEPS.map((n) => [n, { value: n === 0 ? '0' : u(n) }])),
  pad: ladder((l) => u(`var(--ui-pad-${l})`)),
  gap: ladder((l) => u(`var(--ui-gap-${l})`)),
  inset: ladder((l) => `max(0px, ${u(`var(--ui-pad-${l})`)} - ${B})`),
};
export const sizes = {
  ...Object.fromEntries(STEPS.map((n) => [n, { value: n === 0 ? '0' : u(n) }])),
  // Keywords (not lengths): fill, intrinsic sizes, and the readable measure.
  full: { value: '100%' }, min: { value: 'min-content' }, max: { value: 'max-content' }, fit: { value: 'fit-content' },
  prose: { value: '65ch' },
};
const scaled = (n: number) => ({ value: `calc(${n} * var(--ui-unit) * var(--ui-radius-scale) * 1px)` });
export const radii = {
  none: { value: '0' },
  sm: scaled(1),
  md: scaled(1.5),
  lg: scaled(2),
  xl: scaled(3),
  full: { value: '9999px' },
};
export const shadows = {
  sm: { value: '0 1px 2px oklch(0 0 0 / 0.08)' },
  md: { value: '0 2px 4px oklch(0 0 0 / 0.06), 0 8px 24px oklch(0 0 0 / 0.12)' },
};
export const borderWidths = { thin: { value: '1px' }, thick: { value: '2px' } };


// Responsive breakpoints (Panda's base preset defines none).
export const breakpoints = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' };

/**
 * The u-based token variables (spacing, sizes, radii, fontSizes) as declarations. Panda declares them on :root, where they resolve with
 * the root unit; any element that sets --ui-unit (or a container param) for its subtree redeclares
 * them so descendants get lengths in that subtree's u. styles/geometry.ts does this for [size];
 * a theme scope (the jig canvas) includes unitTokenCss().
 */
export function unitTokenVars(): Record<string, string> {
  const out: Record<string, string> = {};
  const add = (group: string, tokens: Record<string, any>, prefix = '') => {
    for (const [k, v] of Object.entries(tokens)) {
      const name = `${prefix}${k}`;
      if (v && typeof v === 'object' && 'value' in v) {
        if (String(v.value).includes('--ui-')) out[`--${group}-${name.replace('.', '\\.')}`] = v.value;
      } else add(group, v, `${name}-`);
    }
  };
  add('spacing', spacing); add('sizes', sizes); add('radii', radii); add('font-sizes', fontSizes);
  return out;
}
export const unitTokenCss = () => Object.entries(unitTokenVars()).map(([k, v]) => `${k}: ${v};`).join('\n  ');

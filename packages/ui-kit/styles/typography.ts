// Type roles in CSS: the same formulas as tokens/typography/resolve.ts, computed at each element
// from inherited inputs (--ui-unit, --ui-type-ratio, --ui-type-rhythm), so `size` and theme
// parameters reach text per subtree. Two equal APIs: `[data-type="heading-1"]` on any element
// (plain HTML), and Panda `textStyle: 'heading-1'`. `[data-heading="serif"]` on any element
// switches display and headings to the serif stack at regular weight.
import { defineGlobalStyles, defineTextStyles } from '@pandacss/dev';
import { TYPE_ROLES, type TypeRole } from '../tokens/typography/resolve.ts';

const U = 'calc(var(--ui-unit) * 1px)';
const BASE = `calc(10px + ${U})`;

function roleStyle(r: TypeRole) {
  const size = r.u !== undefined ? `calc(${r.u} * ${U})` : `calc(${BASE} * pow(var(--ui-type-ratio), ${r.step}))`;
  // Round up to the rhythm unit; a zero rhythm falls back to a 0.01px grid (natural height).
  const lineHeight = r.control ? String(r.lh) : `round(up, calc(${size} * ${r.lh}), max(calc(var(--ui-type-rhythm) * ${U}), 0.01px))`;
  return {
    fontFamily: r.mono ? 'var(--fonts-mono)' : r.heading ? 'var(--ui-heading-family, var(--fonts-sans))' : 'var(--fonts-sans)',
    fontSize: size,
    lineHeight,
    fontWeight: r.heading ? 'var(--ui-heading-weight, 700)' : String(r.weight),
    letterSpacing: `${r.tracking}em`,
    textTransform: r.upper ? 'uppercase' : 'none',
  };
}

const roles = Object.entries(TYPE_ROLES) as [string, TypeRole][];

export const textStyles = defineTextStyles(Object.fromEntries(roles.map(([name, r]) => [name, { value: roleStyle(r) }])));

export const typography = defineGlobalStyles({
  ...Object.fromEntries(roles.map(([name, r]) => [`[data-type="${name}"]`, roleStyle(r)])),
  '[data-heading="serif"]': { '--ui-heading-family': 'var(--fonts-serif)', '--ui-heading-weight': '400' },
  '[data-heading="sans"]': { '--ui-heading-family': 'var(--fonts-sans)', '--ui-heading-weight': '700' },
});

// Kit colors: the default Spectrum (HCT-generated, Radix-style ramps with separate light and
// dark values), from the generated snapshot in spectrum/defaults.json. Every family is a token
// group colors.spectrum.{family}.{1..12} (1 = the scheme's endpoint tone); semantic roles alias ramp steps
// with Radix step semantics. Regenerate the snapshot with `npm run spectrum:defaults`; apply
// other settings at runtime with spectrumCSS (same variable names).
import DEFAULTS from './spectrum/defaults.json' with { type: 'json' };
import { ROLE_STEPS } from './spectrum/index.ts';

type Snapshot = { roles: Record<'primary' | 'neutral' | 'critical', string>; onSolid: { light: string; dark: string }; light: Record<string, string[]>; dark: Record<string, string[]> };
const D = DEFAULTS as Snapshot;

// Same value set in every scheme block, so a .light/.dark class on any element re-resolves it.
const schemed = (light: string, dark: string) => ({ value: { base: light, _osDark: dark, _dark: dark, _light: light } });

export const colors = {
  white: { value: '#fff' },
  black: { value: '#000' },
};

const spectrum = Object.fromEntries(Object.keys(D.light).map((family) => [
  family,
  Object.fromEntries(D.light[family].map((css, i) => [i + 1, schemed(css, D.dark[family][i])])),
]));

// Role tokens: "accent.solid" style paths from ROLE_STEPS names, aliasing ramp steps.
const roles: Record<string, any> = {};
for (const [role, [family, step]] of Object.entries(ROLE_STEPS)) {
  const ref = `{colors.spectrum.${D.roles[family]}.${step}}`;
  const [group, ...rest] = role.split('-');
  const key = rest.length ? rest.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('') : 'DEFAULT';
  const camelGroup = group === 'focus' ? 'focusRing' : group;
  if (camelGroup === 'focusRing') { roles.focusRing = schemed(ref, ref); continue; }
  (roles[camelGroup] ??= {})[key] = schemed(ref, ref);
}

export const semanticColors = {
  spectrum,
  ...roles,
  fg: { ...roles.fg, onSolid: schemed(D.onSolid.light, D.onSolid.dark) },
};

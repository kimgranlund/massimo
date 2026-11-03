// Kit colors: the default Spectrum (HCT-generated, Radix-style ramps with separate light and
// dark values), from the generated snapshot in spectrum/defaults.json. Every family is a token
// group colors.spectrum.{family}.{1..12} (1 = the scheme's endpoint tone); semantic roles alias ramp steps
// with Radix step semantics. Regenerate the snapshot with `npm run spectrum:defaults`; apply
// other settings at runtime with spectrumCSS (same variable names).
import DEFAULTS from './spectrum/defaults.json' with { type: 'json' };
import { ROLE_STEPS, SHADOWS, roleStep, withAlpha } from './spectrum/index.ts';
import { elevationTokens } from '../elevation/index.ts';

type Snapshot = { roles: Record<string, string>; onSolid: { light: string; dark: string }; light: Record<string, string[]>; dark: Record<string, string[]> };
const D = DEFAULTS as Snapshot;

// Same value set in every scheme block, so a .light/.dark class on any element re-resolves it.
const schemed = (light: string, dark: string) => ({ value: { base: light, _osDark: dark, _dark: dark, _light: light } });

// White and black are the neutral endpoints, not #fff / #000: the light scheme's step 1 (tone 97.5)
// and the dark scheme's step 1 (tone 5), the same in every scheme. fg.strong uses them for headings
// and titles: black in light, white in dark.
export const colors = {
  white: { value: D.light[D.roles.neutral][0] },
  black: { value: D.dark[D.roles.neutral][0] },
};

const spectrum = Object.fromEntries(Object.keys(D.light).map((family) => [
  family,
  Object.fromEntries(D.light[family].map((css, i) => [i + 1, schemed(css, D.dark[family][i])])),
]));

// Role tokens: "primary.solid" style paths from ROLE_STEPS names, aliasing ramp steps.
const roles: Record<string, any> = {};
for (const [role, entry] of Object.entries(ROLE_STEPS)) {
  const at = (mode: 'light' | 'dark') => { const r = roleStep(entry, mode); return withAlpha(`{colors.spectrum.${D.roles[r.family]}.${r.step}}`, r.alpha); };
  const ref = at('light'), dref = at('dark');
  const [group, ...rest] = role.split('-');
  const key = rest.length ? rest.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('') : 'DEFAULT';
  const camelGroup = group === 'focus' ? 'focusRing' : group;
  if (camelGroup === 'focusRing') { roles.focusRing = schemed(ref, dref); continue; }
  (roles[camelGroup] ??= {})[key] = schemed(ref, dref);
}

// Elevation (tokens/elevation, docs/specs/elevation.md). Shadow layers are per-scheme colors: the
// shadow role at each layer's light or dark alpha. The shadow tokens scale them by the theme
// (shadow-strength, shadow-<level>, card-raised) and the fills mix toward the page fill
// (surface-contrast); both are declared per scheme too, so a .dark / .light subtree re-resolves them.
const shadowLayer = Object.fromEntries((Object.keys(SHADOWS) as (keyof typeof SHADOWS)[]).flatMap((name) =>
  SHADOWS[name].map((l, i) => [`${name}${i + 1}`, schemed(withAlpha('{colors.shadow}', l.light), withAlpha('{colors.shadow}', l.dark))])));
const elevation = elevationTokens();
export const semanticShadows = Object.fromEntries(Object.entries(elevation.shadows).map(([k, v]) => [k, schemed(v, v)]));
const elevationFills = Object.fromEntries(Object.entries(elevation.fills).map(([k, v]) => [k, schemed(v, v)]));

export const semanticColors = {
  spectrum,
  ...roles,
  elevation: elevationFills,
  shadowLayer,
  fg: { ...roles.fg, onSolid: schemed(D.onSolid.light, D.onSolid.dark), selected: schemed(`{colors.spectrum.${D.roles.neutral}.12}`, D.onSolid.dark), strong: schemed('{colors.black}', '{colors.white}') },
};

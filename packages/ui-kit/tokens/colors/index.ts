// Kit colors: the default Spectrum (HCT-generated, Radix-style ramps with separate light and
// dark values), from the generated snapshot in spectrum/defaults.json. Every family is a token
// group colors.{family}.{1..12} (1 = the scheme's endpoint tone); semantic roles alias ramp steps
// with Radix step semantics. Regenerate the snapshot with `npm run spectrum:defaults`; apply
// other settings at runtime with spectrumCSS (same variable names).
import DEFAULTS from './spectrum/defaults.json' with { type: 'json' };
import { DEFAULT_ENDPOINT, ROLE_STEPS, SHADOW_LAYERS, rampName, roleStep, selectionVars, withAlpha } from './spectrum/roles.ts';
import { elevationTokens } from '../elevation/index.ts';

type Snapshot = { roles: Record<string, string>; onSolid: { light: string; dark: string }; light: Record<string, string[]>; dark: Record<string, string[]> };
const D = DEFAULTS as Snapshot;

// Same value set in every scheme block, so a .light/.dark class on any element re-resolves it.
const schemed = (light: string, dark: string) => ({ value: { base: light, _osDark: dark, _dark: dark, _light: light } });

// White and black are neutral steps, not #fff / #000: the light ramp's step 3 for white and the dark
// ramp's step 3 for black (DEFAULT_ENDPOINT), the same in every scheme. fg.strong uses them for
// headings and titles: black in light, white in dark. A theme maps them (color.endpoints).
export const colors = {
  white: { value: D.light[D.roles.neutral][DEFAULT_ENDPOINT - 1] },
  black: { value: D.dark[D.roles.neutral][DEFAULT_ENDPOINT - 1] },
};

const spectrum = Object.fromEntries(Object.keys(D.light).map((family) => [
  rampName(family),
  Object.fromEntries(D.light[family].map((css, i) => [i + 1, schemed(css, D.dark[family][i])])),
]));

// Role tokens: "primary.solid" style paths from ROLE_STEPS names, aliasing ramp steps.
const roles: Record<string, any> = {};
for (const [role, entry] of Object.entries(ROLE_STEPS)) {
  const at = (mode: 'light' | 'dark') => { const r = roleStep(entry, mode); return withAlpha(`{colors.${rampName(D.roles[r.family])}.${r.step}}`, r.alpha); };
  const ref = at('light'), dref = at('dark');
  const [group, ...rest] = role.split('-');
  const key = rest.length ? rest.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('') : 'DEFAULT';
  const camelGroup = group === 'focus' ? 'focusRing' : group;
  if (camelGroup === 'focusRing') { roles.focusRing = schemed(ref, dref); continue; }
  (roles[camelGroup] ??= {})[key] = schemed(ref, dref);
}
// The selection fills follow the theme's emphasis (selectionVars), from the role tokens.
const tokenRef = (r: string) => (r === 'fg-on-solid' ? '{colors.fg.onSolid}' : r === 'primary-solid' ? '{colors.primary.solid}' : `{colors.${r.replace('-', '.')}}`);
const sel = { light: selectionVars('light', tokenRef), dark: selectionVars('dark', tokenRef) };
roles.bg.selected = schemed(sel.light['bg-selected'], sel.dark['bg-selected']);

// Elevation (tokens/elevation, docs/specs/elevation.md). Shadow layers are per-scheme colors: the
// shadow role at each layer's light or dark alpha. The shadow tokens scale them by the theme
// (shadow-strength, shadow-<level>, card-raised) and the fills mix toward the page fill
// (surface-contrast); both are declared per scheme too, so a .dark / .light subtree re-resolves them.
const shadowLayer = Object.fromEntries(Object.entries(SHADOW_LAYERS).map(([layer, l]) => [layer, schemed(withAlpha('{colors.shadow}', l.light), withAlpha('{colors.shadow}', l.dark))]));
const elevation = elevationTokens();
export const semanticShadows = Object.fromEntries(Object.entries(elevation.shadows).map(([k, v]) => [k, schemed(v, v)]));
const elevationFills = Object.fromEntries(Object.entries(elevation.fills).map(([k, v]) => [k, schemed(v, v)]));

export const semanticColors = {
  ...spectrum,
  ...roles,
  elevation: elevationFills,
  shadowLayer,
  fg: { ...roles.fg, onSolid: schemed(D.onSolid.light, D.onSolid.dark), selected: schemed(sel.light['fg-selected'], sel.dark['fg-selected']), strong: schemed('{colors.black}', '{colors.white}') },
};

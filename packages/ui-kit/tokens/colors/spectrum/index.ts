// Spectrum: HCT-generated, Radix-style 12-step ramps (light and dark) and their mapping onto
// the kit's semantic color variables. Generation runs the vendored engine (runtime.json, see
// NOTICE.md) lazily; it takes ~300ms, so callers should debounce.
import RUNTIME from './runtime.json' with { type: 'json' };
import { RADIX_HUES, SPECTRUM_FIXED, normalizeSpectrum, type SpectrumSettings } from './config.ts';

export * from './config.ts';

export interface Swatch { step: number; stop: number; css: string; oklch: [number, number, number]; hct: [number, number, number]; apca: { css: string; lc: number; ok: boolean } }
export type Scheme = Record<string, Swatch[]>;
export interface Spectrum { settings: SpectrumSettings; schemes: { light: Scheme; dark: Scheme }; metadata?: { light: { accents: string[]; neutrals: string[]; pairs: Record<string, { accent: string; neutral: string }> } } }

let engine: { generate(s: SpectrumSettings): Spectrum } | undefined;
const load = () => (engine ??= new Function((RUNTIME as { code: string }).code + '\nreturn SpectrumRuntime;')());

/** Generate both schemes. Throws on invalid settings or a malformed ramp. */
export function generateSpectrum(settings: SpectrumSettings = {}): Spectrum {
  const s = normalizeSpectrum(settings);
  const out = load().generate({ ...s, ...SPECTRUM_FIXED, tint: s.tint });
  for (const mode of ["light", "dark"] as const) for (const [name, ramp] of Object.entries(out.schemes[mode]) as [string, Swatch[]][]) {
    if (ramp.length !== 12 || ramp.some((sw) => !sw.css)) throw new Error(`Invalid generated ramp: ${name}`);
  }
  return out;
}

export function families(data: Spectrum) {
  const all = Object.keys(data.schemes.light);
  const accents = data.metadata?.light.accents ?? all;
  const neutrals = data.metadata?.light.neutrals ?? all.filter((n) => !accents.includes(n));
  return { all, accents, neutrals };
}

const hueOf = (data: Spectrum, name: string) => data.schemes.light[name][8].hct[0];

/** Resolve a requested family name: exact match, else the candidate nearest in hue. */
export function closestFamily(data: Spectrum, requested: string, candidates: string[]): string {
  if (candidates.includes(requested)) return requested;
  const hue = RADIX_HUES[requested] ?? (/^h\d{3}$/.test(requested) ? Number(requested.slice(1)) : 25);
  const distance = (n: string) => { const d = Math.abs(hueOf(data, n) - hue) % 360; return Math.min(d, 360 - d); };
  return candidates.reduce((best, n) => (distance(n) < distance(best) ? n : best));
}

export interface Roles { primary: string; neutral: string; critical: string }
export const DEFAULT_ROLES: Roles = { primary: 'indigo', neutral: 'neutral', critical: 'red' };

/** Resolve the role families against what this generation actually produced. */
export function resolveRoles(data: Spectrum, wanted: Partial<Roles> = {}): Roles {
  const f = families(data);
  const w = { ...DEFAULT_ROLES, ...wanted };
  return {
    primary: closestFamily(data, w.primary, f.accents),
    neutral: f.all.includes(w.neutral) ? w.neutral : (f.neutrals[0] ?? 'neutral'),
    critical: closestFamily(data, w.critical, f.accents),
  };
}

/** Round the numbers in a color string to 4 decimals (well below a visible difference). */
export const trimColor = (css: string) => css.replace(/-?\d*\.\d+/g, (n) => String(Number(Number(n).toFixed(4))));

/**
 * Steps 1–12 per family and scheme (index 0 = step 1). Step 1 is the scheme endpoint: the
 * Light endpoint tone in light ramps, the Dark endpoint tone in dark ramps (100 / 0 = white / black).
 */
export function ramps(data: Spectrum, mode: 'light' | 'dark'): Record<string, string[]> {
  return Object.fromEntries(Object.entries(data.schemes[mode]).map(([name, ramp]) => [name, ramp.map((sw) => trimColor(sw.css))]));
}

/** Role -> [family role, step], Radix step semantics. Shared by the kit tokens and spectrumCSS. */
export const ROLE_STEPS = {
  'bg': ['neutral', 1], 'bg-subtle': ['neutral', 2], 'bg-muted': ['neutral', 3],
  'fg': ['neutral', 12], 'fg-muted': ['neutral', 11],
  'border': ['neutral', 6], 'border-strong': ['neutral', 7],
  'accent-solid': ['primary', 9], 'accent-solid-hover': ['primary', 10], 'accent-subtle': ['primary', 3], 'accent-fg': ['primary', 11],
  'danger-solid': ['critical', 9], 'danger-solid-hover': ['critical', 10], 'danger-fg': ['critical', 11],
  'focus-ring': ['primary', 8],
} as const satisfies Record<string, [keyof Roles, number]>;

/** Semantic variables per scheme: ramp variables plus roles that point at them. */
export function roleVariables(data: Spectrum, roles: Roles, mode: 'light' | 'dark') {
  const vars: Record<string, string> = {};
  for (const [role, [family, step]] of Object.entries(ROLE_STEPS)) vars[`--colors-${role}`] = `var(--colors-spectrum-${roles[family]}-${step})`;
  // Text on a primary solid: the engine's APCA choice for step 9.
  vars['--colors-fg-on-solid'] = data.schemes[mode][roles.primary][8].apca.css;
  return vars;
}

const block = (sel: string, vars: Record<string, string>) => `${sel} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;

/**
 * CSS that applies a spectrum over the kit's semantic colors, mirroring the kit's scheme
 * structure: light by default, dark under prefers-color-scheme, .light/.dark to force. Emit it
 * after the kit stylesheet; selectors match the kit's own so each rule wins its counterpart.
 * Variable names match the kit's tokens (--colors-spectrum-{family}-{1..12}, --colors-{role}).
 */
export function spectrumCSS(data: Spectrum, roles: Roles, scope?: string) {
  const light = roleVariables(data, roles, 'light'), dark = roleVariables(data, roles, 'dark');
  const rampVars = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(ramps(data, mode)).flatMap(([name, steps]) => steps.map((css, i) => [`--colors-spectrum-${name}-${i + 1}`, css])));
  // Scoped: everything is declared on the scope element itself, so it re-resolves there and
  // nothing outside it changes; .light/.dark on the scope element force a scheme.
  const sel = scope
    ? { base: scope, light: `${scope}.light`, dark: `${scope}.dark`, auto: `${scope}:not(.light)` }
    : { base: ':where(:root)', light: '.light', dark: '.dark', auto: ':where(:root)' };
  return [
    block(sel.base, { ...rampVars('light'), ...light }),
    block(sel.light, { ...rampVars('light'), ...light }),
    `@media (prefers-color-scheme: dark) {\n${block(sel.auto, { ...rampVars('dark'), ...dark })}\n}`,
    block(sel.dark, { ...rampVars('dark'), ...dark }),
  ].join('\n');
}

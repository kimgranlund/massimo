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

/** Page canvas (Radix "step 0" extension): halfway from step 1 toward white/black, chroma halved. */
function endpoint(sw: Swatch, mode: 'light' | 'dark') {
  const [l, c, h] = sw.oklch;
  return `oklch(${mode === 'light' ? (l + 1) / 2 : l / 2} ${c / 2} ${h})`;
}

/** Semantic variables per scheme, using Radix step semantics (1-based steps). */
export function roleVariables(data: Spectrum, roles: Roles, mode: 'light' | 'dark') {
  const s = data.schemes[mode];
  const n = s[roles.neutral], p = s[roles.primary], c = s[roles.critical];
  const step = (ramp: Swatch[], k: number) => ramp[k - 1].css;
  return {
    '--colors-bg': endpoint(n[0], mode),
    '--colors-bg-subtle': step(n, 2),
    '--colors-bg-muted': step(n, 3),
    '--colors-fg': step(n, 12),
    '--colors-fg-muted': step(n, 11),
    '--colors-fg-on-solid': p[8].apca.css,
    '--colors-border': step(n, 6),
    '--colors-border-strong': step(n, 7),
    '--colors-accent-solid': step(p, 9),
    '--colors-accent-solid-hover': step(p, 10),
    '--colors-accent-subtle': step(p, 3),
    '--colors-accent-fg': step(p, 11),
    '--colors-danger-solid': step(c, 9),
    '--colors-danger-solid-hover': step(c, 10),
    '--colors-danger-fg': step(c, 11),
    '--colors-focus-ring': step(p, 8),
  };
}

const block = (sel: string, vars: Record<string, string>) => `${sel} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;

/**
 * CSS that applies a spectrum over the kit's semantic colors, mirroring the kit's scheme
 * structure: light by default, dark under prefers-color-scheme, .light/.dark to force. Emit it
 * after the kit stylesheet; selectors match the kit's own so each rule wins its counterpart.
 */
export function spectrumCSS(data: Spectrum, roles: Roles) {
  const light = roleVariables(data, roles, 'light'), dark = roleVariables(data, roles, 'dark');
  const ramps = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(data.schemes[mode]).flatMap(([name, ramp]) => ramp.map((sw) => [`--spectrum-${name}-${sw.step}`, sw.css])));
  return [
    block(':where(:root)', { ...light, ...ramps('light') }),
    block('.light', { ...light, ...ramps('light') }),
    `@media (prefers-color-scheme: dark) {\n${block(':where(:root)', { ...dark, ...ramps('dark') })}\n}`,
    block('.dark', { ...dark, ...ramps('dark') }),
  ].join('\n');
}

// Spectrum: HCT-generated, Radix-style 12-step ramps (light and dark) and their mapping onto
// the kit's semantic color variables. Generation runs the vendored engine (runtime.json, see
// NOTICE.md) lazily; it takes ~300ms, so callers should debounce.
import RUNTIME from './runtime.json' with { type: 'json' };
import { RADIX_HUES, SPECTRUM_FIXED, normalizeSpectrum, type SpectrumSettings } from './config.ts';

export * from './config.ts';

export interface Swatch { step: number; stop: number; css: string; oklch: [number, number, number]; hct: [number, number, number]; apca: { css: string; lc: number; ok: boolean } }
export type Scheme = Record<string, Swatch[]>;
interface Checks { peakTone: number; rows: Record<string, { roles: { r11: number; r12: number }; passes: { r11: boolean; r12: boolean } }> }
export interface Spectrum { settings: SpectrumSettings; schemes: { light: Scheme; dark: Scheme }; checks?: { light: Checks; dark: Checks }; metadata?: { light: { accents: string[]; neutrals: string[]; pairs: Record<string, { accent: string; neutral: string }> } } }

let engine: { generate(s: SpectrumSettings): Spectrum } | undefined;
let boundaryFn: ((hue: number, tone: number, target: string) => number) | undefined;

/**
 * Load the vendored runtime. Its inner HCT engine also has a `boundary(hue, tone, gamut)` function
 * (max in-gamut HCT chroma) that the published runtime API does not re-export. The runtime builds
 * that engine with `new Function("self", source)`; we wrap the global Function constructor only
 * for the first generation to keep a reference to it. The vendored file itself is untouched.
 */
function load() {
  if (engine) return engine;
  const Orig = Function;
  engine = new Orig((RUNTIME as { code: string }).code + '\nreturn SpectrumRuntime;')() as { generate(s: SpectrumSettings): Spectrum };
  const g = globalThis as { Function: FunctionConstructor };
  g.Function = function (...args: string[]) {
    const f = Orig(...args);
    if (args.length === 2 && args[0] === 'self') return (self: any) => { f(self); boundaryFn ??= self.HCTPalettes?.boundary; };
    return f;
  } as unknown as FunctionConstructor;
  try { engine.generate({ ...normalizeSpectrum({}), ...SPECTRUM_FIXED }); } finally { g.Function = Orig; }
  return engine;
}

/** Max in-gamut HCT chroma at a hue and tone for a gamut ('srgb' | 'display-p3'). */
export function gamutBoundary(hue: number, tone: number, target: string): number {
  load();
  if (!boundaryFn) throw new Error('Spectrum engine boundary function unavailable');
  return boundaryFn(hue, tone, target);
}

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

/**
 * Color roles, each a family: brand (primary, secondary, neutral), feedback (critical = errors and
 * danger, warning, success, info) and data 1–6 (chart series and categories, well spaced in hue).
 */
export const BRAND_ROLES = ['primary', 'secondary', 'neutral'] as const;
export const FEEDBACK_ROLES = ['critical', 'warning', 'success', 'info'] as const;
export const DATA_ROLES = ['data1', 'data2', 'data3', 'data4', 'data5', 'data6'] as const;
export const ROLE_NAMES = [...BRAND_ROLES, ...FEEDBACK_ROLES, ...DATA_ROLES] as const;
export type RoleName = (typeof ROLE_NAMES)[number];
export type Roles = Record<RoleName, string>;
export const DEFAULT_ROLES: Roles = {
  primary: 'indigo', secondary: 'amber', neutral: 'neutral',
  critical: 'red', warning: 'orange', success: 'green', info: 'cyan',
  data1: 'indigo', data2: 'cyan', data3: 'grass', data4: 'amber', data5: 'tomato', data6: 'plum',
};

/** Resolve the role families against what this generation actually produced. */
export function resolveRoles(data: Spectrum, wanted: Partial<Roles> = {}): Roles {
  const f = families(data);
  const w = { ...DEFAULT_ROLES, ...wanted };
  return Object.fromEntries(ROLE_NAMES.map((r) => [r, r === 'neutral'
    ? (f.all.includes(w.neutral) ? w.neutral : (f.neutrals[0] ?? 'neutral'))
    : closestFamily(data, w[r], f.accents)])) as Roles;
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
  'bg-muted-hover': ['neutral', 4], 'bg-muted-active': ['neutral', 5],
  // Floating layers (menus, popovers, dialogs, drawers): the page tone in light, one step up in dark,
  // where shadows barely read. Tooltips invert; the backdrop dims the page in both schemes.
  'bg-overlay': ['neutral', 1, { dark: 2 }],
  'bg-inverse': ['neutral', 12], 'fg-inverse': ['neutral', 1],
  'bg-backdrop': ['neutral', 12, { dark: 1, alpha: 0.4, darkAlpha: 0.7 }],
  'fg': ['neutral', 12], 'fg-muted': ['neutral', 11],
  'border': ['neutral', 6], 'border-strong': ['neutral', 7],
  'accent-solid': ['primary', 9], 'accent-solid-hover': ['primary', 10], 'accent-subtle': ['primary', 3], 'accent-subtle-hover': ['primary', 4], 'accent-fg': ['primary', 11],
  'danger-solid': ['critical', 9], 'danger-solid-hover': ['critical', 10], 'danger-subtle': ['critical', 3], 'danger-fg': ['critical', 11],
  'secondary-solid': ['secondary', 9], 'secondary-solid-hover': ['secondary', 10], 'secondary-subtle': ['secondary', 3], 'secondary-fg': ['secondary', 11],
  'warning-solid': ['warning', 9], 'warning-subtle': ['warning', 3], 'warning-fg': ['warning', 11],
  'success-solid': ['success', 9], 'success-subtle': ['success', 3], 'success-fg': ['success', 11],
  'info-solid': ['info', 9], 'info-subtle': ['info', 3], 'info-fg': ['info', 11],
  // Data series: the step-9 solid of each data family.
  'data-1': ['data1', 9], 'data-2': ['data2', 9], 'data-3': ['data3', 9], 'data-4': ['data4', 9], 'data-5': ['data5', 9], 'data-6': ['data6', 9],
  'focus-ring': ['primary', 8],
} as const satisfies Record<string, RoleStep>;

/** A role: a family step, optionally a different step and/or an alpha per scheme. */
export type RoleStep = readonly [keyof Roles, number] | readonly [keyof Roles, number, { dark?: number; alpha?: number; darkAlpha?: number }];

/** Family, step and alpha (1 = opaque) of a role in one scheme. */
export function roleStep(entry: RoleStep, mode: 'light' | 'dark'): { family: keyof Roles; step: number; alpha: number } {
  const [family, step, o = {}] = entry as readonly [keyof Roles, number, { dark?: number; alpha?: number; darkAlpha?: number }?];
  const dark = mode === 'dark';
  return { family, step: (dark && o.dark) || step, alpha: (dark ? o.darkAlpha ?? o.alpha : o.alpha) ?? 1 };
}

/** CSS for a role from a ramp-step reference (a var() or a token reference). */
export const withAlpha = (ref: string, alpha: number) => alpha === 1 ? ref : `color-mix(in oklch, ${ref} ${Math.round(alpha * 100)}%, transparent)`;

/** Semantic variables per scheme: ramp variables plus roles that point at them. */
export function roleVariables(data: Spectrum, roles: Roles, mode: 'light' | 'dark') {
  const vars: Record<string, string> = {};
  for (const [role, entry] of Object.entries(ROLE_STEPS)) {
    const { family, step, alpha } = roleStep(entry, mode);
    vars[`--colors-${role}`] = withAlpha(`var(--colors-spectrum-${roles[family]}-${step})`, alpha);
  }
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

// ── Diagnostics ──

/** CAM16 unique hues: hue angle h, eccentricity e, quadrature H (red, yellow, green, blue, red). */
const UNIQUE = { h: [20.14, 90.0, 164.25, 237.53, 380.14], e: [0.8, 0.7, 1.0, 1.2, 0.8], H: [0, 100, 200, 300, 400] };
export const UNIQUE_HUES = [{ name: 'R', h: 20.14, H: 0 }, { name: 'Y', h: 90, H: 100 }, { name: 'G', h: 164.25, H: 200 }, { name: 'B', h: 237.53, H: 300 }];

/** CAM16 hue quadrature H (0–400) for a hue angle h. */
export function hueQuadrature(h: number) {
  const hp = h < UNIQUE.h[0] ? h + 360 : h;
  let i = 0;
  while (i < 3 && hp >= UNIQUE.h[i + 1]) i++;
  const a = (hp - UNIQUE.h[i]) / UNIQUE.e[i], b = (UNIQUE.h[i + 1] - hp) / UNIQUE.e[i + 1];
  return UNIQUE.H[i] + (100 * a) / (a + b);
}

export interface SpectrumDiagnostics {
  peakTone: number;
  peakChroma: number;
  limitedBy: string;
  target: string;
  primary: { name: string; light: { r11: number; r12: number }; dark: { r11: number; r12: number } };
  accents: { name: string; color: string; h: number; H: number; curve: [number, number][] }[];
  weakest: [number, number][];
  tones: [number, number];
}

/**
 * What shaped this generation: the peak tone T* (the weakest hue's chroma peak), the shared peak
 * chroma C* and the accent that limits it, the primary's contrast checks, each accent's position in
 * hue quadrature, and the max in-gamut chroma per accent by tone (20–92).
 */
export function spectrumDiagnostics(data: Spectrum, roles: Roles, step = 2): SpectrumDiagnostics {
  const accents = families(data).accents;
  const light = data.schemes.light, target = data.settings.target;
  const peakTone = data.checks?.light.peakTone ?? light[accents[0]][8].hct[2];
  const rows = accents.map((name) => {
    const h = light[name][8].hct[0];
    const curve: [number, number][] = [];
    for (let T = 20; T <= 92; T += step) curve.push([T, gamutBoundary(h, T, target)]);
    return { name, color: light[name][8].css, h, H: hueQuadrature(h), curve, atPeak: gamutBoundary(h, peakTone, target) };
  });
  const limiting = rows.reduce((a, b) => (b.atPeak < a.atPeak ? b : a));
  const weakest = rows[0].curve.map(([T], i) => [T, Math.min(...rows.map((r) => r.curve[i][1]))] as [number, number]);
  const check = (mode: 'light' | 'dark') => data.checks?.[mode].rows[roles.primary]?.roles ?? { r11: NaN, r12: NaN };
  return {
    peakTone,
    peakChroma: Math.min(...accents.map((a) => light[a][8].hct[1])),
    limitedBy: limiting.name,
    target,
    primary: { name: roles.primary, light: check('light'), dark: check('dark') },
    accents: rows.map(({ atPeak: _p, ...r }) => r),
    weakest,
    tones: [20, 92],
  };
}

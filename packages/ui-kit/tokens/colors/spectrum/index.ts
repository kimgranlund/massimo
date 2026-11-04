// Spectrum: HCT-generated, Radix-style 12-step ramps (light and dark) and their mapping onto
// the kit's semantic color variables. Generation runs the vendored engine (runtime.json, see
// NOTICE.md) lazily; it takes ~300ms, so callers should debounce.
import RUNTIME from './runtime.json' with { type: 'json' };
import { RADIX_HUES, SPECTRUM_FIXED, normalizeSpectrum, type SpectrumSettings } from './config.ts';
import { apcaLc, stepTones, DEFAULT_TARGETS } from './contrast.ts';
import { applyAnchors, type SolidSteps } from './anchors.ts';
export { apcaLc, stepTones, toneForLc, DEFAULT_TARGETS, TARGET_MAX } from './contrast.ts';
export { applyAnchors, isAnchorColor, type ColorAnchor, type AnchorResult, type SolidSteps } from './anchors.ts';

export * from './config.ts';

export interface Swatch { step: number; stop: number; css: string; oklch: [number, number, number]; hct: [number, number, number]; apca: { css: string; lc: number; ok: boolean } }
export type Scheme = Record<string, Swatch[]>;
interface Checks { peakTone: number; rows: Record<string, { roles: { r11: number; r12: number }; passes: { r11: boolean; r12: boolean } }> }
export interface Spectrum { settings: SpectrumSettings; schemes: { light: Scheme; dark: Scheme }; checks?: { light: Checks; dark: Checks }; metadata?: { light: { accents: string[]; neutrals: string[]; pairs: Record<string, { accent: string; neutral: string }> } } }

let engine: { generate(s: SpectrumSettings): Spectrum } | undefined;
let boundaryFn: ((hue: number, tone: number, target: string) => number) | undefined;
/** The step tones generateSpectrum asks for (contrast targets), per scheme; null while generating the legacy way. */
let toneOverride: { light: number[]; dark: number[] } | null = null;
/** The even ladder's 12 output stops per scheme (recorded on the first generation), the keys our tones take. */
const stepStops: { light: number[]; dark: number[] } = { light: [], dark: [] };

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
    if (args.length === 2 && args[0] === 'self') return (self: any) => { f(self); boundaryFn ??= self.HCTPalettes?.boundary; installToneMap(self); };
    return f;
  } as unknown as FunctionConstructor;
  try {
    const first = engine.generate({ ...normalizeSpectrum({}), ladder: 'even', ...SPECTRUM_FIXED });
    for (const mode of ['light', 'dark'] as const) stepStops[mode] = Object.values(first.schemes[mode])[0].map((sw) => sw.stop);
  } finally { g.Function = Orig; }
  return engine;
}

/**
 * The engine reads its step → tone map from a flag on its own global object (__HCT_TONEMAP, written
 * just after __HCT_TONES, the scheme's end tones). An accessor there hands back our solved tones, in
 * step order, while generateSpectrum asks for them; otherwise the engine's own map passes through.
 */
function installToneMap(self: any) {
  let stored: Record<string, number> | null = null;
  Object.defineProperty(self, '__HCT_TONEMAP', {
    configurable: true,
    get() {
      if (!toneOverride) return stored;
      const ends = self.__HCT_TONES as number[] | null;
      const tones = toneOverride[ends && ends[0] < ends[1] ? 'dark' : 'light'];
      // Keyed by the even ladder's output stops, in step order; other sampled stops keep the engine's tones.
      const stops = stepStops[ends && ends[0] < ends[1] ? 'dark' : 'light'];
      return stops.length === tones.length ? { ...(stored ?? {}), ...Object.fromEntries(stops.map((k, i) => [String(k), tones[i]])) } : stored;
    },
    set(v) { stored = v; },
  });
}

/** Max in-gamut HCT chroma at a hue and tone for a gamut ('srgb' | 'display-p3'). */
export function gamutBoundary(hue: number, tone: number, target: string): number {
  load();
  if (!boundaryFn) throw new Error('Spectrum engine boundary function unavailable');
  return boundaryFn(hue, tone, target);
}

/** Generate both schemes. Throws on invalid settings or a malformed ramp. */
/** The engine's own settings: ours minus the contrast targets. */
const engineSettings = (s: SpectrumSettings) => { const { targetsLight: _l, targetsDark: _d, ...rest } = s; return rest; };
/** A ramp the legacy way (the engine's own tone placement), for measuring targets from old settings. */
const generateLegacy = (s: SpectrumSettings) => engine!.generate({ ...engineSettings(s), ...SPECTRUM_FIXED, tint: s.tint }) as Spectrum;
/** The contrast targets (steps 2–12) a ramp has against its page, per scheme, measured on the neutral family. */
export function measureTargets(data: Spectrum) {
  const of = (mode: 'light' | 'dark') => {
    const fam = Object.keys(data.schemes[mode]).find((n) => /neutral/i.test(n)) ?? Object.keys(data.schemes[mode])[0];
    const ramp = data.schemes[mode][fam];
    return ramp.slice(1).map((sw) => Math.round(apcaLc(sw.hct[2], ramp[0].hct[2]) * 10) / 10);
  };
  return { light: of('light'), dark: of('dark') };
}

export function generateSpectrum(settings: SpectrumSettings = {}): Spectrum {
  const s = normalizeSpectrum(settings);
  load();
  // Contrast targets (contrast.ts): a theme that sets only the legacy tone placement (peak tone,
  // scale) has its targets measured from the ramp those settings produce.
  const legacy = ['ptAuto', 'pt', 'ladder'].some((k) => k in settings) && !('targetsLight' in settings || 'targetsDark' in settings);
  const targets = legacy ? measureTargets(generateLegacy(s)) : { light: s.targetsLight, dark: s.targetsDark };
  const tones = { light: stepTones(s.toneMax, targets.light, 'light'), dark: stepTones(s.darkTone, targets.dark, 'dark') };
  toneOverride = tones;
  let out: Spectrum;
  try {
    // The even ladder keeps the kit's chroma envelope; its 12 stops take our tones. Step 9 is the chroma peak.
    out = engine!.generate({ ...engineSettings(s), ladder: 'even', ptAuto: 0, pt: Math.round(tones.light[8] * 2) / 2, ...SPECTRUM_FIXED, tint: s.tint });
  } finally { toneOverride = null; }
  out.settings = { ...out.settings, targetsLight: targets.light, targetsDark: targets.dark };
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
 * destructive actions, warning, success, info) and data 1–6 (chart series and categories, well spaced in hue).
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

/** Brand and feedback roles: each gets the same semantic steps and its whole ramp. */
export const SCALE_ROLES = [...BRAND_ROLES, ...FEEDBACK_ROLES] as const;
/** Semantic steps every scale role carries (Radix step semantics). */
export const SEMANTIC_STEPS = { solid: 9, 'solid-hover': 10, subtle: 3, 'subtle-hover': 4, border: 7, fg: 11 } as const;
const UNIFORM_STEPS = Object.fromEntries(SCALE_ROLES.flatMap((role) => [
  ...Object.entries(SEMANTIC_STEPS).map(([name, step]) => [`${role}-${name}`, [role, step] as const]),
  ...Array.from({ length: 12 }, (_, i) => [`${role}-${i + 1}`, [role, i + 1] as const]),
])) as Record<`${(typeof SCALE_ROLES)[number]}-${keyof typeof SEMANTIC_STEPS | number}`, RoleStep>;

/**
 * Role -> [family role, step], Radix step semantics. Shared by the kit tokens and spectrumCSS.
 * One name per role: <role>-solid, -solid-hover, -subtle, -subtle-hover, -border, -fg and <role>-1…12
 * for primary, secondary, neutral, critical, warning, success and info; data-1…6; plus the page roles.
 */
export const ROLE_STEPS = {
  'bg': ['neutral', 1], 'bg-subtle': ['neutral', 2], 'bg-muted': ['neutral', 3],
  'bg-muted-hover': ['neutral', 4], 'bg-muted-active': ['neutral', 5],
  // Control fills (the neutral button): neutral 12 as a translucent layer, so a control reads on any
  // surface (page, muted panel, card). On the page tone they match neutral 3 / 4 / 5.
  'bg-control': ['neutral', 12, { alpha: 0.12, darkAlpha: 0.2 }],
  'bg-control-hover': ['neutral', 12, { alpha: 0.19, darkAlpha: 0.29 }],
  'bg-control-active': ['neutral', 12, { alpha: 0.25, darkAlpha: 0.39 }],
  // Floating layers (menus, popovers, dialogs, drawers): the page tone in light, one step up in dark,
  // where shadows barely read. Tooltips invert; the backdrop dims the page in both schemes.
  'bg-overlay': ['neutral', 1, { dark: 2 }],
  // The selected option of a listbox or segmented control: the lightest neutral in light, the primary
  // solid in dark (its text is fg-selected: neutral 12 in light, the solid's contrast color in dark).
  'bg-selected': ['neutral', 1, { dark: 9, darkFamily: 'primary' }],
  'bg-inverse': ['neutral', 12], 'fg-inverse': ['neutral', 1],
  'bg-backdrop': ['neutral', 12, { dark: 1, alpha: 0.4, darkAlpha: 0.7 }],
  'fg': ['neutral', 12], 'fg-muted': ['neutral', 11],
  // Placeholders and other hints that must read as absent content: well below muted text.
  'fg-subtle': ['neutral', 8],
  'border': ['neutral', 6], 'border-strong': ['neutral', 7],
  ...UNIFORM_STEPS,
  // The scheme's shadow color (shadows.sm, shadows.md mix it with transparent): neutral 12 in light,
  // the darkest neutral in dark, where the shadow alphas are stronger.
  'shadow': ['neutral', 12, { dark: 1 }],
  // Data series: the step-9 solid of each data family.
  'data-1': ['data1', 9], 'data-2': ['data2', 9], 'data-3': ['data3', 9], 'data-4': ['data4', 9], 'data-5': ['data5', 9], 'data-6': ['data6', 9],
  'focus-ring': ['primary', 8],
} as const satisfies Record<string, RoleStep>;

/**
 * Compound shadows (Material's key-light umbra and penumbra plus an ambient layer), continuous in the
 * elevation e (dp): each layer's offset, blur and spread are px per dp, fitted to Material's tables
 * at 2, 8 and 24dp, so any elevation is valid. Colored by the `shadow` role (neutral 12 in light, the
 * darkest neutral in dark: tinted, never black) at a per-scheme alpha, stronger in dark where a
 * shadow has less page to darken.
 */
export const SHADOW_LAYERS = {
  umbra:    { y: 0.5, blur: 0.6, spread: -0.3,  light: 0.14, dark: 0.5 },
  penumbra: { y: 1,   blur: 1.6, spread: 0.125, light: 0.1,  dark: 0.36 },
  ambient:  { y: 0.4, blur: 1.9, spread: 0.33,  light: 0.08, dark: 0.3 },
} as const satisfies Record<string, { y: number; blur: number; spread: number; light: number; dark: number }>;
export type ShadowLayer = keyof typeof SHADOW_LAYERS;

/** The base shadows' elevations (small lifts inside components: a selected option, a range thumb). */
export const SHADOW_DP = { sm: 1, md: 3 } as const;

/** The three layers at elevation e: px offsets, blur and spread, and the per-scheme alphas. */
export const shadowAt = (e: number) => (Object.entries(SHADOW_LAYERS) as [ShadowLayer, (typeof SHADOW_LAYERS)[ShadowLayer]][]).map(([layer, l]) =>
  ({ layer, y: l.y * e, blur: l.blur * e, spread: l.spread * e, light: e > 0 ? l.light : 0, dark: e > 0 ? l.dark : 0 }));

/** The base shadows as layers (the DTCG export). */
export const SHADOWS = { sm: shadowAt(SHADOW_DP.sm), md: shadowAt(SHADOW_DP.md) };

/** A role: a family step, optionally a different step and/or an alpha per scheme. */
export type RoleStep = readonly [keyof Roles, number] | readonly [keyof Roles, number, { dark?: number; darkFamily?: keyof Roles; alpha?: number; darkAlpha?: number }];

/** Family, step and alpha (1 = opaque) of a role in one scheme. */
export function roleStep(entry: RoleStep, mode: 'light' | 'dark'): { family: keyof Roles; step: number; alpha: number } {
  const [family, step, o = {}] = entry as readonly [keyof Roles, number, { dark?: number; darkFamily?: keyof Roles; alpha?: number; darkAlpha?: number }?];
  const dark = mode === 'dark';
  return { family: (dark && o.darkFamily) || family, step: (dark && o.dark) || step, alpha: (dark ? o.darkAlpha ?? o.alpha : o.alpha) ?? 1 };
}

/** CSS for a role from a ramp-step reference (a var() or a token reference). */
export const withAlpha = (ref: string, alpha: number) => alpha === 1 ? ref : `color-mix(in oklch, ${ref} ${Math.round(alpha * 100)}%, transparent)`;

/** Semantic variables per scheme: ramp variables plus roles that point at them. */
export function roleVariables(data: Spectrum, roles: Roles, mode: 'light' | 'dark', solidSteps: Partial<Record<RoleName, number>> = {}) {
  const vars: Record<string, string> = {};
  for (const [role, entry] of Object.entries(ROLE_STEPS)) {
    const { family, step, alpha } = roleStep(entry, mode);
    vars[`--colors-${role}`] = withAlpha(`var(--colors-spectrum-${roles[family]}-${step})`, alpha);
  }
  // An anchored role's solid follows its anchor (applyAnchors): solid at the anchored step, hover one
  // darker (one lighter at step 12, the darkest).
  for (const [role, s] of Object.entries(solidSteps) as [RoleName, number][]) {
    if (!(SCALE_ROLES as readonly string[]).includes(role)) continue;
    vars[`--colors-${role}-solid`] = `var(--colors-spectrum-${roles[role]}-${s})`;
    vars[`--colors-${role}-solid-hover`] = `var(--colors-spectrum-${roles[role]}-${s === 12 ? 11 : s + 1})`;
  }
  // Text on a primary solid: the engine's APCA choice for the solid step (9 unless anchored).
  vars['--colors-fg-on-solid'] = data.schemes[mode][roles.primary][(solidSteps.primary ?? 9) - 1].apca.css;
  // White and black: neutral step 3 of the light and dark ramps, the same in both schemes; fg.strong
  // (headings, titles) is black in light, white in dark. endpointVars maps them to another family.
  Object.assign(vars, endpointVars(data, roles));
  vars['--colors-fg-strong'] = mode === 'dark' ? 'var(--colors-white)' : 'var(--colors-black)';
  // Text on bg-selected: strong neutral in light, the primary solid's contrast color in dark.
  vars['--colors-fg-selected'] = mode === 'dark' ? vars['--colors-fg-on-solid'] : `var(--colors-spectrum-${roles.neutral}-12)`;
  return vars;
}

/**
 * White and black (`--colors-white`, `--colors-black`): a step of the neutral role's ramp, the same
 * in both schemes: white from the light ramp, black from the dark ramp, step 3 by default (DEFAULT_ENDPOINT);
 * or 'pure' (#fff, #000).
 */
export type Endpoint = number | 'pure';
export type Endpoints = { white?: Endpoint; black?: Endpoint };
/** The neutral step white and black take by default. */
export const DEFAULT_ENDPOINT = 3;
export function endpointVars(data: Spectrum, roles: Roles, map: Endpoints = {}) {
  const pick = (want: Endpoint | undefined, mode: 'light' | 'dark', pure: string) =>
    want === 'pure' ? pure : data.schemes[mode][roles.neutral][(want ?? DEFAULT_ENDPOINT) - 1].css;
  return { '--colors-white': pick(map.white, 'light', '#fff'), '--colors-black': pick(map.black, 'dark', '#000') };
}

const block = (sel: string, vars: Record<string, string>) => `${sel} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;

/**
 * CSS that applies a spectrum over the kit's semantic colors, mirroring the kit's scheme
 * structure: light by default, dark under prefers-color-scheme, .light/.dark to force. Emit it
 * after the kit stylesheet; selectors match the kit's own so each rule wins its counterpart.
 * Variable names match the kit's tokens (--colors-spectrum-{family}-{1..12}, --colors-{role}).
 */
export function spectrumCSS(data: Spectrum, roles: Roles, scope?: string, solidSteps: SolidSteps = { light: {}, dark: {} }) {
  const light = roleVariables(data, roles, 'light', solidSteps.light), dark = roleVariables(data, roles, 'dark', solidSteps.dark);
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

/**
 * A spectrum with a theme's anchors applied (anchors.ts): each anchor's family re-shaped and its step
 * overridden, the roles (a role whose family another anchor claimed moves to a free family), and the
 * solid step per anchored role. Use the returned roles.
 */
export function anchoredSpectrum(data: Spectrum, roles: Roles, anchors: import('./anchors.ts').ColorAnchor[] = []) {
  if (!anchors.length) return { data, roles, report: [] as import('./anchors.ts').AnchorResult[], solidSteps: { light: {}, dark: {} } as SolidSteps };
  const targets = { light: (data.settings.targetsLight as number[] | undefined) ?? [...DEFAULT_TARGETS.light], dark: (data.settings.targetsDark as number[] | undefined) ?? [...DEFAULT_TARGETS.dark] };
  const r = applyAnchors(data, roles, anchors, targets);
  return { data: r.data, roles: r.roles as Roles, report: r.report, solidSteps: r.solidSteps };
}

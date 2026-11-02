// Typography: massimo-ui's type roles on our u ramp. The base is the control font, 10px + u
// (14px at u = 4). A step role is base × ratio^step; a fixed role is n·u. Line heights round
// up to the rhythm unit (rhythm × u; 0 keeps the natural size × multiplier). Controls keep a
// unitless 1.2. styles/typography.ts computes the same values in CSS with pow() and round().

// Fonts in three layers, like colors: faces (the stacks) -> voices (what text is for) -> roles.
export const FACES = ['sans', 'serif', 'mono', 'display', 'controls'] as const;
export type Face = (typeof FACES)[number];
export const VOICES = ['display', 'heading', 'body', 'ui', 'numeric', 'code'] as const;
export type Voice = (typeof VOICES)[number];
/** Default face per voice. `ui` (controls, labels, kickers) uses the Controls face; `numeric` follows `ui`; `display` is its own face (falls back to sans). */
export const DEFAULT_VOICES: Record<Voice, Face> = { display: 'display', heading: 'sans', body: 'sans', ui: 'controls', numeric: 'controls', code: 'mono' };
/** Voices whose bold weight drops to regular on a serif face (massimo-ui's serif heading style). */
export const SERIF_REGULAR_VOICES: ReadonlySet<Voice> = new Set(['display', 'heading']);
// Numerals contract: `data-numeric="<variant> …"` (space-separated) and the Panda `numeric()` pattern.
// Each variant sets one axis of font-variant-numeric (or, for `caps`, font-feature-settings), so
// variants on different axes combine. Two variants on one axis conflict: the later one in this
// table wins (the CSS rules follow table order), whatever the attribute order. Bare = the defaults.
export const NUMERIC_AXES = ['spacing', 'figures', 'fraction', 'zero', 'ordinal'] as const;
export type NumericAxis = (typeof NUMERIC_AXES)[number];
/** Axis defaults: aligned columns, lining digits. The other axes default to off. */
export const NUMERIC_DEFAULTS: Partial<Record<NumericAxis, string>> = { spacing: 'tabular-nums', figures: 'lining-nums' };
export const NUMERIC_VARIANTS = {
  'tabular':          { axis: 'spacing', value: 'tabular-nums', feature: 'tnum', label: 'Tabular figures' },
  'proportional':     { axis: 'spacing', value: 'proportional-nums', feature: 'pnum', label: 'Proportional figures' },
  'lining':           { axis: 'figures', value: 'lining-nums', feature: 'lnum', label: 'Lining figures' },
  'oldstyle':         { axis: 'figures', value: 'oldstyle-nums', feature: 'onum', label: 'Oldstyle figures' },
  'fraction':         { axis: 'fraction', value: 'diagonal-fractions', feature: 'frac', label: 'Diagonal fractions' },
  'stacked-fraction': { axis: 'fraction', value: 'stacked-fractions', feature: 'afrc', label: 'Stacked fractions' },
  'slashed-zero':     { axis: 'zero', value: 'slashed-zero', feature: 'zero', label: 'Slashed zero' },
  'ordinal':          { axis: 'ordinal', value: 'ordinal', feature: 'ordn', label: 'Ordinals' },
  // Case-sensitive forms: punctuation and (in some faces) figures sized for all-caps settings.
  'caps':             { axis: 'caps', value: '"case"', feature: 'case', label: 'Case-sensitive forms' },
} as const satisfies Record<string, { axis: NumericAxis | 'caps'; value: string; feature: string; label: string }>;
export type NumericVariant = keyof typeof NUMERIC_VARIANTS;
/** `data-position` on a `data-numeric` element: superior / inferior figures (font-variant-position). */
export const NUMERIC_POSITIONS = { super: { feature: 'sups', label: 'Superior figures' }, sub: { feature: 'subs', label: 'Inferior figures' } } as const;
export type NumericPosition = keyof typeof NUMERIC_POSITIONS;

/** The CSS for a set of numeric variants (unknown tokens are ignored, as in the attribute). */
export function numericStyle(variants: readonly string[] | string = [], position?: NumericPosition) {
  const list = new Set(typeof variants === 'string' ? variants.split(/\s+/) : variants);
  const axes: Partial<Record<NumericAxis, string>> = { ...NUMERIC_DEFAULTS };
  let caps = false;
  for (const [t, v] of Object.entries(NUMERIC_VARIANTS)) {
    if (!list.has(t)) continue;
    if (v.axis === 'caps') caps = true;
    else axes[v.axis as NumericAxis] = v.value;
  }
  return {
    fontVariantNumeric: NUMERIC_AXES.map((a) => axes[a]).filter(Boolean).join(' '),
    ...(caps ? { fontFeatureSettings: '"case"' } : {}),
    ...(position ? { fontVariantPosition: position, fontSynthesisPosition: 'auto' } : {}),
  };
}

/** Figures for the numeric voice: aligned columns, lining digits (bare `data-numeric`). */
export const NUMERIC_FEATURES = numericStyle().fontVariantNumeric;

export interface TypeRole {
  label: string;
  voice: Voice;
  step?: number;
  u?: number;
  lh: number;
  weight: number;
  tracking: number; // em
  upper?: boolean;
  control?: boolean; // unitless line height, no rhythm rounding
}

export const TYPE_ROLES = {
  'display':       { label: 'Display',         voice: 'display', step: 6,  lh: 0.95, weight: 700, tracking: -0.045 },
  'heading-1':     { label: 'Heading 1',       voice: 'heading', step: 4,  lh: 1.1,  weight: 700, tracking: -0.025 },
  'heading-2':     { label: 'Heading 2',       voice: 'heading', step: 3,  lh: 1.15, weight: 700, tracking: -0.02 },
  'heading-3':     { label: 'Heading 3',       voice: 'heading', step: 2,  lh: 1.2,  weight: 700, tracking: -0.01 },
  'section-kicker': { label: 'Kicker · Section', voice: 'ui', step: 0, lh: 1.2, weight: 700, tracking: 0.12, upper: true },
  'group-kicker':  { label: 'Kicker · Group',  voice: 'ui', step: -1, lh: 1.2,  weight: 500, tracking: 0.096, upper: true },
  'body-large':    { label: 'Body · Large',    voice: 'body', step: 1,  lh: 1.5,  weight: 400, tracking: 0 },
  'body':          { label: 'Body',            voice: 'body', step: 0,  lh: 1.5,  weight: 400, tracking: 0 },
  'caption':       { label: 'Caption',         voice: 'body', u: 3,     lh: 1.45, weight: 400, tracking: 0 },
  'code':          { label: 'Code',            voice: 'code', u: 3,     lh: 1.5,  weight: 400, tracking: 0 },
  'control':       { label: 'Control',         voice: 'ui', step: 0,  lh: 1.2,  weight: 450, tracking: 0, control: true },
  'label':         { label: 'Label',           voice: 'ui', step: 0,  lh: 1.4,  weight: 450, tracking: 0 },
  // A strong item title: list and settings rows, table name cells, small card titles.
  'title':         { label: 'Title',           voice: 'ui', step: 0,  lh: 1.4,  weight: 600, tracking: 0 },
  'control-small': { label: 'Control · Small', voice: 'ui', u: 3,     lh: 1.2,  weight: 450, tracking: 0, control: true },
} as const satisfies Record<string, TypeRole>;
export type TypeRoleName = keyof typeof TYPE_ROLES;

/** Named ratios from massimo-ui. */
export const TYPE_RATIOS: [number, string][] = [[1, 'Product UI'], [1.125, 'Major second'], [1.2, 'Minor third'], [1.25, 'Major third'], [1.333, 'Perfect fourth'], [1.5, 'Perfect fifth']];

/** Default face stacks (massimo-ui). The display face starts as the sans stack. */
export const FONT_FAMILIES: Record<Face, string> = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Baskerville, "Palatino Linotype", Palatino, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  display: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  /** Controls: the platform UI font, so buttons, fields and labels match the OS. */
  controls: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

/** Curated alternative stacks per face, for theme pickers. The first entry is the default. */
export const FACE_STACKS: Record<Face, [string, string][]> = {
  sans: [['Helvetica Neue', FONT_FAMILIES.sans], ['System UI', 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'], ['Avenir Next', '"Avenir Next", Avenir, "Segoe UI", sans-serif'], ['Gill Sans', '"Gill Sans", "Gill Sans MT", Calibri, sans-serif']],
  serif: [['Baskerville', FONT_FAMILIES.serif], ['Georgia', 'Georgia, "Times New Roman", serif'], ['Charter', 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif'], ['Didot', 'Didot, "Bodoni 72", "Bodoni MT", serif']],
  mono: [['UI Monospace', FONT_FAMILIES.mono], ['Menlo', 'Menlo, Monaco, Consolas, monospace'], ['Courier', '"Courier New", Courier, monospace']],
  controls: [['System UI', FONT_FAMILIES.controls], ['Helvetica Neue', FONT_FAMILIES.sans], ['Avenir Next', '"Avenir Next", Avenir, "Segoe UI", sans-serif'], ['Gill Sans', '"Gill Sans", "Gill Sans MT", Calibri, sans-serif']],
  display: [['Same as sans', FONT_FAMILIES.display], ['Didot', 'Didot, "Bodoni 72", "Bodoni MT", serif'], ['Futura', 'Futura, "Century Gothic", "Avenir Next", sans-serif'], ['Avenir Next Condensed', '"Avenir Next Condensed", "Arial Narrow", sans-serif'], ['Baskerville', FONT_FAMILIES.serif]],
};

export const TYPE_DEFAULTS = { unit: 4.5, ratio: 1.333, rhythm: 1, voices: DEFAULT_VOICES, faces: FONT_FAMILIES };

/** A face counts as serif when its stack ends in the serif generic family. */
export const isSerifStack = (stack: string) => /\bserif\s*$/.test(stack) && !/sans-serif\s*$/.test(stack);

export function resolveType(role: TypeRoleName, input: { unit?: number; ratio?: number; rhythm?: number; voices?: Partial<Record<Voice, Face>>; faces?: Partial<Record<Face, string>> } = {}) {
  const x = { ...TYPE_DEFAULTS, ...input, voices: { ...DEFAULT_VOICES, ...input.voices }, faces: { ...FONT_FAMILIES, ...input.faces } };
  const r: TypeRole = TYPE_ROLES[role];
  const base = 10 + x.unit;
  const size = r.u !== undefined ? r.u * x.unit : base * Math.pow(x.ratio, r.step!);
  const natural = size * r.lh;
  const grid = x.rhythm * x.unit;
  const lineHeight = r.control ? natural : grid > 0 ? Math.ceil(natural / grid - 1e-6) * grid : natural;
  const face = x.voices[r.voice];
  const serifRegular = SERIF_REGULAR_VOICES.has(r.voice) && isSerifStack(x.faces[face]);
  return {
    size, lineHeight, lineHeightRatio: r.control ? r.lh : undefined,
    weight: serifRegular ? 400 : r.weight,
    tracking: r.tracking,
    transform: r.upper ? 'uppercase' : 'none',
    voice: r.voice,
    face,
    stack: x.faces[face],
  };
}

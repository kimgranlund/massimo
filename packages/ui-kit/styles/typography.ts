// Type roles in CSS: the same formulas as tokens/typography/resolve.ts, computed at each element
// from inherited inputs (--ui-unit, --ui-type-ratio, --ui-type-rhythm), so `size` and theme
// parameters reach text per subtree. Two equal APIs: `[data-type="heading-1"]` on any element
// (plain HTML), and Panda `textStyle: 'heading-1'`.
//
// Fonts: faces (--fonts-sans|serif|mono|display) -> voices -> roles. A role reads its voice,
// `var(--font-voice-<voice>, <default face>)`, resolved at the element, so `data-font-<voice>="<face>"`
// on any element repoints a voice for its subtree (and a face override there re-resolves too).
//
// Numerals: `data-numeric` (a global rule, Panda's base layer) must beat a role class
// (`textStyle`, Panda's utilities layer), which a base-layer font-family never can. So every role
// reads `var(--ui-numeric-family, <its voice>)`: the numeric rule sets --ui-numeric-family on its
// own element and the role resolves to it, whichever layer the role came from. The variable does
// not inherit: text below without a role inherits the numeric family as usual, while an explicit
// role inside a numeric element (a "/ month" caption) keeps its own voice. Figures compose per axis: each variant token sets one
// non-inheriting --ui-num-<axis> and font-variant-numeric reads them all with the axis defaults
// as fallbacks, so `data-numeric="oldstyle fraction"` combines. Panda code uses the same contract
// through the `numeric()` pattern (styles/numeric.ts), whose classes sit above textStyles too.
import { defineGlobalStyles, defineTextStyles } from '@pandacss/dev';
import { DEFAULT_VOICES, FACES, NUMERIC_AXES, NUMERIC_DEFAULTS, NUMERIC_POSITIONS, NUMERIC_VARIANTS, RHYTHM_TOLERANCE, SERIF_REGULAR_VOICES, TYPE_ROLES, VOICES, type TypeRole, type Voice } from '../tokens/typography/resolve.ts';

/** CSS font-family for a voice: its repointed face, else its default face. Numeric follows ui. */
export const voiceFamily = (v: Voice) => v === 'numeric'
  ? `var(--font-voice-numeric, var(--font-voice-ui, var(--fonts-${DEFAULT_VOICES.ui})))`
  : `var(--font-voice-${v}, var(--fonts-${DEFAULT_VOICES[v]}))`;

/** Set by `data-numeric` / `numeric()`; every role's family reads it first. */
export const NUMERIC_FAMILY_VAR = '--ui-numeric-family';
/** font-variant-numeric composed from the per-axis variables, defaults as fallbacks. */
export const NUMERIC_COMPOSED = NUMERIC_AXES.map((a) => `var(--ui-num-${a},${NUMERIC_DEFAULTS[a] ? ` ${NUMERIC_DEFAULTS[a]}` : ''})`).join(' ');
/** None of the numeric variables inherit: each data-numeric element composes from its own tokens. */
export const numericProperties = Object.fromEntries([NUMERIC_FAMILY_VAR, ...NUMERIC_AXES.map((a) => `--ui-num-${a}`)].map((n) => [n, { syntax: '*', inherits: false }]));

const U = 'calc(var(--ui-unit) * 1px)';
const BASE = `calc(10px + ${U})`;

function roleStyle(name: string, r: TypeRole) {
  const size = `calc(${BASE} * pow(var(--ui-type-ratio), ${r.step}))`;
  // Round up to the rhythm unit; a zero rhythm falls back to a 0.01px grid (natural height).
  // RHYTHM_TOLERANCE of a step absorbs float error (Firefox: 12.5px × 1.2 computes above 15px).
  const grid = `max(calc(var(--ui-type-rhythm) * ${U}), 0.01px)`;
  const lineHeight = r.control ? String(r.lh) : `round(up, calc(${size} * ${r.lh} - ${grid} * ${RHYTHM_TOLERANCE}), ${grid})`;
  return {
    fontFamily: `var(${NUMERIC_FAMILY_VAR}, ${voiceFamily(r.voice)})`,
    fontSize: size,
    lineHeight,
    fontWeight: SERIF_REGULAR_VOICES.has(r.voice) ? `var(--font-voice-${r.voice}-weight, ${r.weight})` : String(r.weight),
    letterSpacing: `${r.tracking}em`,
    textTransform: r.upper ? 'uppercase' : 'none',
    // The role's text color (theme typography.colors): display, headings and titles default to the
    // strong color (fg.strong); the others inherit unless a theme maps them (an
    // unset variable leaves an inherited property inheriting).
    color: r.strong ? `var(--ui-type-color-${name}, var(--colors-fg-strong))` : r.ink ? `var(--ui-type-color-${name}, var(--colors-fg-${r.ink}))` : `var(--ui-type-color-${name})`,
  };
}

const roles = Object.entries(TYPE_ROLES) as [string, TypeRole][];

export const textStyles = defineTextStyles(Object.fromEntries(roles.map(([name, r]) => [name, { value: roleStyle(name, r) }])));

export const typography = defineGlobalStyles({
  ...Object.fromEntries(roles.map(([name, r]) => [`[data-type="${name}"]`, roleStyle(name, r)])),
  // data-font-<voice>="<face>": repoint a voice for a subtree. Display and heading voices drop
  // to regular weight on the serif face (and on a display face set to a serif stack via the jig).
  ...Object.fromEntries(VOICES.flatMap((v) => FACES.map((f) => [`[data-font-${v}="${f}"]`, {
    [`--font-voice-${v}`]: `var(--fonts-${f})`,
    ...(SERIF_REGULAR_VOICES.has(v) ? { [`--font-voice-${v}-weight`]: f === 'serif' ? '400' : 'initial' } : {}),
  }]))),
  // Figures in the numeric voice (stats, tables, counters): tabular lining digits when bare, one
  // rule per variant token after it (table order decides a conflict on one axis).
  '[data-numeric]': { [NUMERIC_FAMILY_VAR]: voiceFamily('numeric'), fontFamily: `var(${NUMERIC_FAMILY_VAR})`, fontVariantNumeric: NUMERIC_COMPOSED },
  ...Object.fromEntries(Object.entries(NUMERIC_VARIANTS).map(([t, v]) => [`[data-numeric~="${t}"]`,
    v.axis === 'caps' ? { fontFeatureSettings: v.value } : { [`--ui-num-${v.axis}`]: v.value }])),
  // Superior / inferior figures. Chrome and Safari do not synthesize them when the face lacks
  // sups/subs (Firefox does unless font-synthesis turns it off, hence the explicit auto); use
  // formatNumberParts and <sup>/<sub> where the face may not have them.
  ...Object.fromEntries(Object.keys(NUMERIC_POSITIONS).map((p) => [`[data-numeric][data-position="${p}"]`, { fontVariantPosition: p, fontSynthesisPosition: 'auto' }])),
});

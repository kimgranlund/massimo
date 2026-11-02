// Type roles in CSS: the same formulas as tokens/typography/resolve.ts, computed at each element
// from inherited inputs (--ui-unit, --ui-type-ratio, --ui-type-rhythm), so `size` and theme
// parameters reach text per subtree. Two equal APIs: `[data-type="heading-1"]` on any element
// (plain HTML), and Panda `textStyle: 'heading-1'`.
//
// Fonts: faces (--fonts-sans|serif|mono|display) -> voices -> roles. A role reads its voice,
// `var(--font-voice-<voice>, <default face>)`, resolved at the element, so `data-font-<voice>="<face>"`
// on any element repoints a voice for its subtree (and a face override there re-resolves too).
import { defineGlobalStyles, defineTextStyles } from '@pandacss/dev';
import { DEFAULT_VOICES, FACES, NUMERIC_FEATURES, SERIF_REGULAR_VOICES, TYPE_ROLES, VOICES, type TypeRole, type Voice } from '../tokens/typography/resolve.ts';

const voiceFamily = (v: Voice) => v === 'numeric'
  ? 'var(--font-voice-numeric, var(--font-voice-ui, var(--fonts-sans)))'
  : `var(--font-voice-${v}, var(--fonts-${DEFAULT_VOICES[v]}))`;

const U = 'calc(var(--ui-unit) * 1px)';
const BASE = `calc(10px + ${U})`;

function roleStyle(r: TypeRole) {
  const size = r.u !== undefined ? `calc(${r.u} * ${U})` : `calc(${BASE} * pow(var(--ui-type-ratio), ${r.step}))`;
  // Round up to the rhythm unit; a zero rhythm falls back to a 0.01px grid (natural height).
  const lineHeight = r.control ? String(r.lh) : `round(up, calc(${size} * ${r.lh}), max(calc(var(--ui-type-rhythm) * ${U}), 0.01px))`;
  return {
    fontFamily: voiceFamily(r.voice),
    fontSize: size,
    lineHeight,
    fontWeight: SERIF_REGULAR_VOICES.has(r.voice) ? `var(--font-voice-${r.voice}-weight, ${r.weight})` : String(r.weight),
    letterSpacing: `${r.tracking}em`,
    textTransform: r.upper ? 'uppercase' : 'none',
  };
}

const roles = Object.entries(TYPE_ROLES) as [string, TypeRole][];

export const textStyles = defineTextStyles(Object.fromEntries(roles.map(([name, r]) => [name, { value: roleStyle(r) }])));

export const typography = defineGlobalStyles({
  ...Object.fromEntries(roles.map(([name, r]) => [`[data-type="${name}"]`, roleStyle(r)])),
  // data-font-<voice>="<face>": repoint a voice for a subtree. Display and heading voices drop
  // to regular weight on the serif face (and on a display face set to a serif stack via the jig).
  ...Object.fromEntries(VOICES.flatMap((v) => FACES.map((f) => [`[data-font-${v}="${f}"]`, {
    [`--font-voice-${v}`]: `var(--fonts-${f})`,
    ...(SERIF_REGULAR_VOICES.has(v) ? { [`--font-voice-${v}-weight`]: f === 'serif' ? '400' : 'initial' } : {}),
  }]))),
  // Figures: tabular, lining digits in the numeric voice (stats, tables, counters).
  '[data-numeric]': { fontFamily: voiceFamily('numeric'), fontVariantNumeric: NUMERIC_FEATURES },
});

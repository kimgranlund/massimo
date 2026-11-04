// Character descriptors (docs/planning/brand-schema.md, step 2): closed scales per concept, kept as
// data in the domain manifests (contracts/domains/<domain>.json `descriptors`). A scale names the
// inputs it sets (a PARAMS name, `spectrum.<field>` or `scheme`) and, per value, their exact values.
//   themeFromCharacter  character ({ scale: value }) → theme parts, with provenance; hand-set values win
//   describeTheme       theme → the nearest value per scale and its distance (0 = exactly that value)
// Distance per input: |a − b| / (max − min) for numbers, 0 or 1 for choices; a scale's distance is the
// mean over its inputs. The value named `default` equals the kit defaults (a test keeps it so).
import { DESCRIPTORS, type InputValue } from './descriptor-data.ts';
import { PARAMS, defaultParams, type ParamName } from './params.ts';
import { themeParameters, partsFromParameters, type Theme } from './theme.ts';
import { SPECTRUM_DEFAULTS, SPECTRUM_FIELDS } from '../colors/spectrum/config.ts';
import { ICON_SET_NAMES } from '../../icons/sets.ts';

export * from './descriptor-data.ts';
export type Character = Record<string, string>;

/** Where an input lives in a theme, its default and how distance is measured. */
export function inputSpec(input: string): { path: string; default: InputValue; range?: number; options?: readonly InputValue[] } {
  if (input === 'scheme') return { path: 'scheme', default: 'auto', options: ['auto', 'light', 'dark'] };
  if (input === 'icons') return { path: 'icons', default: 'phosphor', options: ICON_SET_NAMES };
  if (input.startsWith('spectrum.')) {
    const key = input.slice(9), f = SPECTRUM_FIELDS.find((x) => x.key === key);
    if (!f) throw new Error(`unknown spectrum field ${key}`);
    return { path: `color.spectrum.${key}`, default: SPECTRUM_DEFAULTS[key], ...(f.options ? { options: f.options } : { range: f.max! - f.min! }) };
  }
  const spec = PARAMS[input as ParamName];
  if (!spec) throw new Error(`unknown descriptor input ${input}`);
  return { path: `${spec.domain}.parameters.${input}`, default: spec.default, range: spec.max - spec.min };
}

/** The value a theme gives an input (its own setting, else the kit default). */
export function inputValue(theme: Partial<Theme>, input: string): InputValue {
  if (input === 'scheme') return theme.scheme ?? 'auto';
  if (input === 'icons') return theme.icons ?? 'phosphor';
  if (input.startsWith('spectrum.')) return (theme.color?.spectrum?.[input.slice(9)] ?? SPECTRUM_DEFAULTS[input.slice(9)]) as InputValue;
  return themeParameters(theme)[input as ParamName] ?? defaultParams[input as ParamName];
}

const distance = (input: string, a: InputValue, b: InputValue) => {
  const s = inputSpec(input);
  return s.range ? Math.abs(Number(a) - Number(b)) / s.range : a === b ? 0 : 1;
};

/** The nearest value of every scale (ties go to the scale's order), with its distance in 0..1. */
export function describeTheme(theme: Partial<Theme>): Record<string, { value: string; distance: number }> {
  const out: Record<string, { value: string; distance: number }> = {};
  for (const scale of Object.values(DESCRIPTORS)) {
    let best = { value: scale.default, distance: Infinity };
    for (const v of scale.values) {
      const d = scale.inputs.reduce((sum, i) => sum + distance(i, inputValue(theme, i), v.set[i]), 0) / scale.inputs.length;
      if (d < best.distance - 1e-9) best = { value: v.name, distance: Math.round(d * 1e4) / 1e4 };
    }
    out[scale.id] = best;
  }
  return out;
}

/**
 * Theme parts from a character: each named scale value sets its inputs; the theme passed in (hand
 * edits) wins over the character. Unknown scales or values come back in `unresolved`, never guessed.
 * Provenance records each input a descriptor set, by its theme path.
 */
export function themeFromCharacter(character: Character, theme: Partial<Theme> = {}) {
  const unresolved: string[] = [];
  const params: Partial<Record<ParamName, number>> = {};
  const spectrum: Record<string, InputValue> = {};
  let scheme: Theme['scheme'];
  let icons: string | undefined;
  const provenance: NonNullable<Theme['provenance']> = { ...(theme.provenance ?? {}) };
  for (const [id, name] of Object.entries(character)) {
    const scale = DESCRIPTORS[id];
    const value = scale?.values.find((v) => v.name === name);
    if (!scale) { unresolved.push(`${id}: unknown scale (one of ${Object.keys(DESCRIPTORS).join(', ')})`); continue; }
    if (!value) { unresolved.push(`${id}: unknown value ${name} (one of ${scale.values.map((v) => v.name).join(', ')})`); continue; }
    for (const [input, v] of Object.entries(value.set)) {
      if (input === 'scheme') scheme = v as Theme['scheme'];
      else if (input === 'icons') icons = String(v);
      else if (input.startsWith('spectrum.')) spectrum[input.slice(9)] = v;
      else params[input as ParamName] = v as number;
      provenance[inputSpec(input).path] ??= { source: 'character', reason: `${id}.${name}` };
    }
  }
  // Hand-set values win: their provenance is the hand's.
  const hand = themeParameters(theme);
  for (const k of Object.keys(hand) as ParamName[]) if (params[k] !== undefined && hand[k] !== params[k]) provenance[inputSpec(k).path] = theme.provenance?.[inputSpec(k).path] ?? { source: 'hand' };
  const parts = partsFromParameters({ ...params, ...hand });
  const out: Partial<Theme> = { ...theme, character: { ...(theme.character ?? {}), ...character } };
  for (const d of ['geometry', 'motion'] as const) if (parts[d]) out[d] = { ...theme[d], parameters: parts[d]!.parameters };
  if (parts.color) out.color = { ...theme.color, ...(out.color ?? {}), parameters: parts.color.parameters };
  if (parts.typography) out.typography = { ...theme.typography, parameters: parts.typography.parameters };
  if (Object.keys(spectrum).length) out.color = { ...theme.color, ...out.color, spectrum: { ...spectrum, ...(theme.color?.spectrum ?? {}) } };
  if (scheme && theme.scheme === undefined) out.scheme = scheme;
  if (icons && theme.icons === undefined) out.icons = icons;
  // Hand-set icons and scheme win too, and keep the hand's provenance.
  for (const k of ['icons', 'scheme'] as const) if (theme[k] !== undefined && provenance[k]?.source === 'character') provenance[k] = theme.provenance?.[k] ?? { source: 'hand' };
  if (Object.keys(provenance).length) out.provenance = provenance;
  return { theme: out, unresolved };
}

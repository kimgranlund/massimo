// The theme object (docs/planning/theme-schema.md, step 1): one format for everything a theme can
// set, used by saved themes (themes.json), the jig's Copy and Load, and generators. Every section is
// optional and holds overrides of the kit defaults only:
//   parameters  PARAMS (geometry, density, curvature, type scale, motion, elevation, the ladder)
//   icons       an icon set name
//   scheme      the preferred scheme (auto follows the OS)
//   color       Spectrum settings (SPECTRUM_FIELDS) and the role mapping (role → requested family)
//   typography  faces (face → font stack) and voices (voice → face)
//   intent, character, provenance  reserved for the later layers (L0 intent, L1 character, who set what)
// contracts/theme.schema.json is generated from the same exports (npm run theme:schema).
import { PARAMS, type ParamName } from './params.ts';
import { THEME_NAME } from './validate.ts';
import { ICON_SET_NAME } from '../../icons/sets.ts';
import { SPECTRUM_FIELDS, normalizeSpectrum, type SpectrumSettings } from '../colors/spectrum/config.ts';
import { ROLE_NAMES, type RoleName } from '../colors/spectrum/index.ts';
import { FACES, VOICES, type Face, type Voice } from '../typography/resolve.ts';

export const THEME_SCHEMA_VERSION = 1;
export const SCHEMES = ['auto', 'light', 'dark'] as const;
export type ThemeScheme = (typeof SCHEMES)[number];

export interface Theme {
  schemaVersion: typeof THEME_SCHEMA_VERSION;
  name: string;
  description?: string;
  parameters?: Partial<Record<ParamName, number>>;
  icons?: string;
  scheme?: ThemeScheme;
  /** endpoints: the family whose step 1 white (light) and black (dark) take; 'neutral' (default) or 'pure' (#fff, #000). */
  color?: { spectrum?: SpectrumSettings; roles?: Partial<Record<RoleName, string>>; endpoints?: { white?: string; black?: string } };
  typography?: { faces?: Partial<Record<Face, string>>; voices?: Partial<Record<Voice, Face>> };
  /** Reserved: L0 intent (subject, audience, character words, signature). */
  intent?: Record<string, unknown>;
  /** Reserved: L1 character, one descriptor per concept. */
  character?: Record<string, string>;
  /** Who set a value and why, keyed by its path (e.g. "parameters.radius-scale"). */
  provenance?: Record<string, { source: 'hand' | 'character' | 'intent'; reason?: string }>;
}

/** A font stack: family names, quotes, commas, spaces, hyphens and digits only (no CSS syntax). */
export const FONT_STACK = /^[\w\s"',.-]{1,300}$/;
/** A requested Spectrum family name (resolveRoles picks the nearest generated hue). */
export const FAMILY_NAME = /^[a-z][a-z0-9-]{0,30}$/;

const TOP = new Set(['$schema', 'schemaVersion', 'name', 'description', 'parameters', 'icons', 'scheme', 'color', 'typography', 'intent', 'character', 'provenance']);
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Validate a theme object, collecting every problem (an agent fixes them all in one pass). Returns
 * the theme as given (minus `$schema`) when it is valid.
 */
export function validateThemeObject(input: unknown): { ok: true; theme: Theme } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);
  if (!isObject(input)) return { ok: false, errors: ['theme: must be an object'] };
  for (const k of Object.keys(input)) if (!TOP.has(k)) err(k, 'unknown section');
  if (input.schemaVersion !== THEME_SCHEMA_VERSION) err('schemaVersion', `must be ${THEME_SCHEMA_VERSION}`);
  if (typeof input.name !== 'string' || !THEME_NAME.test(input.name)) err('name', `must match ${THEME_NAME}`);
  if (input.description !== undefined && typeof input.description !== 'string') err('description', 'must be a string');
  if (input.parameters !== undefined) {
    if (!isObject(input.parameters)) err('parameters', 'must be an object');
    else for (const [k, v] of Object.entries(input.parameters)) {
      const spec = PARAMS[k as ParamName];
      if (!spec) { err(`parameters.${k}`, 'unknown parameter'); continue; }
      if (typeof v !== 'number' || !Number.isFinite(v) || v < spec.min || v > spec.max) err(`parameters.${k}`, `must be a number in ${spec.min}..${spec.max}`);
      else if (Math.abs((v - spec.min) / spec.step - Math.round((v - spec.min) / spec.step)) > 1e-7) err(`parameters.${k}`, `must be on the ${spec.step} step`);
    }
  }
  if (input.icons !== undefined && (typeof input.icons !== 'string' || !ICON_SET_NAME.test(input.icons))) err('icons', 'must be an icon set name');
  if (input.scheme !== undefined && !SCHEMES.includes(input.scheme as ThemeScheme)) err('scheme', `must be one of ${SCHEMES.join(', ')}`);
  if (input.color !== undefined) {
    if (!isObject(input.color)) err('color', 'must be an object');
    else {
      for (const k of Object.keys(input.color)) if (k !== 'spectrum' && k !== 'roles' && k !== 'endpoints') err(`color.${k}`, 'unknown section');
      if (input.color.endpoints !== undefined) {
        if (!isObject(input.color.endpoints)) err('color.endpoints', 'must be an object');
        else for (const [k, v] of Object.entries(input.color.endpoints)) {
          if (k !== 'white' && k !== 'black') err(`color.endpoints.${k}`, 'must be white or black');
          else if (typeof v !== 'string' || !FAMILY_NAME.test(v)) err(`color.endpoints.${k}`, "must be a family name, 'neutral' or 'pure'");
        }
      }
      if (input.color.spectrum !== undefined) {
        if (!isObject(input.color.spectrum)) err('color.spectrum', 'must be an object');
        else try { normalizeSpectrum(input.color.spectrum); } catch (e) { err('color.spectrum', (e as Error).message); }
      }
      if (input.color.roles !== undefined) {
        if (!isObject(input.color.roles)) err('color.roles', 'must be an object');
        else for (const [k, v] of Object.entries(input.color.roles)) {
          if (!ROLE_NAMES.includes(k as RoleName)) err(`color.roles.${k}`, 'unknown role');
          else if (typeof v !== 'string' || !FAMILY_NAME.test(v)) err(`color.roles.${k}`, 'must be a family name');
        }
      }
    }
  }
  if (input.typography !== undefined) {
    if (!isObject(input.typography)) err('typography', 'must be an object');
    else {
      for (const k of Object.keys(input.typography)) if (k !== 'faces' && k !== 'voices') err(`typography.${k}`, 'unknown section');
      const { faces, voices } = input.typography;
      if (faces !== undefined) {
        if (!isObject(faces)) err('typography.faces', 'must be an object');
        else for (const [k, v] of Object.entries(faces)) {
          if (!FACES.includes(k as Face)) err(`typography.faces.${k}`, 'unknown face');
          else if (typeof v !== 'string' || !FONT_STACK.test(v)) err(`typography.faces.${k}`, 'must be a font stack (family names and commas only)');
        }
      }
      if (voices !== undefined) {
        if (!isObject(voices)) err('typography.voices', 'must be an object');
        else for (const [k, v] of Object.entries(voices)) {
          if (!VOICES.includes(k as Voice)) err(`typography.voices.${k}`, 'unknown voice');
          else if (!FACES.includes(v as Face)) err(`typography.voices.${k}`, `must be one of ${FACES.join(', ')}`);
        }
      }
    }
  }
  for (const k of ['intent', 'character', 'provenance'] as const) if (input[k] !== undefined && !isObject(input[k])) err(k, 'must be an object');
  if (errors.length) return { ok: false, errors };
  const { $schema: _, ...theme } = input;
  return { ok: true, theme: theme as unknown as Theme };
}

/** The JSON Schema of a theme object, from the same exports the validator reads (contracts/theme.schema.json). */
export function themeJsonSchema() {
  const num = (k: ParamName) => ({ type: 'number', minimum: PARAMS[k].min, maximum: PARAMS[k].max, multipleOfStep: PARAMS[k].step, description: PARAMS[k].label });
  const field = (f: (typeof SPECTRUM_FIELDS)[number]) => f.multiple
    ? { type: 'array', uniqueItems: true, items: { enum: f.options }, description: f.label }
    : f.options ? { enum: f.options, description: f.label } : { type: 'number', minimum: f.min, maximum: f.max, description: f.label };
  const strict = (properties: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ type: 'object', additionalProperties: false, properties, ...extra });
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://massimo.dev/contracts/theme.schema.json',
    $comment: 'Generated by npm run theme:schema from tokens/themes/theme.ts and the exports it reads. Do not edit. multipleOfStep is the parameter step (validateThemeObject checks it).',
    title: 'Theme',
    description: 'One theme: overrides of the kit defaults, every section optional (docs/specs/theming.md#theme-object).',
    ...strict({
      $schema: { type: 'string' },
      schemaVersion: { const: THEME_SCHEMA_VERSION },
      name: { type: 'string', pattern: THEME_NAME.source },
      description: { type: 'string' },
      parameters: strict(Object.fromEntries((Object.keys(PARAMS) as ParamName[]).map((k) => [k, num(k)]))),
      icons: { type: 'string', pattern: ICON_SET_NAME.source },
      scheme: { enum: [...SCHEMES] },
      color: strict({
        spectrum: strict(Object.fromEntries(SPECTRUM_FIELDS.map((f) => [f.key, field(f)]))),
        roles: strict(Object.fromEntries(ROLE_NAMES.map((r) => [r, { type: 'string', pattern: FAMILY_NAME.source }]))),
        endpoints: strict({ white: { type: 'string', pattern: FAMILY_NAME.source }, black: { type: 'string', pattern: FAMILY_NAME.source } }),
      }),
      typography: strict({
        faces: strict(Object.fromEntries(FACES.map((f) => [f, { type: 'string', pattern: FONT_STACK.source }]))),
        voices: strict(Object.fromEntries(VOICES.map((v) => [v, { enum: [...FACES] }]))),
      }),
      intent: { type: 'object' },
      character: { type: 'object', additionalProperties: { type: 'string' } },
      provenance: { type: 'object', additionalProperties: strict({ source: { enum: ['hand', 'character', 'intent'] }, reason: { type: 'string' } }, { required: ['source'] }) },
    }, { required: ['schemaVersion', 'name'] }),
  };
}
export const themeJsonSchemaText = () => JSON.stringify(themeJsonSchema(), null, 2) + '\n';

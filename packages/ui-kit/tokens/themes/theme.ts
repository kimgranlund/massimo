// The theme object, schema version 2 (docs/planning/brand-schema.md, step 1): one format for
// everything a theme can set, used by saved themes (themes.json), the jig's Copy and Load, and
// generators. It is split into the four domain parts a brand hydrates; every section is optional and
// holds overrides of the kit defaults only:
//   geometry    parameters: unit, density, border, curvature, container radius and ladder, elevation
//   typography  parameters (type ratio, rhythm), faces (face → font stack), voices (voice → face), colors
//   color       Spectrum settings (SPECTRUM_FIELDS), the role mapping (role → requested family), endpoints
//   motion      parameters: the multipliers, springs and intents
//   icons, scheme  the icon set; the preferred scheme (auto follows the OS)
//   character   L1: one value per descriptor scale (descriptors.ts: themeFromCharacter, describeTheme)
//   intent, provenance  reserved for the brand layer (L0 intent) and who set what
// Version 1 kept every number in one flat `parameters` section; migrateTheme moves it into the parts
// (each parameter's PARAMS domain) and loadTheme accepts both.
// contracts/theme.schema.json is generated from the same exports (npm run theme:schema).
import { PARAMS, PARAM_DOMAINS, domainParams, type ParamDomain, type ParamName } from './params.ts';
import { THEME_NAME } from './validate.ts';
import { DESCRIPTORS } from './descriptor-data.ts';
import { ICON_SET_NAME } from '../../icons/sets.ts';
import { SPECTRUM_FIELDS, normalizeSpectrum, type SpectrumSettings } from '../colors/spectrum/config.ts';
import { ROLE_NAMES, isAnchorColor, type RoleName, type ColorAnchor } from '../colors/spectrum/index.ts';
import { FACES, VOICES, TEXT_COLORS, TYPE_ROLES, type Face, type Voice, type TextColor, type TypeRoleName } from '../typography/resolve.ts';

export const THEME_SCHEMA_VERSION = 2;
export const SCHEMES = ['auto', 'light', 'dark'] as const;
export type ThemeScheme = (typeof SCHEMES)[number];

type Numbers = Partial<Record<ParamName, number>>;
export interface Theme {
  schemaVersion: typeof THEME_SCHEMA_VERSION;
  name: string;
  description?: string;
  geometry?: { parameters?: Numbers };
  typography?: { parameters?: Numbers; faces?: Partial<Record<Face, string>>; voices?: Partial<Record<Voice, Face>>; colors?: Partial<Record<TypeRoleName, TextColor>> };
  /** endpoints: the neutral step (1–12) white takes from the light ramp and black from the dark ramp; 3 by default, or 'pure' (#fff, #000). */
  /** anchors: exact brand colors placed in a role's ramp (spectrum/anchors.ts): hue pinned, chroma re-shaped, nearest step overridden. */
  color?: { spectrum?: SpectrumSettings; roles?: Partial<Record<RoleName, string>>; endpoints?: { white?: number | 'pure'; black?: number | 'pure' }; anchors?: (ColorAnchor & { role: RoleName })[] };
  motion?: { parameters?: Numbers };
  icons?: string;
  scheme?: ThemeScheme;
  /** Reserved: L0 intent (subject, audience, character words, signature). */
  intent?: Record<string, unknown>;
  /** L1 character: a value per descriptor scale (DESCRIPTORS; themeFromCharacter, describeTheme). */
  character?: Record<string, string>;
  /** Who set a value and why, keyed by its path (e.g. "geometry.parameters.radius-scale"). */
  provenance?: Record<string, { source: 'hand' | 'character' | 'intent'; reason?: string }>;
}
/** The four domain parts of a theme (the parts a brand hydrates). */
export const THEME_DOMAINS = ['geometry', 'typography', 'color', 'motion'] as const;
export type ThemeDomain = (typeof THEME_DOMAINS)[number];

/** Every parameter a theme sets, flat (the input the resolvers, CSS variables and lint read). */
export const themeParameters = (t: Partial<Theme>): Numbers =>
  ({ ...t.geometry?.parameters, ...t.typography?.parameters, ...t.motion?.parameters });
/** Flat parameters back into their parts (what the jig's Copy writes). Empty parts are left out. */
export function partsFromParameters(p: Numbers): Pick<Theme, 'geometry' | 'typography' | 'motion'> {
  const out: Pick<Theme, 'geometry' | 'typography' | 'motion'> = {};
  for (const d of PARAM_DOMAINS) {
    const picked = Object.fromEntries(domainParams(d).filter((k) => p[k] !== undefined).map((k) => [k, p[k]]));
    if (Object.keys(picked).length) out[d] = { parameters: picked };
  }
  return out;
}

/**
 * A version 1 theme as version 2: its flat `parameters` move into the parts by each parameter's
 * domain (typography faces, voices and colors join the type parameters); everything else is kept.
 * Unknown parameters stay in a `parameters` section so validation reports them. A version 2 theme
 * is returned as it is.
 */
export function migrateTheme(input: unknown): unknown {
  if (!isObject(input) || input.schemaVersion !== 1) return input;
  const { parameters, typography, schemaVersion: _, ...rest } = input as Record<string, any>;
  const out: Record<string, any> = { schemaVersion: THEME_SCHEMA_VERSION, ...rest };
  const unknown: Record<string, unknown> = {};
  if (isObject(parameters)) {
    for (const [k, v] of Object.entries(parameters)) {
      const d: ParamDomain | undefined = PARAMS[k as ParamName]?.domain;
      if (!d) { unknown[k] = v; continue; }
      (out[d] ??= {}).parameters ??= {};
      out[d].parameters[k] = v;
    }
  } else if (parameters !== undefined) out.parameters = parameters;
  if (Object.keys(unknown).length) out.parameters = unknown;
  if (typography !== undefined) out.typography = isObject(typography) ? { ...(out.typography ?? {}), ...typography } : typography;
  return out;
}

/** Migrate (version 1) and validate: the one entry point for theme files and the jig's Load. */
export const loadTheme = (input: unknown) => validateThemeObject(migrateTheme(input));

/** A font stack: family names, quotes, commas, spaces, hyphens and digits only (no CSS syntax). */
export const FONT_STACK = /^[\w\s"',.-]{1,300}$/;
/** A requested Spectrum family name (resolveRoles picks the nearest generated hue). */
export const FAMILY_NAME = /^[a-z][a-z0-9-]{0,30}$/;

const TOP = new Set(['$schema', 'schemaVersion', 'name', 'description', 'geometry', 'typography', 'color', 'motion', 'icons', 'scheme', 'intent', 'character', 'provenance']);
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
  if (input.parameters !== undefined) err('parameters', input.schemaVersion === 1 ? 'version 1 layout: load it with loadTheme (migrateTheme)' : 'moved into geometry, typography and motion (schema version 2)');
  const checkParameters = (domain: ParamDomain, parameters: unknown) => {
    const path = `${domain}.parameters`;
    if (!isObject(parameters)) return err(path, 'must be an object');
    for (const [k, v] of Object.entries(parameters)) {
      const spec = PARAMS[k as ParamName];
      if (!spec) { err(`${path}.${k}`, 'unknown parameter'); continue; }
      if (spec.domain !== domain) { err(`${path}.${k}`, `belongs in ${spec.domain}.parameters`); continue; }
      if (typeof v !== 'number' || !Number.isFinite(v) || v < spec.min || v > spec.max) err(`${path}.${k}`, `must be a number in ${spec.min}..${spec.max}`);
      else if (Math.abs((v - spec.min) / spec.step - Math.round((v - spec.min) / spec.step)) > 1e-7) err(`${path}.${k}`, `must be on the ${spec.step} step`);
    }
  };
  for (const d of ['geometry', 'motion'] as const) {
    const part = input[d];
    if (part === undefined) continue;
    if (!isObject(part)) { err(d, 'must be an object'); continue; }
    for (const k of Object.keys(part)) if (k !== 'parameters') err(`${d}.${k}`, 'unknown section');
    if (part.parameters !== undefined) checkParameters(d, part.parameters);
  }
  if (input.icons !== undefined && (typeof input.icons !== 'string' || !ICON_SET_NAME.test(input.icons))) err('icons', 'must be an icon set name');
  if (input.scheme !== undefined && !SCHEMES.includes(input.scheme as ThemeScheme)) err('scheme', `must be one of ${SCHEMES.join(', ')}`);
  if (input.color !== undefined) {
    if (!isObject(input.color)) err('color', 'must be an object');
    else {
      for (const k of Object.keys(input.color)) if (k !== 'spectrum' && k !== 'roles' && k !== 'endpoints' && k !== 'anchors') err(`color.${k}`, 'unknown section');
      if (input.color.anchors !== undefined) {
        if (!Array.isArray(input.color.anchors)) err('color.anchors', 'must be a list');
        else input.color.anchors.forEach((raw: unknown, i: number) => {
          const path = `color.anchors.${i}`;
          if (!isObject(raw)) return err(path, 'must be an object');
          const a = raw as any;
          for (const k of Object.keys(a)) if (!['role', 'value', 'step', 'name'].includes(k)) err(`${path}.${k}`, 'unknown field');
          if (!ROLE_NAMES.includes(a.role)) err(`${path}.role`, 'unknown role');
          if (!isAnchorColor(a.value)) err(`${path}.value`, 'must be a #rrggbb color');
          if (a.step !== undefined && !(Number.isInteger(a.step) && a.step >= 2 && a.step <= 12)) err(`${path}.step`, 'must be a step 2–12');
          if (a.name !== undefined && typeof a.name !== 'string') err(`${path}.name`, 'must be a string');
        });
        if (Array.isArray(input.color.anchors)) {
          const roles = input.color.anchors.map((a: any) => a?.role);
          if (new Set(roles).size !== roles.length) err('color.anchors', 'one anchor per role');
        }
      }
      if (input.color.endpoints !== undefined) {
        if (!isObject(input.color.endpoints)) err('color.endpoints', 'must be an object');
        else for (const [k, v] of Object.entries(input.color.endpoints)) {
          if (k !== 'white' && k !== 'black') err(`color.endpoints.${k}`, 'must be white or black');
          else if (v !== 'pure' && !(Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12)) err(`color.endpoints.${k}`, "must be a neutral step 1–12 or 'pure'");
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
      for (const k of Object.keys(input.typography)) if (k !== 'parameters' && k !== 'faces' && k !== 'voices' && k !== 'colors') err(`typography.${k}`, 'unknown section');
      const { parameters, faces, voices, colors } = input.typography;
      if (parameters !== undefined) checkParameters('typography', parameters);
      if (colors !== undefined) {
        if (!isObject(colors)) err('typography.colors', 'must be an object');
        else for (const [k, v] of Object.entries(colors)) {
          if (!(k in TYPE_ROLES)) err(`typography.colors.${k}`, 'unknown type role');
          else if (!(String(v) in TEXT_COLORS)) err(`typography.colors.${k}`, `must be one of ${Object.keys(TEXT_COLORS).join(', ')}`);
        }
      }
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
  if (isObject(input.character)) for (const [k, v] of Object.entries(input.character)) {
    const scale = DESCRIPTORS[k];
    if (!scale) err(`character.${k}`, 'unknown descriptor scale');
    else if (!scale.values.some((x) => x.name === v)) err(`character.${k}`, `must be one of ${scale.values.map((x) => x.name).join(', ')}`);
  }
  if (errors.length) return { ok: false, errors };
  const { $schema: _, ...theme } = input;
  return { ok: true, theme: theme as unknown as Theme };
}

/** The JSON Schema of a theme object, from the same exports the validator reads (contracts/theme.schema.json). */
export function themeJsonSchema() {
  const num = (k: ParamName) => ({ type: 'number', minimum: PARAMS[k].min, maximum: PARAMS[k].max, multipleOfStep: PARAMS[k].step, description: PARAMS[k].label });
  const field = (f: (typeof SPECTRUM_FIELDS)[number]) => f.list
    ? { type: 'array', minItems: f.list, maxItems: f.list, items: { type: 'number', minimum: f.min, maximum: f.max }, description: f.label }
    : f.multiple
    ? { type: 'array', uniqueItems: true, items: { enum: f.options }, description: f.label }
    : f.options ? { enum: f.options, description: f.label } : { type: 'number', minimum: f.min, maximum: f.max, description: f.label };
  const strict = (properties: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ type: 'object', additionalProperties: false, properties, ...extra });
  const params = (d: ParamDomain) => strict(Object.fromEntries(domainParams(d).map((k) => [k, num(k)])));
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://massimo.dev/contracts/theme.schema.json',
    $comment: 'Generated by npm run theme:schema from tokens/themes/theme.ts and the exports it reads. Do not edit. multipleOfStep is the parameter step (validateThemeObject checks it).',
    title: 'Theme',
    description: 'One theme: overrides of the kit defaults in four domain parts (geometry, typography, color, motion), every section optional (docs/specs/theming.md#theme-object). Version 1 themes (one flat parameters section) load through migrateTheme.',
    ...strict({
      $schema: { type: 'string' },
      schemaVersion: { const: THEME_SCHEMA_VERSION },
      name: { type: 'string', pattern: THEME_NAME.source },
      description: { type: 'string' },
      geometry: strict({ parameters: params('geometry') }, { description: 'Unit, density, border, curvature, container radius and ladder, elevation.' }),
      icons: { type: 'string', pattern: ICON_SET_NAME.source },
      scheme: { enum: [...SCHEMES] },
      color: strict({
        spectrum: strict(Object.fromEntries(SPECTRUM_FIELDS.map((f) => [f.key, field(f)]))),
        roles: strict(Object.fromEntries(ROLE_NAMES.map((r) => [r, { type: 'string', pattern: FAMILY_NAME.source }]))),
        anchors: { type: 'array', description: 'Exact brand colors: one per role, placed at the nearest step (or the named step 2–12).', items: strict({ role: { enum: [...ROLE_NAMES] }, value: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, step: { type: 'integer', minimum: 2, maximum: 12 }, name: { type: 'string' } }, { required: ['role', 'value'] }) },
        endpoints: strict({ white: { oneOf: [{ type: 'integer', minimum: 1, maximum: 12 }, { const: 'pure' }] }, black: { oneOf: [{ type: 'integer', minimum: 1, maximum: 12 }, { const: 'pure' }] } }),
      }),
      typography: strict({
        parameters: params('typography'),
        faces: strict(Object.fromEntries(FACES.map((f) => [f, { type: 'string', pattern: FONT_STACK.source }]))),
        voices: strict(Object.fromEntries(VOICES.map((v) => [v, { enum: [...FACES] }]))),
        colors: strict(Object.fromEntries(Object.keys(TYPE_ROLES).map((r) => [r, { enum: Object.keys(TEXT_COLORS) }]))),
      }),
      motion: strict({ parameters: params('motion') }, { description: 'Duration and bounce multipliers, springs, intents.' }),
      intent: { type: 'object' },
      character: strict(Object.fromEntries(Object.values(DESCRIPTORS).map((d) => [d.id, { enum: d.values.map((v) => v.name), description: `${d.title}: ${d.reads}` }])), { description: 'L1 character: one value per descriptor scale (contracts/domains/<domain>.json descriptors).' }),
      provenance: { type: 'object', additionalProperties: strict({ source: { enum: ['hand', 'character', 'intent'] }, reason: { type: 'string' } }, { required: ['source'] }) },
    }, { required: ['schemaVersion', 'name'] }),
  };
}
export const themeJsonSchemaText = () => JSON.stringify(themeJsonSchema(), null, 2) + '\n';

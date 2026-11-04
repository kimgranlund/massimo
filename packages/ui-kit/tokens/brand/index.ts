// The Brand (docs/planning/brand-schema.md, step 4): a typed brand authored first, from a brief, a
// reference or a design, that hydrates the theme's four domain parts. It lives beside the theme
// (brand.json; contracts/brand.schema.json is generated from this module by npm run brand:schema).
//   validateBrand(input)  every problem at once
//   hydrate(brand)        → { theme (schema v2), unresolved: questions, never guesses }
//   lintBrand(brand)      advisory findings: genericness, traceability, bounds, coherence
// Precedence in hydrate: explicit brand fields, then the primary territory's canon, then the
// grounding's canon (unless the brand reacts against it), then the kit defaults. Provenance records
// the source of every value as a brand path.
import catalogue from '../../contracts/brand-catalogue.json' with { type: 'json' };
import { DESCRIPTORS } from '../themes/descriptor-data.ts';
import { themeFromCharacter } from '../themes/descriptors.ts';
import { THEME_SCHEMA_VERSION, FONT_STACK, type Theme } from '../themes/theme.ts';
import { THEME_NAME } from '../themes/validate.ts';
import { ROLE_NAMES, isAnchorColor, type RoleName } from '../colors/spectrum/index.ts';
import { ICON_SET_NAMES } from '../../icons/sets.ts';
import { FACE_CATALOGUE, FACE_DESCRIPTORS, catalogueFace, faceStack, googleFontsUrl, missingWeights, voiceWeights, type FaceDescriptor } from '../typography/faces.ts';
export { FACE_DESCRIPTORS };

export const BRAND_SCHEMA_VERSION = 1;
export const SUBJECT_KINDS = ['product', 'editorial', 'tool', 'campaign', 'institution'] as const;
export const RELATIONS = ['inherit', 'reinterpret', 'react-against'] as const;
export const MUSE_KINDS = ['person', 'work', 'object', 'place', 'archetype'] as const;
export const FACE_SOURCES = ['system', 'google', 'self-hosted'] as const;
export const TONE_WORDS = ['plain', 'warm', 'precise', 'playful', 'confident', 'calm', 'candid', 'formal', 'technical', 'poetic'] as const;
export const ANCHOR_ROLES = ROLE_NAMES;

export interface BrandFace { /** A face catalogue id (contracts/face-catalogue.json); family and descriptor then default from it. */ ref?: string; family: string; descriptor: FaceDescriptor; source?: (typeof FACE_SOURCES)[number]; url?: string; weights?: number[] }
export interface Territory {
  name: string; ref?: string; primary?: boolean; description: string;
  materials?: string[]; palette?: { name: string; value: string }[]; textures?: string; light?: string; composition?: string;
  type?: string; motion?: string; imagery?: string; outOfBounds?: string[]; character?: Record<string, string>;
}
export interface Brand {
  $schema?: string;
  schemaVersion: typeof BRAND_SCHEMA_VERSION;
  name: string;
  subject: { name: string; audience: string; primaryJob: string; kind: (typeof SUBJECT_KINDS)[number]; sources: string[] };
  grounding?: { primary: { ref?: string; name?: string; relation: (typeof RELATIONS)[number]; principles?: string[] }; secondary?: { ref?: string; name?: string; relation: (typeof RELATIONS)[number] } };
  territories?: Territory[];
  muse?: { kind: (typeof MUSE_KINDS)[number]; name: string; take: string; leave?: string };
  color?: { anchors?: { name: string; value: string; role: RoleName; step?: number; dark?: string }[]; feedback?: 'independent' | 'anchored'; character?: Record<string, string> };
  type?: { faces?: { display?: BrandFace; body?: BrandFace; utility?: BrandFace }; character?: Record<string, string> };
  form?: Record<string, string>;
  movement?: string;
  adaptivity?: string;
  voice?: { tone?: (typeof TONE_WORDS)[number][]; samples?: { action?: string; confirmation?: string; error?: string } };
  iconography?: { set?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' };
  signature?: { concept: string; scale: string; reason: string };
  avoid?: string[];
  /** One line per choice, keyed by its brand path (e.g. "form.curvature"), tying it to the subject, grounding, a territory or the muse. */
  rationale?: Record<string, string>;
}

type FaceRole = 'display' | 'body' | 'utility';
type Entry = { id: string; title: string; canon: { character: Record<string, string>; faces?: Record<string, string>; pairings?: Partial<Record<FaceRole, string[]>>; palette?: { name: string; value: string }[] }; cliches: string[]; outOfBounds?: string[] };
export const GROUNDINGS = catalogue.groundings as unknown as Entry[];
export const TERRITORIES = catalogue.territories as unknown as Entry[];
const groundingOf = (ref?: string) => GROUNDINGS.find((g) => g.id === ref);
const territoryOf = (ref?: string) => TERRITORIES.find((t) => t.id === ref);

/** Which descriptor scales each brand section may set. */
const SECTION_SCALES: Record<'color' | 'type' | 'form', string[]> = {
  color: ['vibrancy', 'harmony', 'neutral', 'emphasis'],
  type: ['type-scale'],
  form: ['scale', 'density', 'space', 'curvature', 'corner', 'line', 'elevation'],
};
const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 400) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function validateBrand(raw: unknown): { ok: true; brand: Brand } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);
  if (!isObject(raw)) return { ok: false, errors: ['brand: must be an object'] };
  // A copy: normalization below (face refs) never touches the caller's object. JSON data only.
  let input: Record<string, any>;
  try { input = structuredClone(raw); } catch { return { ok: false, errors: ['brand: must be plain JSON data (no functions or symbols)'] }; }
  const list = (path: string, v: unknown, what = 'a list'): unknown[] => { if (v === undefined) return []; if (Array.isArray(v)) return v; err(path, `must be ${what}`); return []; };
  const TOP = ['$schema', 'schemaVersion', 'name', 'subject', 'grounding', 'territories', 'muse', 'color', 'type', 'form', 'movement', 'adaptivity', 'voice', 'iconography', 'signature', 'avoid', 'rationale'];
  for (const k of Object.keys(input)) if (!TOP.includes(k)) err(k, 'unknown section');
  if (input.schemaVersion !== BRAND_SCHEMA_VERSION) err('schemaVersion', `must be ${BRAND_SCHEMA_VERSION}`);
  if (typeof input.name !== 'string' || !THEME_NAME.test(input.name)) err('name', `must match ${THEME_NAME}`);
  const s = input.subject;
  if (!isObject(s)) err('subject', 'is required: name, audience, primaryJob, kind, sources');
  else {
    for (const k of ['name', 'audience', 'primaryJob'] as const) if (!str(s[k])) err(`subject.${k}`, 'must be a non-empty string');
    if (!SUBJECT_KINDS.includes(s.kind)) err('subject.kind', `must be one of ${SUBJECT_KINDS.join(', ')}`);
    if (!Array.isArray(s.sources) || !s.sources.length || !s.sources.every((x: unknown) => str(x))) err('subject.sources', 'must list at least one source of visual character');
  }
  const scaleValue = (path: string, id: string, v: unknown) => {
    const scale = DESCRIPTORS[id];
    if (!scale) err(path, 'unknown descriptor scale');
    else if (!scale.values.some((x) => x.name === v)) err(path, `must be one of ${scale.values.map((x) => x.name).join(', ')}`);
  };
  const g = input.grounding;
  if (g !== undefined) {
    if (!isObject(g) || !isObject(g.primary)) err('grounding', 'must have a primary');
    else for (const k of ['primary', 'secondary'] as const) {
      const x = g[k]; if (x === undefined) continue;
      if (!isObject(x)) { err(`grounding.${k}`, 'must be an object'); continue; }
      if (!x.ref && !str(x.name)) err(`grounding.${k}`, 'needs a catalogue ref or a name');
      if (x.ref !== undefined && !groundingOf(x.ref)) err(`grounding.${k}.ref`, `unknown grounding (one of ${GROUNDINGS.map((e) => e.id).join(', ')})`);
      if (!RELATIONS.includes(x.relation)) err(`grounding.${k}.relation`, `must be one of ${RELATIONS.join(', ')}`);
    }
  }
  if (input.territories !== undefined) {
    if (!Array.isArray(input.territories) || input.territories.length < 1 || input.territories.length > 3) err('territories', 'must list 1–3 territories');
    else {
      input.territories.forEach((t: any, i: number) => {
        const p = `territories.${i}`;
        if (!isObject(t)) return err(p, 'must be an object');
        if (!str(t.name)) err(`${p}.name`, 'is required');
        if (!str(t.description, 1000)) err(`${p}.description`, 'is required');
        if (t.ref !== undefined && !territoryOf(t.ref)) err(`${p}.ref`, `unknown territory (one of ${TERRITORIES.map((e) => e.id).join(', ')})`);
        for (const c of list(`${p}.palette`, t.palette) as any[]) if (!isAnchorColor(c?.value)) err(`${p}.palette`, 'colors must be #rrggbb');
        for (const k of ['materials'] as const) for (const x of list(`${p}.${k}`, t[k])) if (!str(x)) err(`${p}.${k}`, 'must be strings');
        for (const [k, v] of Object.entries(t.character ?? {})) scaleValue(`${p}.character.${k}`, k, v);
        for (const o of list(`${p}.outOfBounds`, t.outOfBounds)) if (typeof o !== 'string') err(`${p}.outOfBounds`, 'must be strings');
        if (t.character !== undefined && !isObject(t.character)) err(`${p}.character`, 'must be an object');
      });
      if (input.territories.filter((t: any) => t?.primary).length > 1) err('territories', 'at most one primary');
    }
  }
  const m = input.muse;
  if (m !== undefined) {
    if (!isObject(m)) err('muse', 'must be an object');
    else {
      if (!MUSE_KINDS.includes(m.kind)) err('muse.kind', `must be one of ${MUSE_KINDS.join(', ')}`);
      if (!str(m.name)) err('muse.name', 'is required');
      if (!str(m.take)) err('muse.take', 'names the quality to take (never a copy)');
    }
  }
  const c = input.color;
  if (c !== undefined) {
    if (!isObject(c)) err('color', 'must be an object');
    else {
      const roles: string[] = [];
      (list('color.anchors', c.anchors) as any[]).forEach((a: any, i: number) => {
        const p = `color.anchors.${i}`;
        if (!str(a?.name)) err(`${p}.name`, 'is required');
        if (!isAnchorColor(a?.value)) err(`${p}.value`, 'must be #rrggbb');
        if (!ROLE_NAMES.includes(a?.role)) err(`${p}.role`, `must be one of ${ROLE_NAMES.join(', ')}`);
        if (a?.step !== undefined && !(Number.isInteger(a.step) && a.step >= 2 && a.step <= 12)) err(`${p}.step`, 'must be a step 2–12');
        if (a?.dark !== undefined && !isAnchorColor(a.dark)) err(`${p}.dark`, 'must be #rrggbb');
        roles.push(a?.role);
      });
      if (new Set(roles).size !== roles.length) err('color.anchors', 'one anchor per role');
      if (c.anchors && (c.anchors.length < 1 || c.anchors.length > 8)) err('color.anchors', 'must list 1–8 anchors');
      if (c.feedback !== undefined && c.feedback !== 'independent' && c.feedback !== 'anchored') err('color.feedback', 'must be independent or anchored');
      for (const [k, v] of Object.entries(c.character ?? {})) { if (!SECTION_SCALES.color.includes(k)) err(`color.character.${k}`, `not a color scale (${SECTION_SCALES.color.join(', ')})`); else scaleValue(`color.character.${k}`, k, v); }
    }
  }
  const ty = input.type;
  if (ty !== undefined) {
    if (!isObject(ty)) err('type', 'must be an object');
    else {
      for (const [role, raw] of Object.entries<any>(ty.faces ?? {})) {
        const p = `type.faces.${role}`;
        const f = resolveFace(raw);
        if (f !== raw) ty.faces[role] = f;
        if (!['display', 'body', 'utility'].includes(role)) { err(p, 'must be display, body or utility'); continue; }
        if (f?.ref !== undefined && !FACE_CATALOGUE.some((x) => x.id === f.ref)) err(`${p}.ref`, 'unknown catalogue face');
        if (!isObject(f) || typeof f.family !== 'string' || !/^[\w\s.-]{1,60}$/.test(f.family)) err(`${p}.family`, 'must be a family name');
        if (!FACE_DESCRIPTORS.includes(f?.descriptor)) err(`${p}.descriptor`, `must be one of ${FACE_DESCRIPTORS.join(', ')}`);
        if (f?.source !== undefined && !FACE_SOURCES.includes(f.source)) err(`${p}.source`, `must be one of ${FACE_SOURCES.join(', ')}`);
        if (f?.source === 'self-hosted' && !(typeof f.url === 'string' && /^https:\/\//.test(f.url))) err(`${p}.url`, 'a self-hosted face needs an https url');
        if (f?.weights !== undefined && !(Array.isArray(f.weights) && f.weights.every((w: unknown) => Number.isInteger(w) && (w as number) >= 100 && (w as number) <= 900))) err(`${p}.weights`, 'must be weights 100–900');
      }
      for (const [k, v] of Object.entries(ty.character ?? {})) { if (!SECTION_SCALES.type.includes(k)) err(`type.character.${k}`, `not a type scale (${SECTION_SCALES.type.join(', ')})`); else scaleValue(`type.character.${k}`, k, v); }
    }
  }
  for (const [k, v] of Object.entries(isObject(input.form) ? input.form : {})) { if (!SECTION_SCALES.form.includes(k)) err(`form.${k}`, `not a form scale (${SECTION_SCALES.form.join(', ')})`); else scaleValue(`form.${k}`, k, v); }
  if (input.form !== undefined && !isObject(input.form)) err('form', 'must be an object');
  if (input.movement !== undefined) scaleValue('movement', 'movement', input.movement);
  if (input.adaptivity !== undefined) scaleValue('adaptivity', 'adaptivity', input.adaptivity);
  if (input.voice !== undefined) {
    if (!isObject(input.voice)) err('voice', 'must be an object');
    else for (const w of list('voice.tone', input.voice.tone) as any[]) if (!TONE_WORDS.includes(w)) err('voice.tone', `words come from ${TONE_WORDS.join(', ')}`);
  }
  if (input.iconography?.set !== undefined && !ICON_SET_NAMES.includes(input.iconography.set)) err('iconography.set', `must be one of ${ICON_SET_NAMES.join(', ')}`);
  if (input.signature !== undefined) {
    const sg = input.signature;
    if (!isObject(sg) || !DESCRIPTORS[sg.scale] || !str(sg.reason)) err('signature', 'names a descriptor scale it pushes and a reason');
  }
  if (input.avoid !== undefined && !(Array.isArray(input.avoid) && input.avoid.every((x: unknown) => str(x)))) err('avoid', 'must be a list of strings');
  if (input.rationale !== undefined && !(isObject(input.rationale) && Object.values(input.rationale).every((x) => str(x, 600)))) err('rationale', 'must map brand paths to one line each');
  if (errors.length) return { ok: false, errors };
  const { $schema: _, ...brand } = input;
  return { ok: true, brand: brand as unknown as Brand };
}

/** A face with its catalogue ref resolved: the family, descriptor and source it leaves out filled in. */
export function resolveFace<T>(raw: T): T {
  const entry = isObject(raw) && raw.ref ? FACE_CATALOGUE.find((x) => x.id === raw.ref) : undefined;
  return entry ? { family: entry.family, descriptor: entry.descriptor, source: entry.source, ...(raw as object) } as T : raw;
}
const facesOf = (b: Brand) => Object.fromEntries(Object.entries(b.type?.faces ?? {}).map(([k, f]) => [k, resolveFace(f)])) as NonNullable<NonNullable<Brand['type']>['faces']>;

/** The primary territory: the one marked primary, else the first. */
export const primaryTerritory = (b: Brand) => b.territories?.find((t) => t.primary) ?? b.territories?.[0];

/** The brand's character per scale, with the brand path that set each value (the precedence above). */
export function brandCharacter(b: Brand): { character: Record<string, string>; from: Record<string, string>; unresolved: string[] } {
  const character: Record<string, string> = {}, from: Record<string, string> = {}, unresolved: string[] = [];
  const set = (scale: string, value: string, path: string) => { if (DESCRIPTORS[scale]?.values.some((v) => v.name === value)) { character[scale] = value; from[scale] = path; } };
  // Lowest first; later sources overwrite.
  const g = b.grounding?.primary;
  if (g?.ref && g.relation !== 'react-against') for (const [k, v] of Object.entries(groundingOf(g.ref)!.canon.character)) set(k, v, `grounding:${g.ref}`);
  if (g && !g.ref) unresolved.push(`grounding.primary: "${g.name}" is not in the catalogue; nearest entries: ${GROUNDINGS.slice(0, 3).map((e) => e.id).join(', ')} … (choose a ref or describe its canon)`);
  const t = primaryTerritory(b);
  if (t?.ref) for (const [k, v] of Object.entries(territoryOf(t.ref)!.canon.character)) set(k, v, `territories:${t.name} (${t.ref})`);
  for (const [k, v] of Object.entries(t?.character ?? {})) set(k, v, `territories:${t!.name}.character.${k}`);
  for (const [k, v] of Object.entries(b.color?.character ?? {})) set(k, v, `color.character.${k}`);
  for (const [k, v] of Object.entries(b.type?.character ?? {})) set(k, v, `type.character.${k}`);
  for (const [k, v] of Object.entries(b.form ?? {})) set(k, v, `form.${k}`);
  if (b.movement) set('movement', b.movement, 'movement');
  if (b.adaptivity) set('adaptivity', b.adaptivity, 'adaptivity');
  if (b.iconography?.set) set('iconography', b.iconography.set, 'iconography.set');
  return { character, from, unresolved };
}

const stack = (f: BrandFace) => faceStack(f.family, f.descriptor);

/** Brand → theme (schema v2) with provenance, and the questions it could not answer. */
export function hydrate(b: Brand): { theme: Theme; unresolved: string[] } {
  const { character, from, unresolved } = brandCharacter(b);
  const { theme: parts, unresolved: u2 } = themeFromCharacter(character);
  unresolved.push(...u2);
  const provenance: NonNullable<Theme['provenance']> = {};
  for (const [path, p] of Object.entries(parts.provenance ?? {})) {
    const scale = p.reason?.split('.')[0] ?? '';
    provenance[path] = { source: 'brand', reason: `${from[scale] ?? scale} → ${p.reason}` };
  }
  const theme: Theme = { schemaVersion: THEME_SCHEMA_VERSION, name: b.name, description: `${b.subject.name}: ${b.subject.primaryJob}`, ...parts, character } as Theme;
  // Color anchors.
  if (b.color?.anchors?.length) {
    theme.color = { ...(theme.color ?? {}), anchors: b.color.anchors.map((a) => ({ role: a.role, value: a.value.toLowerCase(), name: a.name, ...(a.step ? { step: a.step } : {}), ...(a.dark ? { dark: a.dark.toLowerCase() } : {}) })) };
    b.color.anchors.forEach((a, i) => { provenance[`color.anchors.${i}`] = { source: 'brand', reason: `color.anchors.${i} (${a.name})` }; });
  } else unresolved.push('color.anchors: no brand colors; the palette is generated from the character alone (name 2–6 anchors, or confirm that is intended)');
  if (b.color?.feedback === 'anchored' && !b.color.anchors?.some((a) => ['critical', 'warning', 'success', 'info'].includes(a.role))) unresolved.push('color.feedback: anchored, but no critical, warning, success or info anchor');
  // Faces and voices.
  const faces = facesOf(b);
  // A face the brand leaves out comes from its grounding's pairings (unless it reacts against it).
  const g = b.grounding?.primary;
  const pairings = g?.ref && g.relation !== 'react-against' ? groundingOf(g.ref)?.canon.pairings : undefined;
  const fromGrounding = new Set<string>();
  for (const role of ['display', 'body', 'utility'] as const) {
    const id = pairings?.[role]?.[0];
    if (!faces[role] && id) { (faces as any)[role] = resolveFace({ ref: id }); fromGrounding.add(role); }
  }
  const tf: NonNullable<Theme['typography']> = { ...(theme.typography ?? {}) };
  const setFace = (face: 'display' | 'sans' | 'serif' | 'mono', f: BrandFace, path: string) => {
    const s = stack(f);
    if (!FONT_STACK.test(s)) { unresolved.push(`${path}.family: "${f.family}" cannot be a font stack`); return; }
    (tf.faces ??= {})[face] = s; provenance[`typography.faces.${face}`] = { source: 'brand', reason: fromGrounding.has(path.split('.').pop()!) ? `grounding:${g!.ref} pairing → ${path}` : path };
    // A web face: its stylesheet (Google from the catalogue, or the brand's self-hosted url).
    const entry = catalogueFace(f.family);
    const url = f.source === 'self-hosted' ? f.url : (entry?.source === 'google' || f.source === 'google') && entry ? googleFontsUrl(entry, f.weights) : undefined;
    if (url && !(tf.sources ??= []).some((x) => x.family === f.family)) { tf.sources.push({ family: f.family, url }); provenance[`typography.sources.${tf.sources.length - 1}`] = { source: 'brand', reason: path }; }
    if (f.source === 'google' && !entry) unresolved.push(`${path}: "${f.family}" is not in the face catalogue, so its stylesheet and weights are unknown (add it, or pick a catalogue face)`);
  };
  if (faces.body) {
    const slot = faces.body.descriptor === 'serif' || faces.body.descriptor === 'slab' ? 'serif' : faces.body.descriptor === 'mono' ? 'mono' : 'sans';
    setFace(slot, faces.body, 'type.faces.body');
    tf.voices = { ...tf.voices, body: slot, heading: slot };
  } else unresolved.push('type.faces.body: no body face; the kit default stack is used');
  if (faces.display) { setFace('display', faces.display, 'type.faces.display'); tf.voices = { ...tf.voices, display: 'display', heading: 'display' }; }
  if (faces.utility) { setFace('mono', faces.utility, 'type.faces.utility'); tf.voices = { ...tf.voices, code: 'mono', ...(faces.utility.descriptor === 'mono' ? {} : { numeric: 'mono' }) }; }
  if (tf.voices) for (const v of Object.keys(tf.voices)) provenance[`typography.voices.${v}`] = { source: 'brand', reason: 'type.faces' };
  if (Object.keys(tf).length) theme.typography = tf;
  theme.provenance = provenance;
  return { theme, unresolved };
}

export type BrandFinding = { id: string; severity: 'warning' | 'info'; message: string };
const hueOf = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.05) return undefined;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
/** HSL-style saturation of a hex color (0 grey … 1 full). */
const saturation = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
};
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

/** Advisory checks on a brand: they warn, never block. */
export function lintBrand(b: Brand): BrandFinding[] {
  const out: BrandFinding[] = [];
  const { character, from } = brandCharacter(b);
  // Frame: grounding, a territory and a muse are what make a brand specific.
  if (!b.grounding) out.push({ id: 'brand.frame-grounding', severity: 'warning', message: 'no grounding: name the heritage or movement the brand stands in' });
  if (!b.territories?.length) out.push({ id: 'brand.frame-territory', severity: 'warning', message: 'no visual territory: name the world the brand draws from' });
  if (!b.muse) out.push({ id: 'brand.frame-muse', severity: 'info', message: 'no muse: the signature has nothing to answer to' });
  // Traceability: every explicit choice has a rationale.
  const explicit = Object.values(from).filter((p) => /^(form|color\.character|type\.character|movement|adaptivity|iconography)/.test(p));
  const missing = explicit.filter((p) => !b.rationale?.[p.replace(/\.character\./, '.character.')]);
  if (missing.length) out.push({ id: 'brand.rationale', severity: 'info', message: `no rationale for ${missing.join(', ')}` });
  // Signature: the pushed scale leaves its default, and it is the brand's to push.
  if (!b.signature) out.push({ id: 'brand.signature', severity: 'warning', message: 'no signature: pick one concept to push and keep the others quieter' });
  else if ((character[b.signature.scale] ?? DESCRIPTORS[b.signature.scale]?.default) === DESCRIPTORS[b.signature.scale]?.default) out.push({ id: 'brand.signature', severity: 'warning', message: `the signature pushes ${b.signature.scale}, but it sits at its default` });
  // Bounds: a primary territory's out-of-bounds values.
  const t = primaryTerritory(b);
  const bounds = [...(t?.outOfBounds ?? []), ...((t?.ref && territoryOf(t.ref)?.outOfBounds) || [])];
  for (const o of bounds) { const [scale, value] = o.split('.'); if (character[scale] === value) out.push({ id: 'brand.out-of-bounds', severity: 'warning', message: `${scale} ${value} is out of bounds for the ${t!.name} territory (set by ${from[scale]})` }); }
  // Muse: take a quality.
  if (b.muse && /\b(copy|replicate|clone|exactly)\b/i.test(b.muse.take)) out.push({ id: 'brand.muse-copy', severity: 'warning', message: 'the muse take reads as a copy; name a quality to take' });
  // Coherence: feedback anchored apart from the primary.
  const primary = b.color?.anchors?.find((a) => a.role === 'primary');
  const ph = primary && hueOf(primary.value);
  for (const a of b.color?.anchors ?? []) {
    if (a.role !== 'critical' || ph === undefined) continue;
    const h = hueOf(a.value);
    if (h !== undefined && hueGap(h, ph) < 30) out.push({ id: 'brand.feedback-hue', severity: 'warning', message: `critical ${a.value} is within 30° of the primary's hue, so errors read as brand` });
  }
  // Genericness: the known defaults (artifact-design) as predicates.
  // Accents only: saturated, non-neutral anchors (a clay neutral is not a terracotta accent).
  const anchors = (b.color?.anchors ?? []).filter((a) => a.role !== 'neutral' && saturation(a.value) >= 0.35);
  const hues = anchors.map((a) => hueOf(a.value)).filter((h): h is number => h !== undefined);
  const display = facesOf(b).display?.descriptor;
  if (display === 'serif' && hues.some((h) => h >= 10 && h <= 35) && b.adaptivity !== 'dark-first') out.push({ id: 'brand.cliche', severity: 'warning', message: 'serif display with a terracotta accent on a light page: the warm-cream default' });
  if (b.adaptivity === 'dark-first' && anchors.length === 1 && hues.some((h) => (h >= 70 && h <= 150) || (h >= 5 && h <= 20))) out.push({ id: 'brand.cliche', severity: 'warning', message: 'dark-first with one acid accent: the near-black default' });
  const pa = anchors.find((a) => a.role === 'primary'), sa = anchors.find((a) => a.role === 'secondary');
  if (pa && sa && hueOf(pa.value)! >= 255 && hueOf(pa.value)! <= 300 && hueOf(sa.value)! >= 200 && hueOf(sa.value)! < 255) out.push({ id: 'brand.cliche', severity: 'warning', message: 'purple primary with a blue secondary: the gradient-hero default' });
  if (character.curvature === 'pill' && character.elevation === 'floating') out.push({ id: 'brand.cliche', severity: 'warning', message: 'pill curvature with floating elevation: everything rounded and lifted' });
  // Faces: each brand face against the catalogue: known, and serving the weights its voices need.
  const fs = facesOf(b);
  const need = voiceWeights(new Set(fs.display?.descriptor === 'serif' || fs.body?.descriptor === 'serif' ? ['display', 'heading'] as const : []));
  const roleVoices: Record<string, (keyof typeof need)[]> = { display: ['display', 'heading'], body: ['body', 'ui'], utility: ['code', 'numeric'] };
  for (const [role, f] of Object.entries(facesOf(b))) {
    const entry = catalogueFace(f!.family);
    if (!entry) { out.push({ id: 'brand.face-catalogue', severity: 'info', message: `${role} face ${f!.family} is not in the face catalogue: its weights and metrics are unchecked` }); continue; }
    const want = [...new Set(roleVoices[role].flatMap((v) => need[v]))];
    const missing = missingWeights(entry, want);
    if (missing.length) out.push({ id: 'brand.face-weights', severity: 'warning', message: `${role} face ${entry.family} (${entry.weights.min}–${entry.weights.max}) cannot render weight ${missing.join(', ')}; the browser fakes it` });
    if (entry.descriptor !== f!.descriptor) out.push({ id: 'brand.face-descriptor', severity: 'info', message: `${role} face ${entry.family} is ${entry.descriptor} in the catalogue, not ${f!.descriptor}` });
  }
  // A grounding reacted against: its canon is rejected, so a choice that matches it is worth a second look.
  for (const g of [b.grounding?.primary, b.grounding?.secondary]) {
    if (g?.relation !== 'react-against' || !g.ref) continue;
    const canon = groundingOf(g.ref)!.canon.character;
    const hits = Object.entries(canon).filter(([k, v]) => character[k] === v).map(([k, v]) => `${k}.${v} (from ${from[k]})`);
    if (hits.length) out.push({ id: 'brand.reacted-canon', severity: 'info', message: `matches the canon of ${g.ref}, which the brand reacts against: ${hits.join(', ')}` });
  }
  for (const a of b.avoid ?? []) {
    const [scale, value] = a.split('.');
    if (DESCRIPTORS[scale] && character[scale] === value) out.push({ id: 'brand.avoid', severity: 'warning', message: `${a} is on the brand's avoid list (set by ${from[scale]})` });
  }
  return out;
}

/** The JSON Schema of a brand (contracts/brand.schema.json). */
export function brandJsonSchema() {
  const strict = (properties: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({ type: 'object', additionalProperties: false, properties, ...extra });
  const scales = (ids: string[]) => strict(Object.fromEntries(ids.map((id) => [id, { enum: DESCRIPTORS[id].values.map((v) => v.name), description: `${DESCRIPTORS[id].title}: ${DESCRIPTORS[id].reads}` }])));
  // The same caps as the validator (str): 400 by default, 1000 for a territory description, 600 for a rationale.
  const text = { type: 'string', minLength: 1, maxLength: 400 };
  const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
  const face = strict({ ref: { enum: FACE_CATALOGUE.map((f) => f.id), description: 'A face catalogue id; fills family, descriptor and source.' }, family: { type: 'string', pattern: '^[\\w\\s.-]{1,60}$' }, descriptor: { enum: [...FACE_DESCRIPTORS] }, source: { enum: [...FACE_SOURCES] }, url: { type: 'string', pattern: '^https://' }, weights: { type: 'array', items: { type: 'integer', minimum: 100, maximum: 900 } } }, { anyOf: [{ required: ['ref'] }, { required: ['family', 'descriptor'] }] });
  const ground = (required: string[]) => strict({ ref: { enum: GROUNDINGS.map((g) => g.id) }, name: text, relation: { enum: [...RELATIONS] }, principles: { type: 'array', items: text } }, { required });
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://massimo.dev/contracts/brand.schema.json',
    $comment: 'Generated by npm run brand:schema from tokens/brand/index.ts, contracts/brand-catalogue.json and the descriptor scales. Do not edit.',
    title: 'Brand',
    description: 'A brand that hydrates a theme (docs/planning/brand-schema.md): its frame (subject, grounding, territories, muse), its closed choices (descriptor values), anchors, faces, voice and signature.',
    ...strict({
      $schema: { type: 'string' },
      schemaVersion: { const: BRAND_SCHEMA_VERSION },
      name: { type: 'string', pattern: THEME_NAME.source },
      subject: strict({ name: text, audience: text, primaryJob: text, kind: { enum: [...SUBJECT_KINDS] }, sources: { type: 'array', minItems: 1, items: text } }, { required: ['name', 'audience', 'primaryJob', 'kind', 'sources'] }),
      grounding: strict({ primary: ground(['relation']), secondary: ground(['relation']) }, { required: ['primary'] }),
      territories: { type: 'array', minItems: 1, maxItems: 3, items: strict({
        name: text, ref: { enum: TERRITORIES.map((t) => t.id) }, primary: { type: 'boolean' }, description: { ...text, maxLength: 1000 },
        materials: { type: 'array', items: text }, palette: { type: 'array', items: strict({ name: text, value: hex }, { required: ['name', 'value'] }) },
        textures: text, light: text, composition: text, type: text, motion: text, imagery: text,
        outOfBounds: { type: 'array', items: { type: 'string', description: '<scale>.<value> or free text' } },
        character: scales(Object.keys(DESCRIPTORS)),
      }, { required: ['name', 'description'] }) },
      muse: strict({ kind: { enum: [...MUSE_KINDS] }, name: text, take: text, leave: text }, { required: ['kind', 'name', 'take'] }),
      color: strict({
        anchors: { type: 'array', minItems: 1, maxItems: 8, items: strict({ name: text, value: hex, role: { enum: [...ROLE_NAMES] }, step: { type: 'integer', minimum: 2, maximum: 12 }, dark: hex }, { required: ['name', 'value', 'role'] }) },
        feedback: { enum: ['independent', 'anchored'] },
        character: scales(SECTION_SCALES.color),
      }),
      type: strict({ faces: strict({ display: face, body: face, utility: face }), character: scales(SECTION_SCALES.type) }),
      form: scales(SECTION_SCALES.form),
      movement: { enum: DESCRIPTORS.movement.values.map((v) => v.name) },
      adaptivity: { enum: DESCRIPTORS.adaptivity.values.map((v) => v.name) },
      voice: strict({ tone: { type: 'array', items: { enum: [...TONE_WORDS] } }, samples: strict({ action: text, confirmation: text, error: text }) }),
      iconography: strict({ set: { enum: [...ICON_SET_NAMES] }, weight: { enum: ['thin', 'light', 'regular', 'bold'] } }),
      signature: strict({ concept: text, scale: { enum: Object.keys(DESCRIPTORS) }, reason: text }, { required: ['scale', 'reason'] }),
      avoid: { type: 'array', items: text },
      rationale: { type: 'object', additionalProperties: { ...text, maxLength: 600 } },
    }, { required: ['schemaVersion', 'name', 'subject'] }),
  };
}
export const brandJsonSchemaText = () => JSON.stringify(brandJsonSchema(), null, 2) + '\n';

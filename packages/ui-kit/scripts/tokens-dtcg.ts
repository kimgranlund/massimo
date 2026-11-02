// Generates the DTCG (2025.10) token files in tokens/dtcg/ from the kit's sources:
//   geometry.dtcg.json      every geometry row (resolver), typed inputs
//   typography.dtcg.json    faces (fontFamily), voices (aliases), role styles (typography), role metrics
//   color.light.dtcg.json   Spectrum ramps (oklch color tokens) and roles (aliases) and shadows, light scheme
//   color.dark.dtcg.json    the same, dark scheme
//   motion.dtcg.json        springs: settle duration, cubic-bezier fit, transition; exact linear() in extensions
//   index.json              file list (not a DTCG file)
// DTCG has no arithmetic: $value is the default-theme value; com.massimo.formula carries the rule and
// com.massimo.bySize the value at every size. test/tokens-dtcg.test.ts validates every file against
// the official schema and fails when a committed file is stale. Run: npm run tokens:dtcg
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GEOMETRY_DEFAULTS, SIZES, CONTAINERS } from '../tokens/geometry/resolve.ts';
import { FACES, VOICES, DEFAULT_VOICES, FONT_FAMILIES, TYPE_ROLES, TYPE_DEFAULTS, resolveType, type TypeRoleName } from '../tokens/typography/resolve.ts';
import { ROLE_STEPS, SHADOWS, roleStep } from '../tokens/colors/spectrum/index.ts';
import DEFAULTS from '../tokens/colors/spectrum/defaults.json' with { type: 'json' };
import { rows, type Row } from './geometry-csv.ts';
import { RESOLVED_SPRINGS, fitBezier } from '../tokens/motion/index.ts';

type Json = Record<string, any>;
const SCHEMA = 'https://www.designtokens.org/schemas/2025.10/format.json';
const round = (n: number) => Math.round(n * 1000) / 1000;
const px = (n: number) => ({ value: round(n), unit: 'px' });
const NUMBER_ROWS = new Set(['in.s', 'in.k', 'in.typeRatio', 'in.typeRhythm']);

/** Put a token at a dotted path, refusing group/token clashes. */
function put(tree: Json, path: string[], token: Json) {
  let g = tree;
  for (const key of path.slice(0, -1)) {
    g[key] ??= {};
    if ('$value' in g[key]) throw new Error(`${path.join('.')}: ${key} is already a token`);
    g = g[key];
  }
  const leaf = path.at(-1)!;
  if (g[leaf]) throw new Error(`${path.join('.')}: duplicate`);
  g[leaf] = token;
}

const rowToken = (r: Row): Json => {
  const isNumber = NUMBER_ROWS.has(r.id);
  const v = r.value(GEOMETRY_DEFAULTS.unit);
  return {
    $type: isNumber ? 'number' : 'dimension',
    $value: isNumber ? round(v) : px(v),
    $description: [r.element, r.quantity, r.notes].filter(Boolean).join(' · '),
    $extensions: {
      'com.massimo.formula': r.formula,
      'com.massimo.status': r.status,
      'com.massimo.bySize': Object.fromEntries(SIZES.map((u) => [`u=${u}`, round(r.value(u))])),
    },
  };
};

const rowPath = (id: string) => { const [head, ...rest] = id.split('.'); return [head === 'in' ? 'input' : head, ...rest]; };

/** oklch(L C H) or oklch(L C H / A) -> DTCG color value. */
function oklch(css: string): Json {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(css);
  if (!m) throw new Error(`not an oklch color: ${css}`);
  const out: Json = { colorSpace: 'oklch', components: [Number(m[1]), Number(m[2]), Number(m[3])] };
  if (m[4] !== undefined) out.alpha = Number(m[4]);
  return out;
}
const hexColor = (hex: string): Json => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return { colorSpace: 'srgb', components: [0, 2, 4].map((i) => round(parseInt(full.slice(i, i + 2), 16) / 255)), hex: `#${full}` };
};

const header = (description: string): Json => ({ $schema: SCHEMA, $description: description });

export function geometryTokens(): Json {
  const tree = header(`ui-kit geometry. Everything derives from u (size, 2–12px), B (border) and s (radius scale). $value is resolved at u=${GEOMETRY_DEFAULTS.unit}, B=${GEOMETRY_DEFAULTS.border}, s=${GEOMETRY_DEFAULTS.radiusScale}; com.massimo.formula gives the rule and com.massimo.bySize the value at every size.`);
  for (const r of rows) {
    if (r.family === 'type' || r.id === 'in.typeRatio' || r.id === 'in.typeRhythm') continue; // typography file
    if (Number.isNaN(r.value(GEOMETRY_DEFAULTS.unit))) continue;
    put(tree, rowPath(r.id), rowToken(r));
  }
  // Container ladder inputs: unitless multiples of u (theme parameters pad-<level>, gap-<level>).
  for (const [level, spec] of Object.entries(CONTAINERS)) {
    for (const kind of ['pad', 'gap'] as const) put(tree, ['input', 'container', level, kind], {
      $type: 'number', $value: spec.padding,
      $description: `${level} ${kind === 'pad' ? 'padding' : 'gap'} in units of u (theme parameter ${kind}-${level})`,
    });
  }
  return tree;
}

export function typographyTokens(): Json {
  const tree = header(`ui-kit typography: faces -> voices -> roles. Role size = (10px + u) × ratio^step or n·u; line heights round up to rhythm × u. $value at u=${TYPE_DEFAULTS.unit}, ratio ${TYPE_DEFAULTS.ratio}, rhythm ${TYPE_DEFAULTS.rhythm}u.`);
  const stack = (s: string) => s.split(',').map((f) => f.trim().replace(/^"|"$/g, ''));
  put(tree, ['input', 'type-ratio'], { $type: 'number', $value: TYPE_DEFAULTS.ratio, $description: 'Type ratio (theme type-ratio, 1–1.5)' });
  put(tree, ['input', 'type-rhythm'], { $type: 'number', $value: TYPE_DEFAULTS.rhythm, $description: 'Line-height rhythm in units of u (theme type-rhythm: 0 natural, 0.5, 1)' });
  for (const f of FACES) put(tree, ['font', 'face', f], { $type: 'fontFamily', $value: stack(FONT_FAMILIES[f]), $description: `Face ${f} (--fonts-${f})` });
  for (const v of VOICES) put(tree, ['font', 'voice', v], { $type: 'fontFamily', $value: `{font.face.${DEFAULT_VOICES[v]}}`, $description: `Voice ${v}; repoint with data-font-${v}="<face>"` });
  for (const role of Object.keys(TYPE_ROLES) as TypeRoleName[]) {
    const r = TYPE_ROLES[role], t = resolveType(role);
    put(tree, ['typography', role], {
      $type: 'typography',
      $value: {
        fontFamily: `{font.voice.${r.voice}}`,
        fontSize: px(t.size),
        fontWeight: t.weight,
        letterSpacing: px(t.tracking * t.size),
        lineHeight: round((t.lineHeightRatio ?? t.lineHeight / t.size)),
      },
      $description: `${r.label}${'upper' in r ? ' · uppercase' : ''}`,
      $extensions: { 'com.massimo.tracking': `${r.tracking}em`, 'com.massimo.lineHeightPx': round(t.lineHeightRatio ? t.lineHeightRatio * t.size : t.lineHeight), 'com.massimo.textTransform': t.transform },
    });
  }
  for (const r of rows) if (r.family === 'type') put(tree, rowPath(r.id), rowToken(r));
  return tree;
}

type Snapshot = { roles: Record<string, string>; onSolid: Record<'light' | 'dark', string>; light: Record<string, string[]>; dark: Record<string, string[]> };

export function colorTokens(mode: 'light' | 'dark'): Json {
  const D = DEFAULTS as Snapshot;
  const tree = header(`ui-kit colors, ${mode} scheme: the default Spectrum (HCT-generated, Radix-style 12-step ramps) and roles (${Object.entries(D.roles).map(([r, f]) => `${r} ${f}`).join(', ')}). Step semantics: 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text.`);
  for (const [family, steps] of Object.entries(D[mode])) steps.forEach((css, i) => put(tree, ['color', 'spectrum', family, String(i + 1)], { $type: 'color', $value: oklch(css) }));
  for (const [role, entry] of Object.entries(ROLE_STEPS)) {
    const { family, step, alpha } = roleStep(entry, mode);
    const name = D.roles[family];
    // DTCG aliases cannot add alpha: a translucent role carries the resolved color.
    const $value = alpha === 1 ? `{color.spectrum.${name}.${step}}` : { ...oklch(D[mode][name][step - 1]), alpha };
    put(tree, ['color', 'role', role], { $type: 'color', $value, $description: `${family} step ${step}${alpha === 1 ? '' : ` at ${alpha * 100}%`}` });
  }
  put(tree, ['color', 'role', 'fg-on-solid'], { $type: 'color', $value: hexColor(D.onSolid[mode]), $description: 'Text on a primary solid: the APCA black/white choice for primary step 9' });
  put(tree, ['color', 'role', 'fg-selected'], mode === 'dark'
    ? { $type: 'color', $value: hexColor(D.onSolid.dark), $description: 'Text on bg-selected (the primary solid in dark): the contrast color' }
    : { $type: 'color', $value: `{color.spectrum.${D.roles.neutral}.12}`, $description: 'Text on bg-selected (neutral 1 in light): neutral 12' });
  // Shadows: layers of the shadow role at a per-scheme alpha (DTCG aliases cannot add alpha, so the color is resolved).
  const shadow = roleStep(ROLE_STEPS.shadow, mode), shadowColor = D[mode][D.roles[shadow.family]][shadow.step - 1];
  for (const [name, layers] of Object.entries(SHADOWS)) put(tree, ['shadow', name], {
    $type: 'shadow',
    $value: layers.map((l) => ({ color: { ...oklch(shadowColor), alpha: l[mode] }, offsetX: px(0), offsetY: px(l.y), blur: px(l.blur), spread: px(0) })),
    $description: `${shadow.family} step ${shadow.step} (role shadow) at ${layers.map((l) => `${l[mode] * 100}%`).join(', ')}`,
  });
  return tree;
}

export const DTCG_DIR = fileURLToPath(new URL('../tokens/dtcg/', import.meta.url));
/** Springs as DTCG duration, cubicBezier (least-squares fit) and transition; the exact spring and its CSS linear() ride in com.massimo.spring. */
export function motionTokens(): Json {
  const tree: Json = { $schema: SCHEMA, $description: 'Motion: SwiftUI-style springs (duration, bounce) solved exactly. CSS uses the linear() easing; the cubic-bezier is a fit for tools without linear().' };
  for (const [name, r] of Object.entries(RESOLVED_SPRINGS)) {
    const ext = { 'com.massimo.spring': { duration: r.duration, bounce: r.bounce, css: r.css } };
    put(tree, ['motion', name, 'duration'], { $type: 'duration', $value: { value: r.ms, unit: 'ms' }, $description: 'settle time (within 0.1% of rest)' });
    put(tree, ['motion', name, 'easing'], { $type: 'cubicBezier', $value: fitBezier(r), $extensions: ext });
    put(tree, ['motion', name, 'transition'], { $type: 'transition', $value: { duration: `{motion.${name}.duration}`, delay: { value: 0, unit: 'ms' }, timingFunction: `{motion.${name}.easing}` }, $extensions: ext });
  }
  return tree;
}

export function dtcgFiles(): Record<string, string> {
  const text = (j: Json) => JSON.stringify(j, null, 2) + '\n';
  const files: Record<string, string> = {
    'geometry.dtcg.json': text(geometryTokens()),
    'typography.dtcg.json': text(typographyTokens()),
    'color.light.dtcg.json': text(colorTokens('light')),
    'color.dark.dtcg.json': text(colorTokens('dark')),
    'motion.dtcg.json': text(motionTokens()),
  };
  files['index.json'] = text({
    $comment: 'Generated by scripts/tokens-dtcg.ts. DTCG 2025.10 token files; merge geometry, typography, motion and one color scheme.',
    schema: SCHEMA,
    files: Object.keys(files),
    schemes: { light: 'color.light.dtcg.json', dark: 'color.dark.dtcg.json' },
  });
  return files;
}

if (import.meta.main) {
  mkdirSync(DTCG_DIR, { recursive: true });
  for (const [name, text] of Object.entries(dtcgFiles())) writeFileSync(DTCG_DIR + name, text);
  console.log(`wrote ${Object.keys(dtcgFiles()).length} files to ${DTCG_DIR}`);
}

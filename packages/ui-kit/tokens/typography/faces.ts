// The face catalogue (contracts/face-catalogue.json): curated families with a descriptor, a source,
// the weight range the source provides and, from npm run faces:measure, measured metrics. Themes
// and brands name faces by family; this module finds the catalogue entry behind a font stack, the
// weights each voice needs (from the type roles), and the stylesheet URL for a Google face.
import catalogue from '../../contracts/face-catalogue.json' with { type: 'json' };
import { TYPE_ROLES, SERIF_REGULAR_VOICES, VOICES, type Voice } from './resolve.ts';

export const FACE_DESCRIPTORS = ['neo-grotesque', 'geometric', 'humanist', 'grotesque', 'serif', 'slab', 'mono', 'display'] as const;
export type FaceDescriptor = (typeof FACE_DESCRIPTORS)[number];
export interface FaceMetrics { xHeight: number; capHeight: number; ascent: number; descent: number; avgWidth: number }
export interface CatalogueFace {
  id: string; family: string; descriptor: FaceDescriptor; source: 'system' | 'google';
  weights: { min: number; max: number }; variable: boolean; italic: boolean; platforms?: string[]; notes: string;
  /** From npm run faces:measure: availability here, the loaded weight range (Google faces), metrics. */
  measured?: { date: string; browser: string; available: boolean; weights?: { min: number; max: number }; metrics?: FaceMetrics };
}
export const FACE_CATALOGUE = catalogue.faces as unknown as CatalogueFace[];

/** The fallback stack after a family, by descriptor (so a missing web face degrades in kind). */
export const FALLBACK_STACKS: Record<FaceDescriptor, string> = {
  'neo-grotesque': '"Helvetica Neue", Helvetica, Arial, sans-serif', grotesque: '"Helvetica Neue", Arial, sans-serif',
  geometric: 'Futura, "Century Gothic", "Avenir Next", sans-serif', humanist: '"Gill Sans", "Segoe UI", Calibri, sans-serif',
  serif: 'Georgia, "Times New Roman", serif', slab: 'Rockwell, "Roboto Slab", Georgia, serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace', display: 'system-ui, sans-serif',
};

/** The first family named in a font stack ("Inter Tight", Helvetica → Inter Tight). */
export const firstFamily = (stack: string) => stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
/** The catalogue entry for a family or a stack's first family (case-insensitive), if any. */
export const catalogueFace = (familyOrStack: string) => {
  const f = firstFamily(familyOrStack).toLowerCase();
  return FACE_CATALOGUE.find((x) => x.family.toLowerCase() === f || x.id === f);
};
/** A font stack for a family: the family, then the fallbacks for its descriptor. */
export const faceStack = (family: string, descriptor: FaceDescriptor) => family === 'system-ui' ? `system-ui, ${FALLBACK_STACKS[descriptor]}` : `"${family}", ${FALLBACK_STACKS[descriptor]}`;

/** The weights each voice renders (every type role on it; serif headings drop bold to regular). */
export function voiceWeights(serifVoices: ReadonlySet<Voice> = new Set()): Record<Voice, number[]> {
  const out = Object.fromEntries(VOICES.map((v) => [v, new Set<number>()])) as Record<Voice, Set<number>>;
  for (const r of Object.values(TYPE_ROLES) as { voice: Voice; weight: number }[]) out[r.voice].add(serifVoices.has(r.voice) && SERIF_REGULAR_VOICES.has(r.voice) ? 400 : r.weight);
  return Object.fromEntries(VOICES.map((v) => [v, [...out[v]].sort((a, b) => a - b)])) as Record<Voice, number[]>;
}

/** The weights in a face's range that serve the requested ones (nearest per CSS matching, within the range). */
export const missingWeights = (face: CatalogueFace, want: number[]) =>
  want.filter((w) => w < face.weights.min - 50 || w > face.weights.max + 50 || (w >= 600 && face.weights.max < 600));

/** The Google Fonts stylesheet for a face at the weights wanted (a variable face takes its whole range). */
export function googleFontsUrl(face: CatalogueFace, weights: number[] = []) {
  const fam = face.family.replace(/ /g, '+');
  // A static face: the weights asked for (snapped into its range), or every hundred it has.
  const all = Array.from({ length: 9 }, (_, i) => (i + 1) * 100).filter((w) => w >= face.weights.min && w <= face.weights.max);
  const picked = weights.length ? [...new Set(weights.map((w) => Math.min(face.weights.max, Math.max(face.weights.min, Math.round(w / 100) * 100))))].sort((a, b) => a - b) : all;
  const ws = face.variable ? `${face.weights.min}..${face.weights.max}` : picked.join(';');
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@${ws}&display=swap`;
}
/** A font source a theme may name: a Google Fonts stylesheet, or a self-hosted https stylesheet. */
export const FONT_SOURCE_URL = /^https:\/\/(fonts\.googleapis\.com\/css2\?[\w+:@;.,&=%-]{1,400}|[\w.-]+\/[\w./-]{1,200}\.css)$/;

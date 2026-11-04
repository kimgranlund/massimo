// Spike (docs/planning/brand-schema.md, step 3): how close can Spectrum's generated ramps get to a
// brand's exact colors? For each palette: the nearest generated swatch per anchor at the default
// settings, then after a search over the generation inputs (hue set, first hue, chroma, base), with
// the family and step each anchor lands on, ΔE (OKLab × 100) and the anchor's APCA Lc against the page
// beside that step's target. Prints JSON; the report is docs/reports/2026-11-03-color-anchoring-spike.md.
//   node scripts/anchor-spike.ts
import { generateSpectrum, type Spectrum } from '../tokens/colors/spectrum/index.ts';
import { apcaLc, DEFAULT_TARGETS } from '../tokens/colors/spectrum/contrast.ts';

type Anchor = { name: string; hex: string; role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'feedback' };
// Published brand palettes (design-system documentation), used only as measurement inputs.
const PALETTES: Record<string, Anchor[]> = {
  'ibm-carbon': [
    { name: 'blue 60', hex: '#0f62fe', role: 'primary' }, { name: 'gray 100', hex: '#161616', role: 'neutral' },
    { name: 'red 60', hex: '#da1e28', role: 'feedback' }, { name: 'green 50', hex: '#24a148', role: 'feedback' }, { name: 'yellow 30', hex: '#f1c21b', role: 'feedback' },
  ],
  'material-3-baseline': [
    { name: 'primary', hex: '#6750a4', role: 'primary' }, { name: 'secondary', hex: '#625b71', role: 'secondary' },
    { name: 'tertiary', hex: '#7d5260', role: 'accent' }, { name: 'error', hex: '#b3261e', role: 'feedback' }, { name: 'neutral', hex: '#605d62', role: 'neutral' },
  ],
  atlassian: [
    { name: 'B400', hex: '#0052cc', role: 'primary' }, { name: 'G300', hex: '#36b37e', role: 'feedback' }, { name: 'R300', hex: '#ff5630', role: 'feedback' },
    { name: 'Y300', hex: '#ffab00', role: 'feedback' }, { name: 'P300', hex: '#6554c0', role: 'accent' },
  ],
};

// sRGB hex → OKLab, and CIE L* (the HCT tone) for the contrast comparison.
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function hexLab(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, tone: Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y };
}
const okLab = ([L, C, h]: number[]) => ({ L, a: C * Math.cos((h * Math.PI) / 180), b: C * Math.sin((h * Math.PI) / 180) });
const dE = (p: { L: number; a: number; b: number }, q: { L: number; a: number; b: number }) => 100 * Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);

function nearest(data: Spectrum, anchor: Anchor) {
  const want = hexLab(anchor.hex);
  let best = { family: '', step: 0, css: '', dE: Infinity };
  for (const [family, ramp] of Object.entries(data.schemes.light)) {
    const isNeutral = /neutral|gray|mauve|slate|sage|olive|sand/i.test(family);
    if ((anchor.role === 'neutral') !== isNeutral) continue;
    for (const sw of ramp) { const d = dE(want, okLab(sw.oklch)); if (d < best.dE) best = { family, step: sw.step, css: sw.css, dE: d }; }
  }
  const page = data.schemes.light[best.family][0].hct[2];
  return { ...best, dE: Math.round(best.dE * 10) / 10, anchorLc: Math.round(apcaLc(want.tone, page) * 10) / 10, stepTargetLc: best.step > 1 ? DEFAULT_TARGETS.light[best.step - 2] : 0 };
}
const score = (data: Spectrum, anchors: Anchor[]) => anchors.reduce((s, a) => s + nearest(data, a).dE, 0) / anchors.length;

function fit(anchors: Anchor[]) {
  let best = { settings: {} as Record<string, unknown>, score: score(generateSpectrum({}), anchors), runs: 1 };
  const tryIt = (settings: Record<string, unknown>) => { const s = score(generateSpectrum(settings), anchors); best.runs++; if (s < best.score) best = { ...best, settings, score: s }; };
  for (const hueSet of ['quad', 'radix']) for (const chroma of [60, 90, 120]) for (let hue = 0; hue < 360; hue += 30) tryIt({ hueSet, hue, chroma });
  const coarse = best.settings as { hueSet?: string; hue?: number; chroma?: number };
  for (let dh = -12; dh <= 12; dh += 3) for (const base of [60, 80, 100]) tryIt({ ...coarse, hue: (((coarse.hue ?? 225) + dh) % 360 + 360) % 360, base });
  return best;
}

const out: Record<string, unknown> = {};
for (const [name, anchors] of Object.entries(PALETTES)) {
  const t0 = performance.now();
  const before = generateSpectrum({});
  const f = fit(anchors);
  const after = generateSpectrum(f.settings);
  out[name] = {
    settings: f.settings, runs: f.runs, seconds: Math.round((performance.now() - t0) / 100) / 10,
    meanDE: { before: Math.round(score(before, anchors) * 10) / 10, after: Math.round(f.score * 10) / 10 },
    anchors: anchors.map((a) => ({ ...a, before: nearest(before, a), after: nearest(after, a) })),
  };
  console.error(`${name}: mean ΔE ${(out[name] as any).meanDE.before} → ${(out[name] as any).meanDE.after} in ${f.runs} runs`);
}
console.log(JSON.stringify(out, null, 2));

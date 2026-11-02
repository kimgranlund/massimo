// OpenType numeric feature detection for the Typography page's Numerals specimen.
//
// CSS cannot ask a font which features it has, and canvas text ignores font-feature-settings, so
// the jig measures what the browser actually renders:
// - Figure spacing (tnum, pnum): the advance of each digit 0–9 in a hidden probe span, with the
//   feature off and on. Tabular = every digit has the same advance.
// - Every other feature: the sample is drawn with the feature off and on into an SVG
//   <foreignObject>, rasterized onto a canvas, and the pixels compared. Any difference means the
//   feature changes the rendering in this face.
// Paired features (lnum/onum, tnum/pnum) report `default` when the face already renders that way
// without the feature and its partner changes it, and lnum/onum report `single` when neither
// changes anything (one figure style, which pixels cannot name). Results describe this browser on this machine:
// a stack resolves to whichever installed font comes first, and fallback fonts can supply glyphs.

export type FeatureTag = 'tnum' | 'pnum' | 'lnum' | 'onum' | 'zero' | 'frac' | 'afrc' | 'sups' | 'subs' | 'ordn' | 'case';
export type FeatureStatus = 'supported' | 'default' | 'single' | 'missing';

export interface FeatureSpec { tag: FeatureTag; label: string; sample: string; contract: string; css: string; partner?: FeatureTag }

/** The specimen rows: OpenType tag, the contract that turns it on, and a sample that shows it. */
export const FEATURES: FeatureSpec[] = [
  { tag: 'tnum', label: 'Tabular figures', sample: '1111 · 8080', contract: 'data-numeric (default)', css: 'tabular-nums', partner: 'pnum' },
  { tag: 'pnum', label: 'Proportional figures', sample: '1111 · 8080', contract: 'proportional', css: 'proportional-nums', partner: 'tnum' },
  { tag: 'lnum', label: 'Lining figures', sample: '1234567890', contract: 'data-numeric (default)', css: 'lining-nums', partner: 'onum' },
  { tag: 'onum', label: 'Oldstyle figures', sample: '1234567890', contract: 'oldstyle', css: 'oldstyle-nums', partner: 'lnum' },
  { tag: 'zero', label: 'Slashed zero', sample: '1,000,800', contract: 'slashed-zero', css: 'slashed-zero' },
  { tag: 'frac', label: 'Diagonal fractions', sample: '1/2 3/4 5/16', contract: 'fraction', css: 'diagonal-fractions' },
  { tag: 'afrc', label: 'Stacked fractions', sample: '1/2 3/4 5/16', contract: 'stacked-fraction', css: 'stacked-fractions' },
  { tag: 'sups', label: 'Superior figures', sample: 'E=mc2 x123', contract: 'data-position="super"', css: 'font-variant-position: super' },
  { tag: 'subs', label: 'Inferior figures', sample: 'H2O x123', contract: 'data-position="sub"', css: 'font-variant-position: sub' },
  { tag: 'ordn', label: 'Ordinals', sample: '1st 2nd 1a 2o', contract: 'ordinal', css: 'ordinal' },
  { tag: 'case', label: 'Case-sensitive forms', sample: '(HQ-1) [24]', contract: 'caps', css: 'font-feature-settings: "case"' },
];

const SIZE = 40;
const W = 480, H = 72;
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Rasterize `text` in `stack` with `features` (a font-feature-settings value) and return its alpha channel. */
async function raster(stack: string, features: string, text: string): Promise<Uint8ClampedArray> {
  const family = stack.replace(/"/g, "'");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%">`
    + `<div xmlns="http://www.w3.org/1999/xhtml" style="font-family: ${escapeXml(family)}; font-size: ${SIZE}px; line-height: ${H}px; white-space: pre; font-feature-settings: ${features.replace(/"/g, "'")}; font-kerning: none">${escapeXml(text)}</div>`
    + '</foreignObject></svg>';
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;
  const alpha = new Uint8ClampedArray(W * H);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return alpha;
}
const differs = (a: Uint8ClampedArray, b: Uint8ClampedArray) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true; return false; };

/** Advance widths of the digits 0–9 under a font-variant-numeric value, from a hidden probe. */
function digitAdvances(stack: string, variant: string): number[] {
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', fontFamily: stack, fontSize: `${SIZE}px`, fontVariantNumeric: variant, fontKerning: 'none' });
  document.body.append(probe);
  const widths = [...'0123456789'].map((d) => { probe.textContent = d.repeat(10); return probe.getBoundingClientRect().width / 10; });
  probe.remove();
  return widths;
}
const tabular = (w: number[]) => Math.max(...w) - Math.min(...w) < 0.05;

const cache = new Map<string, Promise<Record<FeatureTag, FeatureStatus>>>();

/** Detect every feature in FEATURES for one font stack (cached per stack). */
export function detectFeatures(stack: string): Promise<Record<FeatureTag, FeatureStatus>> {
  let hit = cache.get(stack);
  if (!hit) { hit = run(stack); cache.set(stack, hit); }
  return hit;
}

async function run(stack: string): Promise<Record<FeatureTag, FeatureStatus>> {
  await document.fonts.ready;
  const out = {} as Record<FeatureTag, FeatureStatus>;
  // Spacing from advances.
  const plain = tabular(digitAdvances(stack, 'normal')), tnum = tabular(digitAdvances(stack, 'tabular-nums')), pnum = !tabular(digitAdvances(stack, 'proportional-nums'));
  out.tnum = tnum ? (plain ? 'default' : 'supported') : 'missing';
  out.pnum = pnum ? (!plain ? 'default' : 'supported') : 'missing';
  // Everything else from pixels: off vs on.
  const changed = {} as Record<FeatureTag, boolean>;
  for (const f of FEATURES) {
    if (f.tag === 'tnum' || f.tag === 'pnum') continue;
    const [off, on] = await Promise.all([raster(stack, `"${f.tag}" 0`, f.sample), raster(stack, `"${f.tag}" 1`, f.sample)]);
    changed[f.tag] = differs(off, on);
  }
  for (const f of FEATURES) {
    if (f.tag === 'tnum' || f.tag === 'pnum') continue;
    out[f.tag] = changed[f.tag] ? 'supported' : !f.partner ? 'missing' : changed[f.partner] ? 'default' : 'single';
  }
  return out;
}

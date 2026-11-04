// Measures the face catalogue (packages/ui-kit/contracts/face-catalogue.json) in Chromium and writes
// each face's `measured` block: whether it is available here; for Google faces the weight range the
// loaded FontFace rules declare (exact; system faces keep their curated range, since a canvas cannot
// tell a real bold from a synthesized one); and metrics as ratios of the em (x-height and cap height
// from glyph bounds, ascent and descent from the font box, average width over a–z). Google faces
// load from fonts.googleapis.com first; system faces are measured on this machine (`platforms` says
// where they exist).
//   npm run faces:measure
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const path = new URL('../../../packages/ui-kit/contracts/face-catalogue.json', import.meta.url);
const cat = JSON.parse(readFileSync(path, 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
const google = cat.faces.filter((f: any) => f.source === 'google');
for (const f of google) {
  const ws = f.variable ? `${f.weights.min}..${f.weights.max}` : Array.from({ length: 9 }, (_, i) => (i + 1) * 100).filter((w) => w >= f.weights.min && w <= f.weights.max).join(';');
  await page.addStyleTag({ url: `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, '+')}:wght@${ws}&display=block` }).catch((e) => console.error(`${f.family}: stylesheet failed (${e.message})`));
}
const results = await page.evaluate(async (faces: any[]) => {
  const ctx = document.createElement('canvas').getContext('2d')!;
  const out: Record<string, unknown> = {};
  for (const f of faces) {
    const fam = f.family === 'system-ui' ? 'system-ui' : `"${f.family}"`;
    for (let w = 100; w <= 900; w += 100) await document.fonts.load(`${w} 100px ${fam}`, 'Hamburgefonstiv').catch(() => {});
    const width = (font: string) => { ctx.font = font; return ctx.measureText('Hamburgefonstiv abcdefghijklmnopqrstuvwxyz').width; };
    let available: boolean, weights: number[] | null = null;
    if (f.source === 'google') {
      // The loaded @font-face rules for the family: their weight descriptors ("400" or "100 900").
      const rules = [...document.fonts].filter((x) => x.family.replace(/["']/g, '') === f.family && x.status === 'loaded');
      available = rules.length > 0;
      const ws = rules.flatMap((x) => x.weight.split(' ').map(Number));
      weights = ws.length ? [Math.min(...ws), Math.max(...ws)] : [];
    } else {
      // Present: it renders unlike at least two of the three generic fallbacks.
      const differs = ['serif', 'sans-serif', 'monospace'].filter((g) => Math.abs(width(`400 100px ${fam}, ${g}`) - width(`400 100px ${g}`)) > 0.5).length;
      available = f.family === 'system-ui' || differs >= 2;
    }
    ctx.font = `400 100px ${fam}, monospace`;
    const m = (s: string) => ctx.measureText(s);
    const r = (n: number) => Math.round((n / 100) * 1000) / 1000;
    out[f.id] = available ? {
      available, ...(weights ? { weights: { min: weights[0], max: weights[1] } } : {}),
      metrics: { xHeight: r(m('x').actualBoundingBoxAscent), capHeight: r(m('H').actualBoundingBoxAscent), ascent: r(m('H').fontBoundingBoxAscent), descent: r(m('H').fontBoundingBoxDescent), avgWidth: r(m('abcdefghijklmnopqrstuvwxyz').width / 26) },
    } : { available };
  }
  return out;
}, cat.faces);
const date = new Date().toISOString().slice(0, 10), version = browser.version();
for (const f of cat.faces) f.measured = { date, browser: `chromium ${version}`, ...(results[f.id] as object) };
writeFileSync(path, JSON.stringify(cat, null, 2) + '\n');
await browser.close();
for (const f of cat.faces) console.log(`${f.measured.available ? 'ok     ' : 'missing'} ${f.family.padEnd(18)} weights ${f.measured.weights ? `${f.measured.weights.min}–${f.measured.weights.max}` : `(curated ${f.weights.min}–${f.weights.max})`}  x ${f.measured.metrics?.xHeight ?? '-'}`);

// The face catalogue (contracts/face-catalogue.json, tokens/typography/faces.ts): curated entries,
// the measured block (npm run faces:measure), the weights voices need, stylesheets, and the lint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACE_CATALOGUE, FACE_DESCRIPTORS, FONT_SOURCE_URL, catalogueFace, faceStack, googleFontsUrl, missingWeights, voiceWeights } from '../tokens/typography/faces.ts';
import { lintTheme } from '../tokens/themes/lint.ts';
import { validateThemeObject } from '../tokens/themes/theme.ts';
import { hydrate, lintBrand, validateBrand } from '../tokens/brand/index.ts';
import { EXAMPLE_BRANDS } from '../tokens/brand/examples.ts';
import { FONT_STACK } from '../tokens/themes/theme.ts';

test('faces: the catalogue is well formed and measured; measured web weights match the curated range', () => {
  const ids = FACE_CATALOGUE.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(FACE_CATALOGUE.length >= 20);
  for (const d of FACE_DESCRIPTORS) assert.ok(FACE_CATALOGUE.some((f) => f.descriptor === d), `a ${d} face`);
  for (const f of FACE_CATALOGUE) {
    assert.ok(f.weights.min >= 100 && f.weights.max <= 900 && f.weights.min <= f.weights.max, f.id);
    assert.ok(FONT_STACK.test(faceStack(f.family, f.descriptor)), `${f.id}: its stack is a valid theme font stack`);
    assert.ok(f.measured, `${f.id}: measured (npm run faces:measure)`);
    assert.ok(f.measured!.available, `${f.id}: available where it was measured`);
    assert.ok(f.measured!.metrics!.xHeight > 0.3 && f.measured!.metrics!.xHeight < 0.7, `${f.id}: x-height ${f.measured!.metrics!.xHeight}`);
    if (f.source === 'google') {
      assert.deepEqual(f.measured!.weights, f.weights, `${f.id}: the loaded weights are the curated range`);
      assert.match(googleFontsUrl(f), FONT_SOURCE_URL);
    }
  }
});

test('faces: voices need the weights their roles use; a face without bold is caught', () => {
  const need = voiceWeights();
  assert.ok(need.heading.includes(700) && need.body.includes(400) && need.ui.includes(450));
  assert.deepEqual(voiceWeights(new Set(['heading'])).heading, [400], 'serif headings drop bold to regular');
  const dm = catalogueFace('"DM Serif Display", Georgia, serif')!;
  assert.deepEqual(missingWeights(dm, need.display), [700]);
  assert.deepEqual(missingWeights(catalogueFace('Fraunces')!, need.display), []);
  assert.equal(catalogueFace('Comic Sans MS'), undefined);
  assert.equal(googleFontsUrl(catalogueFace('Inter')!), 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
  assert.equal(googleFontsUrl(catalogueFace('IBM Plex Sans')!), 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@100;200;300;400;500;600;700&display=swap', 'a static face loads every weight it has');
  assert.equal(googleFontsUrl(dm, [400, 700]), 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&display=swap');
});

test('faces: typography.sources is validated; the lint warns on missing weights and unloaded web faces', () => {
  const t = (typography: object) => ({ schemaVersion: 2, name: 'f', typography });
  assert.ok(validateThemeObject(t({ sources: [{ family: 'Inter', url: googleFontsUrl(catalogueFace('Inter')!) }] })).ok);
  assert.equal(validateThemeObject(t({ sources: [{ family: 'Inter', url: 'http://evil.example/x.js' }] })).ok, false);
  const ids = (typography: object) => lintTheme(t(typography) as any, { only: ['typography.face-weights', 'typography.web-face-source'] }).findings.map((f) => f.id);
  assert.deepEqual(ids({}), [], 'the kit defaults pass');
  assert.deepEqual(ids({ faces: { display: '"DM Serif Display", Georgia, serif' }, voices: { heading: 'display' }, sources: [{ family: 'DM Serif Display', url: googleFontsUrl(catalogueFace('DM Serif Display')!) }] }), [], 'a serif display at regular weight is fine');
  assert.deepEqual(ids({ faces: { display: '"DM Serif Display", system-ui, sans-serif' }, sources: [{ family: 'DM Serif Display', url: googleFontsUrl(catalogueFace('DM Serif Display')!) }] }), ['typography.face-weights'], 'a one-weight face on a bold sans voice');
  assert.deepEqual(ids({ faces: { sans: '"Inter Tight", sans-serif' } }), ['typography.web-face-source']);
});

test('faces: brands use the catalogue: hydrate adds each web face\'s stylesheet, the lint checks weights', () => {
  for (const b of EXAMPLE_BRANDS) {
    const { theme } = hydrate(b);
    for (const f of Object.values(b.type?.faces ?? {})) {
      const entry = catalogueFace(f!.family);
      assert.ok(entry, `${b.name}: ${f!.family} is in the catalogue`);
      if (entry!.source === 'google') assert.ok(theme.typography?.sources?.some((x) => x.family === f!.family && FONT_SOURCE_URL.test(x.url)), `${b.name}: ${f!.family} has a stylesheet`);
    }
  }
  const brand = (faces: object) => { const r = validateBrand({ schemaVersion: 1, name: 'f', subject: { name: 'F', audience: 'a', primaryJob: 'j', kind: 'tool', sources: ['s'] }, type: { faces } }); assert.ok(r.ok); return (r as any).brand; };
  assert.ok(lintBrand(brand({ display: { family: 'DM Serif Display', descriptor: 'display', source: 'google' } })).some((f) => f.id === 'brand.face-weights'));
  assert.ok(lintBrand(brand({ body: { family: 'Comic Neue', descriptor: 'humanist', source: 'google' } })).some((f) => f.id === 'brand.face-catalogue'));
  assert.ok(hydrate(brand({ body: { family: 'Comic Neue', descriptor: 'humanist', source: 'google' } })).unresolved.some((u) => u.includes('not in the face catalogue')));
  assert.equal(validateBrand({ schemaVersion: 1, name: 'f', subject: { name: 'F', audience: 'a', primaryJob: 'j', kind: 'tool', sources: ['s'] }, type: { faces: { body: { ref: 'nope', family: 'X', descriptor: 'serif' } } } }).ok, false);
});

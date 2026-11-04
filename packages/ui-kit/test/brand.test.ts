// The Brand (brand-schema step 4): schema, catalogue, hydrate with provenance, and the advisory lint,
// proven on three worked brands (tokens/brand/examples) with different groundings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import Ajv from 'ajv';
import { validateBrand, hydrate, lintBrand, brandCharacter, brandJsonSchemaText, GROUNDINGS, TERRITORIES, type Brand } from '../tokens/brand/index.ts';
import { DESCRIPTORS } from '../tokens/themes/descriptor-data.ts';
import { describeTheme } from '../tokens/themes/descriptors.ts';
import { validateThemeObject } from '../tokens/themes/theme.ts';
import { lintTheme } from '../tokens/themes/lint.ts';

const dir = new URL('../tokens/brand/examples/', import.meta.url);
const EXAMPLES = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
const brand = (b: unknown) => { const r = validateBrand(b); assert.ok(r.ok, JSON.stringify((r as any).errors)); return (r as any).brand as Brand; };
const minimal = { schemaVersion: 1, name: 'mini', subject: { name: 'Mini', audience: 'testers', primaryJob: 'test', kind: 'tool', sources: ['a test bench'] } };

test('brand: contracts/brand.schema.json is current (npm run brand:schema) and agrees with the validator', () => {
  assert.equal(readFileSync(new URL('../contracts/brand.schema.json', import.meta.url), 'utf8'), brandJsonSchemaText());
  const ajv = new (Ajv as any)({ strict: false, allErrors: true });
  const schema = ajv.compile(JSON.parse(brandJsonSchemaText()));
  const cases: [unknown, boolean][] = [
    ...EXAMPLES.map((e) => [e, true] as [unknown, boolean]), [minimal, true],
    [{ ...minimal, form: { curvature: 'blobby' } }, false], [{ ...minimal, form: { vibrancy: 'vivid' } }, false],
    [{ ...minimal, color: { anchors: [{ name: 'x', value: 'red', role: 'primary' }] } }, false],
    [{ ...minimal, grounding: { primary: { ref: 'vaporwave', relation: 'inherit' } } }, false],
    [{ ...minimal, muse: { kind: 'person', name: 'X' } }, false], [{ ...minimal, subject: { ...minimal.subject, kind: 'blog' } }, false],
    [{ ...minimal, type: { faces: { body: { family: 'X', descriptor: 'serif', source: 'self-hosted' } } } }, true], // url is checked by the validator only
  ];
  for (const [b, ok] of cases.slice(0, -1)) {
    assert.equal(schema(b), ok, `schema: ${JSON.stringify(b).slice(0, 120)}`);
    assert.equal(validateBrand(b).ok, ok, `validator: ${JSON.stringify(b).slice(0, 120)}`);
  }
  assert.equal(validateBrand(cases.at(-1)![0]).ok, false, 'a self-hosted face needs an https url');
});

test('brand: the catalogue is well formed: canons use real descriptor values, bounds name real values, groundings cite sources', () => {
  const ids = [...GROUNDINGS, ...TERRITORIES].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(GROUNDINGS.length >= 6 && TERRITORIES.length >= 6);
  for (const e of [...GROUNDINGS, ...TERRITORIES]) {
    for (const [k, v] of Object.entries(e.canon.character)) assert.ok(DESCRIPTORS[k]?.values.some((x) => x.name === v), `${e.id}: ${k}.${v}`);
    for (const o of e.outOfBounds ?? []) { const [k, v] = o.split('.'); assert.ok(DESCRIPTORS[k]?.values.some((x) => x.name === v), `${e.id}: out of bounds ${o}`); }
    assert.ok(e.cliches.length > 0, `${e.id}: names its clichés`);
  }
  for (const g of GROUNDINGS) assert.ok((g as any).sources.length > 0 && (g as any).principles.length >= 3, `${g.id}: principles and sources`);
});

test('brand: the three worked brands validate, hydrate into valid lint-clean themes, and leave nothing unresolved', () => {
  assert.equal(EXAMPLES.length, 3);
  for (const e of EXAMPLES) {
    const b = brand(e);
    assert.deepEqual(lintBrand(b).filter((f) => f.severity === 'warning'), [], `${b.name}: brand lint`);
    const { theme, unresolved } = hydrate(b);
    assert.deepEqual(unresolved, [], `${b.name}: unresolved`);
    const v = validateThemeObject(theme);
    assert.ok(v.ok, `${b.name}: ${JSON.stringify((v as any).errors)}`);
    assert.deepEqual(lintTheme(theme).findings.filter((f) => f.severity === 'warning').map((f) => `${f.id}: ${f.message}`), [], `${b.name}: theme lint`);
  }
});

test('brand: every hydrated value traces to a brand field, a territory, the grounding or the muse', () => {
  for (const e of EXAMPLES) {
    const { theme } = hydrate(brand(e));
    const paths = [
      ...Object.keys(theme.geometry?.parameters ?? {}).map((k) => `geometry.parameters.${k}`),
      ...Object.keys(theme.motion?.parameters ?? {}).map((k) => `motion.parameters.${k}`),
      ...Object.keys(theme.typography?.parameters ?? {}).map((k) => `typography.parameters.${k}`),
      ...Object.keys(theme.typography?.faces ?? {}).map((k) => `typography.faces.${k}`),
      ...Object.keys(theme.typography?.voices ?? {}).map((k) => `typography.voices.${k}`),
      ...Object.keys(theme.color?.spectrum ?? {}).map((k) => `color.spectrum.${k}`),
      ...(theme.color?.anchors ?? []).map((_, i) => `color.anchors.${i}`),
      ...(theme.icons ? ['icons'] : []), ...(theme.scheme ? ['scheme'] : []),
    ];
    assert.ok(paths.length > 10, `${e.name}: ${paths.length} values`);
    for (const p of paths) {
      const pr = theme.provenance?.[p];
      assert.equal(pr?.source, 'brand', `${e.name}: ${p} has brand provenance`);
      assert.match(pr!.reason!, /^(form|color|type|movement|adaptivity|territories:|grounding:|iconography|muse)/, `${e.name}: ${p} → ${pr!.reason}`);
    }
  }
});

test('brand: the three themes read as different (describeTheme), each pushing its signature', () => {
  const reads = EXAMPLES.map((e) => { const b = brand(e); return { b, read: describeTheme(hydrate(b).theme) }; });
  for (let i = 0; i < reads.length; i++) for (let j = i + 1; j < reads.length; j++) {
    const differ = Object.keys(DESCRIPTORS).filter((s) => reads[i].read[s].value !== reads[j].read[s].value);
    assert.ok(differ.length >= 5, `${reads[i].b.name} vs ${reads[j].b.name}: ${differ.length} scales differ (${differ.join(', ')})`);
  }
  for (const { b, read } of reads) assert.notEqual(read[b.signature!.scale].value, DESCRIPTORS[b.signature!.scale].default, `${b.name}: its signature leaves the default`);
});

test('brand: precedence: explicit fields over the territory over the grounding; a grounding reacted against adds nothing', () => {
  const base = { ...minimal, grounding: { primary: { ref: 'bauhaus', relation: 'inherit' } }, territories: [{ name: 'Lab', ref: 'laboratory', description: 'a lab' }] };
  const c1 = brandCharacter(brand(base));
  assert.equal(c1.character.curvature, 'crisp', 'the territory (laboratory: crisp) beats the grounding (bauhaus: square)');
  assert.equal(c1.from.curvature, 'territories:Lab (laboratory)');
  assert.equal(c1.character.harmony, 'triadic', 'the grounding fills what the territory leaves');
  const c2 = brandCharacter(brand({ ...base, form: { curvature: 'round' } }));
  assert.equal(c2.character.curvature, 'round');
  assert.equal(c2.from.curvature, 'form.curvature');
  const c3 = brandCharacter(brand({ ...minimal, grounding: { primary: { ref: 'bauhaus', relation: 'react-against' } } }));
  assert.deepEqual(c3.character, {});
  const free = hydrate(brand({ ...minimal, grounding: { primary: { name: 'Vaporwave', relation: 'inherit' } } }));
  assert.ok(free.unresolved.some((u) => u.startsWith('grounding.primary')), 'a free grounding name is a question, not a guess');
  assert.ok(free.unresolved.some((u) => u.startsWith('color.anchors')));
});

test('brand: the lint catches the known defaults, out-of-bounds choices, feedback that reads as brand, and an idle signature', () => {
  const ids = (b: object) => lintBrand(brand({ ...minimal, ...b })).map((f) => f.id);
  assert.ok(ids({}).includes('brand.frame-grounding') && ids({}).includes('brand.frame-territory') && ids({}).includes('brand.signature'));
  assert.ok(ids({ type: { faces: { display: { family: 'Caslon', descriptor: 'serif' } } }, color: { anchors: [{ name: 'terracotta', value: '#c4622d', role: 'primary' }] } }).includes('brand.cliche'), 'warm cream');
  assert.ok(ids({ adaptivity: 'dark-first', color: { anchors: [{ name: 'acid', value: '#9cff1e', role: 'primary' }] } }).includes('brand.cliche'), 'near black with one acid accent');
  assert.ok(ids({ color: { anchors: [{ name: 'p', value: '#7c3aed', role: 'primary' }, { name: 's', value: '#2563eb', role: 'secondary' }] } }).includes('brand.cliche'), 'purple to blue');
  assert.ok(ids({ form: { curvature: 'pill', elevation: 'floating' } }).includes('brand.cliche'), 'pill and floating');
  assert.ok(ids({ territories: [{ name: 'Lab', ref: 'laboratory', description: 'a lab' }], form: { curvature: 'pill' } }).includes('brand.out-of-bounds'));
  assert.ok(ids({ color: { anchors: [{ name: 'p', value: '#d1182a', role: 'primary' }, { name: 'c', value: '#c8102e', role: 'critical' }] } }).includes('brand.feedback-hue'));
  assert.ok(ids({ signature: { concept: 'curvature', scale: 'curvature', reason: 'r' } }).includes('brand.signature'), 'a signature at its default');
  assert.ok(ids({ form: { curvature: 'pill' }, avoid: ['curvature.pill'] }).includes('brand.avoid'));
  assert.ok(ids({ muse: { kind: 'work', name: 'X', take: 'copy it exactly' } }).includes('brand.muse-copy'));
  assert.ok(ids({ grounding: { primary: { ref: 'memphis', relation: 'react-against' } }, form: { curvature: 'round' } }).includes('brand.reacted-canon'), 'a choice matching a rejected canon');
  assert.ok(!ids({ grounding: { primary: { ref: 'memphis', relation: 'react-against' } }, form: { curvature: 'crisp' } }).includes('brand.reacted-canon'));
  assert.ok(lintBrand(brand({ ...minimal })).every((f) => f.severity !== ('error' as string)), 'advisory only');
});

test('brand: a face ref fills family, descriptor and source from the face catalogue, without touching the input', () => {
  const input = { ...minimal, type: { faces: { body: { ref: 'inter' }, display: { ref: 'fraunces', weights: [400, 700] } } } };
  const before = JSON.stringify(input);
  const b = brand(input);
  assert.equal(JSON.stringify(input), before, 'the caller\'s object is unchanged');
  assert.deepEqual(b.type!.faces!.body, { family: 'Inter', descriptor: 'neo-grotesque', source: 'google', ref: 'inter' });
  assert.equal(b.type!.faces!.display!.descriptor, 'serif');
  const { theme } = hydrate(b);
  assert.deepEqual(theme.typography!.sources!.map((s) => s.family).sort(), ['Fraunces', 'Inter']);
  assert.equal(validateBrand({ ...minimal, type: { faces: { body: {} } } }).ok, false, 'a face needs a ref or a family and descriptor');
});

test('brand build: the studio\'s delivered brand (apps/studio/public/brand) is current with its brand (npm run brand:studio)', async () => {
  const { buildBrand } = await import('../tokens/brand/build.ts');
  const studio = new URL('../../../apps/studio/', import.meta.url);
  const b = brand(JSON.parse(readFileSync(new URL('brand/massimo.brand.json', studio), 'utf8')));
  const r = buildBrand(b);
  assert.deepEqual(r.unresolved, []);
  assert.equal(readFileSync(new URL('public/brand/massimo.css', studio), 'utf8'), r.css);
  assert.equal(readFileSync(new URL('public/brand/massimo.fonts.html', studio), 'utf8'), r.fonts);
  assert.deepEqual(JSON.parse(readFileSync(new URL('public/brand/massimo.theme.json', studio), 'utf8')), { $schema: 'https://massimo.dev/contracts/theme.schema.json', ...r.theme });
  assert.match(r.css, /^\/\* massimo: generated/);
  assert.equal(readFileSync(new URL('public/brand/massimo.scope.css', studio), 'utf8'), buildBrand(b, { scope: true }).css, 'the scoped build the jig panel wears is current too');
  assert.match(readFileSync(new URL('index.html', studio), 'utf8'), /href="brand\/massimo\.scope\.css"/, 'the jig loads it');
});

test('brand: groundings pair catalogue faces per role, and hydrate fills a face the brand leaves out from them', async () => {
  const { FACE_CATALOGUE } = await import('../tokens/typography/faces.ts');
  const ids = new Set(FACE_CATALOGUE.map((f) => f.id));
  assert.ok(GROUNDINGS.length >= 12 && TERRITORIES.length >= 10);
  for (const g of GROUNDINGS) for (const role of ['display', 'body', 'utility'] as const) {
    const list = (g.canon as any).pairings?.[role];
    assert.ok(list?.length, `${g.id}: pairs a ${role} face`);
    for (const id of list) assert.ok(ids.has(id), `${g.id}.${role}: ${id} is in the face catalogue`);
  }
  const b = brand({ ...minimal, grounding: { primary: { ref: 'ulm-school', relation: 'inherit' } } });
  const { theme, unresolved } = hydrate(b);
  assert.match(theme.typography!.faces!.sans!, /^"Inter", /, 'body from the Ulm pairing');
  assert.match(theme.provenance!['typography.faces.sans']!.reason!, /^grounding:ulm-school pairing/);
  assert.ok(!unresolved.some((u) => u.startsWith('type.faces.body')), 'no open question once the grounding pairs a body face');
  const against = hydrate(brand({ ...minimal, grounding: { primary: { ref: 'ulm-school', relation: 'react-against' } } }));
  assert.ok(against.unresolved.some((u) => u.startsWith('type.faces.body')), 'a rejected grounding pairs nothing');
});

test('brand: catalogue palettes sit inside the ramp; free-text bounds and malformed avoid keys are handled', async () => {
  const S = await import('../tokens/colors/spectrum/index.ts');
  const d = S.generateSpectrum({}), r = S.resolveRoles(d, {});
  for (const t of TERRITORIES) for (const x of (t.canon as any).palette ?? []) {
    const a = S.anchoredSpectrum(d, r, [{ role: 'secondary', value: x.value }]).report[0];
    assert.ok(a.inRange && a.inOrder, `${t.id} ${x.name} ${x.value}: Lc ${a.lc} in range and order`);
  }
  const f = lintBrand(brand({ ...minimal, territories: [{ name: 'T', description: 'd', outOfBounds: ['no neon signs'] }], avoid: ['color.vibrancy.vivid', 'curvature.pill'] }));
  assert.ok(!f.some((x) => /undefined/.test(x.message)), 'free-text bounds never print undefined');
  assert.ok(f.some((x) => x.id === 'brand.avoid-format' && x.message.includes('color.vibrancy.vivid')));
  assert.ok(!f.some((x) => x.id === 'brand.avoid-format' && x.message.includes('"curvature.pill"')));
});

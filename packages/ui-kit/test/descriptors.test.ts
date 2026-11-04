// Character descriptors (brand-schema step 2): every scale value resolves inside the input ranges,
// reads back as itself (describe(resolve(d)) = d at distance 0), and the default value of every scale
// is the kit default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DESCRIPTORS, describeTheme, themeFromCharacter, inputSpec, validateThemeObject, lintTheme, defaultParams, PARAMS } from '../tokens/themes/index.ts';
import { SPECTRUM_DEFAULTS } from '../tokens/colors/spectrum/config.ts';

const named = (t: object) => ({ schemaVersion: 2 as const, name: 'd', ...t });
const scales = Object.values(DESCRIPTORS);

test('descriptors: every scale is well formed, its inputs are disjoint from every other scale, and its concept is its domain\'s', () => {
  assert.ok(scales.length >= 12, `${scales.length} scales`);
  const seen = new Map<string, string>();
  for (const s of scales) {
    const manifest = JSON.parse(readFileSync(new URL(`../contracts/domains/${s.domain}.json`, import.meta.url), 'utf8'));
    assert.ok(manifest.concepts.includes(s.concept), `${s.id}: concept ${s.concept} is one ${s.domain} covers`);
    for (const i of s.inputs) {
      assert.doesNotThrow(() => inputSpec(i), `${s.id}: input ${i}`);
      assert.ok(!seen.has(i), `${i}: set by ${seen.get(i)} and ${s.id}`);
      seen.set(i, s.id);
      if (PARAMS[i as keyof typeof PARAMS]) assert.equal(PARAMS[i as keyof typeof PARAMS].domain, s.domain, `${s.id}: ${i} belongs to ${s.domain}`);
    }
    const names = s.values.map((v) => v.name);
    assert.equal(new Set(names).size, names.length, `${s.id}: value names are unique`);
    assert.ok(names.includes(s.default), `${s.id}: its default ${s.default} is a value`);
    for (const v of s.values) assert.deepEqual(Object.keys(v.set).sort(), [...s.inputs].sort(), `${s.id}.${v.name}: sets exactly the scale's inputs`);
  }
});

test('descriptors: the default value of every scale is the kit default, so the default theme reads as all defaults', () => {
  const kit = (i: string) => i === 'scheme' ? 'auto' : i === 'icons' ? 'phosphor' : i.startsWith('spectrum.') ? SPECTRUM_DEFAULTS[i.slice(9)] : defaultParams[i as keyof typeof defaultParams];
  for (const s of scales) {
    const d = s.values.find((v) => v.name === s.default)!;
    for (const [i, v] of Object.entries(d.set)) assert.equal(v, kit(i), `${s.id}.${s.default}: ${i} is the kit default`);
  }
  const read = describeTheme({});
  for (const s of scales) assert.deepEqual(read[s.id], { value: s.default, distance: 0 }, s.id);
});

test('descriptors: every value resolves to a valid theme and reads back as itself at distance 0, leaving the other scales at their defaults', () => {
  for (const s of scales) for (const v of s.values) {
    const { theme, unresolved } = themeFromCharacter({ [s.id]: v.name });
    assert.deepEqual(unresolved, []);
    const r = validateThemeObject(named(theme));
    assert.ok(r.ok, `${s.id}.${v.name}: ${JSON.stringify((r as any).errors)}`);
    const read = describeTheme(theme);
    assert.deepEqual(read[s.id], { value: v.name, distance: 0 }, `${s.id}.${v.name} reads back`);
    for (const o of scales) if (o.id !== s.id) assert.equal(read[o.id].value, o.default, `${s.id}.${v.name} leaves ${o.id} at ${o.default}`);
    for (const i of s.inputs) assert.deepEqual(theme.provenance?.[inputSpec(i).path], { source: 'character', reason: `${s.id}.${v.name}` });
  }
});

test('descriptors: no single value trips a theme lint warning on its own', () => {
  for (const s of scales) for (const v of s.values) {
    const warnings = lintTheme(themeFromCharacter({ [s.id]: v.name }).theme).findings.filter((f) => f.severity === 'warning');
    assert.deepEqual(warnings.map((f) => f.id), [], `${s.id}.${v.name}`);
  }
});

test('descriptors: a whole character resolves at once, hand edits win, unknown names come back unresolved', () => {
  const character = { scale: 'sm', density: 'compact', curvature: 'crisp', elevation: 'flat', 'type-scale': 'gentle', vibrancy: 'muted', adaptivity: 'dark-first', movement: 'calm' };
  const hand = { geometry: { parameters: { 'radius-scale': 0.8 } }, provenance: { 'geometry.parameters.radius-scale': { source: 'hand' as const, reason: 'logo corners' } } };
  const { theme, unresolved } = themeFromCharacter({ ...character, line: 'dotted', texture: 'grainy' }, hand);
  assert.deepEqual(unresolved.map((u) => u.split(':')[0]), ['line', 'texture']);
  assert.ok(validateThemeObject(named({ ...theme, character })).ok);
  assert.equal(theme.geometry?.parameters?.['radius-scale'], 0.8, 'the hand value wins');
  assert.deepEqual(theme.provenance?.['geometry.parameters.radius-scale'], { source: 'hand', reason: 'logo corners' });
  assert.equal(theme.scheme, 'dark');
  const read = describeTheme(theme);
  for (const [id, value] of Object.entries(character)) if (id !== 'curvature') assert.deepEqual(read[id], { value, distance: 0 }, id);
  assert.equal(read.curvature.value, 'soft', '0.8 reads as the nearest value, soft');
  assert.ok(read.curvature.distance > 0);
});

test('descriptors: the validator and the schema accept only known scale values in character', () => {
  assert.ok(validateThemeObject(named({ character: { curvature: 'round', movement: 'still' } })).ok);
  const bad = validateThemeObject(named({ character: { curvature: 'blobby', texture: 'grainy' } }));
  assert.equal(bad.ok, false);
  assert.match((bad as any).errors.join('\n'), /character\.curvature: must be one of/);
  assert.match((bad as any).errors.join('\n'), /character\.texture: unknown descriptor scale/);
});

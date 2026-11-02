// Geometry acceptance (docs/guides/geometry-review.md): the checklist items a test can enforce.
// Every component belongs to a geometry family; every family names exported resolvers, has rows in
// docs/geometry.csv, is rendered by the browser geometry check, and has (or explicitly waives) a
// size-ladder metrics family in the jig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as resolve from '../tokens/geometry/resolve.ts';

const KIT = new URL('..', import.meta.url).pathname;
const read = (p: string) => readFileSync(join(KIT, p), 'utf8');
const families = JSON.parse(read('contracts/geometry-families.json')).families as Record<string, { members: string[]; resolver: string[]; csv?: string[]; ladder?: string | null; ladderWaiver?: string }>;
const components = readdirSync(join(KIT, 'components'), { withFileTypes: true }).filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(KIT, 'components', d.name)).filter((f) => f.endsWith('.manifest.json')).map((f) => JSON.parse(read(`components/${d.name}/${f}`))))
  .flatMap((m) => m.nodes.filter((n: any) => n.kind === 'component' && n.tag)) as { id: string; tag: string }[];
const csvFamilies = new Set(read('docs/geometry.csv').split('\n').slice(1).map((l) => l.split(',')[1]).filter(Boolean));
const geometryCheck = readFileSync(join(KIT, '../../apps/studio/geometry-check.html'), 'utf8');
// Known gaps on the components that existed when this check landed (2026-11-02). The list is a
// ratchet: a new component cannot add a gap, and closing one fails the test until it is removed here.
const KNOWN_GAPS = new Set<string>([]);
const gaps: string[] = [];
const ladderKeys = new Set([...readFileSync(join(KIT, '../../apps/studio/src/pages/shared.tsx'), 'utf8').matchAll(/^\s{2}(\w+): \(g\) =>/gm)].map((m) => m[1]));

test('every component belongs to a geometry family', () => {
  const members = new Set(Object.values(families).flatMap((f) => f.members));
  for (const c of components) if (!members.has(c.id)) gaps.push(`family:${c.id}`);
});

test('every family names resolvers exported from tokens/geometry/resolve.ts', () => {
  for (const [id, f] of Object.entries(families)) {
    if (!f.resolver.length) { gaps.push(`resolver:${id}`); continue; }
    for (const r of f.resolver) assert.equal(typeof (resolve as any)[r], 'function', `${id}: ${r} is not exported`);
  }
});

test('every family has rows in docs/geometry.csv', () => {
  for (const [id, f] of Object.entries(families)) {
    assert.ok(Array.isArray(f.csv), `${id}: declare its CSV families (csv: [...])`);
    if (!f.csv!.length) { gaps.push(`csv:${id}`); continue; }
    for (const c of f.csv!) assert.ok(csvFamilies.has(c), `${id}: no CSV rows with family "${c}"`);
  }
});

test('the browser geometry check renders every component tag', () => {
  // A tag counts as rendered when the page's source names it (as markup, or by its bare name in a
  // level list such as ['group', 'collection', …] that builds ui-<name>).
  for (const t of new Set(components.map((c) => c.tag))) {
    const bare = t.slice(3);
    if (!new RegExp(`<${t}[\\s>]|['"\`]${t}['"\`]|['"]${bare}['"]`).test(geometryCheck)) gaps.push(`check:${t}`);
  }
});

test('every family has a jig size-ladder metrics family, or an explicit waiver', () => {
  for (const [id, f] of Object.entries(families)) {
    if (f.ladder === null) { assert.ok(f.ladderWaiver, `${id}: ladder null needs a ladderWaiver reason`); continue; }
    assert.ok(f.ladder && ladderKeys.has(f.ladder), `${id}: ladder "${f.ladder}" is not a LADDER_METRICS key (${[...ladderKeys].join(', ')})`);
  }
});

test('known geometry gaps match exactly (close one: remove it from KNOWN_GAPS; never add one)', () => {
  assert.deepEqual([...new Set(gaps)].sort(), [...KNOWN_GAPS].sort());
});

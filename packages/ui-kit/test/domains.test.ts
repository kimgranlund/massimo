// Theme domains (contracts/domains/<name>.json): the four parts of the theme a brand hydrates. Each
// manifest must agree with the exports and contracts it summarizes, so it cannot drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import Ajv from 'ajv';
import { PARAMS, THEME_DOMAINS, themeJsonSchema } from '../tokens/themes/index.ts';
import { staleness, domainRecords } from '../scripts/verification.ts';
import { loadGraph, lookup } from '../scripts/registry-lib.ts';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const DOMAINS = readdirSync(new URL('../contracts/domains', import.meta.url)).filter((f) => f.endsWith('.json')).map((f) => read(`contracts/domains/${f}`));
const parameters = read('contracts/parameters.json');
const constraints = read('contracts/theme-constraints.json');

test('domains: one manifest per theme domain, each valid against its schema', () => {
  assert.deepEqual(DOMAINS.map((d) => d.name).sort(), [...THEME_DOMAINS].sort());
  const ajv = new (Ajv as any)({ strict: false, allErrors: true });
  const validate = ajv.compile(read('contracts/domain-manifest.schema.json'));
  for (const d of DOMAINS) {
    assert.ok(validate(d), `${d.name}: ${JSON.stringify(validate.errors)}`);
    assert.equal(d.id, `domain:${d.name}`);
    assert.equal(d.themePart, d.name);
  }
});

test('domains: the manifests partition the theme groups, concepts and constraints, and agree with PARAMS', () => {
  const owner = (key: 'parameterGroups' | 'constraints' | 'concepts') => {
    const map = new Map<string, string[]>();
    for (const d of DOMAINS) for (const x of d[key]) map.set(x, [...(map.get(x) ?? []), d.name]);
    return map;
  };
  const groups = owner('parameterGroups');
  const themeGroups = Object.entries<any>(parameters.groups).filter(([, g]) => g.scope === 'theme' || g.id === undefined && g.scope !== 'subtree').map(([k]) => k);
  for (const g of themeGroups) assert.equal(groups.get(g)?.length, 1, `group ${g}: owned by exactly one domain (${groups.get(g) ?? 'none'})`);
  for (const g of groups.keys()) assert.ok(parameters.groups[g], `group ${g} exists in contracts/parameters.json`);
  // A PARAMS member sits in the domain whose manifest owns its group.
  for (const d of DOMAINS) for (const g of d.parameterGroups) {
    const spec = parameters.groups[g].spec;
    if (spec?.export !== 'PARAMS') continue;
    for (const m of parameters.groups[g].members) assert.equal((PARAMS as any)[m].domain, d.name, `${m}: PARAMS domain is ${d.name} (group ${g})`);
  }
  const rules = owner('constraints');
  for (const id of Object.keys(constraints.rules)) assert.equal(rules.get(id)?.length, 1, `constraint ${id}: owned by exactly one domain`);
  for (const d of DOMAINS) for (const id of d.constraints) assert.ok(d.concepts.includes(constraints.rules[id].concept), `${id}: its concept ${constraints.rules[id].concept} is one ${d.name} covers`);
  const concepts = owner('concepts');
  for (const c of concepts.keys()) assert.ok(parameters.concepts[c], `concept ${c} exists`);
  for (const [c, ds] of concepts) assert.equal(ds.length, 1, `concept ${c}: covered by one domain`);
});

test('domains: every listed field, spec, resolver and check exists', () => {
  const schema = themeJsonSchema() as any;
  for (const d of DOMAINS) {
    assert.deepEqual([...d.themePartFields].sort(), Object.keys(schema.properties[d.themePart].properties).sort(), `${d.name}: themePartFields match the theme schema`);
    for (const s of d.specs) assert.ok(existsSync(new URL(`../contracts/domains/${s.split('#')[0]}`, import.meta.url)), `${d.name}: spec ${s}`);
    for (const r of d.resolvers) assert.ok(existsSync(new URL(`../${r}`, import.meta.url)), `${d.name}: resolver ${r}`);
    for (const c of d.checks) {
      const file = c.command.match(/test\/[\w-]+\.test\.ts/)?.[0];
      if (file) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `${d.name}: check ${c.command}`);
    }
    // The record declares the same checks as the manifest.
    const rec = read(`contracts/domains/${d.verification.slice(2)}`);
    assert.equal(rec.domain, d.name);
    assert.deepEqual(Object.values<any>(rec.renderers).flatMap((r) => r.checks.map((c: any) => c.command)).sort(), d.checks.map((c: any) => c.command).sort(), `${d.name}: record and manifest name the same checks`);
  }
});

test('domains: verification records are current (npm run verification -- run domain:<name>)', () => {
  assert.deepEqual(domainRecords(), DOMAINS.map((d) => `domain:${d.name}`).sort());
  assert.deepEqual(domainRecords().flatMap(staleness), []);
});

test('domains: the registry has a node per domain that covers its concepts and owns its groups and constraints', () => {
  const graph = loadGraph();
  for (const d of DOMAINS) {
    const r = lookup(d.id, graph) as any;
    assert.equal(r.kind, 'domain');
    assert.deepEqual([...r.groups].sort(), d.parameterGroups.map((g: string) => `parameters:${g}`).sort());
    assert.deepEqual([...r.constraints].sort(), d.constraints.map((c: string) => `constraint:${c}`).sort());
    assert.deepEqual([...r.descriptors].sort(), d.descriptors.map((s: any) => `descriptor:${s.id}`).sort());
    for (const s of d.descriptors) for (const v of s.values) assert.equal((lookup(`descriptor:${s.id}.${v.name}`, graph) as any).kind, 'descriptor-value');
  }
  assert.equal((lookup('constraint:scale.target-size', graph) as any).kind, 'constraint');
});

// Manifests, examples, verification records and the registry graph agree with source.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import Ajv from 'ajv';
import { KIT, manifests, fromManifest, pointer, readSource, buildGraph, graphText, auditRecommendations, page, find, assembly } from '../scripts/registry-lib.ts';
import { staleness, componentFolders } from '../scripts/verification.ts';
import { GEOMETRY_SCOPE } from '../styles/geometry.ts';

const all = manifests();
for (const { manifest } of all) if (manifest.module) await import(`../components/${manifest.name}/${manifest.module.slice(2)}`);

const read = (p: string) => JSON.parse(readFileSync(join(KIT, p), 'utf8'));
const ajv = new (Ajv as any)({ strict: false, allErrors: true });
const validateManifest = ajv.compile(read('contracts/component-manifest.schema.json'));
const validateExamples = ajv.compile(read('contracts/examples.schema.json'));
const validateRecord = ajv.compile(read('contracts/verification.schema.json'));
const contracts = read('contracts/components.json').components;
const families = read('contracts/geometry-families.json').families;
const graph = buildGraph();
const components = all.flatMap(({ path, manifest }) => manifest.nodes.filter((n: any) => n.kind === 'component').map((node: any) => ({ path, manifest, node })));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const typeName = (t: unknown) => (t === Boolean ? 'boolean' : t === Number ? 'number' : 'string');
const attrOf = (k: string, c: any) => c.attribute ?? k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

test('every manifest, examples file and verification record validates against its schema', () => {
  for (const { path, manifest } of all) {
    assert.ok(validateManifest(manifest), `${path}: ${JSON.stringify(validateManifest.errors?.slice(0, 3))}`);
    const ex = fromManifest(path, manifest.examples);
    assert.ok(validateExamples(read(ex)), `${ex}: ${JSON.stringify(validateExamples.errors?.slice(0, 3))}`);
    const rec = `components/${manifest.name}/verification/${manifest.name}.verification.json`;
    assert.ok(validateRecord(read(rec)), `${rec}: ${JSON.stringify(validateRecord.errors?.slice(0, 3))}`);
  }
});

test('the schema check bites: a component without intent or with an unknown relation is rejected', () => {
  const m = structuredClone(all[0].manifest);
  delete m.nodes[0].intent;
  assert.equal(validateManifest(m), false);
  const m2 = structuredClone(all[0].manifest);
  m2.edges[0].relation = 'likes';
  assert.equal(validateManifest(m2), false);
});

test('every registered ui-* tag has exactly one manifest node, and every element node is registered', () => {
  const tags = components.map((c) => c.node.tag);
  assert.equal(new Set(tags).size, tags.length, 'duplicate tags');
  for (const t of GEOMETRY_SCOPE.match(/ui-[a-z-]+/g)!) assert.ok(tags.includes(t), `${t} has no manifest node`);
  for (const { manifest, node } of components) {
    const cls = customElements.get(node.tag);
    if (manifest.registration === 'none') assert.equal(cls, undefined, `${node.tag} is CSS-only but registered`);
    else assert.ok(cls, `${node.tag} is not registered by ${manifest.module}`);
  }
});

test('node properties match static properties; class, base and form association match the element', () => {
  for (const { node } of components) {
    const cls: any = customElements.get(node.tag);
    if (!cls) { assert.deepEqual(node.properties, [], `${node.id}: CSS-only nodes have no properties`); continue; }
    const want = Object.entries(cls.properties as Record<string, any>).map(([key, c]) => ({ key, type: typeName(c.type), default: c.default ?? null, attribute: attrOf(key, c), reflects: !!c.reflect }));
    const got = node.properties.map((p: any) => ({ key: p.key, type: p.type, default: p.default, attribute: p.attribute, reflects: p.reflects }));
    assert.deepEqual(got, want, `${node.id} properties`);
    assert.equal(node.class, cls.name, `${node.id} class`);
    assert.equal(node.semantics.formAssociated, !!cls.formAssociated, `${node.id} formAssociated`);
    assert.equal(node.extends, cls.formAssociated ? 'UIFormElement' : 'UIElement', `${node.id} extends`);
    for (const p of node.properties) if (p.enum && p.default !== null && p.default !== '') assert.ok(p.enum.includes(p.default), `${node.id}.${p.key} default outside its enum`);
    for (const a of node.attributes) assert.ok(!node.properties.some((p: any) => p.attribute === a.name), `${node.id}: ${a.name} is a property attribute, not attribute-only`);
  }
});

test('every event a module dispatches is declared on one of its nodes', () => {
  for (const { path, manifest } of all) {
    if (!manifest.module) continue;
    const src = readFileSync(join(KIT, fromManifest(path, manifest.module)), 'utf8');
    const dispatched = new Set([...src.matchAll(/new (?:Custom)?Event\('([a-z]+)'/g)].map((m) => m[1]));
    const declared = new Set(manifest.nodes.flatMap((n: any) => (n.events ?? []).map((e: any) => e.name)));
    for (const e of dispatched) assert.ok(declared.has(e), `${manifest.name}: dispatches ${e} but declares ${[...declared]}`);
  }
});

test('paths, JSON Pointers, renderer modules and independent layers resolve', () => {
  for (const { path, manifest } of all) {
    const refs = [manifest.documentation, manifest.examples, manifest.contract, manifest.stateContract, ...manifest.styleSource.modules,
      ...(manifest.module ? [manifest.module] : []), ...manifest.nodes.flatMap((n: any) => (n.contract ? [n.contract] : []))];
    for (const r of refs) assert.doesNotThrow(() => readSource(fromManifest(path, r)), `${path}: ${r}`);
    for (const [name, r] of Object.entries<any>(manifest.renderers)) {
      if (r.module) assert.ok(existsSync(join(KIT, fromManifest(path, r.module))), `${path}: ${name} module`);
      if (r.verification) assert.doesNotThrow(() => readSource(fromManifest(path, r.verification)), `${path}: ${name} verification`);
      if (r.status === 'completed') assert.ok(r.verification, `${path}: completed ${name} needs a verification record`);
      for (const id of Object.keys(r.exports ?? {}).concat(Object.keys(r.selectors ?? {}))) assert.ok(manifest.nodes.some((n: any) => n.id === id), `${path}: ${name} maps unknown ${id}`);
    }
    for (const layer of manifest.independentLayers ?? []) {
      const src = readFileSync(join(KIT, fromManifest(path, layer.module)), 'utf8');
      for (const e of layer.exports) assert.match(src, new RegExp(`export (?:function|const|class) ${e}\\b`), `${path}: ${layer.module} exports ${e}`);
    }
  }
});

test('edges and recommendations point at existing graph IDs; components carry the required relationships', () => {
  for (const e of graph.edges) {
    assert.ok(graph.nodes[e.from], `edge from unknown ${e.from}`);
    assert.ok(graph.nodes[e.to], `${e.from} ${e.relation} unknown ${e.to}`);
  }
  for (const { node } of components) {
    const out = graph.edges.filter((e) => e.from === node.id);
    const to = (rel: string) => out.filter((e) => e.relation === rel).map((e) => e.to).sort();
    for (const f of ['colors', 'typography', 'geometry', 'motion', 'states']) assert.ok(to('usesFoundation').includes(`foundation:${f}`), `${node.id} usesFoundation ${f}`);
    const c = contracts[node.id.slice('component:'.length)];
    assert.ok(c, `${node.id} has no semantic contract`);
    assert.deepEqual(to('usesGeometry'), [families[c.geometryFamily].id], `${node.id} geometry family`);
    assert.deepEqual(to('allowedIn'), c.allowedParents.map((p: string) => `context:${p}`).sort(), `${node.id} contexts`);
    const contractParts = c.parts.map((p: string) => `part:${p.replace(/\?$/, '')}`).sort();
    assert.deepEqual(to('ownsPart'), contractParts, `${node.id} parts agree with contracts/components.json`);
    for (const a of node.avoidWhen) if (a.useInstead) {
      assert.notEqual(a.useInstead, node.id, `${node.id} recommends itself`);
      assert.ok(graph.nodes[a.useInstead], `${node.id} recommends unknown ${a.useInstead}`);
    }
  }
  assert.equal(auditRecommendations(graph).ok, true);
});

test('labelled components own the five construction-pattern parts', () => {
  const PATTERN = ['part:slot-leading', 'part:slot-prefix', 'part:slot-contents', 'part:slot-suffix', 'part:slot-trailing'];
  for (const id of ['button', 'option', 'tag', 'chip']) {
    const parts = graph.edges.filter((e) => e.from === `component:${id}` && e.relation === 'ownsPart').map((e) => e.to);
    for (const p of PATTERN) assert.ok(parts.includes(p), `component:${id} owns ${p}`);
  }
  for (const id of ['input', 'select']) {
    const parts = graph.edges.filter((e) => e.from === `component:${id}` && e.relation === 'ownsPart').map((e) => e.to);
    for (const p of ['part:slot-leading', 'part:slot-prefix', 'part:slot-suffix']) assert.ok(parts.includes(p), `component:${id} owns ${p}`);
  }
});

test('examples mount with no native form elements, and name real subjects', async () => {
  (globalThis as any).IntersectionObserver ??= class { observe() {} disconnect() {} };
  for (const { path, manifest } of all) {
    const ex = read(fromManifest(path, manifest.examples));
    assert.ok(ex.examples.some((e: any) => e.id === ex.defaultExample), `${manifest.name}: defaultExample`);
    const ids = new Set(manifest.nodes.map((n: any) => n.id));
    for (const e of ex.examples) {
      assert.ok(ids.has(e.subject), `${manifest.name}/${e.id}: subject ${e.subject}`);
      const d = document.createElement('div');
      d.innerHTML = e.markup;
      document.body.append(d);
      await tick();
      const subjectTag = graph.nodes[e.subject]?.tag;
      if (subjectTag) assert.ok(d.querySelector(subjectTag), `${manifest.name}/${e.id} contains ${subjectTag}`);
      const hosts = [...d.querySelectorAll('*')].filter((el) => el.localName.startsWith('ui-'));
      for (const h of hosts) assert.equal(h.querySelector(NATIVE), null, `${manifest.name}/${e.id}: native element inside ${h.localName}`);
      d.remove();
    }
  }
});

test('graph.json is current (run npm run registry:graph)', () => {
  assert.equal(readFileSync(join(KIT, 'graph.json'), 'utf8'), graphText());
});

test('verification records are current: bound sources unchanged since the last passing run', () => {
  assert.deepEqual(componentFolders(), all.map((m) => m.manifest.name).sort());
  const problems = componentFolders().flatMap(staleness);
  assert.deepEqual(problems, []);
});

test('registry: find, assembly, paging and the continuation token', () => {
  assert.ok(find('dropdown').some((r) => r.id === 'component:select'));
  assert.ok(find('Prefix').some((r) => r.id === 'part:slot-prefix'));
  assert.deepEqual(find('zzzz'), []);
  const a = assembly('component:radio');
  assert.equal(a.tag, 'ui-radio');
  assert.ok(a.alternatives.every((x: any) => !x.useInstead || x.availability === 'implemented'));
  const content = 'x'.repeat(10000) + '€'.repeat(100);
  let offset = 0, token: string | null = null, acc = '';
  for (let i = 0; i < 20; i++) {
    const raw = page(['k'], content, offset, token, 1000);
    assert.ok(Buffer.byteLength(raw) <= 1000);
    const p = JSON.parse(raw);
    acc += p.content;
    if (p.complete) break;
    [, offset, token] = [p.next.args[1], Number(p.next.args[2]), p.next.args[3]];
  }
  assert.equal(acc, content);
  assert.throws(() => page(['k'], content + 'changed', 5, page(['k'], content, 0, null, 1000) && JSON.parse(page(['k'], content, 0, null, 1000)).sha256, 1000), /restart/);
});

test('registry CLI: unknown IDs fail; --packet requires bounded delivery', () => {
  const run = (...a: string[]) => execFileSync('node', ['scripts/registry.ts', ...a], { cwd: KIT, encoding: 'utf8', stdio: 'pipe' });
  assert.throws(() => run('component:nope'));
  assert.throws(() => run('--packet', 'consumer', 'web-component', 'component:button'));
  const p = JSON.parse(run('--packet', 'consumer', 'web-component', 'component:button', '--page', '0'));
  assert.equal(typeof p.complete, 'boolean');
  assert.equal(JSON.parse(run('component:button')).registration.import, '@massimo/ui-kit/components/button/element');
});

test('pointer resolution rejects a missing key', () => {
  assert.throws(() => pointer({ a: 1 }, '/b'));
});

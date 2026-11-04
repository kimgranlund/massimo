// Manifests, examples, verification records and the registry graph agree with source.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import Ajv from 'ajv';
import { KIT, styleModules, manifests, fromManifest, pointer, readSource, buildGraph, graphText, auditRecommendations, page, find, assembly, lookup, parameterId, specMembers } from '../scripts/registry-lib.ts';
import { staleness, componentFolders } from '../scripts/verification.ts';
import { GEOMETRY_SCOPE } from '../styles/geometry.ts';
import { compare, generate, manifestText } from '../scripts/manifests.ts';

const all = manifests();
for (const { manifest } of all) if (manifest.module) await import(`../components/${manifest.name}/${manifest.module.slice(2)}`);

const read = (p: string) => JSON.parse(readFileSync(join(KIT, p), 'utf8'));
const ajv = new (Ajv as any)({ strict: false, allErrors: true });
const validateManifest = ajv.compile(read('contracts/component-manifest.schema.json'));
const validateExamples = ajv.compile(read('contracts/examples.schema.json'));
const validateRecord = ajv.compile(read('contracts/verification.schema.json'));
const contracts = read('contracts/components.json').components;
const graph = buildGraph();
const components = all.flatMap(({ path, manifest }) => manifest.nodes.filter((n: any) => n.kind === 'component').map((node: any) => ({ path, manifest, node })));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';

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

// Properties, class, base, form association, dispatched events, contract edges (geometry family,
// parts, contexts) and React props are generated from source by scripts/manifests.ts.
test('manifests are current: mirrored fields equal the generator output (run npm run manifests)', () => {
  const stale = compare().filter(([, cur, next]) => cur !== next).map(([p]) => p);
  assert.deepEqual(stale, []);
});

test('the manifest check bites: edited mirrored fields are restored, hand-written fields are kept', () => {
  const { path, manifest } = all.find((m) => m.manifest.name === 'button')!;
  const text = manifestText(manifest);
  const node = (m: any) => m.nodes.find((n: any) => n.id === 'component:button');
  const edits: [string, (m: any) => void][] = [
    ['property default', (m) => { node(m).properties.find((p: any) => p.key === 'type').default = 'submit'; }],
    ['property reflects', (m) => { node(m).properties.find((p: any) => p.key === 'loading').reflects = false; }],
    ['missing property', (m) => { node(m).properties = node(m).properties.filter((p: any) => p.key !== 'loading'); }],
    ['class', (m) => { node(m).class = 'UIButtonX'; }],
    ['formAssociated', (m) => { node(m).semantics.formAssociated = false; }],
    ['ownsPart edge', (m) => { m.edges = m.edges.filter((e: any) => e.to !== 'part:slot-suffix'); }],
    ['allowedIn edge', (m) => { m.edges.push({ from: 'component:button', relation: 'allowedIn', to: 'context:nowhere' }); }],
    ['react prop', (m) => { m.renderers.react.props['component:button'].props.push('hidden?: boolean'); }],
  ];
  for (const [what, edit] of edits) {
    const m = structuredClone(manifest);
    edit(m);
    assert.notEqual(manifestText(m), text, `${what}: the edit changes the file`);
    assert.equal(manifestText(generate(path, m)), text, `${what}: the generator restores it`);
  }
  const choice = all.find((m) => m.manifest.name === 'choice')!;
  const c = structuredClone(choice.manifest);
  c.nodes[0].events.find((e: any) => e.name === 'change').bubbles = false;
  c.nodes[0].events = c.nodes[0].events.filter((e: any) => e.name !== 'input');
  const regenerated = generate(choice.path, c);
  assert.equal(regenerated.nodes[0].events.find((e: any) => e.name === 'change').bubbles, true, 'dispatched event flags are restored');
  assert.deepEqual(regenerated.nodes[0].events.find((e: any) => e.name === 'input').trigger, '', 'an undeclared dispatched event is added with an empty trigger');
  const kept = structuredClone(manifest);
  node(kept).properties[0].description = 'hand-written';
  node(kept).intent = ['hand-written'];
  node(kept).avoidWhen = [];
  node(kept).events[0].trigger = 'hand-written';
  assert.deepEqual(generate(path, kept), kept, 'hand-written fields survive');
});

test('enum defaults sit in the enum; attribute-only inputs are not property attributes; every event has a trigger', () => {
  for (const { node } of components) {
    if (!customElements.get(node.tag)) assert.deepEqual(node.properties, [], `${node.id}: CSS-only nodes have no properties`);
    for (const p of node.properties) if (p.enum && p.default !== null && p.default !== '') assert.ok(p.enum.includes(p.default), `${node.id}.${p.key} default outside its enum`);
    for (const a of node.attributes) assert.ok(!node.properties.some((p: any) => p.attribute === a.name), `${node.id}: ${a.name} is a property attribute, not attribute-only`);
    for (const e of node.events) assert.ok(e.trigger.trim(), `${node.id}: event ${e.name} needs a trigger`);
  }
});

// A second derivation (regex, not the generator's AST walk) of the dispatched events.
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
    const refs = [manifest.documentation, manifest.examples, manifest.contract, manifest.stateContract, ...styleModules(manifest),
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
  const input = assembly('component:input');
  assert.equal(input.react.export, 'Input');
  assert.ok(input.react.props.some((p: string) => p.startsWith('hideLabel?: boolean')), 'assembly shows React props');
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

test('parameters: the contract lists exactly the members each owning export defines, and the registry finds and traces them', () => {
  const { groups, concepts } = read('contracts/parameters.json');
  for (const [c, rec] of Object.entries<any>(concepts)) assert.ok(readSource(rec.documentation), `concept ${c} documentation resolves`);
  for (const [g, rec] of Object.entries<any>(groups)) {
    assert.ok(concepts[rec.concept], `${g} expresses a known concept (${rec.concept})`);
    for (const [m, c] of Object.entries<any>(rec.memberConcepts ?? {})) assert.ok(rec.members.includes(m) && concepts[c], `${g}.${m} → ${c}`);
  }
  assert.ok((lookup('concept:curvature', graph) as any).groups.includes('parameters:curvature'), 'a concept lists the groups that express it');
  const byOwner = new Map<string, { group: string; members: string[]; spec: any }[]>();
  for (const [g, rec] of Object.entries<any>(groups)) {
    assert.equal(new Set(rec.members).size, rec.members.length, `${g} repeats a member`);
    assert.ok(readSource(rec.documentation), `${g} documentation resolves`);
    if (!rec.spec) continue;
    const key = `${rec.spec.module}#${rec.spec.export}`;
    byOwner.set(key, [...(byOwner.get(key) ?? []), { group: g, members: rec.members, spec: rec.spec }]);
  }
  for (const [owner, gs] of byOwner) {
    const listed = gs.flatMap((g) => g.members);
    assert.deepEqual([...listed].sort(), [...specMembers(gs[0].spec)].sort(), `${owner}: contracts/parameters.json must list every member once`);
  }
  for (const [term, id] of [['radius scale', 'parameter:radius-scale'], ['type ratio', 'parameter:type-ratio'], ['corner shape', 'parameter:corner-shape'], ['chroma', 'parameter:spectrum-chroma']])
    assert.ok(find(term, graph).some((r) => r.id === id), `--find ${term} → ${id}`);
  const unit = lookup(parameterId(groups.unit, 'unit'), graph) as any;
  assert.equal(unit.spec.default, 4.5);
  assert.equal(unit.group, 'parameters:unit');
  const button = assembly('component:button', graph).parameters.map((p: any) => p.group);
  assert.ok(button.includes('parameters:curvature') && button.includes('parameters:spectrum'), 'button responds to curvature and color');
  assert.ok(!button.includes('parameters:containers'), 'button is not a container');
  assert.ok(assembly('component:container', graph).parameters.some((p: any) => p.group === 'parameters:containers'), 'container responds to the container ladder');
});

test('pointer resolution rejects a missing key', () => {
  assert.throws(() => pointer({ a: 1 }, '/b'));
});

test('examples and guides use ui-container, not the deprecated level tags', () => {
  const OLD = /<ui-(group|collection|card|panel|region|page)[\s>/]/;
  for (const { path, manifest } of all) {
    const ex = read(fromManifest(path, manifest.examples));
    for (const e of ex.examples) assert.ok(!OLD.test(e.markup), `${path} example ${e.id} uses a deprecated level tag; use <ui-container preset="…">`);
    const guide = readFileSync(join(KIT, fromManifest(path, manifest.documentation)), 'utf8');
    assert.ok(!OLD.test(guide), `${manifest.documentation} uses a deprecated level tag`);
  }
  const container = all.find((m) => m.manifest.name === 'container')!.manifest;
  for (const n of container.nodes.filter((x: any) => x.id !== 'component:container' && x.kind === 'component')) {
    assert.equal(n.status, 'deprecated', `${n.id} is a deprecated alias`);
    assert.ok(n.avoidWhen.some((a: any) => a.useInstead === 'component:container'), `${n.id} points at component:container`);
  }
});

// Rewrites the fields of components/*/*.manifest.json that mirror source, and leaves every other
// field (intent, constraints, avoidWhen, relationships, descriptions, inspector hints, …) as it is.
//   node scripts/manifests.ts          rewrite the manifests
//   node scripts/manifests.ts --check  exit 1 when a manifest differs from the generator output
//
// Generated per component node, from the registered element class (imported in a happy-dom window):
//   class, extends, semantics.formAssociated, the `extends` edge (foundation:element | form-element),
//   properties[].key/type/default/attribute/reflects (one entry per `static properties` key, in order;
//     enum, description and inspector are kept by key; a new key gets a default inspector control).
// From the folder's *.element.ts files (acorn over the type-stripped source):
//   events[].name/type/bubbles/cancelable for every `new Event | CustomEvent('<name>', {…})` the
//     node's class or one of its base classes dispatches (trigger and detail are kept by name;
//     a new event gets an empty trigger, which the tests reject until one is written). Events the
//     source does not dispatch (a managed native click) stay as written.
// From contracts/components.json (the semantic contract):
//   the usesGeometry, allowedIn and ownsPart edges, in contract order, placed where that node's
//   edges of the relation already were.
// From the React renderer module (scripts/react-props.ts):
//   renderers.react.props: per graph ID, the inherited base types and the declared props;
//   renderers.react.parts: per graph ID, the compound parts (`Select.Trigger`, Base UI style) and
//     the props of each, from the `Name.Part = Impl;` lines of the module (omitted when none).
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { parse } from 'acorn';
import { KIT, manifests, fromManifest } from './registry-lib.ts';
import { reactApi, reactParts, type ReactProp } from './react-props.ts';

type EventFact = { name: string; type: 'Event' | 'CustomEvent'; bubbles: boolean; cancelable: boolean };
type ClassFacts = { superName: string | null; events: EventFact[] };

const typeName = (t: unknown) => (t === Boolean ? 'boolean' : t === Number ? 'number' : 'string');
const attrOf = (k: string, c: any) => c.attribute ?? k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const INSPECTOR: Record<string, string> = { boolean: 'toggle', number: 'number', string: 'text' };

/** Classes declared in a folder's element modules, with the events each one dispatches. */
export function dispatchedEvents(folder: string): Map<string, ClassFacts> {
  const out = new Map<string, ClassFacts>();
  const dir = join(KIT, 'components', folder);
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.element.ts')).sort()) {
    const js = stripTypeScriptTypes(readFileSync(join(dir, f), 'utf8'));
    const ast: any = parse(js, { ecmaVersion: 'latest', sourceType: 'module' });
    const walk = (node: any, facts: ClassFacts | null) => {
      if (!node || typeof node.type !== 'string') return;
      if ((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') && node.id) {
        facts = { superName: node.superClass?.type === 'Identifier' ? node.superClass.name : null, events: [] };
        out.set(node.id.name, facts);
      }
      if (facts && node.type === 'NewExpression' && node.callee.type === 'Identifier' && /^(Custom)?Event$/.test(node.callee.name)) {
        const [nameArg, opts] = node.arguments;
        if (nameArg?.type !== 'Literal' || typeof nameArg.value !== 'string') throw new Error(`${folder}/${f}: event name must be a string literal`);
        const flag = (k: string) => {
          const p = opts?.properties?.find((q: any) => q.key?.name === k);
          if (p && p.value.type !== 'Literal') throw new Error(`${folder}/${f}: ${nameArg.value}.${k} must be a literal`);
          return !!p?.value.value;
        };
        if (!facts.events.some((e) => e.name === nameArg.value)) facts.events.push({ name: nameArg.value, type: node.callee.name, bubbles: flag('bubbles'), cancelable: flag('cancelable') });
      }
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (Array.isArray(v)) v.forEach((c) => walk(c, facts));
        else if (v && typeof v.type === 'string') walk(v, facts);
      }
    };
    walk(ast, null);
  }
  return out;
}

/** Events dispatched by a class and its bases declared in the same folder, base first. */
function eventsOf(cls: string, classes: Map<string, ClassFacts>): EventFact[] {
  const chain: ClassFacts[] = [];
  for (let c: string | null = cls; c && classes.has(c); c = classes.get(c)!.superName) chain.unshift(classes.get(c)!);
  const out: EventFact[] = [];
  for (const f of chain) for (const e of f.events) if (!out.some((o) => o.name === e.name)) out.push(e);
  return out;
}

function properties(cls: any, current: any[]): any[] {
  return Object.entries(cls.properties as Record<string, any>).map(([key, c]) => {
    const old = current.find((p) => p.key === key) ?? {};
    const type = typeName(c.type);
    const gen = { key, type, default: c.default ?? null, attribute: attrOf(key, c), reflects: !!c.reflect };
    const kept = Object.fromEntries(Object.entries(old).filter(([k]) => !(k in gen)));
    return { ...gen, ...kept, inspector: kept.inspector ?? { control: INSPECTOR[type] } };
  });
}

function events(dispatched: EventFact[], current: any[]): any[] {
  const out = current.map((e) => {
    const d = dispatched.find((x) => x.name === e.name);
    if (!d) return e;
    const merged: any = { ...e, ...d };
    if (d.type === 'Event') delete merged.detail; // a plain Event carries no detail
    return merged;
  });
  for (const d of dispatched) if (!out.some((e) => e.name === d.name)) out.push({ ...d, trigger: '' });
  return out;
}

/** Replace a node's edges of the given relations in place, keeping every other edge where it is. */
function placeEdges(edges: any[], from: string, generated: Map<string, string[]>): any[] {
  const out: any[] = [];
  const done = new Set<string>();
  for (const e of edges) {
    if (e.from !== from || !generated.has(e.relation)) { out.push(e); continue; }
    if (done.has(e.relation)) continue;
    done.add(e.relation);
    for (const to of generated.get(e.relation)!) out.push({ from, relation: e.relation, to });
  }
  for (const [relation, tos] of generated) if (!done.has(relation) && tos.length) {
    let at = out.map((e) => e.from).lastIndexOf(from) + 1;
    if (at === 0) at = out.length;
    out.splice(at, 0, ...tos.map((to) => ({ from, relation, to })));
  }
  return out;
}

/** The manifest with its mirrored fields regenerated from source. Element modules must be loaded. */
export function generate(path: string, manifest: any): any {
  const m = structuredClone(manifest);
  const contracts = JSON.parse(readFileSync(join(KIT, 'contracts/components.json'), 'utf8')).components;
  const families = JSON.parse(readFileSync(join(KIT, 'contracts/geometry-families.json'), 'utf8')).families;
  const classes = m.module ? dispatchedEvents(m.name) : new Map<string, ClassFacts>();
  for (const node of m.nodes) {
    if (node.kind !== 'component') continue;
    const cls: any = customElements.get(node.tag);
    const generated = new Map<string, string[]>();
    if (cls) {
      node.class = cls.name;
      node.extends = cls.formAssociated ? 'UIFormElement' : 'UIElement';
      node.semantics.formAssociated = !!cls.formAssociated;
      node.properties = properties(cls, node.properties ?? []);
      node.events = events(eventsOf(cls.name, classes), node.events ?? []);
      generated.set('extends', [cls.formAssociated ? 'foundation:form-element' : 'foundation:element']);
    } else if (m.registration !== 'none') throw new Error(`${node.tag} is not registered; load ${m.module} first`);
    const c = contracts[node.id.slice('component:'.length)];
    if (c) {
      generated.set('usesGeometry', [families[c.geometryFamily].id]);
      generated.set('ownsPart', c.parts.map((p: string) => `part:${p.replace(/\?$/, '')}`));
      generated.set('allowedIn', c.allowedParents.map((p: string) => `context:${p}`));
    }
    m.edges = placeEdges(m.edges, node.id, generated);
  }
  const react = m.renderers.react;
  if (react?.module) {
    const file = join(KIT, fromManifest(path, react.module));
    const props = Object.fromEntries(Object.entries<string>(react.exports ?? {}).map(([id, name]) => {
      const api = reactApi(file, name);
      return [id, { inherits: api.inherits, props: api.props.map(propLine) }];
    }));
    const parts = Object.fromEntries(Object.entries<string>(react.exports ?? {}).flatMap(([id, name]) => {
      const found = Object.entries(reactParts(file, name)).map(([part, api]) => [part, { inherits: api.inherits, props: api.props.map(propLine) }]);
      return found.length ? [[id, Object.fromEntries(found)]] : [];
    }));
    const { parts: _old, ...rest } = react;
    m.renderers.react = { ...rest, props, ...(Object.keys(parts).length ? { parts } : {}) };
  }
  return m;
}

/** One prop as a TypeScript-style member line: `name?: Type = default // description`. */
export const propLine = (p: ReactProp) =>
  `${p.name}${p.optional ? '?' : ''}: ${p.type}${p.default !== undefined ? ` = ${p.default}` : ''}${p.description ? ` // ${p.description}` : ''}`;

export const manifestText =(manifest: any) => JSON.stringify(manifest, null, 2) + '\n';

/** Import every element module so the classes are registered. */
export async function loadElements() {
  for (const { manifest } of manifests()) if (manifest.module) await import(`../components/${manifest.name}/${manifest.module.slice(2)}`);
}

/** [path, committed text, generated text] for every manifest. */
export function compare(): [string, string, string][] {
  return manifests().map(({ path, manifest }) => [path, readFileSync(join(KIT, path), 'utf8'), manifestText(generate(path, manifest))]);
}

if (import.meta.main) {
  if (!(globalThis as any).customElements) await import('../test/setup.ts');
  await loadElements();
  const stale = compare().filter(([, cur, next]) => cur !== next);
  if (process.argv.includes('--check')) {
    for (const [p] of stale) console.error(`${p} is stale: run npm run manifests`);
    if (stale.length) process.exit(1);
    console.log('manifests current');
  } else {
    for (const [p, , next] of stale) writeFileSync(join(KIT, p), next);
    console.log(stale.length ? `rewrote ${stale.map(([p]) => p).join(', ')}` : 'manifests current');
  }
}

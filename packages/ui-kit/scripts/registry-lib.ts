// Registry library: builds the graph index from the component manifests and contracts, resolves
// references, reads bodies, assembles lookups and packets, and pages responses. Used by
// scripts/registry.ts (CLI), scripts/registry-graph.ts (graph.json) and the tests.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARAMS } from '../tokens/themes/params.ts';
import { SPECTRUM_FIELDS } from '../tokens/colors/spectrum/config.ts';
import { ROLE_NAMES } from '../tokens/colors/spectrum/index.ts';
import { FACES, VOICES } from '../tokens/typography/resolve.ts';

export const KIT = fileURLToPath(new URL('..', import.meta.url));
const json = (p: string) => JSON.parse(readFileSync(join(KIT, p), 'utf8'));
const rel = (abs: string) => relative(KIT, abs).split('\\').join('/');

export type GraphNode = { kind: string; source: string; availability: string; title?: string; tag?: string; searchTerms: string[] };
export type Edge = { from: string; relation: string; to: string };
export type Graph = { $comment: string; schemaVersion: 1; nodes: Record<string, GraphNode>; edges: Edge[] };

// ── Manifests ──
export function manifestPaths(): string[] {
  return readdirSync(join(KIT, 'components'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(KIT, 'components', d.name, `${d.name}.manifest.json`)))
    .map((d) => `components/${d.name}/${d.name}.manifest.json`).sort();
}
export const loadManifest = (path: string) => json(path);
export const manifests = () => manifestPaths().map((path) => ({ path, manifest: loadManifest(path) }));

/** Resolve a manifest-relative path (with optional #fragment) to a package-relative one. */
export function fromManifest(manifestPath: string, ref: string): string {
  const [file, frag] = ref.split('#');
  const p = rel(normalize(join(KIT, dirname(manifestPath), file)));
  return frag !== undefined ? `${p}#${frag}` : p;
}

// ── JSON Pointer and Markdown anchors ──
export function pointer(doc: any, ptr: string): any {
  if (ptr === '' || ptr === '/') return doc;
  return ptr.split('/').slice(1).map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~')).reduce((o, k) => {
    if (o == null || !(k in Object(o))) throw new Error(`JSON Pointer ${ptr} does not resolve`);
    return o[k];
  }, doc);
}
const slug = (h: string) => h.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

/** Read a package-relative source: whole file, a JSON Pointer (#/a/b) or a Markdown section (#anchor). */
export function readSource(ref: string): { source: string; body: string } {
  const [file, frag] = ref.split('#');
  const abs = normalize(join(KIT, file));
  if (!abs.startsWith(normalize(join(KIT, '..', '..')))) throw new Error(`${file} is outside the repository`);
  if (!existsSync(abs)) throw new Error(`${file} does not exist`);
  const text = readFileSync(abs, 'utf8');
  if (!frag) return { source: file, body: text };
  if (frag.startsWith('/')) return { source: ref, body: JSON.stringify(pointer(JSON.parse(text), frag), null, 2) };
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && slug(l.replace(/^#+\s*/, '')) === frag);
  if (start < 0) throw new Error(`${file} has no section #${frag}`);
  const level = /^#+/.exec(lines[start])![0].length;
  let end = lines.findIndex((l, i) => i > start && /^#{1,6}\s/.test(l) && /^#+/.exec(l)![0].length <= level);
  if (end < 0) end = lines.length;
  return { source: ref, body: lines.slice(start, end).join('\n').trim() + '\n' };
}

// ── Graph ──
export function buildGraph(): Graph {
  const nodes: Record<string, GraphNode> = {};
  const edges: Edge[] = [];
  const add = (id: string, n: GraphNode) => {
    if (nodes[id]) throw new Error(`duplicate graph ID ${id} (${nodes[id].source} and ${n.source})`);
    nodes[id] = n;
  };
  for (const { path, manifest } of manifests()) {
    manifest.nodes.forEach((n: any, i: number) => add(n.id, {
      kind: n.kind, source: `${path}#/nodes/${i}`,
      availability: n.kind === 'component' ? (manifest.registration === 'none' ? 'css-only' : 'implemented') : 'implemented',
      ...(n.tag ? { tag: n.tag } : {}),
      searchTerms: n.searchTerms ?? (n.summary ? [n.id.split(':')[1].replace(/-/g, ' ')] : []),
    }));
    edges.push(...manifest.edges);
  }
  const shared: [string, string, string][] = [
    ['contracts/parts.json', 'parts', 'part'], ['contracts/foundations.json', 'foundations', 'foundation'],
    ['contracts/geometry-families.json', 'families', 'geometry'], ['contracts/composition.json', 'contexts', 'context'],
    ['contracts/tokens.json', 'tokens', 'tokens'],
  ];
  for (const [file, key, kind] of shared) {
    for (const [k, rec] of Object.entries<any>(json(file)[key])) add(rec.id, {
      kind, source: `${file}#/${key}/${k}`, availability: 'implemented', ...(rec.title ? { title: rec.title } : {}), searchTerms: rec.searchTerms ?? [k],
    });
  }
  // Parameters (contracts/parameters.json): a node per concept (concept:<id>), a node per group
  // carrying its drives edges and the concept it expresses, and a node per member (parameter:<id>)
  // that is a memberOf its group (and expresses its own concept when memberConcepts names one).
  const params = json('contracts/parameters.json');
  for (const [c, rec] of Object.entries<any>(params.concepts)) add(`concept:${c}`, { kind: 'concept', source: `contracts/parameters.json#/concepts/${c}`, availability: 'implemented', title: rec.title, searchTerms: rec.searchTerms ?? [c] });
  for (const [g, rec] of Object.entries<any>(params.groups)) {
    const group = `parameters:${g}`;
    add(group, { kind: 'parameters', source: `contracts/parameters.json#/groups/${g}`, availability: 'implemented', title: rec.title, searchTerms: rec.searchTerms ?? [g] });
    for (const to of rec.drives) edges.push({ from: group, relation: 'drives', to });
    edges.push({ from: group, relation: 'expresses', to: `concept:${rec.concept}` });
    for (const m of rec.members as string[]) {
      const id = parameterId(rec, m), label = parameterSpec(rec, m)?.label;
      add(id, { kind: 'parameter', source: `contracts/parameters.json#/groups/${g}`, availability: 'implemented', ...(label ? { title: label } : {}), searchTerms: [m.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...(label ? [label.toLowerCase()] : [])] });
      edges.push({ from: id, relation: 'memberOf', to: group });
      if (rec.memberConcepts?.[m]) edges.push({ from: id, relation: 'expresses', to: `concept:${rec.memberConcepts[m]}` });
    }
  }
  const sorted = Object.fromEntries(Object.entries(nodes).sort(([a], [b]) => a.localeCompare(b)));
  return { $comment: 'Generated by npm run registry:graph from components/*/*.manifest.json and contracts/. Do not edit.', schemaVersion: 1, nodes: sorted, edges };
}

// ── Parameters ──
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const parameterId = (group: any, member: string) => `parameter:${group.idPrefix ?? ''}${kebab(member)}`;
/** The exports that own parameter ranges and defaults, by module#export (contracts/parameters.json spec). */
export const PARAMETER_SPECS: Record<string, readonly any[] | Record<string, any>> = {
  'tokens/themes/params.ts#PARAMS': PARAMS,
  'tokens/colors/spectrum/config.ts#SPECTRUM_FIELDS': SPECTRUM_FIELDS,
  'tokens/colors/spectrum/index.ts#ROLE_NAMES': ROLE_NAMES,
  'tokens/typography/resolve.ts#FACES': FACES,
  'tokens/typography/resolve.ts#VOICES': VOICES,
};
/** The member names an export defines: object keys, field keys, or list values. */
export function specMembers(spec: { module: string; export: string; key?: string }): string[] {
  const v = PARAMETER_SPECS[`${spec.module}#${spec.export}`];
  if (!v) throw new Error(`no parameter export ${spec.module}#${spec.export}`);
  return Array.isArray(v) ? v.map((x) => spec.key ? x[spec.key] : x) : Object.keys(v);
}
/** A member's live range and default from the export that owns it (undefined for list exports and subtree inputs). */
export function parameterSpec(group: any, member: string): any {
  if (!group.spec) return undefined;
  const v: any = PARAMETER_SPECS[`${group.spec.module}#${group.spec.export}`];
  if (Array.isArray(v)) return group.spec.key ? v.find((x) => x[group.spec.key] === member) : undefined;
  return v?.[member];
}

export const graphText = () => JSON.stringify(buildGraph(), null, 2) + '\n';
export const loadGraph = (): Graph => json('graph.json');

/** The record a graph ID points at (a manifest node or a contract entry). */
export function record(id: string, graph = loadGraph()): any {
  const n = graph.nodes[id];
  if (!n) throw new Error(`unknown ID ${id}`);
  const [file, ptr] = n.source.split('#');
  return pointer(json(file), ptr);
}

const manifestOf = (id: string, graph: Graph) => graph.nodes[id].source.split('#')[0];

// ── Lookups ──
export function list(graph = loadGraph()) {
  return Object.entries(graph.nodes).filter(([, n]) => n.kind === 'component').map(([id]) => {
    const r = record(id, graph);
    return { id, tag: r.tag, status: r.status, availability: graph.nodes[id].availability, intent: r.intent, layout: r.layout };
  });
}

export function all(graph = loadGraph()) {
  return Object.entries(graph.nodes).map(([id, n]) => ({ id, kind: n.kind, availability: n.availability, source: n.source }));
}

function registration(id: string, graph: Graph) {
  const mpath = manifestOf(id, graph), m = loadManifest(mpath);
  const r = record(id, graph);
  return m.module
    ? { mode: 'on-import', import: `@massimo/ui-kit/components/${m.name}/element`, module: fromManifest(mpath, m.module), tag: r.tag, class: r.class }
    : { mode: 'none', note: 'CSS-only tag: load the kit CSS; nothing to register.', tag: r.tag };
}

/** The style modules a manifest names: its recipe module. */
export const styleModules = (m: any): string[] => [m.styleSource.module];

const STYLES = { css: '@massimo/ui-kit/css', preset: '@massimo/ui-kit/preset', note: 'Load dist/ui-kit.css, or add uiKitPreset to a Panda config. Components never generate styles at runtime.' };

export function lookup(id: string, graph = loadGraph()) {
  const n = graph.nodes[id];
  if (!n) throw new Error(`unknown ID ${id}`);
  const node = record(id, graph);
  if (n.kind === 'parameter') {
    const group = graph.edges.find((e) => e.from === id && e.relation === 'memberOf')!.to;
    const member = node.members.find((m: string) => parameterId(node, m) === id);
    return { id, kind: n.kind, source: n.source, member, group, spec: parameterSpec(node, member) ?? null, ...(node.spec ? { owner: `${node.spec.module}#${node.spec.export}` } : {}), drives: node.drives, record: node };
  }
  if (n.kind === 'concept') {
    const by = (kind: string) => graph.edges.filter((e) => e.relation === 'expresses' && e.to === id && graph.nodes[e.from].kind === kind).map((e) => e.from);
    return { id, kind: n.kind, source: n.source, record: node, groups: by('parameters'), parameters: by('parameter') };
  }
  if (n.kind === 'parameters') return { id, kind: n.kind, source: n.source, members: node.members.map((m: string) => parameterId(node, m)), record: node };
  if (n.kind !== 'component' && n.kind !== 'part') return { id, kind: n.kind, source: n.source, record: node };
  const mpath = manifestOf(id, graph);
  const m = loadManifest(mpath);
  const out = graph.edges.filter((e) => e.from === id);
  const refs = Object.fromEntries([...new Set([...out.map((e) => e.to), ...(node.avoidWhen ?? []).flatMap((a: any) => a.useInstead ? [a.useInstead] : [])])]
    .map((t) => [t, graph.nodes[t] ? { kind: graph.nodes[t].kind, source: graph.nodes[t].source, availability: graph.nodes[t].availability } : { missing: true }]));
  return {
    id, kind: n.kind, pathBase: 'packages/ui-kit', manifest: mpath, node,
    contract: fromManifest(mpath, node.contract ?? m.contract),
    documentation: fromManifest(mpath, m.documentation), examples: fromManifest(mpath, m.examples),
    ...(n.kind === 'component' ? { registration: registration(id, graph), styles: STYLES, foundations: out.filter((e) => e.relation === 'usesFoundation').map((e) => e.to) } : {}),
    edges: out, incoming: graph.edges.filter((e) => e.to === id), references: refs,
  };
}

/** Bounded view: what you need to decide and assemble, without the full API. */
export function assembly(id: string, graph = loadGraph()) {
  const n = graph.nodes[id];
  if (!n || n.kind !== 'component') throw new Error(`--assembly needs a component ID; ${id} is ${n ? n.kind : 'unknown'}`);
  const mpath = manifestOf(id, graph), m = loadManifest(mpath), node = record(id, graph);
  const out = graph.edges.filter((e) => e.from === id);
  const by = (rel: string) => out.filter((e) => e.relation === rel).map((e) => e.to);
  const contractRef = fromManifest(mpath, node.contract ?? m.contract);
  const contract = JSON.parse(readSource(contractRef).body);
  return {
    id, tag: node.tag, status: node.status, availability: n.availability, intent: node.intent,
    constraints: node.constraints, layout: node.layout, content: node.content,
    semantics: { role: node.semantics.role, formAssociated: node.semantics.formAssociated, accessibleName: node.semantics.accessibleName },
    contract: { source: contractRef, ...contract },
    registration: registration(id, graph), styles: STYLES,
    paths: {
      manifest: mpath, documentation: fromManifest(mpath, m.documentation), examples: fromManifest(mpath, m.examples),
      module: m.module ? fromManifest(mpath, m.module) : null, styleSource: styleModules(m).map((s: string) => fromManifest(mpath, s)),
      verification: fromManifest(mpath, m.renderers.webComponent.verification),
    },
    geometry: by('usesGeometry').map((g) => ({ id: g, source: graph.nodes[g]?.source })),
    parts: by('ownsPart'), acceptsChild: by('acceptsChild'), requiresParent: by('requiresParent'), allowedIn: by('allowedIn'), uses: by('uses'),
    alternatives: (node.avoidWhen ?? []).map((a: any) => ({ ...a, ...(a.useInstead ? { availability: graph.nodes[a.useInstead]?.availability ?? 'missing' } : {}) })),
    parameters: parametersFor(id, graph),
    renderers: Object.fromEntries(Object.entries<any>(m.renderers).map(([k, v]) => [k, v.status])),
    ...(m.renderers.react?.props?.[id] ? { react: { export: m.renderers.react.exports[id], module: fromManifest(mpath, m.renderers.react.module), ...m.renderers.react.props[id], ...(m.renderers.react.parts?.[id] ? { parts: m.renderers.react.parts[id] } : {}) } } : {}),
  };
}

/** The parameter groups a component responds to: those driving a token group or geometry family it uses (not a foundation, which every component follows). */
export function parametersFor(id: string, graph = loadGraph()) {
  const used = new Set(graph.edges.filter((e) => e.from === id && (e.relation === 'usesTokens' || e.relation === 'usesGeometry')).map((e) => e.to));
  const groups = new Map<string, string[]>();
  for (const e of graph.edges) if (e.relation === 'drives' && used.has(e.to)) groups.set(e.from, [...(groups.get(e.from) ?? []), e.to]);
  return [...groups].map(([group, via]) => ({ group, title: graph.nodes[group].title, via, members: graph.edges.filter((e) => e.relation === 'memberOf' && e.to === group).map((e) => e.from) }));
}

// ── Search ──
const norm = (s: string) => s.toLowerCase().replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_\s]+/g, ' ').trim();
export function find(term: string, graph = loadGraph()) {
  const q = norm(term);
  if (!q) throw new Error('--find needs a term');
  const hit = (s: string) => { const t = norm(s); return t === q || t.startsWith(q) || t.includes(' ' + q); };
  return Object.entries(graph.nodes).flatMap(([id, n]) => {
    const why = [
      ...(hit(id) || hit(id.split(':')[1]) ? ['id'] : []), ...(n.tag && hit(n.tag) ? ['tag'] : []),
      ...(hit(n.source.split('#')[0]) ? ['source'] : []), ...n.searchTerms.filter(hit).map((t) => `term:${t}`),
    ];
    return why.length ? [{ id, kind: n.kind, availability: n.availability, source: n.source, matched: why }] : [];
  });
}

// ── Recommendation audit ──
export function auditRecommendations(graph = loadGraph()) {
  const rows: any[] = [], errors: string[] = [];
  for (const { id } of list(graph)) {
    for (const a of record(id, graph).avoidWhen ?? []) {
      const row: any = { component: id, when: a.when, useInstead: a.useInstead ?? null };
      if (!a.useInstead) row.review = 'no alternative registered';
      else if (a.useInstead === id) errors.push(`${id} recommends itself`);
      else if (!graph.nodes[a.useInstead]) errors.push(`${id} recommends missing ${a.useInstead}`);
      else row.availability = graph.nodes[a.useInstead].availability;
      rows.push(row);
    }
  }
  return { ok: errors.length === 0, errors, rows };
}

// ── Task packets ──
export function packet(role: string, renderer: string, ids: string[], graph = loadGraph()) {
  const sys = json('system.manifest.json').taskPackets;
  if (!sys.roles[role]) throw new Error(`role must be one of ${Object.keys(sys.roles).join(', ')}`);
  if (!sys.renderers.includes(renderer)) throw new Error(`renderer must be one of ${sys.renderers.join(', ')}`);
  const rkey = renderer === 'web-component' ? 'webComponent' : renderer;
  const sources: { path: string; sha256: string; body: string }[] = [];
  const seen = new Set<string>();
  const include = (ref: string) => {
    if (seen.has(ref)) return; seen.add(ref);
    const { body } = readSource(ref);
    sources.push({ path: ref, sha256: createHash('sha256').update(body).digest('hex'), body });
  };
  const components = ids.map((id) => {
    const a = assembly(id, graph), mpath = a.paths.manifest, m = loadManifest(mpath);
    const r = m.renderers[rkey];
    if (!r) throw new Error(`${id} has no ${renderer} renderer`);
    include(a.paths.documentation); include(a.paths.examples);
    if (role === 'author') {
      include(mpath);
      if (a.paths.module) include(a.paths.module);
      if (r.module && r.module !== m.module) include(fromManifest(mpath, r.module));
      for (const g of a.geometry) include(g.source!);
      include(a.paths.verification.split('#')[0]);
    }
    return { id, renderer: { name: renderer, ...r, ...(r.module ? { module: fromManifest(mpath, r.module) } : {}) }, node: record(id, graph), assembly: a };
  });
  if (role === 'author') for (const f of ['contracts/component-manifest.schema.json', '../../docs/specs/authoring.md', '../../docs/specs/manifest-language.md']) include(f);
  const p = { role, purpose: sys.roles[role], renderer, components, sources };
  const bytes = Buffer.byteLength(JSON.stringify(p));
  if (bytes > sys.maxBytes) throw new Error(`packet is ${bytes} bytes, over the ${sys.maxBytes}-byte limit; select fewer components`);
  return p;
}

// ── Start ──
export function start() {
  const sys = json('system.manifest.json'), reg = json('registry.json');
  return {
    system: { name: sys.name, package: sys.package, pathBase: reg.pathBase }, authority: sys.authority, routes: sys.routes,
    foundations: sys.foundations, workflows: reg.workflows, commands: reg.commands, delivery: reg.delivery,
    next: { args: [], note: 'List components (no arguments), or --find <term>, then --assembly <component:id>.' },
  };
}

// ── Paged delivery ──
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
/** One page of `content` such that the serialized envelope fits `budget` bytes. `args` excludes --page. */
export function page(args: string[], content: string, offset: number, token: string | null, budget = json('registry.json').delivery.contentBudgetBytes) {
  const full = sha(args.join('\u0000') + '\u0000' + content);
  if (offset > 0 && token !== full) throw new Error('continuation token does not match: the selection or a source changed; restart with --page 0');
  const chars = [...content];
  const envelope = (slice: string, next: number | null) => JSON.stringify({
    complete: next === null, offset, length: chars.length, sha256: full, ...(offset === 0 ? { contentSha256: sha(content) } : {}),
    next: next === null ? null : { args: [...args, '--page', String(next), full] },
    content: slice,
  });
  let lo = 0, hi = chars.length - offset;
  while (lo < hi) { // largest slice that fits
    const mid = Math.ceil((lo + hi) / 2);
    const end = offset + mid;
    if (Buffer.byteLength(envelope(chars.slice(offset, end).join(''), end < chars.length ? end : null)) <= budget) lo = mid; else hi = mid - 1;
  }
  if (lo === 0 && offset < chars.length) throw new Error('budget too small for one character');
  const end = offset + lo;
  return envelope(chars.slice(offset, end).join(''), end < chars.length ? end : null);
}

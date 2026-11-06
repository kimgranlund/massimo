// Fails when a kit component has no page. Run by the site's build, so a component added without one
// stops the deploy. The graph lists the components; the site's model decides which have pages.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPages, missingPages, type ExamplesFile, type Manifest } from '../src/model.ts';

const kit = fileURLToPath(new URL('../../../packages/ui-kit/', import.meta.url));
const json = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
const folders = readdirSync(`${kit}components`).filter((d) => existsSync(`${kit}components/${d}/${d}.manifest.json`));
const manifests = folders.map((d) => json<Manifest>(`${kit}components/${d}/${d}.manifest.json`));
const examples = folders.filter((d) => existsSync(`${kit}components/${d}/${d}.examples.json`)).map((d) => json<ExamplesFile>(`${kit}components/${d}/${d}.examples.json`));
const graph = json<{ nodes: Record<string, { kind: string }> }>(`${kit}graph.json`);
const ids = Object.entries(graph.nodes).filter(([, n]) => n.kind === 'component').map(([id]) => id);

const pages = buildPages(manifests, examples), missing = missingPages(ids, pages);
// The check has to be able to fail: without one component's examples, that component must be reported.
const without = examples.slice(1), dropped = missingPages(ids, buildPages(manifests, without));
if (!dropped.length) throw new Error('coverage check is vacuous: dropping an examples file reported nothing');
if (missing.length) { console.error(`no docs page for: ${missing.join(', ')}`); process.exit(1); }
console.log(`docs: ${pages.length} pages for ${ids.length} components`);

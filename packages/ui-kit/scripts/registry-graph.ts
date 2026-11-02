// Writes graph.json, the registry's index of every graph ID (components, parts, foundations,
// geometry families, contexts, token groups) and every edge, from the manifests and contracts.
//   node scripts/registry-graph.ts          write graph.json
//   node scripts/registry-graph.ts --check  exit 1 when graph.json is stale
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { KIT, graphText } from './registry-lib.ts';

const path = join(KIT, 'graph.json');
const text = graphText();
if (process.argv.includes('--check')) {
  let cur = '';
  try { cur = readFileSync(path, 'utf8'); } catch { /* missing */ }
  if (cur !== text) { console.error('graph.json is stale: run npm run registry:graph'); process.exit(1); }
  console.log('graph.json current');
} else {
  writeFileSync(path, text);
  const g = JSON.parse(text);
  console.log(`graph.json: ${Object.keys(g.nodes).length} nodes, ${g.edges.length} edges`);
}

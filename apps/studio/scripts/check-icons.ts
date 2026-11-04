// Every icon name the jig and the kit render (<i name="…"> in apps/studio/src and components/) must
// load from every built-in set, through that set's aliases (canonical names are Phosphor's).
// Fetches from the CDNs, so it needs the network.
//   npm run icons:check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BUILTIN_SETS } from '../../../packages/ui-kit/icons/sets.ts';

const root = new URL('../../../', import.meta.url).pathname;
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(tsx?|html)$/.test(f) ? [p] : []; });
const names = [...new Set([...files(join(root, 'apps/studio/src')), ...files(join(root, 'packages/ui-kit/components'))]
  .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<i [^>]*name="([a-z0-9-]+)"/g)].map((m) => m[1])))].sort();
let failed = 0;
for (const [set, s] of Object.entries(BUILTIN_SETS)) {
  const miss: string[] = [];
  await Promise.all(names.map(async (n) => { try { await s.load((s as any).aliases?.[n] ?? n); } catch { miss.push(n); } }));
  console.log(`${set}: ${names.length - miss.length}/${names.length}${miss.length ? `, missing ${miss.sort().join(' ')}` : ''}`);
  failed += miss.length;
}
process.exit(failed ? 1 : 0);

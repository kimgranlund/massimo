// ui-kit registry CLI. Run from packages/ui-kit (npm run registry -- …) or the repo root
// (npm run registry -w @massimo/ui-kit -- …). Output is JSON on stdout.
//
//   (no args)                       public components: id, tag, status, availability, intent, layout
//   --all                           every graph ID with kind, availability, source
//   --start                         system identity, authority, routes, foundations, workflows, commands
//   <id>                            exact lookup (component/part: node, contract, docs, registration, edges)
//   --assembly <component:id>       bounded view for choosing and assembling one component
//   --find <term>                   IDs, tags, source paths and search terms
//   --read <path>[#anchor|#/ptr]    a document body, Markdown section or JSON Pointer
//   --packet <role> <renderer> <ids> task-sized bundle (requires --page or --out)
//   --audit-recommendations         every avoidWhen entry with its alternative's availability
//
// Delivery: --page <offset> [sha256] returns bounded pages (follow next.args until complete);
// --out <new-file> writes the whole response and prints a receipt.
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { all, assembly, auditRecommendations, find, list, lookup, packet, page, readSource, start } from './registry-lib.ts';

function take(args: string[], flag: string, n: number): string[] | null {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  const vals = args.slice(i + 1, i + 1 + n);
  args.splice(i, 1 + n);
  return vals;
}

function main(argv: string[]) {
  const args = [...argv];
  const out = take(args, '--out', 1);
  // --page takes an offset and, after the first page, the continuation sha256.
  let paging: { offset: number; token: string | null } | null = null;
  const pi = args.indexOf('--page');
  if (pi >= 0) {
    const offset = Number(args[pi + 1]);
    if (!Number.isInteger(offset) || offset < 0) throw new Error('--page needs a non-negative integer offset');
    const token = args[pi + 2] && /^[0-9a-f]{64}$/.test(args[pi + 2]) ? args[pi + 2] : null;
    args.splice(pi, token ? 3 : 2);
    paging = { offset, token };
  }
  if (out && paging) throw new Error('--out and --page are separate delivery modes');

  const [q, ...rest] = args;
  let result: unknown;
  if (!q) result = list();
  else if (q === '--all') result = all();
  else if (q === '--start') result = start();
  else if (q === '--assembly') result = assembly(rest[0]);
  else if (q === '--find') result = find(rest.join(' '));
  else if (q === '--read') { const r = readSource(rest[0] ?? ''); result = paging || out ? r.body : r; }
  else if (q === '--audit-recommendations') result = auditRecommendations();
  else if (q === '--packet') {
    if (!paging && !out) throw new Error('--packet needs --page 0 or --out <file>');
    const [role, renderer, ids] = rest;
    if (!role || !renderer || !ids) throw new Error('--packet <consumer|author> <web-component|react|html> <component:id[,component:id…]>');
    result = packet(role, renderer, ids.split(','));
  } else if (/^[a-z-]+:[a-z0-9-]+$/.test(q)) result = lookup(q);
  else throw new Error(`unknown command ${q}`);

  const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  if (out) {
    const path = resolve(out[0]);
    if (!existsSync(dirname(path))) throw new Error(`folder ${dirname(path)} does not exist`);
    if (existsSync(path)) throw new Error(`${path} exists; --out never overwrites`);
    writeFileSync(path, content);
    return JSON.stringify({ receipt: { path, sha256: createHash('sha256').update(content).digest('hex'), bytes: Buffer.byteLength(content), selection: args } }, null, 2);
  }
  if (paging) return page(args, content, paging.offset, paging.token);
  return content;
}

try {
  process.stdout.write(main(process.argv.slice(2)) + '\n');
} catch (e: any) {
  process.stderr.write(`registry: ${e.message}\n`);
  process.exit(1);
}

// Load a .tsx module in node:test: Node strips types but does not compile JSX, so transform it with
// Vite's Oxc transform into a sibling .mjs (relative imports keep resolving), import it, delete it.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { transformWithOxc } from 'vite';

export async function loadTsx(url: URL) {
  const path = url.pathname;
  const { code } = await transformWithOxc(readFileSync(path, 'utf8'), path, { lang: 'tsx', jsx: { runtime: 'automatic' } } as any);
  const tmp = new URL(`.test-${path.split('/').pop()!.replace(/\W/g, '-')}.mjs`, url);
  writeFileSync(tmp, code);
  try { return await import(tmp.href); } finally { rmSync(tmp, { force: true }); }
}

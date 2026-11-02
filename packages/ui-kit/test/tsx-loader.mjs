// Node module load hook for tests: compile .tsx (JSX + types) with Vite's Oxc transform. Registered by
// test/load-tsx.ts; transitive .tsx imports load through it too.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transformWithOxc } from 'vite';

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.tsx')) return nextLoad(url, context);
  const path = fileURLToPath(url);
  const { code } = await transformWithOxc(await readFile(path, 'utf8'), path, { lang: 'tsx', jsx: { runtime: 'automatic' } });
  return { format: 'module', source: code, shortCircuit: true };
}

// Guard: no style object may define the same selector key twice. In a JS object literal the last
// entry silently wins, so a second `[SELECTOR]: {…}` (or a spread such as `...textRun(host)` that
// produces an existing key) drops the first rule without any error. This test rebuilds every object
// literal in the style modules as a merge that throws on a repeated key, then imports the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { parse } from 'acorn';

const STYLES = new URL('../styles/', import.meta.url);
const MERGE = `const __m = (entries) => { const o = {}; const put = (k, v) => { if (Object.hasOwn(o, k)) throw new Error('duplicate style key: ' + k); o[k] = v; };
  for (const e of entries) { if (Array.isArray(e)) put(e[0], e[1]); else for (const k of Object.keys(e.s ?? {})) put(k, e.s[k]); } return o; };\n`;

type Edit = { at: number; end?: number; text: string };

/** Rewrite every object literal `{ a: 1, [k]: v, ...s }` into `__m([['a', 1], [k, v], { s }])`. */
export function guardObjects(js: string): string {
  const edits: Edit[] = [];
  const visit = (node: any) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'ObjectExpression' && node.properties.every((p: any) => p.type === 'SpreadElement' || (p.kind === 'init' && !p.method))) {
      edits.push({ at: node.start, end: node.start + 1, text: '__m([' });
      edits.push({ at: node.end - 1, end: node.end, text: '])' });
      for (const p of node.properties) {
        if (p.type === 'SpreadElement') {
          // Replace only the '...' token: the argument may be parenthesized.
          edits.push({ at: p.start, end: p.start + 3, text: '{ s: ' });
          edits.push({ at: p.end, text: ' }' });
        } else if (p.shorthand) {
          edits.push({ at: p.start, end: p.end, text: `[${JSON.stringify(p.key.name)}, ${p.key.name}]` });
        } else {
          const key = p.computed ? js.slice(p.key.start, p.key.end) : p.key.type === 'Identifier' ? JSON.stringify(p.key.name) : js.slice(p.key.start, p.key.end);
          edits.push({ at: p.start, end: p.value.start, text: `[${key}, ` });
          edits.push({ at: p.value.end, text: ']' });
        }
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object' && typeof v.type === 'string') visit(v);
    }
  };
  visit(parse(js, { ecmaVersion: 'latest', sourceType: 'module' }));
  // Apply from the end; at the same position an insertion goes after a replacement that ends there.
  edits.sort((a, b) => b.at - a.at || (a.end === undefined ? -1 : 1));
  let out = js;
  for (const e of edits) out = out.slice(0, e.at) + e.text + out.slice(e.end ?? e.at);
  return out;
}

async function check(file: string) {
  const src = readFileSync(new URL(file, STYLES), 'utf8');
  const js = guardObjects(stripTypeScriptTypes(src));
  const tmp = new URL(`.dupcheck-${file.replace(/\W/g, '-')}.mjs`, new URL(file, STYLES));
  writeFileSync(tmp, MERGE + js);
  try { await import(tmp.href + `?t=${Date.now()}`); } finally { rmSync(tmp, { force: true }); }
}

const files = [...readdirSync(STYLES).filter((f) => f.endsWith('.ts')), ...readdirSync(new URL('pages/', STYLES)).filter((f) => f.endsWith('.ts')).map((f) => `pages/${f}`)];

for (const f of files) {
  test(`styles/${f}: no style object repeats a selector key`, async () => {
    await check(f);
  });
}

test('the guard bites: a repeated key and a spread that repeats a key both throw', async () => {
  const run = (js: string) => new Function(MERGE + 'return ' + guardObjects('(' + js + ')').replace(/;\s*$/, ''))();
  assert.throws(() => run(`{ a: 1, ['a']: 2 }`), /duplicate style key: a/);
  assert.throws(() => run(`{ x: 1, ...{ x: 2 } }`), /duplicate style key: x/);
  assert.deepEqual(run(`{ a: { b: 1 }, c: 2, ...{ d: 3 } }`), { a: { b: 1 }, c: 2, d: 3 });
});

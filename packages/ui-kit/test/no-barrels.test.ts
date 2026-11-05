// No barrel files: a module imports each name from the module that declares it, so a page bundles only
// what it uses and the dev server loads no index fan-out. A barrel is a module made only of re-exports;
// the kit holds none, and nothing imports the generated Panda barrel (styled-system/recipes/index.js).
// icons/index.ts is the icon runtime's entry: it is imported for its side effect only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = fileURLToPath(new URL('..', import.meta.url));
const STUDIO = join(KIT, '../../apps/studio');
const SKIP = new Set(['node_modules', 'styled-system', 'dist', 'public']);

function files(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    if (SKIP.has(f) || f.startsWith('.')) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(ts|tsx|html)$/.test(f)) out.push(p);
  }
  return out;
}
const sources = [...files(KIT), ...files(join(STUDIO, 'src')), ...files(join(STUDIO, 'scripts')), ...readdirSync(STUDIO).filter((f) => f.endsWith('.html')).map((f) => join(STUDIO, f))];
// A @massimo/ui-kit specifier → its file through the package's exports map (exact keys, then `*` patterns).
const EXPORTS: Record<string, string> = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8')).exports;
function exported(spec: string): string | null {
  const key = '.' + spec.slice('@massimo/ui-kit'.length);
  if (typeof EXPORTS[key] === 'string') return join(KIT, EXPORTS[key]);
  for (const [k, v] of Object.entries(EXPORTS)) {
    const [pre, post] = k.split('*');
    if (post !== undefined && key.startsWith(pre) && key.endsWith(post)) return join(KIT, v.replace('*', key.slice(pre.length, key.length - post.length)));
  }
  return null;
}
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean);

test('no module in the kit is a barrel (only re-exports)', () => {
  const barrels = sources.filter((f) => /\.tsx?$/.test(f)).filter((f) => {
    const lines = code(readFileSync(f, 'utf8'));
    return lines.length > 0 && lines.every((l) => /^export\s+(\*|(type\s+)?\{[^}]*\})\s+from\s+'/.test(l));
  });
  assert.deepEqual(barrels.map((f) => relative(KIT, f)), []);
});

test('nothing imports a barrel, the Panda recipe index, or names from the icon runtime entry', () => {
  const bad: string[] = [];
  for (const f of sources) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?'([^']+)'|import\(\s*'([^']+)'\s*\)/g)) {
      const spec = m[1] ?? m[2], named = !/^import\s+'/.test(m[0]);
      const where = `${relative(join(KIT, '../..'), f)}: ${m[0].replace(/\s+/g, ' ').slice(0, 90)}`;
      if (/(^|\/)(core|dom|styles)(\/index(\.ts)?)?$/.test(spec) && !spec.startsWith('node:') && (spec.startsWith('.') || spec.startsWith('@massimo/ui-kit/'))) bad.push(where);
      if (/styled-system\/recipes(\/index\.js)?$/.test(spec)) bad.push(where);
      if (named && /(^|\/)icons(\/index\.ts)?$/.test(spec) && (spec.startsWith('.') || spec.startsWith('@massimo/ui-kit/'))) bad.push(where);
    }
  }
  assert.deepEqual(bad, []);
});

test('the kit marks only modules with top-level effects as side-effectful', () => {
  const pkg = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.sideEffects, ['./components/**/*.element.ts', './core/modality.ts', './icons/index.ts', '*.css']);
  // A module outside that list must not run code at load: register an element, touch the DOM, or listen.
  const effectful = sources.filter((f) => f.startsWith(KIT) && /\.tsx?$/.test(f) && !/\/(test|scripts)\//.test(f) && !f.endsWith('.element.ts'))
    .filter((f) => /^(define\(|customElements\.define|document\.|window\.|addEventListener|if \(typeof (document|window|customElements))/m.test(readFileSync(f, 'utf8')));
  assert.deepEqual(effectful.map((f) => relative(KIT, f)).sort(), ['core/modality.ts', 'icons/index.ts']);
});

test('no element module statically reaches the theme engine or the spectrum runtime (264 KB of JSON)', () => {
  const graph = (file: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(file) || !/\.(ts|tsx|json)$/.test(file)) return seen;
    seen.add(file);
    if (file.endsWith('.json')) return seen;
    for (const m of readFileSync(file, 'utf8').matchAll(/^(?:import|export)\s+(?!type\b)(?:[\w*{}\s,$]+?\s+from\s+)?'([^']+)'/gm)) {
      const spec = m[1];
      if (spec.startsWith('.')) graph(join(file, '..', spec), seen);
      else if (spec.startsWith('@massimo/ui-kit/')) { const r = exported(spec); if (r) graph(r, seen); }
    }
    return seen;
  };
  const heavy = ['tokens/colors/spectrum/runtime.json', 'tokens/themes/index.ts'].map((p) => join(KIT, p));
  const roots = sources.filter((f) => f.endsWith('.element.ts') || f === join(KIT, 'icons/index.ts'));
  const reach = roots.flatMap((r) => heavy.filter((h) => graph(r).has(h)).map((h) => `${relative(KIT, r)} → ${relative(KIT, h)}`));
  assert.ok(roots.length > 40, `found ${roots.length} element modules`);
  assert.deepEqual(reach, []);
});

test('the studio shell keeps the spectrum engine in its worker', () => {
  const graph = (file: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(file) || !/\.(ts|tsx|json)$/.test(file)) return seen;
    seen.add(file);
    if (file.endsWith('.json')) return seen;
    // Static imports only: the engine runs in spectrum.worker.ts, which the shell starts by URL.
    for (const m of readFileSync(file, 'utf8').matchAll(/^(?:import|export)\s+(?!type\b)(?:[\w*{}\s,$]+?\s+from\s+)?'([^']+)'/gm)) {
      const spec = m[1];
      if (spec.startsWith('.')) graph(join(file, '..', spec), seen);
      else if (spec.startsWith('@massimo/ui-kit/')) { const r = exported(spec); if (r) graph(r, seen); }
    }
    return seen;
  };
  const shell = graph(join(STUDIO, 'src/studio/main.tsx'));
  assert.ok(shell.has(join(STUDIO, 'src/studio/App.tsx')), 'the graph reaches App.tsx');
  assert.equal(shell.has(join(KIT, 'tokens/colors/spectrum/runtime.json')), false, 'the spectrum runtime is not in the shell');
});

test('every kit element the studio shell renders is registered by the shell, whatever page loads first', () => {
  const graph = (file: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(file) || !/\.(ts|tsx)$/.test(file)) return seen;
    seen.add(file);
    for (const m of readFileSync(file, 'utf8').matchAll(/^(?:import|export)\s+(?!type\b)(?:[\w*{}\s,$]+?\s+from\s+)?'([^']+)'/gm)) {
      const spec = m[1];
      if (spec.startsWith('.')) graph(join(file, '..', spec), seen);
      else if (spec.startsWith('@massimo/ui-kit/')) { const r = exported(spec); if (r) graph(r, seen); }
    }
    return seen;
  };
  const shell = graph(join(STUDIO, 'src/studio/main.tsx'));
  // Tag → the module that defines it. A tag with no element module (ui-container, CSS only) needs none.
  const definedBy = new Map<string, string>();
  for (const f of sources.filter((p) => p.endsWith('.element.ts'))) for (const m of readFileSync(f, 'utf8').matchAll(/define\(\s*'(ui-[a-z-]+)'/g)) definedBy.set(m[1], f);
  assert.ok(definedBy.size > 40, `found ${definedBy.size} element tags`);
  const missing: string[] = [];
  for (const f of shell) {
    if (!f.startsWith(join(STUDIO, 'src/studio'))) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(/<(ui-[a-z-]+)[\s>/]/g)) {
      const def = definedBy.get(m[1]);
      if (def && !shell.has(def)) missing.push(`${relative(STUDIO, f)}: <${m[1]}> (${relative(KIT, def)})`);
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

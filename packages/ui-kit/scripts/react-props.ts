// React renderer props, read from the type text of a *.react.tsx module.
//
// Node strips types and acorn never sees them, and the tests run without the TypeScript compiler, so
// this is a small parser for the subset of type syntax the renderers use. It throws on anything else
// instead of guessing (test/manifests.test.ts covers each form):
//   - `interface Name extends A, B { … }` and `type Name = …;` declarations, local or imported by a
//     relative import from another .tsx module (PartProps from ../parts.react.tsx);
//   - type expressions: `A & B & { … }`, `Omit<A, 'k' | 'l'>`, a declared name, a type literal.
//     A name the kit does not declare (HTMLAttributes<…>, ButtonHTMLAttributes<…>, or an Omit of
//     one) is an inherited base, kept as text under `inherits`;
//   - members `name?: Type;` (`;`, `,` or a line break ends one), with the JSDoc block before a
//     member (`/** … */`) as its description; a later member of the same name replaces an earlier one;
//   - the props type of an export: the annotation on the first parameter of `export function Name(…)`,
//     or, for `export const Name = factory(…)`, of the first `function` in `const factory = …`.
//     Defaults are the destructuring defaults of that parameter (`type = 'button'`), as source text.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type ReactProp = { name: string; type: string; optional: boolean; default?: string; description?: string };
export type ReactApi = { inherits: string[]; props: ReactProp[] };

type Decl = { kind: 'interface'; ext: string[]; body: string } | { kind: 'type'; expr: string };
export type Module = { file: string; text: string; decls: Map<string, Decl>; imports: Map<string, string> };

const OPEN = '{(<[', CLOSE = '})>]';
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/** If a string or comment starts at i, the index of its last character; otherwise i. */
function skip(text: string, i: number): number {
  const ch = text[i];
  if (ch === "'" || ch === '"' || ch === '`') return text.indexOf(ch, i + 1);
  if (ch === '/' && text[i + 1] === '/') { const e = text.indexOf('\n', i); return e < 0 ? text.length : e - 1; }
  if (ch === '/' && text[i + 1] === '*') return text.indexOf('*/', i) + 1;
  return i;
}
const isClose = (text: string, i: number) => CLOSE.includes(text[i]) && !(text[i] === '>' && text[i - 1] === '=');

/** Scan from `from` and return the first index where `stop(i, depth)` holds, skipping strings and comments. */
function scan(text: string, from: number, stop: (i: number, depth: number) => boolean): number {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const k = skip(text, i);
    if (k !== i) { i = k; continue; }
    if (stop(i, depth)) return i;
    if (OPEN.includes(text[i])) depth++;
    else if (isClose(text, i)) depth--;
  }
  return text.length;
}

/** Index of the bracket that closes the one at `at` (`=>` is not a closer). */
export function closing(text: string, at: number): number {
  const end = scan(text, at + 1, (i, depth) => depth === 0 && isClose(text, i));
  if (end >= text.length) throw new Error(`unbalanced bracket at ${at}: ${squash(text.slice(at, at + 40))}`);
  return end;
}

/** Split at a separator that is outside every bracket, string and comment. */
export function splitTop(text: string, sep: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (;;) {
    const at = scan(text, start, (i, depth) => depth === 0 && text.startsWith(sep, i) && !(sep === '>' && text[i - 1] === '='));
    out.push(text.slice(start, at));
    if (at >= text.length) break;
    start = at + sep.length;
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Members of an interface body or type literal, in order, with JSDoc descriptions. */
export function members(body: string): ReactProp[] {
  const out: ReactProp[] = [];
  let i = 0, doc: string | undefined;
  while (i < body.length) {
    if (/[\s;,]/.test(body[i])) { i++; continue; }
    if (body.startsWith('/**', i)) {
      const end = body.indexOf('*/', i);
      doc = squash(body.slice(i + 3, end).replace(/^\s*\*/gm, ' '));
      i = end + 2;
      continue;
    }
    if (body.startsWith('/*', i) || body.startsWith('//', i)) { i = skip(body, i) + 1; continue; }
    const m = /^(?:readonly\s+)?([A-Za-z_$][\w$]*)(\?)?\s*:/.exec(body.slice(i));
    if (!m) throw new Error(`unsupported member syntax: ${squash(body.slice(i, i + 60))}`);
    i += m[0].length;
    const end = scan(body, i, (j, depth) => depth === 0 && (body[j] === ';' || body[j] === ',' || body[j] === '\n'));
    out.push({ name: m[1], type: squash(body.slice(i, end)), optional: !!m[2], ...(doc ? { description: doc } : {}) });
    doc = undefined;
    i = end + 1;
  }
  return out;
}

/** Declarations and relative .tsx type imports of one module. */
export function parseModule(file: string, text: string): Module {
  const decls = new Map<string, Decl>(), imports = new Map<string, string>();
  for (const m of text.matchAll(/^(?:export\s+)?interface\s+(\w+)\s*(?:extends\s+([^{]+?))?\s*\{/gm)) {
    const open = m.index! + m[0].length - 1;
    decls.set(m[1], { kind: 'interface', ext: m[2] ? splitTop(m[2], ',') : [], body: text.slice(open + 1, closing(text, open)) });
  }
  for (const m of text.matchAll(/^(?:export\s+)?type\s+(\w+)\s*=\s*/gm)) {
    const start = m.index! + m[0].length;
    const end = scan(text, start, (j, depth) => depth === 0 && text[j] === ';');
    decls.set(m[1], { kind: 'type', expr: text.slice(start, end) });
  }
  for (const m of text.matchAll(/^import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'(\.[^']+\.tsx)'/gm)) {
    for (const name of m[1].split(',').map((s) => s.trim().replace(/^type\s+/, '')).filter(Boolean)) imports.set(name, join(dirname(file), m[2]));
  }
  return { file, text, decls, imports };
}

const cache = new Map<string, Module>();
const load = (file: string): Module => {
  if (!cache.has(file)) cache.set(file, parseModule(file, readFileSync(file, 'utf8')));
  return cache.get(file)!;
};

function merge(into: ReactApi, add: ReactApi) {
  into.inherits.push(...add.inherits);
  for (const p of add.props) {
    const at = into.props.findIndex((q) => q.name === p.name);
    if (at >= 0) into.props.splice(at, 1);
    into.props.push(p);
  }
}

function lookupDecl(mod: Module, name: string): [Module, Decl] | null {
  if (mod.decls.has(name)) return [mod, mod.decls.get(name)!];
  const from = mod.imports.get(name);
  if (from && existsSync(from)) { const m = load(from); if (m.decls.has(name)) return [m, m.decls.get(name)!]; }
  return null;
}

function resolveDecl(mod: Module, decl: Decl): ReactApi {
  if (decl.kind === 'type') return resolveExpr(mod, decl.expr);
  const api: ReactApi = { inherits: [], props: [] };
  for (const e of decl.ext) merge(api, resolveExpr(mod, e));
  merge(api, { inherits: [], props: members(decl.body) });
  return api;
}

/** Resolve a type expression to inherited bases and members. */
export function resolveExpr(mod: Module, expr: string): ReactApi {
  const api: ReactApi = { inherits: [], props: [] };
  for (const part of splitTop(expr, '&')) {
    if (part.startsWith('{')) { merge(api, { inherits: [], props: members(part.slice(1, closing(part, 0))) }); continue; }
    const omit = /^Omit<([\s\S]*)>$/.exec(part);
    if (omit) {
      const [base, keys = ''] = splitTop(omit[1], ',');
      const inner = resolveExpr(mod, base);
      if (inner.inherits.length) { api.inherits.push(squash(part)); continue; }
      const drop = new Set([...keys.matchAll(/'([^']+)'/g)].map((k) => k[1]));
      merge(api, { inherits: [], props: inner.props.filter((p) => !drop.has(p.name)) });
      continue;
    }
    const named = /^([A-Za-z_$][\w$]*)(<[\s\S]*>)?$/.exec(part);
    if (!named) throw new Error(`unsupported type expression: ${squash(part)}`);
    const found = lookupDecl(mod, named[1]);
    if (found) merge(api, resolveDecl(found[0], found[1]));
    else api.inherits.push(squash(part));
  }
  return api;
}

/** The first parameter of the function whose `(` is at `open`: [pattern, type]. */
function param(text: string, open: number): [string, string] {
  const first = splitTop(text.slice(open + 1, closing(text, open)), ',')[0] ?? '';
  if (first.startsWith('{')) {
    const end = closing(first, 0);
    return [first.slice(0, end + 1), first.slice(end + 1).replace(/^\s*:/, '').trim()];
  }
  const [pattern, ...type] = splitTop(first, ':');
  return [pattern ?? '', type.join(':').trim()];
}

function defaults(pattern: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!pattern.startsWith('{')) return out;
  for (const item of splitTop(pattern.slice(1, -1), ',')) {
    if (item.startsWith('...')) continue;
    const [lhs, ...rhs] = splitTop(item, '=');
    if (rhs.length) out.set(splitTop(lhs, ':')[0], squash(rhs.join('=')));
  }
  return out;
}

/** Props of an exported React component. */
export function reactApi(file: string, exportName: string, mod = load(file)): ReactApi {
  const { text } = mod;
  let open: number;
  const fn = new RegExp(`^export function ${exportName}\\s*\\(`, 'm').exec(text);
  if (fn) open = fn.index + fn[0].length - 1;
  else {
    const made = new RegExp(`^export const ${exportName}\\s*=\\s*(\\w+)\\(`, 'm').exec(text);
    if (!made) throw new Error(`${file}: no export function or factory const named ${exportName}`);
    const factory = new RegExp(`^const ${made[1]}\\s*=[^\\n]*?\\bfunction\\s*\\w*\\s*\\(`, 'm').exec(text);
    if (!factory) throw new Error(`${file}: factory ${made[1]} has no function expression`);
    open = factory.index + factory[0].length - 1;
  }
  const [pattern, type] = param(text, open);
  const api: ReactApi = type ? resolveExpr(mod, type) : { inherits: [], props: [] };
  const d = defaults(pattern);
  return {
    inherits: api.inherits,
    props: api.props.map(({ name, type, optional, description }) => ({
      name, type, optional, ...(d.has(name) ? { default: d.get(name)! } : {}), ...(description ? { description } : {}),
    })),
  };
}

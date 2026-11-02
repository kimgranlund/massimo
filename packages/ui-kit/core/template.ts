// Tagged-template rendering into light DOM.
// Bindings: `.prop=${}`  `@event=${}`  `?bool=${}`  `attr=${}`  `${content}`.
// Pass a function or signal to get a fine-grained binding that updates alone.
import { effect, isSignal } from './signals.ts';

export interface TemplateResult { s: TemplateStringsArray; v: unknown[] }
interface Part { n: any; k: string; name?: string; c?: unknown; fx?: (() => void) | null; box?: HTMLElement }
type Host = Element & { _t?: { s: TemplateStringsArray; parts: Part[] } | null; _k?: Map<unknown, HTMLElement> | null };
interface Keyed { keyed(box: Host): void }

export const html = (s: TemplateStringsArray, ...v: unknown[]): TemplateResult => ({ s, v });

const cache = new WeakMap<TemplateStringsArray, HTMLTemplateElement>();
function tpl(s: TemplateStringsArray) {
  let t = cache.get(s);
  if (!t) {
    let m = s[0];
    for (let i = 1; i < s.length; i++) m += (/<[^>]*$/.test(m) ? `__p${i - 1}` : `<!--p${i - 1}-->`) + s[i];
    t = document.createElement('template');
    t.innerHTML = m;
    cache.set(s, t);
  }
  return t;
}

const camel = (n: string) => n.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const isResult = (v: any): v is TemplateResult => !!v?.s;
const span = () => {
  const b = document.createElement('span');
  b.style.display = 'contents';
  b.setAttribute('role', 'presentation');
  return b;
};
// Stop every binding effect in a subtree that is leaving the DOM.
const dispose = (n: Element) => [n, ...n.querySelectorAll('*')].forEach(e => (e as Host)._t?.parts.forEach(p => { p.fx?.(); p.fx = null; }));

/** Keyed list: items with the same key keep their DOM nodes across renders. */
export function repeat<T>(items: T[], key: (it: T, i: number) => unknown, fn: (it: T, i: number) => TemplateResult): Keyed {
  return {
    keyed(box) {
      const old = box._k || new Map<unknown, HTMLElement>(), next = new Map<unknown, HTMLElement>();
      items.forEach((it, i) => {
        const k = key(it, i);
        if (next.has(k)) return;
        const el = old.get(k) || span();
        render(fn(it, i), el);
        next.set(k, el);
      });
      for (const [k, el] of old) if (!next.has(k)) { dispose(el); el.remove(); }
      let ref: Node | null = null;
      for (const el of [...next.values()].reverse()) {
        if (el.nextSibling !== ref || el.parentNode !== box) box.insertBefore(el, ref);
        ref = el;
      }
      box._k = next;
    },
  };
}

function set(p: Part, v: any) {
  if (p.k === '@') { p.n.removeEventListener(p.name, p.c); if (v) p.n.addEventListener(p.name, v); }
  else if (p.k === '.') p.n[p.name!] = v;
  else if (p.k === '?' || v == null || v === false) p.n.toggleAttribute(p.name, !!v && p.k === '?');
  else if (p.k === 'a') p.n.setAttribute(p.name, v === true ? '' : v);
  else {
    const box = (p.box ??= (() => { const b = span(); p.n.replaceWith(b); return b; })()) as Host;
    if (v?.keyed) { v.keyed(box); p.c = v; return; }
    if (box._k) { box._k = null; box._t = null; }
    if (isResult(v)) render(v, box);
    else {
      [...box.children].forEach(dispose);
      box._t = null;
      box.replaceChildren(...[v].flat().map((x: any) =>
        isResult(x) ? (() => { const s = span(); render(x, s); return s; })() : x instanceof Node ? x : String(x ?? '')));
    }
  }
  p.c = v;
}

export function render(r: TemplateResult, host: Element) {
  const h = host as Host;
  let st = h._t;
  if (st?.s !== r.s) {
    st?.parts.forEach(p => p.fx?.());
    [...h.children].forEach(dispose);
    const f = tpl(r.s).content.cloneNode(true) as DocumentFragment;
    const parts: Part[] = [];
    const w = document.createTreeWalker(f, 129); // elements + comments
    for (let n = w.nextNode() as any; n; n = w.nextNode()) {
      if (n.nodeType === 8 && /^p\d+$/.test(n.data)) {
        const t = document.createTextNode('');
        n.replaceWith(t);
        w.currentNode = t;
        parts[+n.data.slice(1)] = { n: t, k: 'n' };
      } else if (n.attributes) {
        for (const a of [...n.attributes] as Attr[]) {
          const m = /^__p(\d+)$/.exec(a.value);
          if (!m) continue;
          n.removeAttribute(a.name);
          const k = '.@?'.includes(a.name[0]) ? a.name[0] : 'a';
          parts[+m[1]] = { n, k, name: k === 'a' ? a.name : k === '.' ? camel(a.name.slice(1)) : a.name.slice(1) };
        }
      }
    }
    h.replaceChildren(f);
    st = h._t = { s: r.s, parts };
  }
  st.parts.forEach((p, i) => {
    const v = r.v[i];
    p.fx?.(); p.fx = null;
    if (p.k !== '@' && (typeof v === 'function' || isSignal(v)))
      p.fx = effect(() => set(p, typeof v === 'function' ? (v as () => unknown)() : (v as any).value));
    else if (v !== p.c) set(p, v);
  });
}

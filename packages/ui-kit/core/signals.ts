// Reactive primitives. No DOM. Effects re-track their dependencies on every run.
type Run = (() => void) & { d?: boolean; deps: Set<Set<Run>> };
export interface Signal<T> { value: T; peek(): T }

let cur: Run | undefined;
let queue: Set<Run> | null = null;
const flush = () => { const q = queue!; queue = null; q.forEach(run => run()); };
const clean = (r: Run) => { r.deps.forEach(s => s.delete(r)); r.deps.clear(); };

export function signal<T>(v: T): Signal<T> {
  const subs = new Set<Run>();
  return {
    get value() { if (cur) { subs.add(cur); cur.deps.add(subs); } return v; },
    set value(n: T) {
      if (Object.is(v, n)) return;
      v = n;
      for (const s of subs) {
        if (s.d) { subs.delete(s); continue; }
        if (!queue) { queue = new Set(); queueMicrotask(flush); }
        queue.add(s);
      }
    },
    peek: () => v,
  };
}

export function effect(fn: () => void): () => void {
  const run = (() => {
    if (run.d) return;
    clean(run);
    const prev = cur; cur = run;
    try { fn(); } finally { cur = prev; }
  }) as Run;
  run.deps = new Set();
  run();
  return () => { run.d = true; clean(run); };
}

export function computed<T>(fn: () => T): Signal<T> {
  const s = signal<T>(undefined as T);
  effect(() => { s.value = fn(); });
  return s;
}

export const isSignal = (v: unknown): v is Signal<unknown> =>
  !!v && typeof v === 'object' && 'peek' in v;

// Recipe classes on web components. An element calls its generated slot recipe function
// (styled-system/recipes/<name>.js) with its variants and puts each slot's class string on the
// host (root) and its parts. Only the classes the kit added are swapped on the next call, so
// author classes stay. No CSS is generated at runtime: class names only.

const applied = new WeakMap<Element, Map<string, string[]>>();

/** Set the classes `key` owns on `el` to `cls`, removing the ones it set before. */
export function setClasses(el: Element | null | undefined, cls: string | undefined, key = 'recipe') {
  if (!el) return;
  const next = (cls ?? '').split(' ').filter(Boolean);
  let mine = applied.get(el);
  if (!mine) applied.set(el, (mine = new Map()));
  for (const c of mine.get(key) ?? []) if (!next.includes(c)) el.classList.remove(c);
  if (next.length) el.classList.add(...next);
  mine.set(key, next);
}

/** The host's direct child with data-part=`name`. */
export const partOf = (host: Element, name: string) =>
  [...host.children].find((c) => c.getAttribute('data-part') === name) ?? null;

/**
 * Apply a slot recipe's classes: `root` on the host, every other slot on the matching part. A part
 * is found by `find` (default: the host's direct child with data-part=<slot>); slots with no part
 * in the DOM are skipped.
 */
export function applyRecipe(host: Element, classes: Record<string, string>, find: (slot: string) => Element | null | undefined = (s) => partOf(host, s), key = 'recipe') {
  for (const [slot, cls] of Object.entries(classes)) setClasses(slot === 'root' ? host : find(slot), cls, key);
}

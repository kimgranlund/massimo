// Icon runtime: fills every <i name="…"> in the document with an SVG from the active icon set.
//
// Which set: a data-icons attribute on the icon itself; else, for system glyphs (plus, minus,
// caret-*, x, …), Phosphor from the CDN; else the nearest ancestor's data-icons, the `icons`
// value of the theme named by <html data-ui-theme>, or the default (phosphor). Changing either attribute
// re-renders affected icons. Fetched icons are cached per set and name.
// The saved themes' JSON, not tokens/themes/index.ts: that module carries the theme engine and the
// spectrum runtime, which no page that only draws icons should load.
import saved from '../tokens/themes/themes.json' with { type: 'json' };
import type { Theme } from '../tokens/themes/theme.ts';

const savedThemes = saved as Record<string, Theme>;
import { sanitizeSvg } from './sanitize.ts';
import { BUILTIN_SETS, DEFAULT_ICON_SET, SYSTEM_GLYPHS, SYSTEM_ICON_SET, type IconSetSource } from './sets.ts';

const sets = new Map<string, IconSetSource>(Object.entries(BUILTIN_SETS));
const cache = new Map<string, Promise<SVGSVGElement | null>>();
let defaultSet: string = DEFAULT_ICON_SET;
let observer: MutationObserver | undefined;

/** Add or replace an icon set (CDN via cdnSet, bundled via moduleSet, or any loader). */
export function registerIconSet(name: string, source: IconSetSource) {
  sets.set(name, source);
  for (const key of [...cache.keys()]) if (key.startsWith(`${name}:`)) cache.delete(key);
  refreshIcons();
}

export function setDefaultIconSet(name: string) { defaultSet = name; refreshIcons(); }

/** The icon set that applies to an element. */
export function iconSetFor(el: Element): string {
  const own = el.getAttribute('data-icons');
  if (own && sets.has(own)) return own;
  if (SYSTEM_GLYPHS.has(el.getAttribute('name') ?? '')) return SYSTEM_ICON_SET;
  const scoped = el.closest('[data-icons]')?.getAttribute('data-icons');
  if (scoped && sets.has(scoped)) return scoped;
  const theme = el.ownerDocument.documentElement.getAttribute('data-ui-theme');
  const themed = theme ? savedThemes[theme]?.icons : undefined;
  return themed && sets.has(themed) ? themed : defaultSet;
}

function load(setName: string, name: string) {
  const key = `${setName}:${name}`;
  let p = cache.get(key);
  if (!p) {
    const set = sets.get(setName)!;
    p = set.load(set.aliases?.[name] ?? name).then(sanitizeSvg).catch((err) => {
      console.warn(`ui-kit icons: ${setName}/${name} unavailable`, err);
      cache.delete(key); // allow a retry later
      return null;
    });
    cache.set(key, p);
  }
  return p;
}

/** Render one <i name>. Safe to call repeatedly; only re-renders when set or name changed. */
export async function renderIcon(el: HTMLElement) {
  // Only <i name>: a form field's name (a radio, a hidden input) is not an icon.
  const name = el.localName === 'i' ? el.getAttribute('name') : null;
  if (!name) return;
  const setName = iconSetFor(el);
  const key = `${setName}:${name}`;
  if (el.dataset.icon === key) return;
  el.dataset.icon = key;
  // Decorative unless the author named it.
  if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) el.setAttribute('role', 'img');
  else el.setAttribute('aria-hidden', 'true');
  const svg = await load(setName, name);
  if (el.dataset.icon !== key) return; // superseded while loading
  el.replaceChildren(...(svg ? [svg.cloneNode(true)] : []));
  el.toggleAttribute('data-icon-missing', !svg);
}

const iconsIn = (root: ParentNode) => root.querySelectorAll<HTMLElement>('i[name]');

/** Re-render every icon under `root` (after a set, theme or default change). */
export function refreshIcons(root: ParentNode = document) {
  if (typeof document === 'undefined') return;
  for (const el of iconsIn(root)) { delete el.dataset.icon; void renderIcon(el); }
}

/** Start watching the document. Idempotent. */
export function startIcons(doc: Document = document) {
  if (observer) return;
  for (const el of iconsIn(doc)) void renderIcon(el);
  observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') {
        for (const n of r.addedNodes) {
          if (n.nodeType !== 1) continue;
          const el = n as HTMLElement;
          if (el.matches('i[name]')) void renderIcon(el);
          for (const i of iconsIn(el)) void renderIcon(i);
        }
      } else if (r.attributeName === 'name') {
        void renderIcon(r.target as HTMLElement);
      } else {
        refreshIcons(r.target as Element); // data-icons or data-ui-theme changed
      }
    }
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['name', 'data-icons', 'data-ui-theme'] });
}

export function stopIcons() { observer?.disconnect(); observer = undefined; }

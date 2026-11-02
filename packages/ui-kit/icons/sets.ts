// Built-in icon sets, fetched on demand from jsDelivr (pinned versions, CORS-enabled).
// Canonical icon names are Phosphor's; other sets map them through `aliases`, and any
// name without an alias is requested as-is.

export interface IconSetSource {
  /** Returns the raw SVG markup for a set-specific icon name. */
  load(name: string): Promise<string>;
  /** Canonical (Phosphor) name -> this set's name. */
  aliases?: Record<string, string>;
}

export const cdnSet = (url: (name: string) => string, aliases?: Record<string, string>): IconSetSource => ({
  aliases,
  async load(name) {
    const res = await fetch(url(name));
    if (!res.ok) throw new Error(`icon ${name}: HTTP ${res.status}`);
    return res.text();
  },
});

/**
 * A set bundled as a dependency, e.g. with Vite:
 *   moduleSet(import.meta.glob('/node_modules/@phosphor-icons/core/assets/regular/*.svg', { query: '?raw', import: 'default' }))
 * Keys are file paths; the file name (without .svg) is the icon name. Loaders stay lazy.
 */
export function moduleSet(modules: Record<string, () => Promise<unknown>>, aliases?: Record<string, string>): IconSetSource {
  const byName = new Map(Object.entries(modules).map(([path, load]) => [path.replace(/^.*\//, '').replace(/\.svg(\?.*)?$/, ''), load]));
  return {
    aliases,
    async load(name) {
      const load = byName.get(name);
      if (!load) throw new Error(`icon ${name}: not in bundled set`);
      return String(await load());
    },
  };
}

const CHEVRONS = { 'caret-down': 'chevron-down', 'caret-up': 'chevron-up', 'caret-left': 'chevron-left', 'caret-right': 'chevron-right' };

export const BUILTIN_SETS = {
  phosphor: cdnSet((n) => `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/regular/${n}.svg`),
  lucide: cdnSet((n) => `https://cdn.jsdelivr.net/npm/lucide-static@1.57.0/icons/${n}.svg`, {
    ...CHEVRONS, 'magnifying-glass': 'search', gear: 'settings', warning: 'triangle-alert', envelope: 'mail',
    'eye-slash': 'eye-off', 'dots-three': 'ellipsis', list: 'menu',
  }),
  tabler: cdnSet((n) => `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/${n}.svg`, {
    ...CHEVRONS, 'magnifying-glass': 'search', globe: 'world', gear: 'settings', house: 'home', info: 'info-circle',
    warning: 'alert-triangle', envelope: 'mail', 'eye-slash': 'eye-off', 'dots-three': 'dots', list: 'menu-2',
  }),
} satisfies Record<string, IconSetSource>;

export const ICON_SET_NAMES = Object.keys(BUILTIN_SETS) as (keyof typeof BUILTIN_SETS)[];
export const DEFAULT_ICON_SET = 'phosphor';
/** Theme values may name a built-in set or one an app registers (lowercase, dashes). */
export const ICON_SET_NAME = /^[a-z][a-z0-9-]{0,39}$/;

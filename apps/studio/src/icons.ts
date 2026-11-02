// Icon sets available in the studio. Built-ins (phosphor, lucide, tabler) load from the CDN;
// "phosphor-bundled" shows the dependency route: a subset of @phosphor-icons/core bundled by
// Vite, one lazy chunk per icon, no network beyond the app itself.
import { registerIconSet, moduleSet, ICON_SET_NAMES } from '@massimo/ui-kit/icons';

registerIconSet('phosphor-bundled', moduleSet(
  import.meta.glob('../../../node_modules/@phosphor-icons/core/assets/regular/{caret-*,plus,minus,arrow-right,globe,check,x,magnifying-glass}.svg', { query: '?raw', import: 'default' }),
));

export const STUDIO_ICON_SETS = [...ICON_SET_NAMES, 'phosphor-bundled'];

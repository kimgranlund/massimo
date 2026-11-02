// Global defaults that are not component recipes: hidden, the icon box, the layout containers
// (CSS-only tags; lengths in styles/geometry.ts) and the forced-colors disabled color. Component
// styles are slot recipes (components/<name>/<name>.recipe.ts). Keyed on tags and [data-ui] hosts
// (React twins are generated, styles/native.ts), so tag rules already apply before upgrade.
import { defineGlobalStyles } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../tokens/geometry/resolve.ts';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },
  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  'i[name]': { display: 'inline-flex', width: '1em', height: '1em', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Layout containers (lengths in styles/geometry.ts)
  'ui-group': { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', borderColor: 'transparent' },
  ':is(ui-collection, ui-tile, ui-card, ui-panel, ui-region, ui-page)': { display: 'flex', flexDirection: 'column', borderColor: 'transparent' },
  'ui-page': { width: '100%', maxWidth: `${PAGE_MAX_WIDTH_REM}rem`, marginInline: 'auto' },
  // Fills alternate by depth so each level reads without borders: panel 3, card 2, tile 1.
  'ui-panel': { bg: 'bg.muted' },
  'ui-card': { bg: 'bg.subtle', borderColor: 'border' },
  'ui-tile': { bg: 'bg' },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  '@media (forced-colors: active)': {
    '[aria-disabled=true]': { color: 'GrayText' },
  },
});

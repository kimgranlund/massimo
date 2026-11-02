// Global defaults that are not component recipes: hidden, the icon box and the forced-colors
// disabled color. Component styles, the layout containers included, are slot recipes
// (components/<name>/<name>.recipe.ts).
import { defineGlobalStyles } from '@pandacss/dev';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },
  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  'i[name]': { display: 'inline-flex', width: '1em', height: '1em', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  '@media (forced-colors: active)': {
    '[aria-disabled=true]': { color: 'GrayText' },
  },
});

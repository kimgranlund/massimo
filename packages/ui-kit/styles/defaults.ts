// Global defaults that are not component recipes: hidden, the icon box and the forced-colors
// disabled color. Component styles, the layout containers included, are slot recipes
// (components/<name>/<name>.recipe.ts).
import { defineGlobalStyles } from '@pandacss/dev';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },
  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  // A bare icon (in text, a callout, a heading) follows the icon formula against the font around it:
  // font + k·u (k from [icon-size], md by default). Components size their slotted icons with --icon.
  'i[name]': { display: 'inline-flex', width: 'calc(1em + var(--ui-icon-k) * var(--ui-unit) * 1px)', height: 'calc(1em + var(--ui-icon-k) * var(--ui-unit) * 1px)', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  // Disabled (data-disabled, the state contract) is GrayText; a busy button stays readable.
  '@media (forced-colors: active)': {
    '[data-disabled]': { color: 'GrayText' },
  },
});

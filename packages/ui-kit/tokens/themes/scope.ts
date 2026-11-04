// Scoped themes (docs/planning/theme-schema.md, step 6): a theme applied to one element and its
// subtree instead of the document. Tokens resolve their var() references where they are declared
// (:root), so a scope must redeclare every token that reads a theme input: the u-based lengths, the
// motion and elevation tokens, the shadow layer colors and the selection fills, beside the theme's own variables and its
// colors per scheme. A theme with scheme auto follows the document's scheme (.light / .dark on
// <html>, else the OS); light or dark is the scope's own default when the theme has colors (without
// ramps of its own a scope follows the document). .light / .dark on the scope element
// itself force one.
import { unitTokenVars } from '../geometry/index.ts';
import { motionTokenVars } from '../motion/index.ts';
import { elevationTokenVars } from '../elevation/index.ts';
import { SHADOW_LAYERS, selectionVars, withAlpha } from '../colors/spectrum/index.ts';
import { themeColorVars, themeVars } from './index.ts';
import { THEME_NAME } from './validate.ts';
import type { Theme } from './theme.ts';

// Each block also sets `color`: text inherits the color computed on <body>, so redeclaring --colors-fg
// alone would not reach plain text in the scope.
const block = (sel: string, vars: Record<string, string>) => Object.keys(vars).length ? `${sel} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n  color: var(--colors-fg);\n}` : '';
const shadowLayers = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(SHADOW_LAYERS).map(([k, l]) => [`--colors-shadow-layer-${k}`, withAlpha('var(--colors-shadow)', l[mode])]));
// The selection fills read --ui-emphasis, so a scope redeclares them even without colors of its own.
const selection = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(selectionVars(mode)).map(([k, v]) => [`--colors-${k}`, v]));

/** A selector for one theme's scope: `[data-ui-scope="<name>"]`. */
export const scopeSelector = (name: string) => {
  if (!THEME_NAME.test(name)) throw new Error(`scope name must match ${THEME_NAME}`);
  return `[data-ui-scope="${name}"]`;
};

/**
 * CSS that applies a theme to `selector` and its subtree: the theme's variables and every derived
 * token redeclared there, then its colors in light (the default), dark under the OS scheme or
 * .dark on the document, and either one forced by .light / .dark on the scope element.
 */
export function themeScopeCss(theme: Theme, selector = scopeSelector(theme.name)) {
  const s = selector;
  const base = { ...themeVars(theme), ...unitTokenVars(), ...motionTokenVars(), ...elevationTokenVars() };
  const colors = themeColorVars(theme);
  const light = { ...(colors?.light ?? {}), ...shadowLayers('light'), ...selection('light') };
  const dark = { ...(colors?.dark ?? {}), ...shadowLayers('dark'), ...selection('dark') };
  // The theme's scheme leads: auto follows the document (its class, else the OS); light or dark is the
  // scope's default, and only .light / .dark on the scope element override it.
  // Only with colors of its own: without ramps, dark shadows and selection would sit on the document's ramps.
  if (colors && theme.scheme === 'dark') return [block(s, { ...base, ...dark }), block(`${s}.light`, light)].join('\n');
  if (colors && theme.scheme === 'light') return [block(s, { ...base, ...light }), block(`${s}.dark`, dark)].join('\n');
  return [
    block(s, { ...base, ...light }),
    `@media (prefers-color-scheme: dark) {\n${block(`:root:not(.light) ${s}:not(.light)`, dark)}\n}`,
    block(`:root.dark ${s}:not(.light), ${s}.dark`, dark),
    // No light block is needed: the base is light, and every dark rule above excludes .light (on the
    // scope, or on <html> for the OS rule).
  ].filter(Boolean).join('\n');
}

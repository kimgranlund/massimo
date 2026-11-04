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
import { DEFAULT_VOICES } from '../typography/resolve.ts';
import type { Theme } from './theme.ts';

// Each block also sets `color` and the body voice's `font-family`: plain text inherits the values
// computed on <body>, so redeclaring --colors-fg or --fonts-* alone would not reach it in the scope.
const BODY_FONT = `var(--font-voice-body, var(--fonts-${DEFAULT_VOICES.body}))`;
const block = (sel: string, vars: Record<string, string>) => Object.keys(vars).length ? `${sel} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n  color: var(--colors-fg);\n  font-family: ${BODY_FONT};\n}` : '';
const shadowLayers = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(SHADOW_LAYERS).map(([k, l]) => [`--colors-shadow-layer-${k}`, withAlpha('var(--colors-shadow)', l[mode])]));
// The selection fills read --ui-emphasis, so a scope redeclares them even without colors of its own.
const selection = (mode: 'light' | 'dark') => Object.fromEntries(Object.entries(selectionVars(mode)).map(([k, v]) => [`--colors-${k}`, v]));

// Only the ramp families the roles point at: a scope's own roles never reach a family they do not
// name, so the other ramps (most of the CSS) would be dead weight.
type Vars = Record<string, string>;
function usedOnly(colors?: { light: Vars; dark: Vars }) {
  if (!colors) return undefined;
  const keep = (vars: Vars) => {
    const refs = Object.entries(vars).filter(([k]) => !k.startsWith('--colors-spectrum-')).map(([, v]) => v).join(' ');
    const used = new Set([...refs.matchAll(/--colors-spectrum-([a-z0-9-]+?)-\d+\b/g)].map((m) => m[1]));
    return Object.fromEntries(Object.entries(vars).filter(([k]) => { const m = /^--colors-spectrum-([a-z0-9-]+?)-\d+$/.exec(k); return !m || used.has(m[1]); }));
  };
  return { light: keep(colors.light), dark: keep(colors.dark) };
}

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
  // Each derived family only when the theme sets an input it reads: lengths and font sizes (geometry,
  // typography), motion (motion), elevation (geometry, or colors, since the fills mix role colors).
  const sets = (d: 'geometry' | 'typography' | 'motion') => Object.keys(theme[d]?.parameters ?? {}).length > 0;
  const base = {
    ...themeVars(theme),
    ...(sets('geometry') || sets('typography') ? unitTokenVars() : {}),
    ...(sets('motion') ? motionTokenVars() : {}),
    ...(sets('geometry') || theme.color ? elevationTokenVars() : {}),
  };
  const colors = usedOnly(themeColorVars(theme));
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

/**
 * CSS that applies a theme to the whole document (the root), for an app that loads it after the kit
 * CSS (npm run brand -- build). The kit declares its tokens on :root and in its scheme blocks, so this
 * sets the theme's variables and colors on :root with an ID-level boost (:not(#ui-theme)) that beats
 * those blocks; tokens re-derive where they are declared, so no token redeclaration is needed. The
 * scheme follows the theme (auto: the OS, or .light / .dark on <html>).
 */
export function themeRootCss(theme: Theme) {
  const R = ':root:not(#ui-theme)';
  const colors = themeColorVars(theme);
  const base = themeVars(theme);
  if (!colors) return block(R, base);
  const { light, dark } = colors;
  if (theme.scheme === 'dark') return [block(R, { ...base, ...dark }), block(`${R}.light`, light)].join('\n');
  if (theme.scheme === 'light') return [block(R, { ...base, ...light }), block(`${R}.dark`, dark)].join('\n');
  return [
    block(R, { ...base, ...light }),
    `@media (prefers-color-scheme: dark) {\n${block(`${R}:not(.light)`, dark)}\n}`,
    block(`${R}.dark`, dark),
  ].join('\n');
}

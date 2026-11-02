// The ui-kit Panda preset: tokens, reset, component geometry, component defaults and the FOUC guard.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens, themeCss } from './tokens/index.ts';
import { breakpoints } from './tokens/geometry/index.ts';
import { reset, textStyles, typography, page, prose, geometry, defaults, pending, pendingKeyframes } from './styles/index.ts';
import { native, withNativeTwins } from './styles/native.ts';
import { conditions as stateConditions } from './styles/conditions.ts';
import { slotRecipes } from './components/recipes.ts';

type Css = Record<string, Record<string, unknown>>;

/**
 * Merge style objects selector by selector. A plain object spread would let a later object
 * silently replace an earlier one's whole rule when both use the same selector key.
 */
export function mergeGlobalCss(...parts: Css[]): Css {
  const out: Css = {};
  for (const part of parts) for (const [sel, rule] of Object.entries(part)) out[sel] = { ...(out[sel] ?? {}), ...rule };
  return out;
}

export const globalCssParts = { theme: themeCss(), reset, typography, scheme: { '.dark': { colorScheme: 'dark' }, '.light': { colorScheme: 'light' } }, geometry, defaults, native, pending } as Record<string, Css>;

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  // Native twins: React renderers use native HTML with data-ui hosts (styles/native.ts).
  globalCss: withNativeTwins(mergeGlobalCss(...Object.values(globalCssParts))) as any,
  // Scheme conditions used by semantic colors: OS preference, plus explicit class overrides.
  // plus the state conditions shared by both renderers (styles/conditions.ts).
  conditions: { osDark: '@media (prefers-color-scheme: dark)', dark: '.dark &', light: '.light &', ...stateConditions },
  theme: {
    breakpoints,
    tokens,
    semanticTokens,
    textStyles,
    keyframes: pendingKeyframes,
    // Component styles: one slot recipe per component (components/<name>/<name>.recipe.ts).
    slotRecipes,
  },
  patterns: { page, prose },
});

export default uiKitPreset;

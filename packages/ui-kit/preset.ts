// The ui-kit Panda preset: tokens, reset, component geometry, component defaults and the FOUC guard.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens, themeCss } from './tokens/index.ts';
import { breakpoints } from './tokens/geometry/index.ts';
import { reset, textStyles, typography, page, prose, geometry, defaults, pending, pendingKeyframes } from './styles/index.ts';

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

export const globalCssParts = { theme: themeCss(), reset, typography, scheme: { '.dark': { colorScheme: 'dark' }, '.light': { colorScheme: 'light' } }, geometry, defaults, pending } as Record<string, Css>;

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  globalCss: mergeGlobalCss(...Object.values(globalCssParts)) as any,
  // Scheme conditions used by semantic colors: OS preference, plus explicit class overrides.
  conditions: { osDark: '@media (prefers-color-scheme: dark)', dark: '.dark &', light: '.light &' },
  theme: {
    breakpoints,
    tokens,
    semanticTokens,
    textStyles,
    keyframes: pendingKeyframes,
  },
  patterns: { page, prose },
});

export default uiKitPreset;

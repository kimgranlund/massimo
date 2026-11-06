// The ui-kit Panda preset: tokens, reset, geometry foundations, state conditions, the component slot
// recipes (components/recipes.ts), the CSS-only container tags and the FOUC guard.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens } from './tokens/index.ts';
import { themeCss } from './tokens/themes/index.ts';
import { breakpoints } from './tokens/geometry/index.ts';
import { reset } from './styles/reset.ts';
import { textStyles, typography, numericProperties } from './styles/typography.ts';
import { numeric } from './styles/numeric.ts';
import { page, prose } from './styles/pages/index.ts';
import { geometry, geometryProperties } from './styles/geometry.ts';
import { motion, motionProperties } from './styles/motion.ts';
import { defaults } from './styles/defaults.ts';
import { pending, pendingKeyframes } from './styles/pending.ts';
import { conditions as stateConditions } from './styles/conditions.ts';
import { slotRecipes } from './components/recipes.ts';
import { containerTags } from './components/container/container.recipe.ts';
import { rowTags } from './components/row/row.recipe.ts';
import { flowTags } from './components/flow/flow.recipe.ts';
import { sectionTags } from './components/section/section.recipe.ts';

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

export const globalCssParts = { theme: themeCss(), reset, typography, scheme: { '.dark': { colorScheme: 'dark' }, '.light': { colorScheme: 'light' } }, geometry, motion, defaults, containers: containerTags, rows: rowTags, flows: flowTags, sections: sectionTags, pending } as Record<string, Css>;

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  // Layout containers are CSS-only tags: their recipes are also emitted on the tags (containers,
  // components/container/container.recipe.ts), since no script puts the classes on them.
  globalCss: mergeGlobalCss(...Object.values(globalCssParts)) as any,
  // Derived motion variables registered as <number> (styles/motion.ts); --ui-gap registered as
  // non-inheriting (styles/geometry.ts), the per-axis numeric variables non-inheriting
  // (styles/typography.ts).
  globalVars: { ...motionProperties, ...geometryProperties, ...numericProperties },
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
  patterns: { page, prose, numeric },
});

export default uiKitPreset;

// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so size and theme parameters work per subtree.
//
// Inputs (unitless): --ui-unit (theme default; [size] overrides per subtree), --ui-border,
// --ui-radius-scale, --ui-icon-k (from [icon-size]), --ui-gap (from [gap], per element).
import { defineGlobalStyles } from '@pandacss/dev';
import { unitTokenVars } from '../tokens/geometry/index.ts';
import { AVATAR_SIZES, GAPS, ICON_STEPS, SIZES } from '../tokens/geometry/resolve.ts';

// :where() keeps the shared control values at zero specificity, so per-element rules (ui-chip,
// ui-badge, …) override them. With :is() the [data-ui] argument would outrank a tag selector.
export const GEOMETRY_SCOPE = ':where(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-swatch, ui-palette, ui-swiper, ui-image, ui-group, ui-collection, ui-card, ui-panel, ui-region, ui-page, ui-separator, ui-avatar, ui-meter, ui-toggle, [data-ui], ui-collapsible, ui-accordion, ui-tabs, ui-number-field, ui-otp-field)';
// Badge, tag and chip hosts in both renderers (the React ones are data-ui hosts).
export const BTG = ':is(ui-badge, ui-tag, ui-chip, [data-ui=badge], [data-ui=tag], [data-ui=chip])';
const UNIT_TOKENS = unitTokenVars() as Record<`--${string}`, string>;

export const geometry = defineGlobalStyles({
  // Not ':root': the preset spreads several globalCss objects, and a shared key would replace
  // the theme parameters (themeCss) instead of merging with them.
  ':where(:root)': { '--ui-icon-k': String(ICON_STEPS.md) },

  // size = u, on any element, inherited.
  ...Object.fromEntries(SIZES.map((u) => [`:is([size="${u}"], [data-size="${u}"])`, { '--ui-unit': String(u) }])),
  // u-based tokens (spacing, sizes, radii) recompute in a sized subtree (tokens/geometry/index.ts).
  ':where([size], [data-size])': UNIT_TOKENS,
  ...Object.fromEntries(Object.entries(ICON_STEPS).map(([k, v]) => [`:is([icon-size=${k}], [data-icon-size=${k}])`, { '--ui-icon-k': String(v) }])),
  // Gap applies to the element that carries the attribute only: --ui-gap does not inherit
  // (geometryProperties), so a nested container keeps its own level gap.
  ...Object.fromEntries(GAPS.map((g) => [`[gap="${g}"]`, { '--ui-gap': String(g) }])),

  // Control family, resolved on every component element.
  [GEOMETRY_SCOPE]: {
    '--u': 'calc(var(--ui-unit) * 1px)',
    '--b': 'min(calc(var(--ui-border) * 1px), calc(var(--u) / 2))',
    '--slot': 'calc(6 * var(--u))',
    '--pad': 'calc(var(--u) - var(--b))',
    '--h': 'calc(8 * var(--u))',
    '--font': 'calc(10px + var(--u))',
    // Multi-line labels (choices) keep the 4.5u rhythm; single-line controls use 1.2, capped at
    // the slot (only below u = 2.5 does 1.2 × font exceed 6u), centered by equal block padding.
    '--leading': 'calc(4.5 * var(--u))',
    '--line': 'min(calc(1.2 * var(--font)), var(--slot))',
    '--line-pad': 'calc((var(--slot) - var(--line)) / 2)',
    // Capped at the slot so the control stays 8u.
    '--icon': 'min(calc(var(--font) + var(--ui-icon-k) * var(--u)), var(--slot))',
    // Indicators (carets, the select chevron) are always icon size sm.
    '--icon-sm': 'min(calc(var(--font) - 0.5 * var(--u)), var(--slot))',
    '--radius': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },

  // Corner shape for every element that carries a radius: superellipse(k) from the theme,
  // k = 1 (round) by default. Browsers without corner-shape keep plain round corners.
  [`${GEOMETRY_SCOPE.slice(0, -1)}, [data-part])`]: { cornerShape: 'superellipse(var(--ui-corner-shape))' },

  // Badge / tag / chip: capped height ladder (see resolveBtg). Overrides the control values
  // on the same element, so --icon and --radius follow automatically. Variables only: the
  // slot recipes (components/btg/btg.recipe.ts) apply them.
  [BTG]: {
    '--chip-h': 'min(calc(12px + 3 * var(--u)), calc(8 * var(--u)))',
    '--tag-h': 'min(calc(12px + 2 * var(--u)), calc(var(--chip-h) - var(--u)))',
    '--badge-h': 'min(calc(12px + var(--u)), calc(var(--tag-h) - var(--u)))',
    // Local unit u′ = height / 8 (a control is 8u tall): spacing is relative to each element's size.
    '--lu': 'calc(var(--h) / 8)',
    '--pad': 'max(0px, calc(0.5 * var(--lu) - var(--b)))',
    '--slot': 'calc(var(--h) - var(--lu))',
    // Concentric radius: the edge (0.5u′) plus a third of the slot, the button's 1u + 2u split
    // (2u = its 6u slot / 3), so a fill slot's radius R − 0.5u′ stays parallel. Pill at height / 2.
    '--radius': 'min(calc((0.5 * var(--lu) + var(--slot) / 3) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },
  ':is(ui-chip, [data-ui=chip])': { '--h': 'var(--chip-h)', '--font': 'calc(10px + var(--u))' },
  ':is(ui-tag, [data-ui=tag])': { '--h': 'var(--tag-h)', '--font': 'calc(10px + 0.5 * var(--u))' },
  ':is(ui-badge, [data-ui=badge])': { '--h': 'var(--badge-h)', '--font': '10px' },

  // Range and progress (resolveTrack): the 4u track and its radius, read by the range recipes.
  ':is(ui-range, ui-progress, ui-meter, [data-ui=range], [data-ui=progress], [data-ui=meter])': {
    '--track': 'calc(4 * var(--u))',
    '--track-r': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--track) / 2))',
  },

  // Separator (resolveSeparator): as thick as the theme border, never thinner than a hairline.
  ':is(ui-separator, [data-ui=separator])': { '--separator': 'max(1px, var(--b))' },

  // Avatar (resolveAvatar): n·u square (sm 6, md 8, lg 12, xl 16), a control scaled by k = n / 8.
  ':is(ui-avatar, [data-ui=avatar])': {
    '--avatar-k': '1',
    '--avatar': 'calc(8 * var(--u) * var(--avatar-k))',
    '--avatar-font': 'calc((10px + var(--u)) * var(--avatar-k))',
    '--avatar-icon': 'calc((10px + 1.5 * var(--u)) * var(--avatar-k))',
    '--avatar-r': 'calc(var(--avatar) / 2 * min(1, var(--ui-radius-scale)))',
  },
  ...Object.fromEntries(Object.entries(AVATAR_SIZES).filter(([k]) => k !== 'md').map(([k, n]) => [`:is(ui-avatar[avatar-size=${k}], [data-ui=avatar][data-avatar-size=${k}])`, { '--avatar-k': String(n / 8) }])),
});

/**
 * @property registrations (Panda globalVars). --ui-gap does not inherit: the gap attribute sets it on
 * its own element only (a container, a composite), and the select popup takes its host's explicitly.
 * Syntax `*` has no initial value, so `var(--ui-gap, <level gap>)` falls back where it is unset.
 */
export const geometryProperties = { '--ui-gap': { syntax: '*', inherits: false } };

// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so size and theme parameters work per subtree.
//
// Inputs (unitless): --ui-unit (theme default; [size] overrides per subtree), --ui-border,
// --ui-radius-scale, --ui-icon-k (from [icon-size]), --ui-gap (from [gap], per element).
import { CONTAINER_DEPTH } from '../tokens/geometry/resolve.ts';
import { defineGlobalStyles } from '@pandacss/dev';
import { DENSITY_FACTOR_CSS, DENSITY_INSET_CSS, unitTokenVars } from '../tokens/geometry/index.ts';
import { AVATAR_SIZES, DENSITIES, GAPS, ICON_SLOT_BASE, ICON_STEPS, RADIUS_FACTORS, SIZES } from '../tokens/geometry/resolve.ts';

// :where() keeps the shared control values at zero specificity, so per-element rules (ui-chip,
// ui-badge, …) override them. With :is() the [data-ui] argument would outrank a tag selector.
export const GEOMETRY_SCOPE = ':where(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-swatch, ui-palette, ui-swiper, ui-image, ui-container, ui-row, ui-column, ui-list, ui-grid, ui-section, ui-separator, ui-spinner, ui-kbd, ui-textarea, ui-breadcrumb, ui-button-link, ui-setting-row, ui-data-list, ui-stat-card, ui-avatar, ui-meter, ui-toggle, [data-ui], ui-collapsible, ui-accordion, ui-tabs, ui-toast-viewport, ui-scroll-area, ui-number-field, ui-otp-field, ui-combobox, ui-autocomplete, ui-toggle-group, ui-dialog, ui-alert-dialog, ui-drawer, ui-menu, ui-context-menu, ui-menubar, ui-popover, ui-tooltip, ui-preview-card, ui-navigation-menu)';
// Badge, tag and chip hosts in both renderers (the React ones are data-ui hosts).
export const BTG = ':is(ui-badge, ui-tag, ui-chip, [data-ui=badge], [data-ui=tag], [data-ui=chip])';
const UNIT_TOKENS = unitTokenVars() as Record<`--${string}`, string>;

export const geometry = defineGlobalStyles({
  // Not ':root': the preset spreads several globalCss objects, and a shared key would replace
  // the theme parameters (themeCss) instead of merging with them.
  ':where(:root)': { '--ui-icon-k': String(ICON_STEPS.md) },

  // size = u, on any element, inherited.
  ...Object.fromEntries(SIZES.map((u) => [`:is([size="${u}"], [data-size="${u}"])`, { '--ui-unit': String(u) }])),
  // density = compact | default | loose on any element, inherited (theme default: --ui-density).
  ...Object.fromEntries(DENSITIES.map((d, i) => [`:is([density="${d}"], [data-density="${d}"])`, { '--ui-density': String(i) }])),
  // u-based tokens (spacing, sizes, radii, the ladder) recompute in a sized or density subtree (tokens/geometry/index.ts).
  ':where([size], [data-size], [density], [data-density])': UNIT_TOKENS,
  ...Object.fromEntries(Object.entries(ICON_STEPS).map(([k, v]) => [`:is([icon-size=${k}], [data-icon-size=${k}])`, { '--ui-icon-k': String(v) }])),
  // Gap applies to the element that carries the attribute only: --ui-gap does not inherit
  // (geometryProperties), so a nested container keeps its own level gap.
  ...Object.fromEntries(GAPS.map((g) => [`[gap="${g}"]`, { '--ui-gap': String(g) }])),
  // Radius applies to the element that carries it, like gap: a container's factor on its concentric radius.
  ...Object.fromEntries(RADIUS_FACTORS.map((t) => [`[radius="${t}"]`, { '--ui-radius': String(t) }])),

  // Control family, resolved on every component element.
  [GEOMETRY_SCOPE]: {
    '--u': 'calc(var(--ui-unit) * 1px)',
    '--b': 'min(calc(var(--ui-border) * 1px), calc(var(--u) / 2))',
    '--slot': 'calc(6 * var(--u))',
    // Density: the control inset --di (0.5u, 1u, 2u) and the ladder factor --df (0.5, 1, 1.5).
    '--di': `calc${DENSITY_INSET_CSS}`,
    '--df': `calc${DENSITY_FACTOR_CSS}`,
    '--pad': 'calc(var(--di) * var(--u) - var(--b))',
    // The control height (7u, 8u, 10u); --h is the element's own height, which badge, tag and chip override.
    // From u, not --slot: badge, tag and chip derive their slot from their own height (no cycle).
    '--ctl-h': 'calc((6 + 2 * var(--di)) * var(--u))',
    '--h': 'var(--ctl-h)',
    '--font': 'calc(10px + var(--u))',
    // Multi-line labels (choices) keep the 4.5u rhythm; single-line controls use 1.2, capped at
    // the slot (only below u = 2.5 does 1.2 × font exceed 6u), centered by equal block padding.
    '--leading': 'calc(4.5 * var(--u))',
    '--line': 'min(calc(1.2 * var(--font)), var(--slot))',
    '--line-pad': 'calc((var(--slot) - var(--line)) / 2)',
    // font + k·u, at least (3.5 + k)/6 of the slot (resolveIcon), capped at the slot so the control keeps its height.
    '--icon': `min(max(calc(var(--font) + var(--ui-icon-k) * var(--u)), calc((${ICON_SLOT_BASE} + var(--ui-icon-k)) / 6 * var(--slot))), var(--slot))`,
    // Indicators (carets, the select chevron) are always icon size sm.
    '--icon-sm': `min(max(calc(var(--font) - 0.5 * var(--u)), calc((${ICON_SLOT_BASE} - 0.5) / 6 * var(--slot))), var(--slot))`,
    '--radius': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },

  // Corner shape for every element that carries a radius: superellipse(k) from the theme,
  // k = 1 (round) by default. Browsers without corner-shape keep plain round corners.
  [`${GEOMETRY_SCOPE.slice(0, -1)}, [data-part])`]: { cornerShape: 'superellipse(var(--ui-corner-shape))' },

  // Badge / tag / chip: capped height ladder (see resolveBtg). Overrides the control values
  // on the same element, so --icon and --radius follow automatically. Variables only: the
  // slot recipes (components/btg/btg.recipe.ts) apply them.
  [BTG]: {
    '--chip-h': 'min(calc(12px + 3 * var(--u)), var(--ctl-h))',
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

  // Scroll area (resolveScrollArea): a 2u track, the thumb 0.5u inside it (u thick), at least 4u
  // long, pill radii capped like a control's; read by the scroll-area recipe.
  ':is(ui-scroll-area, [data-ui=scroll-area])': {
    '--scrollbar': 'calc(2 * var(--u))',
    '--scrollbar-inset': 'calc(0.5 * var(--u))',
    '--thumb': 'calc(var(--scrollbar) - 2 * var(--scrollbar-inset))',
    '--thumb-min': 'calc(4 * var(--u))',
    '--scrollbar-r': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--scrollbar) / 2))',
    '--thumb-r': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--thumb) / 2))',
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
export const geometryProperties = {
  '--ui-gap': { syntax: '*', inherits: false }, '--ui-radius': { syntax: '*', inherits: false },
  // The container nesting chain (container.recipe.ts): each depth's radius and padding read the previous
  // depth's twice, so as unregistered (token-stream) properties their values grow exponentially with
  // depth and WebKit drops them past depth 5. Registered as lengths, each computes to a length per
  // element and the chain stays linear.
  ...Object.fromEntries(Array.from({ length: CONTAINER_DEPTH }, (_, i) => i + 1).flatMap((n) => [
    [`--uc-r${n}`, { syntax: '<length>', inherits: true, initialValue: '0px' }],
    [`--uc-p${n}`, { syntax: '<length>', inherits: true, initialValue: '0px' }],
  ])),
};

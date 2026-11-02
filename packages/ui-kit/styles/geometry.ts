// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so `size` and theme parameters work per subtree.
//
// Inputs (theme parameters, unitless): --ui-unit, --ui-border, --ui-label-edge, --ui-radius-scale.
// Size: [size|data-size = sm|md|lg] on any element sets --ui-size-inset/--ui-size-gap for its subtree.
// Composite inset: [inset = 0|0.5|1|1.5] on a listbox/segmented/select sets --ui-composite-inset.
import { defineGlobalStyles } from '@pandacss/dev';

export const GEOMETRY_SCOPE = ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, [data-ui])';
export const COMPOSITE = ':is(ui-listbox, ui-segmented, ui-select > [data-part=popup])';

const sizes = { sm: ['0.5', '0'], md: ['1', '1'], lg: ['2', '2'] } as const;

export const geometry = defineGlobalStyles({
  // Not ':root': the preset spreads several globalCss objects, and a shared key would replace
  // the theme parameters (themeCss) instead of merging with them.
  ':where(:root)': { '--ui-size-inset': '1', '--ui-size-gap': '1', '--ui-composite-inset': '0.5' },
  ...Object.fromEntries(Object.entries(sizes).map(([k, [inset, gap]]) => [
    `:is([size=${k}], [data-size=${k}])`, { '--ui-size-inset': inset, '--ui-size-gap': gap },
  ])),
  // Set on the component; the select's popup inherits it.
  ...Object.fromEntries(['0', '0.5', '1', '1.5'].map((q) => [`:is(ui-listbox, ui-segmented, ui-select)[inset="${q}"]`, { '--ui-composite-inset': q }])),

  // Control family, resolved on every component element.
  [GEOMETRY_SCOPE]: {
    '--u': 'calc(var(--ui-unit) * 1px)',
    '--b': 'min(calc(var(--ui-border) * 1px), calc(var(--u) / 2))',
    '--slot': 'calc(6 * var(--u))',
    '--inset': 'calc(var(--ui-size-inset) * var(--u))',
    '--pad': 'calc(var(--inset) - var(--b))',
    '--gap': 'calc(var(--ui-size-gap) * var(--u))',
    '--h': 'calc(var(--slot) + 2 * var(--inset))',
    '--edge': 'calc(var(--ui-label-edge) * var(--u))',
    '--font': 'calc(2 * var(--u) + 6px)',
    '--leading': 'calc(5 * var(--u))',
    '--icon': 'min(calc(4 * var(--u)), calc(var(--slot) - 2 * var(--b)))',
    '--radius': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },

  // Composite family. Declared on the parent; children read the inherited values.
  [COMPOSITE]: {
    '--q': 'calc(var(--ui-composite-inset) * var(--u))',
    '--d': 'max(var(--b), var(--q))',
    '--ci': 'max(var(--b), calc(var(--inset) - var(--d)))',
    '--ch': 'calc(var(--slot) + 2 * var(--ci))',
    // Container curvature for lists and popups; segmented overrides with control curvature.
    '--cr': 'calc(3 * var(--u) * var(--ui-radius-scale))',
    padding: 'calc(var(--d) - var(--b))',
    gap: 'var(--q)',
    borderWidth: 'var(--b)',
    borderRadius: 'var(--cr)',
  },
  'ui-segmented': { '--cr': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc((var(--ch) + 2 * var(--d)) / 2))' },
  [`${COMPOSITE} > ui-option`]: {
    minHeight: 'var(--ch)',
    paddingBlock: 'calc(var(--ci) - var(--b))',
    paddingInline: 'calc(var(--ci) - var(--b) + var(--edge))',
    borderWidth: 'var(--b)',
    borderColor: 'transparent',
    // Nested radius; the min(1, Q*1000) factor is 0 only when Q = 0 (attached group: square children).
    borderRadius: 'calc(min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d)))) * min(1, var(--ui-composite-inset) * 1000))',
    fontSize: 'var(--font)',
    lineHeight: 'var(--leading)',
  },
});

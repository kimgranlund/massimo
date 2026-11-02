// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so size and theme parameters work per subtree.
//
// Inputs (unitless): --ui-unit (theme default; [size] overrides per subtree), --ui-border,
// --ui-radius-scale, --ui-icon-k (from [icon-size]), --ui-composite-inset (from [inset]).
import { defineGlobalStyles } from '@pandacss/dev';
import { ICON_STEPS, SIZES } from '../tokens/geometry/resolve.ts';

export const GEOMETRY_SCOPE = ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, [data-ui])';
export const COMPOSITE = ':is(ui-listbox, ui-segmented, ui-select > [data-part=popup])';
export const SLOTTED = ':is(ui-button, ui-option, [data-ui=button])';
const SLOT = ':is([data-part=leading], [data-part=trailing])';

export const geometry = defineGlobalStyles({
  // Not ':root': the preset spreads several globalCss objects, and a shared key would replace
  // the theme parameters (themeCss) instead of merging with them.
  ':where(:root)': { '--ui-composite-inset': '0.5', '--ui-icon-k': String(ICON_STEPS.md) },

  // size = u, on any element, inherited.
  ...Object.fromEntries(SIZES.map((u) => [`:is([size="${u}"], [data-size="${u}"])`, { '--ui-unit': String(u) }])),
  ...Object.fromEntries(Object.entries(ICON_STEPS).map(([k, v]) => [`:is([icon-size=${k}], [data-icon-size=${k}])`, { '--ui-icon-k': String(v) }])),
  // Set on the component; the select's popup inherits it.
  ...Object.fromEntries(['0', '0.5', '1', '1.5'].map((q) => [`:is(ui-listbox, ui-segmented, ui-select)[inset="${q}"]`, { '--ui-composite-inset': q }])),

  // Control family, resolved on every component element.
  [GEOMETRY_SCOPE]: {
    '--u': 'calc(var(--ui-unit) * 1px)',
    '--b': 'min(calc(var(--ui-border) * 1px), calc(var(--u) / 2))',
    '--slot': 'calc(6 * var(--u))',
    '--pad': 'calc(var(--u) - var(--b))',
    '--h': 'calc(8 * var(--u))',
    '--font': 'calc(10px + var(--u))',
    '--leading': 'calc(4.5 * var(--u))',
    // Capped at the slot so the control stays 8u.
    '--icon': 'min(calc(var(--font) + var(--ui-icon-k) * var(--u)), var(--slot))',
    '--radius': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },

  // Slots: leading / contents / trailing, each at least 6u square.
  [`${SLOTTED} > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)' },
  [`${SLOTTED} > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
  [`${SLOTTED} > [data-part=contents]`]: {
    display: 'flex', alignItems: 'center', minWidth: 'var(--slot)', minHeight: 'var(--slot)',
    paddingInline: 'var(--u)', paddingBlock: 'calc(0.75 * var(--u))', lineHeight: 'var(--leading)',
  },
  // Fill: artwork covers the whole slot, with a radius nested inside the control's.
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT}`]: {
    width: 'var(--slot)', height: 'var(--slot)', overflow: 'hidden',
    borderRadius: 'max(0px, calc(var(--radius) - var(--u)))',
  },
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT} > *`]: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },

  // Composite family. Declared on the parent; children read the inherited values.
  [COMPOSITE]: {
    '--q': 'calc(var(--ui-composite-inset) * var(--u))',
    '--d': 'max(var(--b), var(--q))',
    '--ci': 'max(var(--b), calc(var(--u) - var(--d)))',
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
    padding: 'calc(var(--ci) - var(--b))',
    borderWidth: 'var(--b)',
    borderColor: 'transparent',
    // Nested radius; the min(1, Q*1000) factor is 0 only when Q = 0 (attached group: square children).
    borderRadius: 'calc(min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d)))) * min(1, var(--ui-composite-inset) * 1000))',
    fontSize: 'var(--font)',
  },
});

// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so size and theme parameters work per subtree.
//
// Inputs (unitless): --ui-unit (theme default; [size] overrides per subtree), --ui-border,
// --ui-radius-scale, --ui-icon-k (from [icon-size]), --ui-gap (from [gap], per element).
import { defineGlobalStyles } from '@pandacss/dev';
import { CONTAINERS, GAPS, ICON_STEPS, SIZES, SQUARE_LEVELS } from '../tokens/geometry/resolve.ts';

// :where() keeps the shared control values at zero specificity, so per-element rules (ui-chip,
// ui-badge, …) override them. With :is() the [data-ui] argument would outrank a tag selector.
export const GEOMETRY_SCOPE = ':where(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-swatch, ui-palette, ui-swiper, ui-image, ui-group, ui-collection, ui-tile, ui-card, ui-panel, ui-region, ui-page, [data-ui])';
export const BTG = ':is(ui-badge, ui-tag, ui-chip)';
const LAYOUT = Object.keys(CONTAINERS).filter((k) => k !== 'composite') as Exclude<keyof typeof CONTAINERS, 'composite'>[];
export const LAYOUT_CONTAINERS = `:is(${LAYOUT.map((k) => `ui-${k}`).join(', ')})`;
const CONTAINER_TAGS = `:where(${LAYOUT.map((k) => `ui-${k}`).join(', ')}, ui-listbox, ui-segmented, ui-select)`;
const TAGCHIP = ':is(ui-tag, ui-chip)';
export const COMPOSITE = ':is(ui-listbox, ui-segmented, ui-select > [data-part=popup])';
// Slotted hosts: buttons, options, and the input control and select trigger, which are laid out as
// buttons (1u padding on the host; contents and slots carry the rest). :where() keeps the tag specificity.
const FIELD_HOSTS = ':where(:is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger])';
export const SLOTTED = `:is(ui-button, ui-option, [data-ui=button], ${FIELD_HOSTS})`;
const SLOT = ':is([data-part=leading], [data-part=trailing])';

export const geometry = defineGlobalStyles({
  // Not ':root': the preset spreads several globalCss objects, and a shared key would replace
  // the theme parameters (themeCss) instead of merging with them.
  ':where(:root)': { '--ui-icon-k': String(ICON_STEPS.md) },

  // size = u, on any element, inherited.
  ...Object.fromEntries(SIZES.map((u) => [`:is([size="${u}"], [data-size="${u}"])`, { '--ui-unit': String(u) }])),
  ...Object.fromEntries(Object.entries(ICON_STEPS).map(([k, v]) => [`:is([icon-size=${k}], [data-icon-size=${k}])`, { '--ui-icon-k': String(v) }])),
  // Gap apply to the element that carries the attribute only: every container resets the
  // value at tag specificity, and the attribute rule (higher specificity) sets it.
  [CONTAINER_TAGS]: { '--ui-gap': 'initial' },
  'ui-select > [data-part=popup]': { '--ui-gap': 'inherit' },
  ...Object.fromEntries(GAPS.map((g) => [`[gap="${g}"]`, { '--ui-gap': String(g) }])),

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
    // Indicators (carets, the select chevron) are always icon size sm.
    '--icon-sm': 'min(calc(var(--font) - 0.5 * var(--u)), var(--slot))',
    '--radius': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--h) / 2))',
  },

  // Corner shape for every element that carries a radius: superellipse(k) from the theme,
  // k = 1 (round) by default. Browsers without corner-shape keep plain round corners.
  [`${GEOMETRY_SCOPE.slice(0, -1)}, [data-part])`]: { cornerShape: 'superellipse(var(--ui-corner-shape))' },

  // Slots: leading / contents / trailing, each at least 6u square.
  [`${SLOTTED} > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)' },
  [`${SLOTTED} > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
  [`${SLOTTED} > [data-part=contents]`]: {
    display: 'flex', alignItems: 'center', minWidth: 'var(--slot)', minHeight: 'var(--slot)',
    paddingInline: 'var(--u)', paddingBlock: 'calc(0.75 * var(--u))', lineHeight: 'var(--leading)',
  },
  // Field text (input, select value) fills the row as a block, so it can scroll or ellipsize.
  [`${FIELD_HOSTS} > [data-part=contents]`]: { display: 'block', flex: '1', minWidth: 0 },
  // Button and option label: 1u more on a side with no leading/trailing element (2u there, 1u beside a slot).
  // Web components keep empty parts as [hidden]; React omits them, so contents is first/last child.
  [`${SLOTTED} > :is([data-part=leading][hidden] + [data-part=contents], [data-part=contents]:first-child)`]: {
    paddingInlineStart: 'calc(2 * var(--u))',
  },
  [`${SLOTTED} > :is([data-part=contents]:has(+ [data-part=trailing][hidden]), [data-part=contents]:last-child)`]: {
    paddingInlineEnd: 'calc(2 * var(--u))',
  },

  // Carets and the select chevron use icon size sm regardless of icon-size.
  [`${SLOT} > i[name^="caret-"]`]: { width: 'var(--icon-sm)', height: 'var(--icon-sm)' },

  // Fill: artwork covers the whole slot, with a radius nested inside the control's.
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT}`]: {
    width: 'var(--slot)', height: 'var(--slot)', overflow: 'hidden',
    borderRadius: 'max(0px, calc(var(--radius) - var(--u)))',
  },
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT} > *`]: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },

  // Badge / tag / chip: capped height ladder (see resolveBtg). Overrides the control values
  // on the same element, so --icon and --radius follow automatically.
  [BTG]: {
    '--chip-h': 'min(calc(12px + 3 * var(--u)), calc(8 * var(--u)))',
    '--tag-h': 'min(calc(12px + 2 * var(--u)), calc(var(--chip-h) - var(--u)))',
    '--badge-h': 'min(calc(12px + var(--u)), calc(var(--tag-h) - var(--u)))',
    '--pad': 'max(0px, calc(0.5 * var(--u) - var(--b)))',
    '--slot': 'calc(var(--h) - var(--u))',
    height: 'var(--h)', minWidth: 'var(--h)', borderWidth: 'var(--b)', borderRadius: 'var(--radius)',
    fontSize: 'var(--font)',
  },
  'ui-chip': { '--h': 'var(--chip-h)', '--font': 'calc(10px + var(--u))' },
  'ui-tag': { '--h': 'var(--tag-h)', '--font': 'calc(10px + 0.5 * var(--u))' },
  'ui-badge': { '--h': 'var(--badge-h)', '--font': '10px', paddingInline: 'var(--pad)', justifyContent: 'center', lineHeight: 1 },
  [TAGCHIP]: { padding: 'var(--pad)' },
  [`${TAGCHIP} > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)' },
  [`${TAGCHIP} > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
  [`${TAGCHIP} > [data-part=contents]`]: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingInline: 'var(--u)', lineHeight: 1 },
  // Fill slots nest inside the 0.5u edge.
  [`:is([icon-size=fill], [data-icon-size=fill]) ${TAGCHIP} > ${SLOT}, ${TAGCHIP}:is([icon-size=fill], [data-icon-size=fill]) > ${SLOT}`]: {
    borderRadius: 'max(0px, calc(var(--radius) - 0.5 * var(--u)))',
  },

  // Layout containers: padding level p and max radius r (units of u), see CONTAINERS.
  // Padding and gap come from the theme parameters --ui-pad-<level> / --ui-gap-<level>; the max
  // radius follows the padding (3u + pad) so corners stay concentric. The gap attribute wins.
  ...Object.fromEntries(LAYOUT.map((k) => [`ui-${k}`, {
    '--cp': `var(--ui-pad-${k})`,
    '--cg': `var(--ui-gap-${k})`,
    '--cm': SQUARE_LEVELS.has(k) ? '0' : `calc(3 + var(--ui-pad-${k}))`,
  }])),
  [LAYOUT_CONTAINERS]: {
    padding: 'max(0px, calc(var(--cp) * var(--u) - var(--b)))',
    gap: 'calc(var(--ui-gap, var(--cg)) * var(--u))',
    borderWidth: 'var(--b)',
    borderRadius: 'calc(var(--cm) * var(--u) * var(--ui-radius-scale))',
  },

  // Choices: a 6u row; the 5u box (9u wide for switch) sits in the 6u leading slot.
  ':is(ui-checkbox, ui-radio, ui-switch)': { minHeight: 'var(--slot)', fontSize: 'var(--font)', lineHeight: 'var(--leading)' },
  ':is(ui-checkbox, ui-radio, ui-switch) > [data-part=contents]': { paddingInlineStart: 'var(--u)', paddingBlock: 'calc(0.75 * var(--u))' },
  ':is(ui-checkbox, ui-radio, ui-switch) > [data-part=leading]': { display: 'grid', placeItems: 'center', minWidth: 'var(--slot)', minHeight: 'var(--slot)', flexShrink: 0 },
  '[data-part=box]': { display: 'grid', placeItems: 'center', width: 'calc(5 * var(--u))', height: 'calc(5 * var(--u))', borderWidth: 'var(--b)' },
  'ui-checkbox [data-part=box]': { borderRadius: 'calc(var(--u) * var(--ui-radius-scale))' },
  'ui-checkbox [data-part=box] > i': { width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))' },
  'ui-radio [data-part=box]': { borderRadius: '50%' },
  'ui-radio [data-part=box]::after': { content: '""', width: 'calc(2 * var(--u))', height: 'calc(2 * var(--u))', borderRadius: '50%' },
  'ui-switch [data-part=box]': { width: 'calc(9 * var(--u))', borderRadius: 'calc(2.5 * var(--u))', justifyItems: 'start', paddingInline: 'calc(0.5 * var(--u) - var(--b))' },
  'ui-switch [data-part=box]::after': {
    content: '""', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))', borderRadius: '50%',
  },
  'ui-switch[aria-checked=true] [data-part=box]::after': { translate: 'calc(4 * var(--u)) 0' },

  // Range and progress: the track fills the 4u box (rounded at half height); range adds a 4u thumb inside.
  ':is(ui-range, ui-progress)': { display: 'grid', alignItems: 'center', height: 'calc(4 * var(--u))', minWidth: 'calc(24 * var(--u))', position: 'relative' },
  ':is(ui-range, ui-progress) > [data-part=track]': { display: 'block', height: '100%', borderRadius: 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(2 * var(--u)))', overflow: 'hidden', gridArea: '1 / 1' },
  ':is(ui-range, ui-progress) > [data-part=track] > [data-part=fill]': { display: 'block', height: '100%', width: 'calc(var(--ui-ratio, 0) * 100%)' },
  // Range fill reaches the thumb's far edge (after the generic rule: same specificity, order wins).
  'ui-range > [data-part=track] > [data-part=fill]': { width: 'calc(var(--ui-ratio, 0) * (100% - 4 * var(--u)) + 4 * var(--u))' },
  'ui-range > [data-part=thumb]': {
    display: 'block', gridArea: '1 / 1', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))', borderRadius: 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(2 * var(--u)))',
    marginInlineStart: 'calc(var(--ui-ratio, 0) * (100% - 4 * var(--u)))',
  },

  // Swatch: 6u square; palette attaches them with no gap inside a 2u-radius strip.
  'ui-swatch': { display: 'inline-block', width: 'var(--slot)', height: 'var(--slot)', borderRadius: 'calc(var(--u) * var(--ui-radius-scale))', flexShrink: 0 },
  'ui-palette': { display: 'inline-flex', borderRadius: 'calc(2 * var(--u) * var(--ui-radius-scale))', overflow: 'hidden' },
  'ui-palette > ui-swatch': { borderRadius: 0, flex: '1 0 var(--slot)' },
  // Vertical: a column of swatches; each keeps at least 6u of height and fills the strip's width.
  'ui-palette[orientation=vertical]': { flexDirection: 'column' },
  'ui-palette[orientation=vertical] > ui-swatch': { width: 'auto' },

  // Swiper: paddles are 8u icon buttons inset 2u; dots are 2u (active 4u) in 4u hit areas.
  'ui-swiper [data-part=paddle]': { position: 'absolute', insetBlockStart: 'calc(50% - 4 * var(--u))' },
  'ui-swiper [data-part=paddle][data-dir=prev]': { insetInlineStart: 'calc(2 * var(--u))' },
  'ui-swiper [data-part=paddle][data-dir=next]': { insetInlineEnd: 'calc(2 * var(--u))' },
  'ui-swiper [data-part=dots]': { position: 'absolute', insetBlockEnd: 'calc(2 * var(--u))', insetInline: 0, display: 'flex', justifyContent: 'center', gap: 'var(--u)' },
  'ui-swiper [data-part=dot]': { display: 'grid', placeItems: 'center', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))' },
  'ui-swiper [data-part=dot]::before': { content: '""', width: 'calc(2 * var(--u))', height: 'calc(2 * var(--u))', borderRadius: 'var(--u)' },
  'ui-swiper [data-part=dot][aria-current=true]::before': { width: 'calc(4 * var(--u))' },

  // Composite (0.5u level). Declared on the parent; options read the inherited values.
  [COMPOSITE]: {
    '--d': 'max(var(--b), calc(var(--ui-pad-composite) * var(--u)))',
    '--ci': 'max(var(--b), calc(var(--u) - var(--d)))',
    '--ch': 'calc(var(--slot) + 2 * var(--ci))',
    // Container curvature for lists and popups; segmented caps it at half its height.
    '--cr': 'calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale))',
    padding: 'calc(var(--d) - var(--b))',
    gap: 'calc(var(--ui-gap, var(--ui-gap-composite)) * var(--u))',
    borderWidth: 'var(--b)',
    borderRadius: 'var(--cr)',
  },
  'ui-segmented': { '--cr': 'min(calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale)), calc((var(--ch) + 2 * var(--d)) / 2))' },
  [`${COMPOSITE} > ui-option`]: {
    minHeight: 'var(--ch)',
    padding: 'calc(var(--ci) - var(--b))',
    borderWidth: 'var(--b)',
    borderColor: 'transparent',
    // Concentric with the composite: parent radius minus its edge (= the 3u control radius).
    borderRadius: 'min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d))))',
    fontSize: 'var(--font)',
  },
});

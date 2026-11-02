// Component geometry in CSS: the same formulas as tokens/geometry/resolve.ts, computed at
// each element from inherited inputs, so size and theme parameters work per subtree.
//
// Inputs (unitless): --ui-unit (theme default; [size] overrides per subtree), --ui-border,
// --ui-radius-scale, --ui-icon-k (from [icon-size]), --ui-gap (from [gap], per element).
import { defineGlobalStyles } from '@pandacss/dev';
import { unitTokenVars } from '../tokens/geometry/index.ts';
import { CONTAINERS, GAPS, ICON_STEPS, SIZES, SQUARE_LEVELS } from '../tokens/geometry/resolve.ts';

// :where() keeps the shared control values at zero specificity, so per-element rules (ui-chip,
// ui-badge, …) override them. With :is() the [data-ui] argument would outrank a tag selector.
export const GEOMETRY_SCOPE = ':where(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-option, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-swatch, ui-palette, ui-swiper, ui-image, ui-group, ui-collection, ui-tile, ui-card, ui-panel, ui-region, ui-page, [data-ui])';
// Badge, tag and chip hosts in both renderers (the React ones are data-ui hosts).
export const BTG = ':is(ui-badge, ui-tag, ui-chip, [data-ui=badge], [data-ui=tag], [data-ui=chip])';
const LAYOUT = Object.keys(CONTAINERS).filter((k) => k !== 'composite') as Exclude<keyof typeof CONTAINERS, 'composite'>[];
export const LAYOUT_CONTAINERS = `:is(${LAYOUT.map((k) => `ui-${k}`).join(', ')})`;
const CONTAINER_TAGS = `:where(${LAYOUT.map((k) => `ui-${k}`).join(', ')}, ui-listbox, ui-segmented, ui-select)`;
export const COMPOSITE = ':is(ui-listbox, ui-segmented, ui-select > [data-part=popup])';
// Slotted hosts (not yet recipes): options, and the input control and select trigger, which are laid out as
// buttons (1u padding on the host; contents and slots carry the rest). :where() keeps the tag specificity.
const FIELD_HOSTS = ':where(:is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger])';
// [data-ui=option] (the React option) also keeps the :is() at attribute specificity, above i[name].
export const SLOTTED = `:is(ui-option, [data-ui=option], ${FIELD_HOSTS})`;
const SLOT = ':is([data-part=leading], [data-part=trailing])';
const TEXT = ':is([data-part=prefix], [data-part=contents], [data-part=suffix])';
const ADORN = ':is([data-part=prefix], [data-part=suffix])';

/**
 * Inline padding of the text run inside `host` (resolveTextRun): each text part gets `bare` at a
 * host edge, `slot` beside a visible leading/trailing slot, and 0.5u beside another visible text
 * part. Web components keep empty parts as [hidden]; React omits them; both work with ~ and :has.
 */
function textRun(host: string, slot: string, bare: string, base: Record<string, string> = {}, between = 'calc(0.5 * var(--u))') {
  const T = `${host} > ${TEXT}`;
  const shown = (part: string) => `${part}:not([hidden])`;
  return {
    [T]: { ...base, paddingInlineStart: bare, paddingInlineEnd: bare },
    [`${host} > ${shown('[data-part=leading]')} ~ ${TEXT}`]: { paddingInlineStart: slot },
    [`${host} > ${shown(TEXT)} ~ ${TEXT}`]: { paddingInlineStart: between },
    [`${T}:has(~ ${shown('[data-part=trailing]')})`]: { paddingInlineEnd: slot },
    [`${T}:has(~ ${shown(TEXT)})`]: { paddingInlineEnd: between },
  };
}

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

  // Construction pattern (resolveTextRun): [leading] [prefix] [contents] [suffix] [trailing].
  // Slots are at least 6u square; the text parts form one run with 0.5u + 0.5u between them,
  // 1u beside a slot and 2u at a bare host edge.
  [`${SLOTTED} > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)' },
  [`${SLOTTED} > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
  [`${SLOTTED} > [data-part=contents]`]: { minWidth: 'var(--slot)' },
  [`${SLOTTED} > ${ADORN}`]: { flexShrink: 0, whiteSpace: 'nowrap' },
  // Field text (input, select value) fills the row as a block, so it can scroll or ellipsize.
  [`${FIELD_HOSTS} > [data-part=contents]`]: { display: 'block', flex: '1', minWidth: 0 },
  ...textRun(SLOTTED, 'var(--u)', 'calc(2 * var(--u))', {
    display: 'flex', alignItems: 'center', minHeight: 'var(--slot)',
    paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)',
  }),

  // Indicators use icon size sm regardless of icon-size: carets, the select chevron and the x
  // close / remove icon (chip remove, dismiss buttons).
  [`${SLOT} > :is(i[name^="caret-"], i[name="x"])`]: { width: 'var(--icon-sm)', height: 'var(--icon-sm)' },

  // Fill: artwork covers the whole slot, with a radius nested inside the control's.
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT}`]: {
    width: 'var(--slot)', height: 'var(--slot)', overflow: 'hidden',
    borderRadius: 'max(0px, calc(var(--radius) - var(--u)))',
  },
  [`:is([icon-size=fill], [data-icon-size=fill]) ${SLOT} > *`]: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },

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

  // Range and progress (resolveTrack): the 4u track and its radius, read by the range recipes.
  ':is(ui-range, ui-progress, [data-ui=range], [data-ui=progress])': {
    '--track': 'calc(4 * var(--u))',
    '--track-r': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--track) / 2))',
  },

  // Swiper: paddles are 8u icon buttons inset 2u; dots are 2u (active 4u) in 4u hit areas.
  // Paddle carets follow the paddle's icon size (lg), not the sm indicator rule for carets.
  // Paddles are fully round whatever the curvature setting (like the dots): radius = half the height.
  'ui-swiper [data-part=paddle]': { position: 'absolute', insetBlockStart: 'calc(50% - 4 * var(--u))', '--radius': 'calc(var(--h) / 2)' },
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

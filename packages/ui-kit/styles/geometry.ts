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
const CHOICE = ':is(ui-checkbox, ui-radio, ui-switch)';
export const COMPOSITE = ':is(ui-listbox, ui-segmented, ui-select > [data-part=popup])';
// Slotted hosts: buttons, options, and the input control and select trigger, which are laid out as
// buttons (1u padding on the host; contents and slots carry the rest). :where() keeps the tag specificity.
const FIELD_HOSTS = ':where(:is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger])';
export const SLOTTED = `:is(ui-button, ui-option, [data-ui=button], ${FIELD_HOSTS})`;
const SLOT = ':is([data-part=leading], [data-part=trailing])';
const TEXT = ':is([data-part=prefix], [data-part=contents], [data-part=suffix])';
const BUTTON_HOST = ':is(ui-button, [data-ui=button])';
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
  // Optical balance (resolveButtonIcons): in a button with visible text, icon slots hug their glyph
  // inline and take the label's 2u on the outer side, so edge-to-icon = edge-to-text (pad + 2u) and
  // icon-to-text = 1u. Icon-only buttons keep the square slot; fill artwork keeps the full slot.
  [`${BUTTON_HOST}:has(> ${TEXT}:not([hidden])) > ${SLOT}`]: { minWidth: 0 },
  [`${BUTTON_HOST}:has(> ${TEXT}:not([hidden])) > [data-part=leading]`]: { marginInlineStart: 'calc(2 * var(--u))' },
  [`${BUTTON_HOST}:has(> ${TEXT}:not([hidden])) > [data-part=trailing]`]: { marginInlineEnd: 'calc(2 * var(--u))' },
  [`${BUTTON_HOST}:is([icon-size=fill], [data-icon-size=fill]):has(> ${TEXT}:not([hidden])) > ${SLOT}, :is([icon-size=fill], [data-icon-size=fill]) ${BUTTON_HOST}:has(> ${TEXT}:not([hidden])) > ${SLOT}`]: {
    minWidth: 'var(--slot)', marginInline: 0,
  },
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
  // on the same element, so --icon and --radius follow automatically.
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
    height: 'var(--h)', minWidth: 'var(--h)', borderWidth: 'var(--b)', borderRadius: 'var(--radius)',
    fontSize: 'var(--font)', padding: 'var(--pad)',
  },
  'ui-chip': { '--h': 'var(--chip-h)', '--font': 'calc(10px + var(--u))' },
  'ui-tag': { '--h': 'var(--tag-h)', '--font': 'calc(10px + 0.5 * var(--u))' },
  'ui-badge': { '--h': 'var(--badge-h)', '--font': '10px', justifyContent: 'center' },
  // Label wrapper padding (resolveBtg), in the local unit u′: the host keeps 0.5u′ − B; labels carry
  // 1u′ on both sides (beside a slot too). Text parts sit 0.5u′ apart.
  // Optical balance: an icon slot hugs its glyph inline (block size stays the slot) and takes the
  // label's 1u′ on its outer side, so edge-to-glyph = edge-to-text = 0.5u′ + 1u′ and icon-to-text = 1u′.
  [`${BTG} > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minHeight: 'var(--slot)' },
  [`${BTG} > [data-part=leading]`]: { marginInlineStart: 'var(--lu)' },
  [`${BTG} > [data-part=trailing]`]: { marginInlineEnd: 'var(--lu)' },
  [`${BTG} > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
  [`${BTG} > ${ADORN}`]: { flexShrink: 0, whiteSpace: 'nowrap' },
  // Chip centers its text with block padding; tag and badge need none, the row centers it.
  // Chip label compensation: +0.5u′ at a bare edge (1.5u′), so text balances an icon's artwork.
  ...textRun('ui-chip', 'var(--lu)', 'calc(1.5 * var(--lu))', { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', lineHeight: 'var(--line)', paddingBlock: 'var(--line-pad)' }, 'calc(0.25 * var(--lu))'),
  ...textRun('ui-tag', 'var(--lu)', 'var(--lu)', { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', lineHeight: 'var(--line)' }, 'calc(0.25 * var(--lu))'),
  ...textRun('ui-badge', 'var(--lu)', 'var(--lu)', { display: 'flex', alignItems: 'center', lineHeight: 'var(--line)' }, 'calc(0.25 * var(--lu))'),
  // Fill artwork (avatars) keeps the full square slot at the edge, nested inside the 0.5u′ edge.
  [`:is([icon-size=fill], [data-icon-size=fill]) ${BTG} > ${SLOT}, ${BTG}:is([icon-size=fill], [data-icon-size=fill]) > ${SLOT}`]: {
    marginInline: 0, minWidth: 'var(--slot)',
    borderRadius: 'max(0px, calc(var(--radius) - 0.5 * var(--lu)))',
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
  [`${CHOICE} > ${ADORN}`]: { flexShrink: 0, whiteSpace: 'nowrap' },
  ...textRun(CHOICE, 'var(--u)', '0px', { paddingBlock: 'calc(0.75 * var(--u))' }),
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

  // Range and progress (resolveTrack): a 4u track, rounded at half height. The range thumb sits inside
  // it like a switch thumb (track − u, inset 0.5u) and travels W − track. The fill ends one
  // track-radius past the thumb's center (track + p·(W − track)) with the track's radius, so its
  // round cap stays concentric around the thumb at every value (maison-ui's construction).
  ':is(ui-range, ui-progress)': {
    '--track': 'calc(4 * var(--u))',
    '--track-r': 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--track) / 2))',
    display: 'grid', alignItems: 'center', height: 'var(--track)', minWidth: 'calc(24 * var(--u))', position: 'relative',
  },
  ':is(ui-range, ui-progress) > [data-part=track]': { display: 'block', height: '100%', borderRadius: 'var(--track-r)', overflow: 'hidden', gridArea: '1 / 1' },
  ':is(ui-range, ui-progress) > [data-part=track] > [data-part=fill]': { display: 'block', height: '100%', width: 'calc(var(--ui-ratio, 0) * 100%)', borderRadius: 'var(--track-r)' },
  // Range fill wraps the thumb (after the generic rule: same specificity, order wins).
  'ui-range > [data-part=track] > [data-part=fill]': { width: 'calc(var(--track) + var(--ui-ratio, 0) * (100% - var(--track)))' },
  'ui-range > [data-part=thumb]': {
    display: 'block', gridArea: '1 / 1', width: 'calc(var(--track) - var(--u))', height: 'calc(var(--track) - var(--u))',
    borderRadius: 'max(0px, calc(var(--track-r) - 0.5 * var(--u)))',
    marginInlineStart: 'calc(0.5 * var(--u) + var(--ui-ratio, 0) * (100% - var(--track)))',
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

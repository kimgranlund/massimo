// Slot recipes for the layout containers: <ui-group>, <ui-collection>, <ui-card>, <ui-panel>,
// <ui-region>, <ui-page> and the React Group … Page (tokens/geometry/resolve.ts CONTAINERS): padding
// and gap come from the theme parameters --ui-pad-<level> / --ui-gap-<level> (the gap attribute wins
// on its own element). Radius: wrappers (group, collection) and cards are concentric with the
// controls they hold, R0 = min(3u·s, 4u) + p·u (square at s = 0), scaled by a magnitude t (0 … 1:
// the radius attribute, else the theme's radius-group / radius-collection / radius-card): R = t × R0;
// areas (panel, region, page) are square. Fills alternate by depth so each level reads without
// borders: panel 3, card 2, a card nested in a card 1.
//
// The containers are CSS-only tags (no script), so nothing puts the recipe classes on them. The same
// recipe objects are therefore also emitted as global rules on the tags (`containerTags`, through
// `tagRules`): the base and default variants on the tag, every other variant on tag[attr=value].
// React renderers and plain HTML use the classes.
import { defineSlotRecipe } from '@pandacss/dev';
import { CARD_PADDINGS, CONTAINERS, PAGE_MAX_WIDTH_REM, radiusFamily, type ContainerLevel } from '../../tokens/geometry/resolve.ts';
import { CONTROL_RADIUS, mergeStyles, tagRules } from '../recipe-parts.ts';

type Layout = Exclude<ContainerLevel, 'composite'>;

/** A level's padding, gap and radius inputs, read by `box`. */
const level = (k: Layout) => {
  const family = CONTAINERS[k].family, f = radiusFamily(k);
  const r0 = family === 'area' ? '0px'
      // Wrappers and cards: concentric with the controls they hold, the control radius + the padding;
      // square at s = 0.
      : `calc(${CONTROL_RADIUS} + calc(var(--ui-pad-${k}) * (0.5 + 0.5 * var(--ui-density))) * var(--u) * min(1, 100 * var(--ui-radius-scale)))`;
  return {
    '--cp': `calc(var(--ui-pad-${k}) * (0.5 + 0.5 * var(--ui-density)))`,
    '--cg': `calc(var(--ui-gap-${k}) * (0.5 + 0.5 * var(--ui-density)))`,
    // The magnitude t (the radius attribute, else the theme's radius-<family>) on the concentric radius.
    '--cr': f ? `calc(var(--ui-radius, var(--ui-radius-${f})) * ${r0})` : r0,
  };
};

/** Padding inside the border, gap (the gap attribute wins) and radius. */
const box = {
  padding: 'max(0px, calc(var(--cp) * var(--u) - var(--b)))',
  gap: 'calc(var(--ui-gap, var(--cg)) * var(--u))',
  borderWidth: 'var(--b)',
  borderColor: 'transparent',
  borderRadius: 'var(--cr)',
};
const column = { display: 'flex', flexDirection: 'column' };

const container = (k: Layout, description: string, root: Record<string, any>) => defineSlotRecipe({
  className: `ui-${k}`,
  description,
  slots: ['root'],
  base: { root: mergeStyles(box, level(k), root) },
});

export const group = container('group', 'Closely related controls (ui-group, React Group).', { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center' });
export const collection = container('collection', 'A list or set of like items (ui-collection, React Collection).', column);
export const panel = container('panel', 'A side or tool panel (ui-panel, React Panel).', { ...column, bg: 'elevation.panel' }); // elevation level 1
export const region = container('region', 'A major area of a page (ui-region, React Region).', column);
export const page = container('page', 'A whole page (ui-page, React Page).', { ...column, width: '100%', maxWidth: `${PAGE_MAX_WIDTH_REM}rem`, marginInline: 'auto' });

export const card = defineSlotRecipe({
  className: 'ui-card',
  description: 'A self-contained surface, padding xs … xl (ui-card, React Card).',
  slots: ['root'],
  base: {
    root: mergeStyles(box, column, {
      // The edge stays transparent like every level's (the fill carries the level); before this
      // recipe a card's `border` color was declared but always lost to the shared transparent rule.
      // Elevation level 2 (card), lifted to 3 (raised) when the theme's card-raised is 1.
      bg: 'elevation.card', boxShadow: 'card',
      // A card nested in a card takes the base fill (either renderer).
      ':is(ui-card, .ui-card__root) &': { bg: 'bg' },
    }),
  },
  variants: {
    padding: Object.fromEntries(CARD_PADDINGS.map((p) => [p, { root: level(`card-${p}`) }])),
  },
  defaultVariants: { padding: 'md' },
});

// ── ui-container: one element for every level (docs/planning/universal-container.md) ──
// preset picks the starting geometry, flow and surface (group, collection, card, panel, region,
// page); padding (xs … xl) the card ladder level; layout and surface override the preset's. The
// nesting chain below sets radius, padding and gap from the parent.
const ROW = { display: 'inline-flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' };
const SURFACES = {
  none: { bg: 'transparent', boxShadow: 'none' },
  panel: { bg: 'elevation.panel', boxShadow: 'none' },
  card: { bg: 'elevation.card', boxShadow: 'card' },
  raised: { bg: 'elevation.card', boxShadow: 'raised' },
};
export const uiContainer = defineSlotRecipe({
  className: 'ui-container',
  description: 'One container for every level, group to page, nesting concentrically (ui-container, React Container).',
  slots: ['root'],
  base: { root: mergeStyles(box, column, { ':is(ui-card, .ui-card__root, [surface=card], [preset=card]) &[surface=card]': { bg: 'bg' } }) },
  variants: {
    preset: {
      group: { root: mergeStyles(level('group'), ROW) },
      collection: { root: mergeStyles(level('collection'), column) },
      card: { root: mergeStyles(level('card-md'), column, SURFACES.card, { ':is(ui-card, .ui-card__root, [preset=card]) &': { bg: 'bg' } }) },
      panel: { root: mergeStyles(level('panel'), column, SURFACES.panel) },
      region: { root: mergeStyles(level('region'), column) },
      page: { root: mergeStyles(level('page'), column, { width: '100%', maxWidth: `${PAGE_MAX_WIDTH_REM}rem`, marginInline: 'auto' }) },
    },
    padding: Object.fromEntries(CARD_PADDINGS.map((p) => [p, { root: level(`card-${p}`) }])),
    layout: { stack: { root: column }, row: { root: { ...ROW, flexWrap: 'nowrap' } }, wrap: { root: ROW } },
    surface: Object.fromEntries(Object.entries(SURFACES).map(([k, v]) => [k, { root: v }])),
  },
  defaultVariants: { preset: 'collection' },
});
export { uiContainer as 'container' };

/**
 * The nesting chain. Each depth n has its own variables (--uc-r<n>, --uc-p<n>), so a container reads
 * its parent's radius and padding without a cycle; depth is counted over chain containers (areas,
 * which are square, restart it). Depth 1 keeps the preset geometry (--cr, the ladder padding); a
 * nested container is concentric with its parent, R = max(0, R_parent − p_parent). Padding: the
 * root's levels split evenly (--uc-step: (R − r_control) / levels); else a container holding
 * containers keeps the ratio (R − max(r_control, R × k), k = the theme's container-ratio); a nested
 * leaf fits its controls (R − r_control). Derived padding is also the gap unless [gap] is set.
 * resolveContainerTree is the same rule in numbers.
 */
export const CHAIN_DEPTH = 6;
// Chain containers: ui-container (the React Container sets the same preset attribute) and the old
// wrapper and card tags; areas are left out. A rule for depth n matches exactly depth n (n chain
// ancestors-or-self, not n + 1), so a nested container never redeclares its parent's variables.
const C = ':is(ui-container, [data-ui=container], ui-group, ui-collection, ui-card, [data-ui=group], [data-ui=collection], [data-ui=card]):not([preset=panel], [preset=region], [preset=page])';
const chain = (n: number) => Array.from({ length: n }, () => C).join(' ');
const depthSel = (n: number) => `${chain(n)}:not(${chain(n + 1)})`;
const ratio = (r: string) => `max(${CONTROL_RADIUS}, calc(${r} * var(--ui-container-ratio)))`;
export const containerChain = Object.fromEntries(Array.from({ length: CHAIN_DEPTH }, (_, i) => i + 1).flatMap((n) => {
  const r = `var(--uc-r${n})`, p = `var(--uc-p${n})`;
  const leaf = n === 1 ? 'calc(var(--cp) * var(--u))' : `max(0px, calc(${r} - ${CONTROL_RADIUS}))`;
  return [
    [depthSel(n), {
      [`--uc-r${n}`]: n === 1 ? 'var(--cr)' : `max(0px, calc(var(--uc-r${n - 1}) - var(--uc-p${n - 1})))`,
      [`--uc-p${n}`]: `var(--uc-step, ${leaf})`,
      // The root's levels (D): every level below takes the same step; a root without levels clears it.
      ...(n === 1 ? { '--uc-step': 'initial' } : {}),
      borderRadius: r, padding: `max(0px, calc(${p} - var(--b)))`,
      ...(n > 1 ? { '&:not([gap])': { gap: p } } : {}),
    }],
    // A container holding containers keeps the ratio for them (C), unless levels set the step.
    [`${depthSel(n)}:has(${C})`, { [`--uc-p${n}`]: `var(--uc-step, calc(${r} - ${ratio(r)}))`, '&:not([gap])': { gap: p } }],
    ...(n === 1 ? Array.from({ length: CHAIN_DEPTH }, (_, j) => j + 1).map((L) => [`${depthSel(1)}[levels="${L}"]`, { '--uc-step': `max(0px, calc((var(--uc-r1) - ${CONTROL_RADIUS}) / ${L}))`, '&:not([gap])': { gap: 'var(--uc-p1)' } }]) : []),
  ];
}));

/** The CSS-only tags' rules: the same recipes, keyed on ui-<level> (card variants on [padding=…]), ui-container, and the nesting chain. */
export const containerTags = mergeStyles(
  ...[group, collection, card, panel, region, page, uiContainer].map((r) => tagRules(r.className!, r)),
  containerChain,
);

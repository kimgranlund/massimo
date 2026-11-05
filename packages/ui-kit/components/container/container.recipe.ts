// The layout container: <ui-container preset="…"> and the React Container (tokens/geometry/resolve.ts
// CONTAINERS). Padding and gap come from the theme parameters --ui-pad-<level> / --ui-gap-<level>
// (the gap attribute wins on its own element). Radius: wrappers (group, collection) are concentric
// with the controls they hold, R0 = min(3u·s, 4u) + p·u (square at s = 0); a card is never rounder
// than it is deep, R0 = p·u × min(1, s). Both scale by a magnitude t (0 … 1: the radius attribute,
// else the theme's radius-group / radius-collection / radius-card): R = t × R0; areas (panel, region,
// page) are square. Fills alternate by depth so each
// level reads without borders: panel 3, card 2, a card nested in a card 1.
//
// ui-container is a CSS-only tag (no script), so nothing puts the recipe classes on it. The recipe
// object is therefore also emitted as global rules (`containerTags`, through `tagRules`) on
// `:is(ui-container, [data-ui=container])`: the base and default variants on it, every other variant
// on [attr=value]. The React Container renders <div data-ui="container"> with the same attributes,
// so both get the same rules and the nesting chain in one layer. (The level tags ui-group … ui-page
// were removed: docs/decisions/0016-remove-container-level-tags.md.)
import { defineSlotRecipe } from '@pandacss/dev';
import { CARD_PADDINGS, CONTAINER_DEPTH, CONTAINERS, NESTED_CARD_FLOOR, PAGE_MAX_WIDTH_REM, radiusFamily, type ContainerLevel } from '../../tokens/geometry/resolve.ts';
import { CONTROL_RADIUS, FIELD_TEXT_EDGE, ROW_BLOCK, mergeStyles, tagRules } from '../recipe-parts.ts';

type Layout = Exclude<ContainerLevel, 'composite'>;

/** A level's padding, gap and radius inputs, read by `box`. */
const level = (k: Layout) => {
  const family = CONTAINERS[k].family, f = radiusFamily(k);
  const r0 = family === 'area' ? '0px'
      // A card is never rounder than it is deep.
      : family === 'container' ? `calc(var(--ui-pad-${k}) * (0.5 + 0.5 * var(--ui-density)) * var(--u) * min(1, var(--ui-radius-scale)))`
      // A wrapper hugs its controls: the control radius + the padding; square at s = 0.
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
  description: 'One container for every level, group to page: padding steps down with depth and radius follows (ui-container, React Container).',
  slots: ['root'],
  base: { root: mergeStyles(box, column, { ':is([surface=card], [preset=card]) &[surface=card]': { bg: 'bg' } }) },
  variants: {
    preset: {
      group: { root: mergeStyles(level('group'), ROW) },
      collection: { root: mergeStyles(level('collection'), column) },
      // A card nested in a card takes the base fill.
      card: { root: mergeStyles(level('card-md'), column, SURFACES.card, { '[preset=card] &': { bg: 'bg' } }) },
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
 * which are square, restart it). Depth 1 keeps the preset geometry (--cr, the ladder padding). Padding
 * is the input and radius follows: a nested container is concentric when its parent has room,
 * R = max(R_parent − p_parent, R_parent × k; k is the theme's container-ratio); a nested card steps down the ladder, max(min(3u, p_parent), p_parent − 1u) ×
 * density, with that as its gap; a `padding` attribute or a painted wrapper takes its ladder padding
 * and gap. An unpainted wrapper has no padding or border and passes its parent's variables through,
 * so its contents share an edge with what sits beside it. resolveContainerTree is the same rule in
 * numbers.
 */
export const CHAIN_DEPTH = CONTAINER_DEPTH;
// Chain containers: ui-container and the React Container (data-ui=container); areas are left out. A rule for depth n matches exactly depth n (n chain
// ancestors-or-self, not n + 1), so a nested container never redeclares its parent's variables.
const C = ':is(ui-container, [data-ui=container]):not([preset=panel], [preset=region], [preset=page])';
// Areas (square): the panel, region and page presets.
const AREA = ':is(ui-container, [data-ui=container]):is([preset=panel], [preset=region], [preset=page])';
const chain = (n: number) => Array.from({ length: n }, () => C).join(' ');
// Exactly depth n; the deepest rule also takes every deeper container, which then repeats its parent's radius.
const depthSel = (n: number) => n === CHAIN_DEPTH ? chain(n) : `${chain(n)}:not(${chain(n + 1)})`;
const WRAPPER = ':is([preset=group], [preset=collection], :not([preset]))';
// A wrapper that paints nothing (isUnpaintedWrapper): no surface, padding or divided attribute.
const UNPAINTED = `${WRAPPER}:not([padding], [divided]):not([surface]:not([surface=none]))`;
const STEP = 'calc((0.5 + 0.5 * var(--ui-density)) * var(--u))';
const steppedDown = (p: string) => `max(min(calc(${NESTED_CARD_FLOOR} * ${STEP}), ${p}), calc(${p} - ${STEP}))`;
// An area inside the chain restarts it: the area sets --uc-a<n>: 1 for every depth, so the first chain
// container below it (at any depth n) reads --uc-a<n−1> = 1 and takes its own preset geometry, as a
// root; each chain container sets its own --uc-a<n>: 0 for the containers under it.
const fresh = (n: number) => `var(--uc-a${n - 1}, 0)`;
const mixFresh = (n: number, asRoot: string, nested: string) => `calc(${fresh(n)} * ${asRoot} + (1 - ${fresh(n)}) * ${nested})`;

export const containerChain = Object.fromEntries([
  [AREA, Object.fromEntries(Array.from({ length: CHAIN_DEPTH }, (_, i) => [`--uc-a${i}`, '1']))],
  ...Array.from({ length: CHAIN_DEPTH }, (_, i) => i + 1).flatMap((n) => {
    const r = `var(--uc-r${n})`, p = `var(--uc-p${n})`, pr = `var(--uc-r${n - 1})`, pp = `var(--uc-p${n - 1})`;
    const ladder = 'calc(var(--cp) * var(--u))', ladderGap = 'calc(var(--cg) * var(--u))';
    const nested = (asRoot: string, inChain: string) => n === 1 ? asRoot : mixFresh(n, asRoot, inChain);
    return [
      [depthSel(n), {
        [`--uc-r${n}`]: nested('var(--cr)', `max(calc(${pr} - ${pp}), calc(${pr} * var(--ui-container-ratio)))`),
        [`--uc-p${n}`]: nested(ladder, steppedDown(pp)),
        [`--uc-a${n}`]: '0',
        borderRadius: r, padding: `max(0px, calc(${p} - var(--b)))`,
        ...(n > 1 ? { '&:not([gap])': { gap: nested(ladderGap, p) } } : {}),
      }],
      // A padding attribute or a painted wrapper: its ladder padding and gap at any depth.
      [`${depthSel(n)}:is([padding], ${WRAPPER})`, { [`--uc-p${n}`]: ladder, '&:not([gap])': { gap: `calc(var(--ui-gap, var(--cg)) * var(--u))` } }],
      // Unpainted: no inset of its own, and the parent's geometry passes through (a root passes the restart flag).
      [`${depthSel(n)}${UNPAINTED}`, {
        [`--uc-r${n}`]: nested('var(--cr)', pr), [`--uc-p${n}`]: nested('0px', pp),
        [`--uc-a${n}`]: n === 1 ? '1' : fresh(n),
        padding: 0, borderWidth: 0,
      }],
      // Divided: full-bleed rows carry the inset, so the box has none.
      [`${depthSel(n)}[divided]`, { [`--uc-p${n}`]: '0px', padding: 0, gap: 0, '&:not([gap])': { gap: 0 } }],
    ];
  }),
]);

// Composed rows (ui-row, row.recipe.ts) read their inset from the container that holds them, so any
// wrapper can sit in between. A card and a painted wrapper put rows on the text edge; areas and
// thumbnail cards (padding xs) on the padding edge; an unpainted wrapper declares nothing, so it passes
// its parent's edge through. Row block padding is the divided list's alone, so a container resets it.
const CONTAINER = ':is(ui-container, [data-ui=container])';
const rowContext = {
  [CONTAINER]: { '--ui-row-block': '0px' },
  [`${CONTAINER}:is([preset=panel], [preset=region], [preset=page], [preset=card][padding=xs])`]: { '--ui-row-edge': '0px' },
  [`${CONTAINER}:is([preset=card]:not([padding=xs]), [divided], ${WRAPPER}:is([padding], [surface]:not([surface=none])))`]: { '--ui-row-edge': FIELD_TEXT_EDGE },
};

// A divided container: an outlined box of full-bleed rows with lines between them. Every child is a
// row on the text edge (resolveDividedRow), a ui-row or not.
const DIVIDED = ':is(ui-container, [data-ui=container])[divided]';
const dividedRows = {
  [DIVIDED]: { overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--colors-border)', '--ui-row-block': ROW_BLOCK },
  [`${DIVIDED} > *`]: { paddingBlock: ROW_BLOCK, paddingInline: FIELD_TEXT_EDGE },
  [`${DIVIDED} > * + *`]: { borderBlockStart: '1px solid var(--colors-border)' },
};

/** The CSS-only tag's rules: the recipe keyed on ui-container and [data-ui=container], then the nesting chain. */
// An area keeps its own level when it is given a padding (areas are square; padding is the card ladder).
const areaPadding = Object.fromEntries((['panel', 'region', 'page'] as const).map((a) => [`:is(ui-container, [data-ui=container])[preset=${a}][padding]`, level(a)]));

export const containerTags = mergeStyles(
  // ui-container and the React Container (<div data-ui="container">) share these rules, so both take
  // part in the nesting chain in the same layer (a recipe class would sit in a later layer and win).
  tagRules(':is(ui-container, [data-ui=container])', uiContainer),
  areaPadding,
  containerChain,
  rowContext,
  dividedRows,
);

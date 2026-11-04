// The layout container: <ui-container preset="…"> and the React Container (tokens/geometry/resolve.ts
// CONTAINERS). Padding and gap come from the theme parameters --ui-pad-<level> / --ui-gap-<level>
// (the gap attribute wins on its own element). Radius: wrappers (group, collection) and cards are
// concentric with the controls they hold, R0 = min(3u·s, 4u) + p·u (square at s = 0), scaled by a
// magnitude t (0 … 1: the radius attribute, else the theme's radius-group / radius-collection /
// radius-card): R = t × R0; areas (panel, region, page) are square. Fills alternate by depth so each
// level reads without borders: panel 3, card 2, a card nested in a card 1.
//
// ui-container is a CSS-only tag (no script), so nothing puts the recipe classes on it. The recipe
// object is therefore also emitted as global rules (`containerTags`, through `tagRules`) on
// `:is(ui-container, [data-ui=container])`: the base and default variants on it, every other variant
// on [attr=value]. The React Container renders <div data-ui="container"> with the same attributes,
// so both get the same rules and the nesting chain in one layer. (The level tags ui-group … ui-page
// were removed: docs/decisions/0016-remove-container-level-tags.md.)
import { defineSlotRecipe } from '@pandacss/dev';
import { CARD_PADDINGS, CONTAINER_DEPTH, CONTAINERS, PAGE_MAX_WIDTH_REM, radiusFamily, type ContainerLevel } from '../../tokens/geometry/resolve.ts';
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
 * which are square, restart it). Depth 1 keeps the preset geometry (--cr, the ladder padding); a
 * nested container is concentric with its parent, R = max(0, R_parent − p_parent). Padding: the
 * root's levels split evenly (--uc-step: (R − r_control) / levels); else a container holding
 * containers keeps the ratio (R − max(r_control, R × k), k = the theme's container-ratio); a nested
 * leaf fits its controls (R − r_control); a derived padding is never below 1u. Derived padding is
 * also the gap unless [gap] is set. An area inside the chain restarts it. resolveContainerTree is the
 * same rule in numbers.
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
const ratio = (r: string) => `max(${CONTROL_RADIUS}, calc(${r} * var(--ui-container-ratio)))`;
/** The smallest derived padding (1u): a deep or tight tree never collapses to nothing, or below zero. */
const FLOOR = 'var(--u)';
// An area inside the chain restarts it: the area sets --uc-a<n>: 1 for every depth, so the first chain
// container below it (at any depth n) reads --uc-a<n−1> = 1 and takes its own preset geometry, as a
// root; each chain container sets its own --uc-a<n>: 0 for the containers under it. An area also
// clears a root's levels step.
const fresh = (n: number) => `var(--uc-a${n - 1}, 0)`;
const mixFresh = (n: number, asRoot: string, nested: string) => `calc(${fresh(n)} * ${asRoot} + (1 - ${fresh(n)}) * ${nested})`;

export const containerChain = Object.fromEntries([
  [AREA, { ...Object.fromEntries(Array.from({ length: CHAIN_DEPTH }, (_, i) => [`--uc-a${i}`, '1'])), '--uc-step': 'initial' }],
  // A root without levels clears an outer step; zero specificity, so a levels rule below wins.
  [`:where(${depthSel(1)})`, { '--uc-step': 'initial' }],
  // levels on a container at any depth (a root, or one restarted under an area): the padding splits
  // evenly from it down, from its own radius (--uc-r).
  ...Array.from({ length: CHAIN_DEPTH }, (_, j) => j + 1).map((L) => [`${C}[levels="${L}"]`, { '--uc-step': `max(0px, calc((var(--uc-r) - ${CONTROL_RADIUS}) / ${L}))`, '&:not([gap])': { gap: 'var(--uc-step)' } }]),
  ...Array.from({ length: CHAIN_DEPTH }, (_, i) => i + 1).flatMap((n) => {
    const r = `var(--uc-r${n})`, p = `var(--uc-p${n})`;
    const ladder = 'calc(var(--cp) * var(--u))';
    const leaf = n === 1 ? ladder : mixFresh(n, ladder, `max(${FLOOR}, calc(${r} - ${CONTROL_RADIUS}))`);
    return [
      [depthSel(n), {
        [`--uc-r${n}`]: n === 1 ? 'var(--cr)' : mixFresh(n, 'var(--cr)', `max(0px, calc(var(--uc-r${n - 1}) - var(--uc-p${n - 1})))`),
        [`--uc-p${n}`]: `var(--uc-step, ${leaf})`,
        [`--uc-a${n}`]: '0',
        // Its own radius under one name, for the levels rules below (one per value, any depth).
        '--uc-r': r,
        borderRadius: r, padding: `max(0px, calc(${p} - var(--b)))`,
        ...(n > 1 ? { '&:not([gap])': { gap: p } } : {}),
      }],
      // A container holding containers keeps the ratio for them (C), unless levels set the step.
      [`${depthSel(n)}:has(${C})`, { [`--uc-p${n}`]: `var(--uc-step, max(${FLOOR}, calc(${r} - ${ratio(r)})))`, '&:not([gap])': { gap: p } }],
    ];
  }),
]);

/** The CSS-only tag's rules: the recipe keyed on ui-container and [data-ui=container], then the nesting chain. */
// An area keeps its own level when it is given a padding (areas are square; padding is the card ladder).
const areaPadding = Object.fromEntries((['panel', 'region', 'page'] as const).map((a) => [`:is(ui-container, [data-ui=container])[preset=${a}][padding]`, level(a)]));

export const containerTags = mergeStyles(
  // ui-container and the React Container (<div data-ui="container">) share these rules, so both take
  // part in the nesting chain in the same layer (a recipe class would sit in a later layer and win).
  tagRules(':is(ui-container, [data-ui=container])', uiContainer),
  areaPadding,
  containerChain,
);

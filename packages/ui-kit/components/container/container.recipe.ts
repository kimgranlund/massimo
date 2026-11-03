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
      : `calc(${CONTROL_RADIUS} + var(--ui-pad-${k}) * var(--u) * min(1, 100 * var(--ui-radius-scale)))`;
  return {
    '--cp': `var(--ui-pad-${k})`,
    '--cg': `var(--ui-gap-${k})`,
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

/** The CSS-only tags' rules: the same recipes, keyed on ui-<level> (card variants on [padding=…]). */
export const containerTags = mergeStyles(
  ...[group, collection, card, panel, region, page].map((r) => tagRules(r.className!, r)),
);

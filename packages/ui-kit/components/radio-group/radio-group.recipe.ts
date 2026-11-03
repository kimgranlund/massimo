// Slot recipe for <ui-radio-group> / React RadioGroup (and, through choiceGroup, the checkbox
// group): a column of 6u choice rows 1u apart (pitch 7u), or a wrapping row with 4u between
// choices and 1u between lines (resolveChoiceGroup). The gap attribute (--ui-gap, in u) replaces
// the gap along the direction. The group draws nothing of its own: no fill, border or radius, so
// each choice keeps its focus ring and the group adds only spacing. Disabled fades the choices
// themselves (they read the group's disabled), so the group adds no second fade.
import { defineSlotRecipe } from '@pandacss/dev';
import { CONTROL_RADIUS, FORCED, FORCED_EDGE, FORCED_ON, PAINT, t } from '../recipe-parts.ts';

/** g·u from the gap attribute, else `fallback` u (the --ui-unit form of a spacing token). */
const gapU = (fallback: number) => `calc(var(--ui-gap, ${fallback}) * var(--ui-unit) * 1px)`;

const DF = '(0.5 + 0.5 * var(--ui-density))';
const CHOICE = '& > :is(ui-radio, ui-checkbox, [data-ui=radio], [data-ui=checkbox])';

/**
 * variant="card" (resolveChoiceCard): each radio or checkbox is a card surface holding any content,
 * for plan pickers and other rich choices. The card-md level: padding 4u − B (× density), the
 * concentric card radius (the control radius + padding, × the theme's radius-card), the card fill
 * with a 1px border-role stroke; checked: the primary-subtle fill and a 2px primary stroke (inset
 * shadows, so the stroke costs no space). Cards sit the collection gap apart; the indicator keeps its
 * slot at the top of the leading edge and the contents stack (1u apart).
 */
const CARD = {
  alignItems: 'stretch',
  rowGap: `calc(var(--ui-gap, calc(var(--ui-gap-collection) * ${DF})) * var(--ui-unit) * 1px)`,
  columnGap: `calc(var(--ui-gap, calc(var(--ui-gap-collection) * ${DF})) * var(--ui-unit) * 1px)`,
  [CHOICE]: {
    '--cc-p': `calc(var(--ui-pad-card-md) * ${DF} * var(--u))`,
    display: 'flex', alignItems: 'flex-start', boxSizing: 'border-box', minHeight: '0',
    padding: 'max(0px, calc(var(--cc-p) - var(--b)))',
    borderRadius: `calc((${CONTROL_RADIUS} + var(--cc-p) * min(1, 100 * var(--ui-radius-scale))) * var(--ui-radius-card))`,
    bg: 'elevation.card', borderWidth: 'var(--b)', borderColor: 'transparent', boxShadow: 'inset 0 0 0 1px {colors.border}',
    transition: t('feedback', ...PAINT, 'box-shadow'),
    '&:not([data-disabled]):hover': { boxShadow: 'inset 0 0 0 1px {colors.border.strong}' },
    '&[data-checked]': { bg: 'primary.subtle', boxShadow: 'inset 0 0 0 2px {colors.primary.solid}', [FORCED]: FORCED_ON },
    '& > [data-part=leading]': { alignSelf: 'flex-start' },
    '& > [data-part=contents]': { display: 'flex', flexDirection: 'column', gap: 'var(--u)', flex: '1', minWidth: '0', paddingBlock: '0', lineHeight: 'var(--leading)' },
    [FORCED]: FORCED_EDGE,
  },
};

/** The shared choice-group recipe: root only, orientation vertical | horizontal, variant list | card. */
export const choiceGroup = (name: string, description: string) => defineSlotRecipe({
  className: `ui-${name}`,
  description,
  slots: ['root'],
  base: {
    root: { display: 'flex', minWidth: '0' },
  },
  variants: {
    orientation: {
      vertical: { root: { flexDirection: 'column', alignItems: 'flex-start', rowGap: gapU(1) } },
      horizontal: { root: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: gapU(4), rowGap: '1' } },
    },
    variant: { list: { root: {} }, card: { root: CARD } },
  },
  compoundVariants: [
    // A row of cards (pricing plans): equal widths, at least 48u, wrapping.
    { orientation: 'horizontal', variant: 'card', css: { root: { alignItems: 'stretch', [CHOICE]: { flex: '1 1 calc(48 * var(--u))', minWidth: '0' } } } },
    { orientation: 'vertical', variant: 'card', css: { root: { alignItems: 'stretch', [CHOICE]: { width: '100%' } } } },
  ],
  defaultVariants: { orientation: 'vertical', variant: 'list' },
});

export const radioGroup = choiceGroup('radio-group', 'Radio group (ui-radio-group, React RadioGroup): its radios in a column or a wrapping row.');

// The manifest names each node's recipe by its id (component:radio-group).
export { radioGroup as 'radio-group' };

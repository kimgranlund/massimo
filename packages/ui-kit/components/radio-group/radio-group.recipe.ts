// Slot recipe for <ui-radio-group> / React RadioGroup (and, through choiceGroup, the checkbox
// group): a column of 6u choice rows 1u apart (pitch 7u), or a wrapping row with 4u between
// choices and 1u between lines (resolveChoiceGroup). The gap attribute (--ui-gap, in u) replaces
// the gap along the direction. The group draws nothing of its own: no fill, border or radius, so
// each choice keeps its focus ring and the group adds only spacing. Disabled fades the choices
// themselves (they read the group's disabled), so the group adds no second fade.
import { defineSlotRecipe } from '@pandacss/dev';

/** g·u from the gap attribute, else `fallback` u (the --ui-unit form of a spacing token). */
const gapU = (fallback: number) => `calc(var(--ui-gap, ${fallback}) * var(--ui-unit) * 1px)`;

/** The shared choice-group recipe: root only, orientation vertical | horizontal. */
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
  },
  defaultVariants: { orientation: 'vertical' },
});

export const radioGroup = choiceGroup('radio-group', 'Radio group (ui-radio-group, React RadioGroup): its radios in a column or a wrapping row.');

// The manifest names each node's recipe by its id (component:radio-group).
export { radioGroup as 'radio-group' };

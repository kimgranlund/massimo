// Slot recipe for <ui-menubar> and the React Menubar (Base UI Menubar; resolveMenubar): the bar is a
// composite row on the control fill (recipe-parts `composite`, one row 8u, the radius capped at half
// the height like ui-segmented); its menus' triggers become composite options (7u, the option radius,
// transparent until hovered, highlighted while their menu is open), with the focus ring drawn inside
// them so it stays within the bar. A vertical bar stacks them (uncapped radius) and its menus open
// beside it (ui-menu placement submenu).
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, composite, compositeOption, mergeStyles, t } from '../recipe-parts.ts';

const TRIGGER = '& > :is(ui-menu, [data-ui=menu]) > [data-part=trigger]';
const ENABLED = '&:not([data-disabled])';

export const menubar = defineSlotRecipe({
  className: 'ui-menubar',
  description: 'A bar of menus (ui-menubar, React Menubar): roving focus across the triggers, open on hover once one is open.',
  slots: ['root'],
  base: {
    root: mergeStyles(composite, {
      display: 'inline-flex', alignItems: 'center', fontFamily: UI_FONT, bg: 'bg.control', borderColor: 'transparent',
      // One row: the radius is capped at half the height (8u), like ui-segmented.
      '--cr': 'min(calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale)), calc((var(--ch) + 2 * var(--d)) / 2))',
      [TRIGGER]: mergeStyles(compositeOption, {
        height: 'auto', bg: 'transparent', justifyContent: 'flex-start', transition: t('feedback', ...PAINT),
        [`${ENABLED}:hover`]: { bg: 'bg.control' },
        [`${ENABLED}:active`]: { bg: 'bg.controlHover' },
        '&[data-popup-open]': { bg: 'bg.controlHover' },
        '&:focus-visible': { outlineOffset: 'calc(-1 * {borderWidths.thick})' },
        [FORCED]: { '&[data-popup-open]': FORCED_ON },
      }),
      [FORCED]: FORCED_EDGE,
    }),
  },
  variants: {
    orientation: {
      horizontal: {},
      vertical: {
        root: {
          flexDirection: 'column', alignItems: 'stretch',
          '--cr': 'calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale))',
          '& > :is(ui-menu, [data-ui=menu])': { display: 'flex', flexDirection: 'column' },
        },
      },
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

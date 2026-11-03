// Slot recipe for <ui-navigation-menu> and the React NavigationMenu (Base UI Navigation Menu:
// Root, List, Item, Trigger, Icon, Content, Link, Positioner, Popup, Viewport). Geometry
// (resolveNavigationMenu): the list is a composite row (8u, edge 0.5u, no fill) of triggers and
// links that are composite options (7u, the construction pattern, the trigger's caret at icon size
// sm in its trailing slot, turned while open); the popup is a composite container (edge 0.5u,
// the control radius) 1u below the open trigger whose content's links are composite options too.
// The popup's size follows the open content (--popup-width / --popup-height set by script) on the
// reveal intent, and new content slides in from the side it came from (data-activation-direction).
// The shared popup pieces (components/popover/popup-parts.ts) place it and run the reveal motion.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED, FORCED, FORCED_EDGE, PAINT, UI_FONT, composite, compositeOption, constructionPattern, mergeStyles, t } from '../recipe-parts.ts';
import { popupPositioner, popupSurface } from '../popover/popup-parts.ts';

const PATTERN = constructionPattern({
  slot: 'var(--u)', bare: 'calc(2 * var(--u))',
  text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)' },
});

/** A trigger or link: a composite option (7u) in the construction pattern. */
const row = mergeStyles(compositeOption, PATTERN, {
  display: 'flex', alignItems: 'center', boxSizing: 'border-box', margin: 0,
  bg: 'transparent', color: 'fg', fontFamily: UI_FONT, fontWeight: 'medium', lineHeight: 'var(--line)', textDecoration: 'none',
  cursor: 'pointer', userSelect: 'none', borderStyle: 'solid',
  transition: t('feedback', ...PAINT),
  '&:hover, &[data-popup-open]': { bg: 'bg.control' },
  '&:active': { bg: 'bg.controlHover' },
  '&[data-active]': { color: 'primary.fg' },
  '&[data-disabled]': { opacity: 0.5, cursor: 'not-allowed' },
  [FORCED]: { '&:focus-visible': FORCED_EDGE },
});

// The composite variables without the box (the popup's own padding and radius come from it too).
const compositeVars = Object.fromEntries(Object.entries(composite).filter(([k]) => k.startsWith('--')));

export const navigationMenu = defineSlotRecipe({
  className: 'ui-navigation-menu',
  description: 'Site navigation whose items open panels of links (ui-navigation-menu, React NavigationMenu).',
  slots: ['root', 'list', 'item', 'trigger', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'content', 'link', 'positioner', 'popup', 'viewport'],
  base: {
    root: { display: 'block', fontFamily: UI_FONT },
    // One row: the radius is capped at half the 8u height, like a segmented control.
    list: mergeStyles(composite, {
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', listStyle: 'none', margin: 0, borderColor: 'transparent', bg: 'transparent',
      '&[data-orientation=vertical]': { flexDirection: 'column', alignItems: 'stretch' },
    }),
    item: { display: 'flex', margin: 0, padding: 0 },
    trigger: mergeStyles(row, {
      '& > [data-part=trailing]': { color: 'fg.muted' },
      '& > [data-part=trailing] > i': { transition: t('toggle', 'rotate') },
      '&[data-popup-open] > [data-part=trailing] > i': { rotate: '180deg' },
      // A submenu's trigger points at the side its content opens to (caret-right, mirrored in RTL), not turned.
      '[data-nested] > [data-part=list] > [data-part=item] > &[data-popup-open] > [data-part=trailing] > i': { rotate: 'none' },
      '[data-nested] > [data-part=list] > [data-part=item] > &:dir(rtl) > [data-part=trailing] > i': { scale: '-1 1' },
      // The open trigger is the popup's anchor.
      [ANCHORED]: { '&[data-popup-open]': { anchorName: 'var(--ui-anchor)' } },
    }),
    link: row,
    positioner: mergeStyles(popupPositioner(120), { minWidth: 0 }),
    popup: mergeStyles(popupSurface, compositeVars, {
      padding: 'calc(var(--d) - var(--b))', borderRadius: 'var(--cr)', fontFamily: UI_FONT,
      width: 'var(--popup-width, auto)', height: 'var(--popup-height, auto)', overflow: 'hidden',
      transition: t('reveal', 'opacity', 'scale', 'width', 'height'),
    }),
    viewport: { position: 'relative', width: '100%', height: '100%', overflow: 'clip' },
    content: {
      display: 'flex', flexDirection: 'column', width: 'max-content', maxWidth: 'calc(120 * var(--u) - 2 * var(--d))',
      gap: 'calc(var(--ui-gap, calc(var(--ui-gap-composite) * (0.5 + 0.5 * var(--ui-density)))) * var(--u))',
      '&[hidden]': { display: 'none' },
      transition: t('reveal', 'opacity', 'translate'),
      '&[data-open][data-activation-direction]': { '@starting-style': { opacity: 0 } },
      '&[data-activation-direction=right]': { '@starting-style': { translate: 'calc(2 * var(--u)) 0' } },
      '&[data-activation-direction=left]': { '@starting-style': { translate: 'calc(-2 * var(--u)) 0' } },
      '&[data-activation-direction=down]': { '@starting-style': { translate: '0 calc(2 * var(--u))' } },
      '&[data-activation-direction=up]': { '@starting-style': { translate: '0 calc(-2 * var(--u))' } },
    },
  },
});
export { navigationMenu as 'navigation-menu' };

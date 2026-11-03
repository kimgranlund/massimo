// Slot recipe for <ui-menu> and the React Menu (Base UI Menu: Root, Trigger, Positioner, Popup, Item,
// CheckboxItem, RadioGroup, RadioItem, indicators, Group, GroupLabel, Separator, SubmenuRoot,
// SubmenuTrigger), shared by the context menu and the menubar (resolveMenu):
// - trigger: a neutral control row (the button look), pressed while open (data-popup-open);
// - popup: a floating composite (recipe-parts floatingPopup + composite), 1u from its anchor;
//   placement variant anchor (below the trigger), submenu (beside its submenu trigger) or point (a
//   context menu at the pointer: script placement only, no anchor);
// - items (item, checkbox-item, radio-item, submenu-trigger; every kind also takes the item class):
//   composite options (7u) in the construction pattern, the neutral control fill while highlighted
//   (data-highlighted follows focus), checkable items with a 6u leading indicator slot;
// - separator: the separator rule with 0.5u above and below; group and radio group: columns with
//   the popup's gap; group label: muted text on the item inset.
import { defineSlotRecipe } from '@pandacss/dev';
import {
  ANCHORED, FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, anchoredPopup, composite, compositeOption, constructionPattern,
  floatingOpen, floatingPopup, mergeStyles, sideOrigins, t,
} from '../recipe-parts.ts';

/** One anchor name, scoped per menu host (anchorScope), so every popup finds its own trigger. */
export const MENU_ANCHOR = '--ui-menu-trigger';
const PATTERN = constructionPattern({
  slot: 'var(--u)', bare: 'calc(2 * var(--u))',
  text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)', whiteSpace: 'nowrap' },
});
const OPEN = '&[data-popup-open]';
const ENABLED = '&:not([data-disabled])';

const popupBase = mergeStyles(floatingPopup, composite, {
  ...sideOrigins,
  outline: 'none',
  '&:popover-open': { display: 'flex', ...floatingOpen },
});

export const menu = defineSlotRecipe({
  className: 'ui-menu',
  description: 'Menu of actions and options from a trigger (ui-menu, React Menu); submenus, checkbox and radio items.',
  slots: ['root', 'trigger', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'popup', 'item', 'checkbox-item', 'radio-item', 'indicator', 'submenu-trigger', 'group', 'group-label', 'radio-group', 'separator'],
  base: {
    root: {
      display: 'inline-flex', fontFamily: UI_FONT,
      // A submenu (a menu inside a popup) is a row of its parent's column: its trigger is an item.
      '&:is([data-part=popup] *)': { display: 'flex', flexDirection: 'column' },
      [ANCHORED]: { anchorScope: MENU_ANCHOR },
    },
    trigger: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
      borderRadius: 'var(--radius)', bg: 'bg.control', color: 'fg', fontFamily: UI_FONT, fontSize: 'var(--font)', lineHeight: 'var(--line)',
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      ...PATTERN,
      transition: t('feedback', ...PAINT),
      [`${ENABLED}:hover`]: { bg: 'bg.controlHover' },
      [`${ENABLED}:active`]: { bg: 'bg.controlActive' },
      [OPEN]: { bg: 'bg.controlActive', '& > [data-part=trailing] > i[name^="caret-"]': { rotate: '180deg' } },
      '& > [data-part=trailing]': { transition: t('toggle', 'rotate') },
      '&[data-disabled]': { opacity: 0.5, cursor: 'not-allowed' },
      [ANCHORED]: { anchorName: MENU_ANCHOR },
      [FORCED]: { ...FORCED_EDGE, '&[data-disabled]': { color: 'GrayText' } },
    },
    popup: popupBase,
    item: {
      display: 'flex', alignItems: 'center', color: 'fg', fontFamily: UI_FONT, cursor: 'default', userSelect: 'none', outline: 'none',
      ...PATTERN,
      ...compositeOption,
      transition: t('feedback', ...PAINT),
      '& > [data-part=contents]': { flex: '1', minWidth: 'var(--slot)' },
      // A shortcut or count in the suffix reads as secondary, 2u after the label (0.5u + 1.5u).
      '& > [data-part=suffix]': { color: 'fg.muted' },
      '& > [data-part=contents]:not([hidden]) ~ [data-part=suffix][data-part=suffix]': { paddingInlineStart: 'calc(1.5 * var(--u))' },
      '&[data-highlighted]': { bg: 'bg.control' },
      [`${ENABLED}:active`]: { bg: 'bg.controlHover' },
      '&[data-disabled]': { opacity: 0.45, cursor: 'not-allowed' },
      [FORCED]: { '&[data-highlighted]': FORCED_ON, '&[data-disabled]': { color: 'GrayText' } },
    },
    'checkbox-item': {},
    'radio-item': {},
    // The check (an icon) or the radio dot; the slot keeps its space while unchecked.
    indicator: {
      display: 'grid', placeItems: 'center', color: 'primary.solid',
      '& > *': { width: '100%', height: '100%' },
      '&[data-unchecked]': { visibility: 'hidden' },
      '&:empty::after': { content: '""', width: 'calc(1.5 * var(--u))', height: 'calc(1.5 * var(--u))', borderRadius: 'full', bg: 'currentColor' },
      [FORCED]: { color: 'CanvasText' },
    },
    'submenu-trigger': {
      [OPEN]: { bg: 'bg.control' },
      '&:dir(rtl) > [data-part=trailing] > i': { scale: '-1 1' },
      [ANCHORED]: { anchorName: MENU_ANCHOR },
    },
    group: { display: 'flex', flexDirection: 'column', gap: 'inherit' },
    'radio-group': { display: 'flex', flexDirection: 'column', gap: 'inherit' },
    'group-label': {
      display: 'flex', alignItems: 'center', minHeight: 'var(--ch)', paddingInline: 'calc(var(--ci) + 2 * var(--u))',
      color: 'fg.muted', fontSize: 'var(--font)', lineHeight: 'var(--line)', fontWeight: 'medium', userSelect: 'none', whiteSpace: 'nowrap',
    },
    separator: {
      flexShrink: 0, height: 'max(1px, var(--b))', marginBlock: 'calc(0.5 * var(--u))', bg: 'border',
      [FORCED]: { forcedColorAdjust: 'none', bg: 'CanvasText' },
    },
  },
  variants: {
    placement: {
      // Below the trigger, start-aligned, at least as wide; flips above when there is no room.
      anchor: {
        popup: {
          [ANCHORED]: {
            ...anchoredPopup({ anchor: MENU_ANCHOR, side: 'bottom', align: 'start' }),
            // The element's side choice where the engine keeps a squeezed first fit (measureSide).
            '&[data-side=top]': { positionArea: 'block-start span-inline-end', marginBlockStart: 0, marginBlockEnd: 'var(--u)' },
            // RTL: position-area reads the (left-to-right) viewport's axes, so the popup spans from the
            // trigger's right edge leftward.
            '&:dir(rtl)': { positionArea: 'block-end span-inline-start', '&[data-side=top]': { positionArea: 'block-start span-inline-start' } },
          },
        },
      },
      // Beside the submenu trigger at the inline end, top-aligned; it flips to the start only when the
      // end has no room (normal try order: the preferred side first, not the roomier one).
      // RTL: the viewport's inline start (left); the 1u margin-inline-start is then the physical right.
      submenu: { popup: { [ANCHORED]: mergeStyles(anchoredPopup({ anchor: MENU_ANCHOR, side: 'right', align: 'start' }), { positionTryOrder: 'normal', '&:dir(rtl)': { positionArea: 'inline-start span-block-end' } }) } },
      // At a point (the context menu): placed from script only.
      point: {},
    },
  },
  defaultVariants: { placement: 'anchor' },
});

// Slot recipe for <ui-tabs> and the React Tabs (Base UI Tabs: Root, List, Tab, Indicator, Panel).
// The list sits 2u above its panels (beside them when vertical). Two variants (resolveTabs):
// - segmented: the list is a composite on the control fill (recipe-parts `composite`, one row 8u);
//   tabs are composite options (7u, the option radius); the indicator is a raised selected fill
//   under the active tab.
// - underline: tabs are 8u control rows side by side over a thin (1px token) track; the indicator
//   is a 0.5u primary bar on the track.
// The indicator is placed only by Base UI's variables (--active-tab-left / -top / -width / -height,
// px set by script from the active tab's box), so it slides on the toggle intent; the first
// placement (data-activation-direction=none) does not animate.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, composite, compositeOption, constructionPattern, mergeStyles, t } from '../recipe-parts.ts';

const VERTICAL = '&[data-orientation=vertical]';
const ACTIVE = '&[data-active]';
const ENABLED = '&:not([data-disabled])';
const INSET_RING = { '&:focus-visible': { outlineOffset: 'calc(-1 * {borderWidths.thick})' } };
const PATTERN = constructionPattern({
  slot: 'var(--u)', bare: 'calc(2 * var(--u))',
  text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)', whiteSpace: 'nowrap' },
});
// The indicator box: the active tab's, from the script's variables (0 before the first placement).
const PLACED = {
  position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 0,
  translate: 'var(--active-tab-left, 0px) var(--active-tab-top, 0px)',
  width: 'var(--active-tab-width, 0px)', height: 'var(--active-tab-height, 0px)',
  transition: t('toggle', 'translate', 'width', 'height'),
  '&[data-activation-direction=none]': { transition: 'none' },
};

export const tabs = defineSlotRecipe({
  className: 'ui-tabs',
  description: 'Switch between peer panels from a row of tabs (ui-tabs, React Tabs): segmented or underline.',
  slots: ['root', 'list', 'tab', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'indicator', 'panel'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: 'calc(2 * var(--u))', fontFamily: UI_FONT, [VERTICAL]: { flexDirection: 'row', alignItems: 'flex-start' } },
    list: { position: 'relative', display: 'flex', alignSelf: 'flex-start', maxWidth: '100%', [VERTICAL]: { flexDirection: 'column', alignItems: 'stretch' } },
    tab: {
      position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderStyle: 'solid', borderColor: 'transparent', bg: 'transparent', color: 'fg.muted',
      fontFamily: UI_FONT, fontSize: 'var(--font)', fontWeight: 'medium', lineHeight: 'var(--line)', cursor: 'pointer', userSelect: 'none',
      ...PATTERN,
      transition: t('feedback', ...PAINT),
      [`${ENABLED}:hover`]: { color: 'fg' },
      [ACTIVE]: { color: 'fg' },
      '&[data-disabled]': { opacity: 0.45, cursor: 'not-allowed' },
      [VERTICAL]: { justifyContent: 'flex-start' },
      ...INSET_RING,
      [FORCED]: { '&[data-disabled]': { color: 'GrayText' }, [ACTIVE]: FORCED_ON },
    },
    indicator: PLACED,
    panel: { minWidth: 0, flex: '1', borderRadius: 'var(--radius)' },
  },
  variants: {
    variant: {
      segmented: {
        list: mergeStyles(composite, { bg: 'bg.control', borderColor: 'transparent', [FORCED]: FORCED_EDGE,
          // One row: the radius is capped at half the height (8u), like ui-segmented.
          '--cr': 'min(calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale)), calc((var(--ch) + 2 * var(--d)) / 2))',
          [VERTICAL]: { '--cr': 'calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale))' },
        }),
        tab: mergeStyles(compositeOption, { [ACTIVE]: { color: 'fg.selected' } }),
        indicator: { bg: 'bg.selected', boxShadow: 'sm', borderRadius: 'min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d))))', [FORCED]: { bg: 'Highlight' } },
      },
      underline: {
        list: {
          gap: 0,
          // The track: a thin border-width line along the list's end edge, under the tabs.
          _after: { content: '""', position: 'absolute', insetInline: 0, insetBlockEnd: 0, borderBlockEndWidth: 'thin', borderColor: 'border', pointerEvents: 'none' },
          [VERTICAL]: { _after: { insetInline: 'auto', insetInlineEnd: 0, insetBlock: 0, borderBlockEndWidth: 0, borderInlineEndWidth: 'thin' } },
        },
        tab: { minHeight: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderRadius: 'var(--radius)' },
        indicator: {
          zIndex: 2, bg: 'primary.solid', borderRadius: 'calc(var(--u) / 4)',
          height: 'calc(var(--u) / 2)',
          translate: 'var(--active-tab-left, 0px) calc(var(--active-tab-top, 0px) + var(--active-tab-height, 0px) - var(--u) / 2)',
          [VERTICAL]: {
            width: 'calc(var(--u) / 2)', height: 'var(--active-tab-height, 0px)',
            translate: 'calc(var(--active-tab-left, 0px) + var(--active-tab-width, 0px) - var(--u) / 2) var(--active-tab-top, 0px)',
            '&:dir(rtl)': { translate: 'var(--active-tab-left, 0px) var(--active-tab-top, 0px)' },
          },
          [FORCED]: { bg: 'Highlight' },
        },
      },
    },
  },
  defaultVariants: { variant: 'segmented' },
});

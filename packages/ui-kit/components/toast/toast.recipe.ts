// Slot recipe for <ui-toast-viewport> and the React Toast (Base UI Toast: Viewport, Root, Content,
// Title, Description, Action, Close). The recipe root is the viewport; each toast is the `toast` slot
// (Base UI Toast.Root). Geometry (resolveToast):
// - viewport: 80u wide (at most the window less 8u), 4u from the window edges, in the top layer;
//   `inline` puts it in flow (a column, toasts 2u apart) for specimens and previews.
// - toast: a container at the card-sm level: padding pad-card-sm (3u) − B, radius = that edge
//   × min(1, s); the overlay fill and edge with the md shadow.
// - content: title and description in one column (0.5u apart; either alone spans both rows, centered), then the action (an 8u control row,
//   label 2u at its edges) and the close (a 6u slot, icon size sm), 1u apart, centered on the text.
// Stacking reads Base UI's variables, px set by script (stack.ts): --toast-index (0 frontmost),
// --toast-offset-y, --toast-height, the viewport's --toast-frontmost-height, and the swipe
// movement --toast-swipe-movement-x / -y. Collapsed, the toasts behind peek 2u and shrink 5% a
// step at the frontmost height with their content hidden (data-behind); expanded (hover or focus,
// data-expanded) they stand 2u apart at their own heights, on the toggle intent. Entering and leaving
// (data-starting-style, data-ending-style; a swipe leaves toward data-swipe-direction) use the
// reveal intent; data-limited toasts (beyond the provider limit) are hidden and inert.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, PAINT, UI_FONT, t } from '../recipe-parts.ts';
import { popupArrow } from '../popover/popup-parts.ts';

const OFF = 'calc(100% + 4 * var(--u))';
const TYPES = { success: 'success', error: 'critical', warning: 'warning', info: 'info' } as const;

const bottom = { root: { insetBlockEnd: 'calc(4 * var(--u))', '--toast-dir': '-1' }, toast: { insetBlockEnd: 0, transformOrigin: 'bottom center', _after: { insetBlockEnd: '100%' } } };
const top = { root: { insetBlockStart: 'calc(4 * var(--u))', '--toast-dir': '1' }, toast: { insetBlockStart: 0, transformOrigin: 'top center', _after: { insetBlockStart: '100%' } } };
const end = { insetInlineEnd: 'calc(4 * var(--u))' };
const center = { insetInlineStart: '50%', translate: '-50% 0' };

export const toast = defineSlotRecipe({
  className: 'ui-toast',
  description: 'Brief notifications in a stack at a window corner (ui-toast-viewport, React Toast).',
  slots: ['root', 'positioner', 'toast', 'arrow', 'content', 'title', 'description', 'action', 'close'],
  base: {
    root: {
      '--toast-gap': 'calc(2 * var(--u))', '--toast-peek': 'calc(2 * var(--u))', '--toast-dir': '-1',
      boxSizing: 'border-box', position: 'fixed', inset: 'auto', margin: 0, padding: 0, borderWidth: 0,
      bg: 'transparent', color: 'fg', overflow: 'visible', fontFamily: UI_FONT,
      width: 'min(calc(80 * var(--u)), calc(100vw - 8 * var(--u)))',
      height: 'var(--toast-frontmost-height, 0px)',
      outline: 'none',
    },
    toast: {
      position: 'absolute', insetInline: 0, boxSizing: 'border-box',
      padding: 'max(0px, calc(calc(var(--ui-pad-card-sm) * (0.5 + 0.5 * var(--ui-density))) * var(--u) - var(--b)))',
      borderWidth: 'var(--b)', borderStyle: 'solid', borderColor: 'border',
      borderRadius: 'calc(calc(var(--ui-pad-card-sm) * (0.5 + 0.5 * var(--ui-density))) * var(--u) * min(1, var(--ui-radius-scale)))',
      // Elevation level 4 (floating).
      bg: 'elevation.overlay', color: 'fg', boxShadow: 'floating', overflow: 'hidden',
      zIndex: 'calc(1000 - var(--toast-index, 0))',
      // Collapsed: peek 2u a step and shrink 5% a step, at the frontmost toast's height.
      '--toast-y': 'calc(var(--toast-dir) * var(--toast-index, 0) * var(--toast-peek))',
      translate: 'var(--toast-swipe-movement-x, 0px) calc(var(--toast-y) + var(--toast-swipe-movement-y, 0px))',
      scale: 'calc(1 - var(--toast-index, 0) * 0.05)',
      height: 'var(--toast-frontmost-height, auto)',
      transition: `${t('toggle', 'translate', 'scale', 'height')}, ${t('reveal', 'transform', 'opacity')}`,
      // Keeps the pointer inside the stack across the 2u gaps while expanded.
      _after: { content: '""', position: 'absolute', insetInline: 0, height: 'calc(var(--toast-gap) + 1px)' },
      '&[data-expanded]': {
        '--toast-y': 'calc(var(--toast-dir) * (var(--toast-offset-y, 0px) + var(--toast-index, 0) * var(--toast-gap)))',
        scale: 1, height: 'var(--toast-height, auto)',
      },
      '&[data-swiping]': { transition: t('reveal', 'transform', 'opacity'), userSelect: 'none' },
      '&[data-starting-style]': { opacity: 0, transform: `translateY(calc(var(--toast-dir) * -1 * ${OFF}))` },
      '&[data-ending-style]': { opacity: 0, transform: `translateY(calc(var(--toast-dir) * -1 * ${OFF}))` },
      '&[data-ending-style][data-swipe-direction=right]': { transform: `translateX(${OFF})` },
      '&[data-ending-style][data-swipe-direction=left]': { transform: `translateX(calc(-1 * ${OFF}))` },
      '&[data-ending-style][data-swipe-direction=up]': { transform: `translateY(calc(-1 * ${OFF}))` },
      '&[data-ending-style][data-swipe-direction=down]': { transform: `translateY(${OFF})` },
      '&[data-limited]': { opacity: 0, pointerEvents: 'none' },
      ...Object.fromEntries(Object.entries(TYPES).map(([type, role]) => [`&[data-type=${type}]`, { borderColor: `${role}.border` }])),
      [FORCED]: FORCED_EDGE,
    },
    // An anchored toast (positionerProps.anchor; Base UI Toast.Positioner, Toast.Arrow): the
    // positioner is fixed in the top layer, placed by script beside the anchor (1u, or sideOffset);
    // the toast inside is a card-sm popup at its own size (at most 80u), entering and leaving as a
    // popup does (opacity and 0.97 scale from the edge facing the anchor, the reveal intent).
    positioner: {
      position: 'fixed', inset: 'auto', margin: 0, padding: 0, border: 0, bg: 'transparent', color: 'fg', overflow: 'visible',
      width: 'max-content', maxWidth: 'min(calc(80 * var(--u)), calc(100vw - 8 * var(--u)))', fontFamily: UI_FONT,
      '&:popover-open': { display: 'block' },
      '& > [data-part=toast]': {
        position: 'relative', insetInline: 'auto', zIndex: 'auto', translate: 'none', scale: 1, height: 'auto',
        transition: t('reveal', 'opacity', 'scale'),
        transformOrigin: 'center',
        _after: { display: 'none' },
        '&[data-side=top]': { transformOrigin: 'bottom center' }, '&[data-side=bottom]': { transformOrigin: 'top center' },
        '&[data-side=left]': { transformOrigin: 'center right' }, '&[data-side=right]': { transformOrigin: 'center left' },
        '&:is([data-starting-style], [data-ending-style])': { opacity: 0, scale: 0.97, transform: 'none' },
      },
    },
    arrow: popupArrow('elevation.overlay', 'border'),
    content: {
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridAutoColumns: 'auto', columnGap: 'var(--u)', alignItems: 'center',
      transition: t('reveal', 'opacity'),
      '&[data-behind]:not([data-expanded])': { opacity: 0 },
    },
    title: {
      // Hugs the description (0.5u apart) when the action row is taller than the two lines (loose density).
      gridRow: 1, gridColumn: 1, alignSelf: 'end', margin: 0, textStyle: 'title', color: 'fg', overflowWrap: 'anywhere',
      // Alone (no description): both rows, so it centers on the action and close.
      '&:not(:has(+ [data-part=description]))': { gridRow: '1 / span 2', alignSelf: 'center' },
      ...Object.fromEntries(Object.entries(TYPES).map(([type, role]) => [`&[data-type=${type}]`, { color: `${role}.fg` }])),
    },
    description: {
      gridRow: 2, gridColumn: 1, alignSelf: 'start', margin: 0, textStyle: 'caption', color: 'fg.muted', overflowWrap: 'anywhere',
      // Alone (no title): both rows, so it centers on the action and close.
      '&:first-child': { gridRow: '1 / span 2', alignSelf: 'center' },
      '[data-part=title] + &': { marginBlockStart: 'calc(var(--u) / 2)' },
    },
    action: {
      gridRow: '1 / span 2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      minHeight: 'var(--h)', margin: 0,
      paddingBlock: 'calc(var(--pad) + var(--line-pad))', paddingInline: 'calc(var(--pad) + 2 * var(--u))',
      borderWidth: 'var(--b)', borderStyle: 'solid', borderColor: 'transparent', borderRadius: 'var(--radius)',
      bg: 'bg.control', color: 'fg', fontFamily: UI_FONT, fontSize: 'var(--font)', fontWeight: 'medium', lineHeight: 'var(--line)',
      whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
      transition: t('feedback', ...PAINT),
      _hover: { bg: 'bg.controlHover' }, '&:active': { bg: 'bg.controlActive' },
      [FORCED]: FORCED_EDGE,
    },
    close: {
      gridRow: '1 / span 2', display: 'grid', placeItems: 'center', boxSizing: 'border-box', flexShrink: 0,
      width: 'var(--slot)', height: 'var(--slot)', margin: 0, padding: 0,
      borderWidth: 'var(--b)', borderStyle: 'solid', borderColor: 'transparent', borderRadius: 'min(var(--radius), calc(var(--slot) / 2))',
      bg: 'transparent', color: 'fg.muted', cursor: 'pointer',
      transition: t('feedback', ...PAINT),
      _hover: { bg: 'bg.controlHover', color: 'fg' }, '&:active': { bg: 'bg.controlActive' },
      '& > *': { width: 'var(--icon-sm)', height: 'var(--icon-sm)' },
    },
  },
  variants: {
    placement: {
      'bottom-end': { root: { ...bottom.root, ...end }, toast: bottom.toast },
      'bottom-center': { root: { ...bottom.root, ...center }, toast: bottom.toast },
      'top-end': { root: { ...top.root, ...end }, toast: top.toast },
      'top-center': { root: { ...top.root, ...center }, toast: top.toast },
      // In flow: a column of toasts at their own heights, 2u apart, none behind another.
      inline: {
        root: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--toast-gap)', width: 'min(calc(80 * var(--u)), 100%)', height: 'auto' },
        toast: { position: 'relative', '--toast-y': '0px', scale: 1, height: 'auto', '&[data-expanded]': { '--toast-y': '0px', height: 'auto' }, _after: { display: 'none' } },
        content: { '&[data-behind]:not([data-expanded])': { opacity: 1 } },
      },
    },
  },
  defaultVariants: { placement: 'bottom-end' },
});

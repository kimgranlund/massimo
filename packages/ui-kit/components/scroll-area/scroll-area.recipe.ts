// Slot recipe for <ui-scroll-area> / React ScrollArea (Base UI ScrollArea: Root, Viewport, Content,
// Scrollbar, Thumb, Corner). The viewport scrolls natively with its own scrollbars hidden; the
// kit's scrollbars overlay its inline end (vertical) and block end (horizontal): a 2u track, the
// thumb u thick 0.5u inside it and at least 4u long, pill radii (resolveScrollArea; the variables
// are in styles/geometry.ts). The thumb's length and place along the track arrive as custom
// properties set by script (--scroll-area-thumb-height / -width, --scroll-area-thumb-offset); the
// vertical bar stops above the corner (--scroll-area-corner-height on the root). The bars fade in
// while the pointer is over the area (data-hovering), while it scrolls (data-scrolling) and while
// keyboard focus is inside, on the feedback motion intent; a bar is hidden when its axis has no
// overflow. The root is a flex column so a height or a max-height on it bounds the viewport.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, t } from '../recipe-parts.ts';

const SHOWN = '&:is([data-hovering], [data-scrolling])';

export const scrollArea = defineSlotRecipe({
  className: 'ui-scroll-area',
  description: 'Scrollable region with kit scrollbars over native scrolling (ui-scroll-area, React ScrollArea).',
  slots: ['root', 'viewport', 'content', 'scrollbar', 'thumb', 'corner'],
  base: {
    root: { position: 'relative', display: 'flex', flexDirection: 'column', minWidth: '0', minHeight: '0' },
    viewport: {
      flex: '1 1 auto', minWidth: '0', minHeight: '0', overflow: 'auto', borderRadius: 'inherit',
      scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
      // The keyboard ring stays inside the area's contour.
      outlineOffset: '-2px',
    },
    content: { display: 'block', minWidth: 'fit-content' },
    scrollbar: {
      position: 'absolute', display: 'flex', padding: 'var(--scrollbar-inset)', borderRadius: 'var(--scrollbar-r)',
      touchAction: 'none', userSelect: 'none', bg: 'transparent',
      opacity: 0, transition: t('feedback', 'opacity', 'background-color'),
      '&[data-orientation=vertical]': {
        flexDirection: 'column', width: 'var(--scrollbar)',
        insetBlockStart: '0', insetInlineEnd: '0', insetBlockEnd: 'var(--scroll-area-corner-height, 0px)',
      },
      '&[data-orientation=horizontal]': {
        flexDirection: 'row', height: 'var(--scrollbar)',
        insetInlineStart: '0', insetBlockEnd: '0', insetInlineEnd: 'var(--scroll-area-corner-width, 0px)',
      },
      [SHOWN]: { opacity: 1 },
      ':root[data-modality=keyboard] :focus-within > &': { opacity: 1 },
      _hover: { bg: 'bg.muted' },
      '&[hidden]': { display: 'none' },
      [FORCED]: { opacity: 1 },
    },
    thumb: {
      flexShrink: 0, borderRadius: 'var(--thumb-r)', bg: 'fg.subtle',
      '[data-orientation=vertical] > &': { width: 'var(--thumb)', height: 'var(--scroll-area-thumb-height)', minHeight: 'var(--thumb-min)', translate: '0 var(--scroll-area-thumb-offset, 0px)' },
      '[data-orientation=horizontal] > &': { height: 'var(--thumb)', width: 'var(--scroll-area-thumb-width)', minWidth: 'var(--thumb-min)', translate: 'var(--scroll-area-thumb-offset, 0px) 0' },
      '[data-scrolling] > &, &:hover': { bg: 'fg.muted' },
      transition: t('feedback', 'background-color'),
      [FORCED]: { bg: 'CanvasText' },
    },
    corner: {
      position: 'absolute', insetInlineEnd: '0', insetBlockEnd: '0',
      width: 'var(--scroll-area-corner-width, 0px)', height: 'var(--scroll-area-corner-height, 0px)',
      '&[hidden]': { display: 'none' },
    },
  },
});

// The registry finds a recipe by its component id.
export { scrollArea as 'scroll-area' };

// Slot recipe for <ui-swiper> and the React Swiper: a scroll-snap viewport, paddles (control-height icon
// buttons inset 2u, styled by the button recipe plus these overrides) and dots (2u, the active one
// 4u, in 4u hit areas). Flags (no-paddles, no-dots, hover-controls, data-single) are attributes on
// the web component and data-* on the React host; both are matched.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_ON, t } from '../recipe-parts.ts';

// The paddle is also a button-recipe root (one class); the [data-dir] clause keeps these overrides
// above the button's base and state rules without depending on stylesheet order.
const PADDLE = '[data-part=paddle][data-dir]';
const flag = (name: string) => `:is([${name}], [data-${name}])`;

const root: Record<string, any> = {
  display: 'block', position: 'relative',
  // Paddles rest on the page fill and keep their lg caret (not the sm indicator size).
  [`& ${PADDLE}`]: { bg: 'bg' },
  [`& ${PADDLE} > [data-part=leading] > i`]: { width: 'var(--icon)', height: 'var(--icon)' },
  // One slide: no controls; no-paddles / no-dots hide one kind.
  [`&[data-single] :is(${PADDLE}, [data-part=dots]), &${flag('no-paddles')} ${PADDLE}, &${flag('no-dots')} [data-part=dots]`]: { display: 'none' },
  // hover-controls: paddles and dots fade in on hover or focus.
  [`&${flag('hover-controls')} :is(${PADDLE}, [data-part=dots])`]: { opacity: 0, transition: t('reveal', 'opacity') },
  [`&${flag('hover-controls')}:is(:hover, :focus-within) :is(${PADDLE}, [data-part=dots])`]: { opacity: 1 },
};

export const swiper = defineSlotRecipe({
  className: 'ui-swiper',
  description: 'Carousel (ui-swiper, React Swiper): scroll-snap viewport, paddles and dots.',
  slots: ['root', 'viewport', 'paddle', 'dots', 'dot'],
  base: {
    root,
    viewport: {
      display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', overscrollBehaviorX: 'contain',
      scrollbarWidth: 'none', borderRadius: 'inherit',
      '& > *': { flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' },
    },
    // Paddles are fully round whatever the curvature setting (like the dots): radius = half the height.
    paddle: {
      position: 'absolute', insetBlockStart: 'calc(50% - var(--h) / 2)', zIndex: 1, '--radius': 'calc(var(--h) / 2)',
      '&[data-dir=prev]': { insetInlineStart: 'calc(2 * var(--u))' },
      '&[data-dir=next]': { insetInlineEnd: 'calc(2 * var(--u))' },
    },
    dots: { position: 'absolute', insetBlockEnd: 'calc(2 * var(--u))', insetInline: 0, display: 'flex', justifyContent: 'center', gap: 'var(--u)' },
    dot: {
      display: 'grid', placeItems: 'center', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))', cursor: 'default',
      // The active dot stretches.
      _before: {
        content: '""', width: 'calc(2 * var(--u))', height: 'calc(2 * var(--u))', borderRadius: 'var(--u)',
        bg: 'fg', opacity: 0.35, transition: t('toggle', 'width', 'opacity'),
      },
      // The current slide's dot: data-selected (aria-current for semantics).
      '&:not([data-selected]):hover::before': { opacity: 0.7 },
      '&[data-selected]::before': { width: 'calc(4 * var(--u))', opacity: 1, [FORCED]: FORCED_ON },
    },
  },
});

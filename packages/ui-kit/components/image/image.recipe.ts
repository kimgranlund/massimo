// Slot recipe for <ui-image> and the React Image: a frame with a cover format (ratio) and a fit.
// Preset ratios and fits are finite choices, so recipe variants; a custom "w/h" ratio and the
// object position are continuous values set by script (--ui-image-ratio, --ui-image-position).
import { defineSlotRecipe } from '@pandacss/dev';
import { FITS, RATIOS } from './ratios.ts';

export const image = defineSlotRecipe({
  className: 'ui-image',
  description: 'Image frame (ui-image, React Image): ratio, fit and an optional slideshow.',
  slots: ['root', 'slide'],
  base: {
    root: {
      display: 'block', overflow: 'hidden', position: 'relative', bg: 'bg.muted',
      '& :is(img, picture)': { display: 'block', width: '100%', height: '100%' },
      '& img': { objectFit: 'cover', objectPosition: 'var(--ui-image-position, center)' },
      // Failed image: hide the broken-image glyph; the frame's empty fill remains.
      '& img[data-error]': { visibility: 'hidden' },
      '& [data-part=slide]': { height: '100%' },
    },
  },
  variants: {
    ratio: {
      none: {},
      // A custom "w/h" (an invalid one leaves the frame to its content).
      custom: { root: { aspectRatio: 'var(--ui-image-ratio, auto)' } },
      ...Object.fromEntries(Object.entries(RATIOS).map(([name, r]) => [name, { root: { aspectRatio: r } }])),
    },
    fit: Object.fromEntries(FITS.map((f) => [f, { root: { '& img': { objectFit: f } } }])),
    // Slideshow: the inline swiper and its viewport fill the frame.
    slideshow: {
      true: { root: { '& > :is(ui-swiper, [data-ui=swiper]), & > :is(ui-swiper, [data-ui=swiper]) > [data-part=viewport]': { height: '100%' } } },
      false: {},
    },
  },
  defaultVariants: { ratio: 'none', fit: 'cover', slideshow: false },
});

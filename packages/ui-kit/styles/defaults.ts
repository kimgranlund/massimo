// Boilerplate component defaults: just enough to make every component usable and its
// state visible. No variants, no design. Every length comes from styles/geometry.ts
// (--h, --pad, --slot, --b, --radius, …); this file only says where each applies. Keyed on tags, [data-ui]/[data-part] hooks and
// ARIA state, so web components and their React counterparts share one stylesheet and
// tag rules already apply before an element upgrades.
import { defineGlobalStyles } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../tokens/geometry/resolve.ts';
import { RATIOS } from '../components/image/ratios.ts';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },
  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  'i[name]': { display: 'inline-flex', width: '1em', height: '1em', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Swiper (scroll-snap viewport; controls positioned in styles/geometry.ts)
  'ui-swiper': { display: 'block', position: 'relative' },
  'ui-swiper > [data-part=viewport]': {
    display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', overscrollBehaviorX: 'contain',
    scrollbarWidth: 'none', borderRadius: 'inherit',
  },
  'ui-swiper > [data-part=viewport] > *': { flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' },
  'ui-swiper [data-part=dot]': { cursor: 'pointer' },
  'ui-swiper [data-part=dot]::before': { bg: 'fg', opacity: 0.35 },
  'ui-swiper [data-part=dot]:not([aria-current=true]):hover::before': { opacity: 0.7 },
  'ui-swiper [data-part=dot][aria-current=true]::before': { opacity: 1 },
  'ui-swiper[data-single] :is([data-part=paddle], [data-part=dots])': { display: 'none' },
  'ui-swiper[no-paddles] [data-part=paddle], ui-swiper[no-dots] [data-part=dots]': { display: 'none' },
  'ui-swiper[hover-controls] :is([data-part=paddle], [data-part=dots])': { opacity: 0 },
  'ui-swiper[hover-controls]:is(:hover, :focus-within) :is([data-part=paddle], [data-part=dots])': { opacity: 1 },

  // Image
  'ui-image': { display: 'block', overflow: 'hidden', position: 'relative', bg: 'bg.muted' },
  'ui-image :is(img, picture)': { display: 'block', width: '100%', height: '100%' },
  // Ratio: presets by attribute; a custom "w/h" via --ui-image-ratio (set by the element). :where()
  // keeps the variable rule below the preset selectors.
  'ui-image:where([ratio])': { aspectRatio: 'var(--ui-image-ratio, auto)' },
  ...Object.fromEntries(Object.entries(RATIOS).map(([name, r]) => [`ui-image[ratio=${name}]`, { aspectRatio: r }])),
  'ui-image img': { objectFit: 'cover', objectPosition: 'var(--ui-image-position, center)' },
  ...Object.fromEntries(['contain', 'fill', 'none', 'scale-down'].map((f) => [`ui-image[fit=${f}] img`, { objectFit: f }])),
  // Failed image: hide the broken-image glyph; the frame's empty fill remains.
  'ui-image img[data-error]': { visibility: 'hidden' },
  'ui-image[slideshow] > ui-swiper, ui-image[slideshow] > ui-swiper > [data-part=viewport], ui-image [data-part=slide]': { height: '100%' },

  // Layout containers (lengths in styles/geometry.ts)
  'ui-group': { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', borderColor: 'transparent' },
  ':is(ui-collection, ui-tile, ui-card, ui-panel, ui-region, ui-page)': { display: 'flex', flexDirection: 'column', borderColor: 'transparent' },
  'ui-page': { width: '100%', maxWidth: `${PAGE_MAX_WIDTH_REM}rem`, marginInline: 'auto' },
  // Fills alternate by depth so each level reads without borders: panel 3, card 2, tile 1.
  'ui-panel': { bg: 'bg.muted' },
  'ui-card': { bg: 'bg.subtle', borderColor: 'border' },
  'ui-tile': { bg: 'bg' },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  '@media (forced-colors: active)': {
    'ui-swiper [data-part=dot][aria-current=true]::before': { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' },
    '[aria-disabled=true]': { color: 'GrayText' },
  },
});

// Boilerplate component defaults: just enough to make every component usable and its
// state visible. No variants, no design. Every length comes from styles/geometry.ts
// (--h, --pad, --slot, --b, --radius, …); this file only says where each applies. Keyed on tags, [data-ui]/[data-part] hooks and
// ARIA state, so web components and their React counterparts share one stylesheet and
// tag rules already apply before an element upgrades.
import { defineGlobalStyles } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../tokens/geometry/resolve.ts';

const FIELD = ':is(ui-input, ui-select, [data-ui=input])';
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';
const BUTTON = ':is(ui-button, [data-ui=button])';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },

  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  'i[name]': { display: 'inline-flex', width: '1em', height: '1em', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Button
  [BUTTON]: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--leading)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  [`${BUTTON}:hover`]: { bg: 'bg.muted' },
  [`${BUTTON}:is([aria-disabled=true], [aria-busy=true])`]: { opacity: 0.5, cursor: 'not-allowed' },

  // Field: label, control, description, error
  [FIELD]: { display: 'flex', flexDirection: 'column', gap: '1.5' },
  [`${FIELD} > [data-part=label]`]: { fontSize: 'sm', fontWeight: 'medium', alignSelf: 'start', cursor: 'default' },
  [`${FIELD} > [data-part=description]`]: { fontSize: 'xs', color: 'fg.muted' },
  [`${FIELD} > [data-part=error]`]: { fontSize: 'xs', color: 'danger.fg' },
  [CONTROL]: {
    // Text sits where button contents sit: padding + 1u.
    display: 'flex', alignItems: 'center', width: '100%', height: 'var(--h)',
    paddingInline: 'calc(var(--pad) + var(--u))', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--leading)',
  },
  // aria-invalid only: native :invalid would flag untouched required fields on load.
  [`:is(${CONTROL})[aria-invalid=true]`]: { borderColor: 'danger.solid' },
  [`:is(${CONTROL}):is(:disabled, [aria-disabled=true])`]: { opacity: 0.5, cursor: 'not-allowed' },
  [`:is(${CONTROL})::placeholder`]: { color: 'fg.muted' },

  // Contenteditable text field
  '[data-part=control][contenteditable]': { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'text', minWidth: 0 },
  '[data-part=control][contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.muted', pointerEvents: 'none' },
  '[data-part=control][data-secret]': { WebkitTextSecurity: 'disc' },

  // Select trigger and popup
  // Trailing chevron slot: padding only on that side (the slot replaces contents padding).
  'ui-select > [data-part=trigger]': { cursor: 'pointer', userSelect: 'none', paddingInlineEnd: 'var(--pad)' },
  'ui-select [data-part=value]': { flex: '1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  'ui-select [data-part=value][data-placeholder]': { color: 'fg.muted' },
  'ui-select [data-part=chevron]': { display: 'grid', placeItems: 'center', flexShrink: 0, width: 'var(--slot)', height: 'var(--slot)', marginInlineStart: 'var(--u)', color: 'fg.muted' },
  // [popover] stays hidden until shown; layout only while open.
  'ui-select > [data-part=popup]': {
    position: 'fixed', inset: 'auto', margin: 0, overflowY: 'auto', overscrollBehavior: 'contain',
    bg: 'bg', color: 'fg', borderColor: 'border', boxShadow: 'md',
  },
  'ui-select > [data-part=popup]:popover-open': { display: 'flex', flexDirection: 'column' },

  // Badge, tag, chip (lengths in styles/geometry.ts)
  ':is(ui-badge, ui-tag, ui-chip)': { display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: 'transparent' },
  'ui-badge': { bg: 'accent.solid', color: 'fg.onSolid', fontWeight: 'semibold' },
  'ui-tag': { bg: 'bg.muted', color: 'fg' },
  'ui-chip': { bg: 'bg', color: 'fg', borderColor: 'border.strong', cursor: 'pointer', userSelect: 'none' },
  'ui-chip:hover': { bg: 'bg.muted' },
  'ui-chip[aria-pressed=true]': { bg: 'accent.subtle', color: 'accent.fg', borderColor: 'accent.solid' },
  'ui-chip[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  'ui-chip [data-remove]': { cursor: 'pointer', opacity: 0.7 },
  'ui-chip [data-remove]:hover': { opacity: 1 },

  // Checkbox, radio, switch
  ':is(ui-checkbox, ui-radio, ui-switch)': { display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', verticalAlign: 'middle' },
  ':is(ui-checkbox, ui-radio, ui-switch)[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  '[data-part=box]': { borderColor: 'border.strong', bg: 'bg', color: 'fg.onSolid' },
  ':is(ui-checkbox, ui-radio, ui-switch)[aria-invalid=true] [data-part=box]': { borderColor: 'danger.solid' },
  'ui-checkbox [data-part=box] > i': { display: 'none' },
  'ui-checkbox[aria-checked=true] [data-part=box] > i[data-mark=checked], ui-checkbox[aria-checked=mixed] [data-part=box] > i[data-mark=mixed]': { display: 'inline-flex' },
  ':is(ui-checkbox:is([aria-checked=true], [aria-checked=mixed]), ui-switch[aria-checked=true]) [data-part=box]': { bg: 'accent.solid', borderColor: 'accent.solid' },
  'ui-radio[aria-checked=true] [data-part=box]': { borderColor: 'accent.solid' },
  'ui-radio[aria-checked=true] [data-part=box]::after': { bg: 'accent.solid' },
  'ui-switch [data-part=box]': { bg: 'bg.muted' },
  'ui-switch [data-part=box]::after': { bg: 'white', boxShadow: 'sm' },

  // Range, progress
  ':is(ui-range, ui-progress) > [data-part=track]': { bg: 'bg.muted' },
  ':is(ui-range, ui-progress) > [data-part=track] > [data-part=fill]': { bg: 'accent.solid' },
  'ui-range': { cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
  'ui-range[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  'ui-range > [data-part=thumb]': { bg: 'white', borderWidth: 'var(--b)', borderColor: 'accent.solid', boxShadow: 'sm' },
  'ui-progress[data-indeterminate] > [data-part=track] > [data-part=fill]': { width: '30%', animation: 'ui-indeterminate 1.2s ease-in-out infinite' },

  // Swatch, palette
  'ui-swatch': {
    backgroundColor: 'var(--ui-swatch-color, transparent)',
    // Checkerboard under the color so alpha reads; the color layer sits on top.
    backgroundImage: 'linear-gradient(var(--ui-swatch-color, transparent), var(--ui-swatch-color, transparent)), conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)',
    backgroundSize: '100% 100%, calc(2 * var(--u)) calc(2 * var(--u))',
    boxShadow: 'inset 0 0 0 1px oklch(0 0 0 / 0.08)',
  },
  'ui-palette[selectable], ui-palette[name]': { cursor: 'pointer' },
  'ui-palette > ui-swatch[aria-selected=true]': { boxShadow: 'inset 0 0 0 2px var(--colors-bg), inset 0 0 0 4px var(--colors-fg)' },
  'ui-palette > ui-swatch[data-active]': { outline: '2px solid {colors.focusRing}', outlineOffset: '-2px' },

  // Swiper (scroll-snap viewport; controls positioned in styles/geometry.ts)
  'ui-swiper': { display: 'block', position: 'relative' },
  'ui-swiper > [data-part=viewport]': {
    display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', overscrollBehaviorX: 'contain',
    scrollbarWidth: 'none', borderRadius: 'inherit',
  },
  'ui-swiper > [data-part=viewport] > *': { flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' },
  'ui-swiper [data-part=paddle]': { bg: 'bg', zIndex: 1 },
  'ui-swiper [data-part=dot]': { cursor: 'pointer' },
  'ui-swiper [data-part=dot]::before': { bg: 'fg', opacity: 0.35 },
  'ui-swiper [data-part=dot][aria-current=true]::before': { opacity: 1 },
  'ui-swiper[data-single] :is([data-part=paddle], [data-part=dots])': { display: 'none' },
  'ui-swiper[no-paddles] [data-part=paddle], ui-swiper[no-dots] [data-part=dots]': { display: 'none' },
  'ui-swiper[hover-controls] :is([data-part=paddle], [data-part=dots])': { opacity: 0, transitionProperty: 'opacity', transitionDuration: 'fast' },
  'ui-swiper[hover-controls]:is(:hover, :focus-within) :is([data-part=paddle], [data-part=dots])': { opacity: 1 },

  // Image
  'ui-image': { display: 'block', overflow: 'hidden', position: 'relative', bg: 'bg.muted' },
  'ui-image :is(img, picture)': { display: 'block', width: '100%', height: '100%' },
  'ui-image img': { objectFit: 'cover', objectPosition: 'var(--ui-image-position, center)' },
  ...Object.fromEntries(['contain', 'fill', 'none', 'scale-down'].map((f) => [`ui-image[fit=${f}] img`, { objectFit: f }])),
  'ui-image[slideshow] > ui-swiper, ui-image[slideshow] > ui-swiper > [data-part=viewport], ui-image [data-part=slide]': { height: '100%' },

  // Layout containers (lengths in styles/geometry.ts)
  'ui-group': { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', borderColor: 'transparent' },
  ':is(ui-collection, ui-tile, ui-card, ui-panel, ui-region, ui-page)': { display: 'flex', flexDirection: 'column', borderColor: 'transparent' },
  'ui-page': { width: '100%', maxWidth: `${PAGE_MAX_WIDTH_REM}rem`, marginInline: 'auto' },
  'ui-tile': { bg: 'bg.subtle' },
  'ui-card': { bg: 'bg', borderColor: 'border' },
  'ui-panel': { bg: 'bg.subtle' },

  // Listbox, segmented control, options
  'ui-listbox': { display: 'flex', flexDirection: 'column', borderColor: 'border' },
  'ui-segmented': { display: 'inline-flex', bg: 'bg.muted', borderColor: 'transparent' },
  'ui-option': { display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  'ui-segmented > ui-option > [data-part=contents]': { flex: '1', justifyContent: 'center' },
  'ui-option[data-active]': { bg: 'bg.muted' },
  'ui-option[aria-selected=true]': { bg: 'accent.subtle', color: 'accent.fg', fontWeight: 'medium' },
  'ui-segmented > ui-option': { flex: '1', justifyContent: 'center', color: 'fg.muted' },
  'ui-segmented > ui-option[data-active]': { bg: 'transparent' },
  'ui-segmented > ui-option[aria-selected=true]': { bg: 'bg', color: 'fg', boxShadow: 'sm' },
  'ui-option[aria-disabled=true]': { opacity: 0.45, cursor: 'not-allowed' },
});

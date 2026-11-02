// Boilerplate component defaults: just enough to make every component usable and its
// state visible. No variants, no design. Every length comes from styles/geometry.ts
// (--h, --pad, --slot, --b, --radius, …); this file only says where each applies. Keyed on tags, [data-ui]/[data-part] hooks and
// ARIA state, so web components and their React counterparts share one stylesheet and
// tag rules already apply before an element upgrades.
import { defineGlobalStyles } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../tokens/geometry/resolve.ts';
import { RATIOS } from '../components/image/ratios.ts';
import { voiceFamily } from './typography.ts';

const UI_VOICE = ':is(ui-input, [data-ui=input], ui-select, ui-listbox, ui-segmented, ui-option)';

const FIELD = ':is(ui-input, ui-select, [data-ui=input])';
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';
const LIST = ':is(ui-listbox, ui-segmented)';
// A field state on the host itself (select trigger) or on its text part (input contents).
const HAS = (attr: string) => `${attr}, :has(> ${attr})`;
// oklab, not oklch: a hue mix with the blue-grey neutral would swing the red through blue.
const CRITICAL_TINT = (pct: number) => `color-mix(in oklab, var(--colors-critical-solid) ${pct}%, var(--colors-bg-muted))`;

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },
  // Buttons, form controls, badges, tags and chips speak in the UI voice (the Controls face,
  // system-ui, unless repointed with data-font-ui). Field descriptions and errors keep the caption role.
  [UI_VOICE]: { fontFamily: voiceFamily('ui') },

  // Icons: <i name="…"> filled by the icon runtime. 1em by default; slots size them to --icon.
  // The box is reserved before the SVG arrives, so nothing shifts.
  'i[name]': { display: 'inline-flex', width: '1em', height: '1em', flexShrink: 0, fontStyle: 'normal', lineHeight: 1 },
  'i[name] > svg': { width: '100%', height: '100%' },

  // Field: label, control, description, error
  [FIELD]: { display: 'flex', flexDirection: 'column', gap: '1.5' },
  [`${FIELD} > [data-part=label]`]: { textStyle: 'label', color: 'fg.muted', alignSelf: 'start', cursor: 'default' },
  [`${FIELD} > [data-part=description]`]: { textStyle: 'caption', color: 'fg.muted' },
  [`${FIELD} > [data-part=error]`]: { textStyle: 'caption', color: 'critical.fg' },
  [CONTROL]: {
    // Laid out as a button: 1u (padding + border) on the host; contents and slots carry the rest.
    display: 'flex', alignItems: 'center', width: '100%', height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg.muted', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--line)',
  },
  // aria-invalid only: native :invalid would flag untouched required fields on load.
  // Invalid: a critical-tinted fill (borders default to 0, so the edge alone cannot carry it).
  [`:is(${CONTROL}):not(${HAS('[aria-disabled=true]')}, ${HAS('[aria-readonly=true]')}, :has(> :disabled)):hover`]: { bg: 'bg.mutedHover' },
  [`:is(${CONTROL}):is(${HAS('[aria-invalid=true]')})`]: { borderColor: 'critical.solid', bg: CRITICAL_TINT(14) },
  [`:is(${CONTROL}):is(${HAS('[aria-invalid=true]')}):hover`]: { bg: CRITICAL_TINT(20) },
  // Read-only: the value stays selectable but the field drops its fill.
  [`:is(${CONTROL}):is(${HAS('[aria-readonly=true]')})`]: { bg: 'bg.subtle', cursor: 'default' },
  // Text fields always show focus, also after a pointer click (the caret target must be visible).
  // The ring sits on the control (the shape), not the text part inside it.
  [`:root[data-modality] :is(ui-input, [data-ui=input]) > [data-part=control]:focus-within`]: { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
  [`:is(ui-input, [data-ui=input]) > [data-part=control] > [data-part=contents]:focus-visible`]: { outline: 'none' },
  // Required: a marker after the label (choices draw theirs in choice.recipe.ts).
  // hide-label: the label stays the control's accessible name but is not drawn (visually hidden,
  // out of flow, so the field keeps no gap for it).
  [`${FIELD}:is([hide-label], [data-hide-label]) > [data-part=label]`]: {
    position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden',
    clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
  },
  [`${FIELD}[required] > [data-part=label]::after`]: { content: '" *"', color: 'critical.fg' },
  [`:is(${CONTROL}):is(${HAS('[aria-disabled=true]')}, :has(> :disabled))`]: { opacity: 0.5, cursor: 'not-allowed' },
  [`:is(${CONTROL}) > [data-part=contents]::placeholder`]: { color: 'fg.subtle' },

  // Contenteditable text field
  '[data-part=contents][contenteditable]': { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'text', minWidth: 0 },
  '[data-part=contents][contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.subtle', pointerEvents: 'none' },
  '[data-part=contents][data-secret]': { WebkitTextSecurity: 'disc' },

  // Select trigger and popup
  // A button with a trailing slot (resolveSelectTrigger): padding + 2u, value, 1u, chevron slot, padding.
  'ui-select > [data-part=trigger]': { cursor: 'pointer', userSelect: 'none' },
  // Open: the trigger holds the pressed fill and the chevron turns.
  'ui-select > [data-part=trigger][aria-expanded=true]': { bg: 'bg.mutedActive' },
  'ui-select > [data-part=trigger][aria-expanded=true] > [data-part=trailing]': { rotate: '180deg' },
  'ui-select > [data-part=trigger] > [data-part=contents]': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  'ui-select > [data-part=trigger] > [data-part=contents][data-placeholder]': { color: 'fg.subtle' },
  'ui-select > [data-part=trigger] > [data-part=trailing]': { color: 'fg.muted' },
  // Prefix / suffix adornments: the label's color at 65%, so they read as secondary on any fill.
  ':is(ui-option, ui-select > [data-part=trigger], :is(ui-input, [data-ui=input]) > [data-part=control]) > :is([data-part=prefix], [data-part=suffix])': {
    color: 'color-mix(in oklch, currentColor 65%, transparent)',
  },
  // Icons in field adornment slots are secondary too.
  ':is(ui-input, [data-ui=input]) > [data-part=control] > :is([data-part=leading], [data-part=trailing])': { color: 'fg.muted' },
  // [popover] stays hidden until shown; layout only while open.
  'ui-select > [data-part=popup]': {
    flexDirection: 'column',
    position: 'fixed', inset: 'auto', margin: 0, overflowY: 'auto', overscrollBehavior: 'contain',
    bg: 'bg.overlay', color: 'fg', borderColor: 'border', boxShadow: 'md',
  },
  // Anchor positioning (browsers with position-area and anchor-scope): each select scopes one shared
  // anchor name, so the popup sits 1u below its own trigger (above when there is no room), at least as
  // wide, as tall as the space allows. Elsewhere the element places it from script.
  '@supports (position-area: block-end) and (anchor-scope: all)': {
    'ui-select': { anchorScope: '--ui-select-trigger' },
    'ui-select > [data-part=trigger]': { anchorName: '--ui-select-trigger' },
    'ui-select > [data-part=popup]': {
      positionAnchor: '--ui-select-trigger', positionArea: 'block-end span-inline-end', positionTryFallbacks: 'flip-block', positionTryOrder: 'most-block-size',
      // One margin toward the trigger; flip-block mirrors it when the popup opens upward.
      marginBlockStart: 'var(--u)', minWidth: 'anchor-size(width)', maxHeight: 'calc(100% - var(--u))',
    },
  },
  // The column layout holds in every state: while closing, the popup stays displayed for its fade
  // (display transitions discretely), so a direction set only on :popover-open would flip it to a row.
  'ui-select > [data-part=popup]:popover-open': { display: 'flex' },

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

  // Listbox, segmented control, options
  'ui-listbox': { display: 'flex', flexDirection: 'column', borderColor: 'border', bg: 'bg.subtle' },
  'ui-segmented': { display: 'inline-flex', bg: 'bg.muted', borderColor: 'transparent' },
  'ui-option': { display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  'ui-segmented > ui-option > [data-part=contents]': { flex: '1', justifyContent: 'center' },
  'ui-option[data-active]': { bg: 'bg.muted' },
  'ui-option[aria-selected=true]': { bg: 'primary.subtle', color: 'primary.fg', fontWeight: 'medium' },
  'ui-segmented > ui-option': { flex: '1', justifyContent: 'center', color: 'fg.muted' },
  'ui-segmented > ui-option[data-active]': { bg: 'transparent' },
  // Selected option in a listbox or segmented control: the lightest neutral with strong text in light,
  // the primary solid with its contrast text in dark (bg.selected / fg.selected). Select popups keep the
  // primary-subtle selection, since neutral 1 is the popup's own fill.
  [`:is(ui-listbox, ui-segmented) > ui-option[aria-selected=true]`]: { bg: 'bg.selected', color: 'fg.selected', boxShadow: 'sm' },
  'ui-option[aria-disabled=true]': { opacity: 0.45, cursor: 'not-allowed' },
  'ui-option:not([aria-disabled=true]):hover': { bg: 'bg.mutedHover' },
  'ui-option:not([aria-disabled=true]):active': { bg: 'bg.mutedActive' },
  'ui-option[aria-selected=true]:not([aria-disabled=true]):is(:hover, :active)': { bg: 'primary.subtleHover' },
  'ui-segmented > ui-option:not([aria-disabled=true]):hover': { color: 'fg' },
  [`:is(ui-listbox, ui-segmented) > ui-option[aria-selected=true]:not([aria-disabled=true]):is(:hover, :active)`]: { bg: 'bg.selected' },
  // Disabled or invalid lists and segmented controls (the host carries the ARIA state).
  [`${LIST}[aria-disabled=true]`]: { opacity: 0.5, cursor: 'not-allowed' },
  [`${LIST}[aria-disabled=true] > *`]: { cursor: 'not-allowed', pointerEvents: 'none' },
  ':is(ui-listbox, ui-segmented)[aria-invalid=true]': { bg: CRITICAL_TINT(14) },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  '@media (forced-colors: active)': {
    [`${CONTROL}, ui-segmented, ui-listbox, ui-select > [data-part=popup]`]: { outline: '1px solid CanvasText', outlineOffset: '-1px' },
    ['ui-option[aria-selected=true], ui-swiper [data-part=dot][aria-current=true]::before']: { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' },
    '[aria-disabled=true]': { color: 'GrayText' },
  },
});

// Boilerplate component defaults: just enough to make every component usable and its
// state visible. No variants, no design. Every length comes from styles/geometry.ts
// (--h, --pad, --slot, --b, --radius, …); this file only says where each applies. Keyed on tags, [data-ui]/[data-part] hooks and
// ARIA state, so web components and their React counterparts share one stylesheet and
// tag rules already apply before an element upgrades.
import { defineGlobalStyles } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../tokens/geometry/resolve.ts';
import { RATIOS } from '../components/image/ratios.ts';
import { voiceFamily } from './typography.ts';

const UI_VOICE = ':is(ui-button, [data-ui=button], ui-input, [data-ui=input], ui-select, ui-listbox, ui-segmented, ui-option, ui-checkbox, ui-radio, ui-switch, ui-range, ui-palette, ui-badge, ui-tag, ui-chip)';

const FIELD = ':is(ui-input, ui-select, [data-ui=input])';
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';
const BUTTON = ':is(ui-button, [data-ui=button])';
// Button variant: an attribute on ui-button, data-variant on plain HTML and the React Button.
const PRIMARY = ':is([variant=primary], [data-variant=primary])';
const ENABLED = ':not([aria-disabled=true], [aria-busy=true])';
const CHOICE = ':is(ui-checkbox, ui-radio, ui-switch)';
const ON = ':is(ui-checkbox:is([aria-checked=true], [aria-checked=mixed]), ui-radio[aria-checked=true], ui-switch[aria-checked=true])';
const LIST = ':is(ui-listbox, ui-segmented, ui-palette)';
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

  // Button
  [BUTTON]: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg.muted', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--line)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  // Hover and press step the fill one ramp step each (neutral 3 → 4 → 5).
  [`${BUTTON}${ENABLED}:hover`]: { bg: 'bg.mutedHover' },
  [`${BUTTON}${ENABLED}:active`]: { bg: 'bg.mutedActive' },
  // Busy buttons also carry aria-disabled (activation is blocked) but stay readable: no fade.
  [`${BUTTON}[aria-disabled=true]:not([aria-busy=true])`]: { opacity: 0.5, cursor: 'not-allowed' },
  // Primary: the primary solid with the contrast text color; hover and press use the solid hover step.
  [`${BUTTON}${PRIMARY}`]: { bg: 'primary.solid', color: 'fg.onSolid', borderColor: 'primary.solid' },
  [`${BUTTON}${PRIMARY}${ENABLED}:is(:hover, :active)`]: { bg: 'primary.solidHover', borderColor: 'primary.solidHover' },
  // Busy: still readable (unlike disabled), with an indeterminate sweep along the bottom edge.
  [`${BUTTON}[aria-busy=true]`]: { cursor: 'progress', position: 'relative', overflow: 'hidden' },
  [`${BUTTON}[aria-busy=true]::after`]: {
    content: '""', position: 'absolute', insetInlineStart: 0, bottom: 0, width: '30%', height: 'calc(0.5 * var(--u))',
    bg: 'primary.solid', animation: 'ui-indeterminate 1.2s ease-in-out infinite',
  },
  // On a primary button the sweep uses the contrast color, so it shows against the solid fill.
  [`${BUTTON}${PRIMARY}[aria-busy=true]::after`]: { bg: 'fg.onSolid' },

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
  // Required: a marker after the label (and after a checkbox/switch's own text).
  // hide-label: the label stays the control's accessible name but is not drawn (visually hidden,
  // out of flow, so the field keeps no gap for it).
  [`${FIELD}:is([hide-label], [data-hide-label]) > [data-part=label]`]: {
    position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden',
    clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
  },
  [`${FIELD}[required] > [data-part=label]::after, :is(ui-checkbox, ui-switch)[aria-required=true]::after`]: { content: '" *"', color: 'critical.fg' },
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
  ':is(ui-button, ui-option, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, [data-ui=button], ui-select > [data-part=trigger], :is(ui-input, [data-ui=input]) > [data-part=control]) > :is([data-part=prefix], [data-part=suffix])': {
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

  // Badge, tag, chip (lengths in styles/geometry.ts)
  ':is(ui-badge, ui-tag, ui-chip)': { display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: 'transparent' },
  'ui-badge': { bg: 'primary.solid', color: 'fg.onSolid', fontWeight: 'semibold', fontVariantNumeric: 'tabular-nums lining-nums' },
  'ui-tag': { bg: 'bg.muted', color: 'fg' },
  'ui-chip': { bg: 'bg.muted', color: 'fg', borderColor: 'border.strong', userSelect: 'none' },
  // Only a selectable chip is a button; a plain or removable chip is a label (its × is the control).
  'ui-chip[selectable]': { cursor: 'pointer' },
  'ui-chip[selectable]:not([aria-disabled=true]):hover': { bg: 'bg.mutedHover' },
  'ui-chip[selectable]:not([aria-disabled=true]):active': { bg: 'bg.mutedActive' },
  // Selected chips use the checkbox/switch "on" colors: the primary solid with on-solid text.
  'ui-chip[aria-pressed=true]': { bg: 'primary.solid', color: 'fg.onSolid', borderColor: 'primary.solid' },
  'ui-chip[aria-pressed=true]:not([aria-disabled=true]):is(:hover, :active)': { bg: 'primary.solidHover' },
  'ui-chip[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  'ui-chip [data-remove]': { cursor: 'pointer', opacity: 0.7 },
  'ui-chip [data-remove]:hover': { opacity: 1 },

  // Checkbox, radio, switch
  ':is(ui-checkbox, ui-radio, ui-switch)': { display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', verticalAlign: 'middle' },
  ':is(ui-checkbox, ui-radio, ui-switch)[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  '[data-part=box]': { borderColor: 'border.strong', bg: 'bg.muted', color: 'fg.onSolid' },
  [`${CHOICE}:not([aria-disabled=true]):hover [data-part=box]`]: { bg: 'bg.mutedHover' },
  [`${CHOICE}:not([aria-disabled=true]):active [data-part=box]`]: { bg: 'bg.mutedActive' },
  [`${CHOICE}[aria-invalid=true] [data-part=box]`]: { borderColor: 'critical.solid', bg: CRITICAL_TINT(20) },
  'ui-checkbox [data-part=box] > i': { display: 'none' },
  'ui-checkbox[aria-checked=true] [data-part=box] > i[data-mark=checked], ui-checkbox[aria-checked=mixed] [data-part=box] > i[data-mark=mixed]': { display: 'inline-flex' },
  // On: every choice fills with the primary solid; its indicator (check, radio dot) uses the contrast color.
  [`${ON} [data-part=box]`]: { bg: 'primary.solid', borderColor: 'primary.solid' },
  [`${ON}:not([aria-disabled=true]):is(:hover, :active) [data-part=box]`]: { bg: 'primary.solidHover', borderColor: 'primary.solidHover' },
  'ui-radio[aria-checked=true] [data-part=box]::after': { bg: 'fg.onSolid' },
  'ui-switch [data-part=box]': { bg: 'bg.muted' },
  'ui-switch [data-part=box]::after': { bg: 'white', boxShadow: 'sm' },

  // Range, progress
  ':is(ui-range, ui-progress) > [data-part=track]': { bg: 'bg.muted' },
  ':is(ui-range, ui-progress) > [data-part=track] > [data-part=fill]': { bg: 'primary.solid' },
  'ui-range': { cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
  'ui-range[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed' },
  'ui-range > [data-part=thumb]': { bg: 'white', borderWidth: 'var(--b)', borderColor: 'primary.solid', boxShadow: 'sm' },
  'ui-range:not([aria-disabled=true]):hover > [data-part=track]': { bg: 'bg.mutedHover' },
  'ui-range:not([aria-disabled=true]):hover > [data-part=track] > [data-part=fill]': { bg: 'primary.solidHover' },
  // Dragging (:active holds while the pointer is captured).
  'ui-range:not([aria-disabled=true]):active': { cursor: 'grabbing' },
  'ui-range:not([aria-disabled=true]):active > [data-part=thumb]': { boxShadow: 'md' },
  'ui-progress[data-indeterminate] > [data-part=track] > [data-part=fill]': { width: '30%', animation: 'ui-indeterminate 1.2s ease-in-out infinite' },
  // Reduced motion: no sweep; a full, faint fill still says "working".
  '@media (prefers-reduced-motion: reduce)': {
    [`ui-progress[data-indeterminate] > [data-part=track] > [data-part=fill], ${BUTTON}[aria-busy=true]::after`]: { animation: 'none', width: '100%', translate: 'none', opacity: 0.4 },
  },

  // Swatch, palette
  // Opaque colors paint one layer; translucent or missing ones (data-alpha) sit on a checkerboard.
  'ui-swatch': { backgroundColor: 'var(--ui-swatch-color, transparent)' },
  'ui-swatch[data-alpha]': {
    backgroundImage: 'linear-gradient(var(--ui-swatch-color, transparent), var(--ui-swatch-color, transparent)), conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)',
    backgroundSize: '100% 100%, calc(2 * var(--u)) calc(2 * var(--u))',
  },

  // A color that does not parse: a diagonal strike over the empty checkerboard.
  'ui-swatch[data-invalid]': { backgroundSize: '100% 100%, calc(2 * var(--u)) calc(2 * var(--u))', backgroundImage: 'linear-gradient(to top right, transparent calc(50% - 1px), var(--colors-critical-solid) 0 calc(50% + 1px), transparent 0), conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)' },
  // A subtle edge drawn over the swatches (no space, follows the strip's radius).
  'ui-palette': { position: 'relative' },
  'ui-palette::after': { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 0 1px var(--colors-border)', pointerEvents: 'none' },
  'ui-palette[selectable], ui-palette[name]': { cursor: 'pointer' },
  ':is(ui-palette[selectable], ui-palette[name]):not([aria-disabled=true]) > ui-swatch:not([aria-selected=true]):hover': { boxShadow: 'inset 0 0 0 2px color-mix(in oklch, var(--colors-bg) 70%, transparent)' },
  'ui-palette > ui-swatch[aria-selected=true]': { boxShadow: 'inset 0 0 0 2px var(--colors-bg), inset 0 0 0 4px var(--colors-fg)' },
  ':root[data-modality=keyboard] ui-palette > ui-swatch[data-active]': { outline: '2px solid {colors.focusRing}', outlineOffset: '-2px' },

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
  // Disabled or invalid lists, segmented controls and palettes (the host carries the ARIA state).
  [`${LIST}[aria-disabled=true]`]: { opacity: 0.5, cursor: 'not-allowed' },
  [`${LIST}[aria-disabled=true] > *`]: { cursor: 'not-allowed', pointerEvents: 'none' },
  ':is(ui-listbox, ui-segmented)[aria-invalid=true]': { bg: CRITICAL_TINT(14) },
  'ui-palette[aria-invalid=true]': { outline: '2px solid {colors.critical.solid}', outlineOffset: '2px' },

  // Forced colors (Windows high contrast): fills are dropped and borders default to 0, so
  // every control gets a system-colored edge that costs no space, and "on" states use Highlight.
  '@media (forced-colors: active)': {
    [`${BUTTON}, ${CONTROL}, ui-chip, [data-part=box], :is(ui-range, ui-progress) > [data-part=track], ui-segmented, ui-listbox, ui-select > [data-part=popup], ui-swatch`]: { outline: '1px solid CanvasText', outlineOffset: '-1px' },
    [`${ON} [data-part=box], ui-chip[aria-pressed=true], ui-option[aria-selected=true], :is(ui-range, ui-progress) > [data-part=track] > [data-part=fill], ui-swiper [data-part=dot][aria-current=true]::before`]: { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' },
    'ui-switch [data-part=box]::after, ui-range > [data-part=thumb]': { forcedColorAdjust: 'none', bg: 'CanvasText' },
    'ui-radio[aria-checked=true] [data-part=box]::after': { forcedColorAdjust: 'none', bg: 'HighlightText' },
    '[aria-disabled=true]': { color: 'GrayText' },
  },
});

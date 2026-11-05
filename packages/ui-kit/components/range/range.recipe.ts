// Slot recipes for <ui-range>, <ui-progress> and the React Range, Progress (resolveTrack): a 4u
// track rounded at half height. The range thumb sits inside it like a switch thumb (track − u,
// inset 0.5u) and travels W − track. The fill ends one track-radius past the thumb's center
// (track + p·(W − track)) with the track's radius, so its round cap stays concentric around the
// thumb at every value. --track and --track-r are geometry variables; --ui-ratio is set by script.
import { defineSlotRecipe } from '@pandacss/dev';
import { ATTACHED, FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, t } from '../recipe-parts.ts';

const REDUCED = '@media (prefers-reduced-motion: reduce)';
const host = {
  display: 'grid', alignItems: 'center', height: 'var(--track)', minWidth: 'calc(24 * var(--u))', position: 'relative',
  [FORCED]: { _disabled: { color: 'GrayText' } },
};
const track = {
  display: 'block', height: '100%', borderRadius: 'var(--track-r)', overflow: 'hidden', gridArea: '1 / 1', bg: 'bg.muted',
  transition: t('feedback', ...PAINT),
  [FORCED]: FORCED_EDGE,
};
const fill = {
  display: 'block', height: '100%', width: 'calc(var(--ui-ratio, 0) * 100%)', borderRadius: 'var(--track-r)', bg: 'primary.solid',
  [FORCED]: FORCED_ON,
};

export const range = defineSlotRecipe({
  className: 'ui-range',
  description: 'Slider (ui-range, React Range): track, indicator (Base UI Slider.Indicator) and thumb.',
  slots: ['root', 'track', 'indicator', 'thumb'],
  base: {
    root: {
      ...host, fontFamily: UI_FONT, cursor: 'default', touchAction: 'none', userSelect: 'none',
      _disabled: { opacity: 0.5, cursor: 'not-allowed' },
      _enabled: {
        '&:hover': { '& > [data-part=track]': { bg: 'bg.mutedHover' }, '& > [data-part=track] > [data-part=indicator]': { bg: 'primary.solidHover' } },
        // Dragging (data-dragging, from pointer down to up).
        // A pair raises only the dragged thumb (data-dragging on the thumb).
        _dragging: { cursor: 'grabbing', '& > [data-part=thumb]:is(:not([data-index]), [data-dragging])': { boxShadow: 'md' } },
      },
      // The thumb and fill glide on keyboard steps; while dragging they track 1:1.
      '&:not([data-dragging])': {
        '& > [data-part=thumb]': { transition: `${t('toggle', 'margin-inline-start')}, ${t('feedback', 'box-shadow')}` },
        '& > [data-part=track] > [data-part=indicator]': { transition: `${t('toggle', 'width', 'margin-inline-start')}, ${t('feedback', 'background-color')}` },
      },
      // React: the native input covers the track, transparent, so pointer and keys are native. Its
      // thumb is as wide as the track, so native travel (width − thumb) equals the painted thumb's
      // travel (width − track) and the pointer lands where the thumb is drawn. One rule per engine.
      '& > input': {
        position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'inherit',
        gridArea: '1 / 1', appearance: 'none', background: 'transparent',
      },
      '& > input::-webkit-slider-thumb': { appearance: 'none', width: 'var(--track)', height: 'var(--track)' },
      '& > input::-moz-range-thumb': { width: 'var(--track)', height: 'var(--track)', border: 0 },
      // A pair's inputs (one per thumb) take keys and the form value; the root script maps the pointer.
      '& > input[data-index]': { pointerEvents: 'none' },
      // React, one thumb: the transparent input covers the root, so the root draws the keyboard ring,
      // on the same box as the web component's focused host.
      ':root:not([data-modality=pointer]) &:has(> input:not([data-index]):focus-visible)': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
    },
    track,
    // A pair's indicator starts one track-radius before the first thumb's center (--ui-ratio-start,
    // 0 for one thumb) and ends one past the second's, so both caps wrap their thumbs.
    indicator: {
      ...fill,
      marginInlineStart: 'calc(var(--ui-ratio-start, 0) * (100% - var(--track)))',
      width: 'calc(var(--track) + (var(--ui-ratio, 0) - var(--ui-ratio-start, 0)) * (100% - var(--track)))',
    },
    // inset="none": the thumb fills the track and takes its radius (the track's own end cap).
    thumb: {
      [`${ATTACHED} > &`]: { width: 'var(--track)', height: 'var(--track)', borderRadius: 'var(--track-r)', marginInlineStart: 'calc(var(--ui-ratio, 0) * (100% - var(--track)))' },
      display: 'block', gridArea: '1 / 1', width: 'calc(var(--track) - var(--u))', height: 'calc(var(--track) - var(--u))',
      borderRadius: 'max(0px, calc(var(--track-r) - 0.5 * var(--u)))',
      marginInlineStart: 'calc(0.5 * var(--u) + var(--ui-ratio, 0) * (100% - var(--track)))',
      bg: 'fg.onSolid', borderWidth: 'var(--b)', borderColor: 'primary.solid', boxShadow: 'sm',
      // A pair's focused or dragged thumb paints over the other where they meet.
      '&:is(:focus-visible, [data-dragging])': { zIndex: 1 },
      // React pair: the input after a thumb has keyboard focus (the thumb draws its ring).
      ':root:not([data-modality=pointer]) &[data-index]:has(+ input:focus-visible)': { zIndex: 1, outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      [FORCED]: { forcedColorAdjust: 'none', bg: 'CanvasText' },
    },
  },
});

export const progress = defineSlotRecipe({
  className: 'ui-progress',
  description: 'Progress bar (ui-progress, React Progress): determinate or indeterminate.',
  slots: ['root', 'track', 'indicator'],
  base: {
    root: {
      ...host,
      '&:not([data-indeterminate]) > [data-part=track] > [data-part=indicator]': { transition: t('reveal', 'width') },
      '&[data-indeterminate] > [data-part=track] > [data-part=indicator]': { width: '30%', animation: 'ui-indeterminate 1.2s ease-in-out infinite' },
      // Reduced motion: no sweep; a full, faint fill still says "working".
      [REDUCED]: { '&[data-indeterminate] > [data-part=track] > [data-part=indicator]': { animation: 'none', width: '100%', translate: 'none', opacity: 0.4 } },
      // React: the native element stays in the accessibility tree; the track paints it.
      '& > progress': { position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' },
    },
    track,
    indicator: fill,
  },
});

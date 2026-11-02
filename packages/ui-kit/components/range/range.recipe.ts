// Slot recipes for <ui-range>, <ui-progress> and the React Range, Progress (resolveTrack): a 4u
// track rounded at half height. The range thumb sits inside it like a switch thumb (track − u,
// inset 0.5u) and travels W − track. The fill ends one track-radius past the thumb's center
// (track + p·(W − track)) with the track's radius, so its round cap stays concentric around the
// thumb at every value. --track and --track-r are geometry variables; --ui-ratio is set by script.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, t } from '../recipe-parts.ts';

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
  description: 'Slider (ui-range, React Range): track, fill and thumb.',
  slots: ['root', 'track', 'fill', 'thumb'],
  base: {
    root: {
      ...host, fontFamily: UI_FONT, cursor: 'pointer', touchAction: 'none', userSelect: 'none',
      _disabled: { opacity: 0.5, cursor: 'not-allowed' },
      _enabled: {
        '&:hover': { '& > [data-part=track]': { bg: 'bg.mutedHover' }, '& > [data-part=track] > [data-part=fill]': { bg: 'primary.solidHover' } },
        // Dragging (data-dragging, from pointer down to up).
        _dragging: { cursor: 'grabbing', '& > [data-part=thumb]': { boxShadow: 'md' } },
      },
      // The thumb and fill glide on keyboard steps; while dragging they track 1:1.
      '&:not([data-dragging])': {
        '& > [data-part=thumb]': { transition: `${t('toggle', 'margin-inline-start')}, ${t('feedback', 'box-shadow')}` },
        '& > [data-part=track] > [data-part=fill]': { transition: `${t('toggle', 'width')}, ${t('feedback', 'background-color')}` },
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
    },
    track,
    fill: { ...fill, width: 'calc(var(--track) + var(--ui-ratio, 0) * (100% - var(--track)))' },
    thumb: {
      display: 'block', gridArea: '1 / 1', width: 'calc(var(--track) - var(--u))', height: 'calc(var(--track) - var(--u))',
      borderRadius: 'max(0px, calc(var(--track-r) - 0.5 * var(--u)))',
      marginInlineStart: 'calc(0.5 * var(--u) + var(--ui-ratio, 0) * (100% - var(--track)))',
      bg: 'white', borderWidth: 'var(--b)', borderColor: 'primary.solid', boxShadow: 'sm',
      [FORCED]: { forcedColorAdjust: 'none', bg: 'CanvasText' },
    },
  },
});

export const progress = defineSlotRecipe({
  className: 'ui-progress',
  description: 'Progress bar (ui-progress, React Progress): determinate or indeterminate.',
  slots: ['root', 'track', 'fill'],
  base: {
    root: {
      ...host,
      '&:not([data-indeterminate]) > [data-part=track] > [data-part=fill]': { transition: t('reveal', 'width') },
      '&[data-indeterminate] > [data-part=track] > [data-part=fill]': { width: '30%', animation: 'ui-indeterminate 1.2s ease-in-out infinite' },
      // Reduced motion: no sweep; a full, faint fill still says "working".
      [REDUCED]: { '&[data-indeterminate] > [data-part=track] > [data-part=fill]': { animation: 'none', width: '100%', translate: 'none', opacity: 0.4 } },
      // React: the native element stays in the accessibility tree; the track paints it.
      '& > progress': { position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' },
    },
    track,
    fill,
  },
});

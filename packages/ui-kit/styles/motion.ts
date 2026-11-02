// Motion: which properties animate, on which spring (tokens/motion: durations.<spring> and
// easings.<spring> are a pair). Springs are SwiftUI-style, sampled into linear(); reduced motion
// collapses every duration in reset.ts. Only paint and transform properties animate, never lengths
// that move layout, except the range/progress fill and the swiper dot, which own their box.
import { defineGlobalStyles } from '@pandacss/dev';

const t = (spring: 'quick' | 'smooth' | 'snappy' | 'bouncy', ...props: string[]) =>
  props.map((p) => `${p} {durations.${spring}} {easings.${spring}}`).join(', ');

const PAINT = ['background-color', 'color', 'border-color', 'box-shadow', 'opacity', 'outline-color'];
const BUTTON = ':is(ui-button, [data-ui=button])';
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';

export const motion = defineGlobalStyles({
  // Hover, press, selection and validity: color and shadow on the quick spring.
  [`${BUTTON}, ${CONTROL}, ui-chip, ui-option, [data-part=box], :is(ui-range, ui-progress) > [data-part=track], ui-palette > ui-swatch, ui-chip [data-remove]`]: {
    transition: t('quick', ...PAINT),
  },

  // Switch thumb and radio dot: snappy, with a hint of overshoot.
  'ui-switch [data-part=box]::after': { transition: `${t('snappy', 'translate')}, ${t('quick', 'background-color')}` },
  'ui-radio [data-part=box]::after': { transition: t('snappy', 'background-color', 'scale') },
  'ui-radio:not([aria-checked=true]) [data-part=box]::after': { scale: 0.4 },

  // Select: the chevron turns; the popup fades and grows from its trigger edge.
  'ui-select [data-part=chevron]': { transition: t('snappy', 'rotate') },
  'ui-select > [data-part=popup]': {
    transformOrigin: 'top center',
    opacity: 0, scale: 0.97,
    transition: `${t('smooth', 'opacity', 'scale')}, display {durations.smooth} allow-discrete, overlay {durations.smooth} allow-discrete`,
  },
  'ui-select > [data-part=popup]:popover-open': { opacity: 1, scale: 1 },
  '@starting-style': { 'ui-select > [data-part=popup]:popover-open': { opacity: 0, scale: 0.97 } },

  // Range: the thumb and fill glide on keyboard steps; while dragging (:active) they track 1:1.
  'ui-range:not(:active) > [data-part=thumb]': { transition: `${t('snappy', 'margin-inline-start')}, ${t('quick', 'box-shadow')}` },
  'ui-range:not(:active) > [data-part=track] > [data-part=fill]': { transition: `${t('snappy', 'width')}, ${t('quick', 'background-color')}` },
  'ui-progress:not([data-indeterminate]) > [data-part=track] > [data-part=fill]': { transition: t('smooth', 'width') },

  // Swiper: the active dot stretches; hover controls fade.
  'ui-swiper [data-part=dot]::before': { transition: t('snappy', 'width', 'opacity') },
  'ui-swiper[hover-controls] :is([data-part=paddle], [data-part=dots])': { transition: t('smooth', 'opacity') },
});

// Motion: which properties animate, for which intent (tokens/motion INTENTS: feedback → quick,
// toggle → snappy, reveal → smooth, emphasis → bouncy; durations.<intent> and easings.<intent> are
// a pair, and carry --ui-motion-scale and --ui-motion-bounce). Springs are SwiftUI-style, sampled into linear(); reduced motion
// collapses every duration in reset.ts. Only paint and transform properties animate, never lengths
// that move layout, except the range/progress fill and the swiper dot, which own their box.
import { defineGlobalStyles } from '@pandacss/dev';
import type { IntentName } from '../tokens/motion/index.ts';

const t = (intent: IntentName, ...props: string[]) =>
  props.map((p) => `${p} {durations.${intent}} {easings.${intent}}`).join(', ');

const PAINT = ['background-color', 'color', 'border-color', 'box-shadow', 'opacity', 'outline-color'];
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';

export const motion = defineGlobalStyles({
  // Hover, press, selection and validity: color and shadow (feedback).
  [`${CONTROL}, ui-option, [data-part=box], :is(ui-range, ui-progress) > [data-part=track], ui-palette > ui-swatch`]: {
    transition: t('feedback', ...PAINT),
  },

  // Switch thumb and radio dot: toggle, with a hint of overshoot.
  'ui-switch [data-part=box]::after': { transition: `${t('toggle', 'translate')}, ${t('feedback', 'background-color')}` },
  'ui-radio [data-part=box]::after': { transition: t('toggle', 'background-color', 'scale') },
  'ui-radio:not([aria-checked=true]) [data-part=box]::after': { scale: 0.4 },

  // Select: the chevron turns; the popup fades and grows from its trigger edge.
  'ui-select > [data-part=trigger] > [data-part=trailing]': { transition: t('toggle', 'rotate') },
  'ui-select > [data-part=popup]': {
    transformOrigin: 'top center',
    opacity: 0, scale: 0.97,
    transition: `${t('reveal', 'opacity', 'scale')}, display {durations.reveal} allow-discrete, overlay {durations.reveal} allow-discrete`,
  },
  'ui-select > [data-part=popup]:popover-open': { opacity: 1, scale: 1 },
  '@starting-style': { 'ui-select > [data-part=popup]:popover-open': { opacity: 0, scale: 0.97 } },

  // Range: the thumb and fill glide on keyboard steps; while dragging (:active) they track 1:1.
  'ui-range:not(:active) > [data-part=thumb]': { transition: `${t('toggle', 'margin-inline-start')}, ${t('feedback', 'box-shadow')}` },
  'ui-range:not(:active) > [data-part=track] > [data-part=fill]': { transition: `${t('toggle', 'width')}, ${t('feedback', 'background-color')}` },
  'ui-progress:not([data-indeterminate]) > [data-part=track] > [data-part=fill]': { transition: t('reveal', 'width') },

  // Swiper: the active dot stretches; hover controls fade.
  'ui-swiper [data-part=dot]::before': { transition: t('toggle', 'width', 'opacity') },
  'ui-swiper[hover-controls] :is([data-part=paddle], [data-part=dots])': { transition: t('reveal', 'opacity') },
});

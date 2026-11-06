// Slot recipe for <ui-spinner> and the React Spinner (resolveSpinner): a 4u ring with a u/2 stroke, 2u
// from its label. The ring paints in the surrounding text color, so it works on any surface. One turn
// takes three reveal durations; the turn is linear, since a spring would pulse. Under reduced motion it
// holds still: the reset only shortens animations, which would spin an infinite one faster.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED } from '../recipe-parts.ts';
import { SPINNER } from '../../tokens/geometry/resolve.ts';

export const spinner = defineSlotRecipe({
  className: 'ui-spinner',
  description: 'Spinner (ui-spinner, React Spinner): a ring for pending work of unknown length.',
  slots: ['root', 'ring', 'label'],
  base: {
    root: { display: 'inline-flex', alignItems: 'center', gap: `calc(${SPINNER.gap} * var(--u))`, textStyle: 'body-sm', maxWidth: 'full' },
    ring: {
      display: 'block', position: 'relative', flexShrink: 0,
      width: `calc(${SPINNER.ring} * var(--u))`, height: `calc(${SPINNER.ring} * var(--u))`,
      // The stroke turns on a layer of its own, so the ring's box holds still for layout and measurement.
      '&::before': {
        content: '""', position: 'absolute', inset: 0, boxSizing: 'border-box', borderRadius: '50%',
        borderStyle: 'solid', borderWidth: `calc(${SPINNER.stroke} * var(--u))`,
        borderColor: 'color-mix(in oklch, currentColor 25%, transparent)', borderBlockStartColor: 'currentColor',
        animation: 'ui-spin calc(3 * {durations.reveal}) linear infinite',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        [FORCED]: { borderColor: 'Canvas', borderBlockStartColor: 'CanvasText' },
      },
    },
    label: { minWidth: 0, '&[hidden]': { display: 'none' } },
  },
});

// Slot recipe for <ui-value-slider> and the React ValueSlider (resolveValueSlider): the kit's range,
// grown to control height, with its label and value inside the track and a thin bar for a thumb.
// The range keeps its keyboard, pointer and form behavior; this only changes how it's drawn.
import { defineSlotRecipe } from '@pandacss/dev';

const RANGE = ':is(ui-range, [data-ui=range])';
const TEXT = { position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 };

export const valueSlider = defineSlotRecipe({
  className: 'ui-value-slider',
  description: 'A range with its label and value inside the track (ui-value-slider, React ValueSlider).',
  slots: ['root', 'label', 'value'],
  base: {
    root: {
      display: 'block', position: 'relative', minWidth: 0, width: '100%', '--vs-h': 'var(--h)', '--vs-r': 'var(--radius)',
      [`& > ${RANGE}`]: { '--track': 'var(--vs-h)', width: '100%', height: 'var(--vs-h)' },
      [`& > ${RANGE} > [data-part=track]`]: { height: 'var(--vs-h)', borderRadius: 'var(--vs-r)', bg: 'bg.muted', overflow: 'hidden' },
      [`& > ${RANGE} > [data-part=track] > [data-part=indicator]`]: { height: '100%', borderRadius: 0, bg: 'bg.control' },
      // A panel of numbers tracks the value 1:1, on mount too: no glide.
      [`& > ${RANGE}:not([data-dragging]) > [data-part=track] > [data-part=indicator], & > ${RANGE}:not([data-dragging]) > [data-part=thumb]`]: { transition: 'none' },
      [`& > ${RANGE} > [data-part=thumb]`]: { width: 'max(2px, calc(0.5 * var(--u)))', height: 'var(--slot)', borderRadius: 'full', bg: 'fg.strong', boxShadow: 'none' },
    },
    label: { ...TEXT, insetInlineStart: 'calc(2 * var(--u))', textStyle: 'control-md', color: 'fg.muted' },
    value: { ...TEXT, insetInlineEnd: 'calc(2 * var(--u))', textStyle: 'control-md', fontWeight: 'semibold', color: 'fg.strong', fontVariantNumeric: 'tabular-nums' },
  },
});

export { valueSlider as 'value-slider' };

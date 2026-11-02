// Slot recipe for <ui-fieldset> / React Fieldset (Base UI Fieldset.Root, Fieldset.Legend): a column
// of the legend and the fields, spaced with the collection gap of the container ladder (theme
// gap-collection, default 2u; the gap attribute wins), with no box of its own (resolveFieldset). The
// React renderer is a native <fieldset>: its user-agent margin, padding, border and min-inline-size
// are reset so both renderers lay out the same. The legend is the title type role; a disabled
// fieldset fades it (the controls fade themselves through their own data-disabled).
import { defineSlotRecipe } from '@pandacss/dev';
import { UI_FONT } from '../recipe-parts.ts';

export const fieldset = defineSlotRecipe({
  className: 'ui-fieldset',
  description: 'Named set of fields (ui-fieldset, React Fieldset): a legend and its fields in a column.',
  slots: ['root', 'legend'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', minWidth: '0', minInlineSize: '0',
      gap: 'calc(var(--ui-gap, var(--ui-gap-collection)) * var(--ui-unit) * 1px)',
      margin: '0', padding: '0', borderWidth: '0', fontFamily: UI_FONT,
    },
    legend: {
      textStyle: 'title', color: 'fg', padding: '0', float: 'none', maxWidth: 'full',
      _disabled: { opacity: 0.5 },
    },
  },
});

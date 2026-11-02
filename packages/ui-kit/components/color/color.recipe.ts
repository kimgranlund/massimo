// Slot recipes for <ui-swatch>, <ui-palette> and the React Swatch, Palette (resolveSwatch): a 6u
// swatch; a palette attaches swatches with no gap inside a 2u-radius strip. The color is a
// continuous value: --ui-swatch-color, set by script.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, PAINT, UI_FONT, t } from '../recipe-parts.ts';

const CHECKER = 'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)';
const SWATCH = '& > :is(ui-swatch, [data-ui=swatch])';
// A swatch's state in a selectable palette: data-selected and data-highlighted on both renderers
// (React: the label around the native radio).
const SELECTED = '[data-selected]';
const ACTIVE = '[data-highlighted]';

export const swatch = defineSlotRecipe({
  className: 'ui-swatch',
  description: 'Color chip (ui-swatch, React Swatch).',
  slots: ['root'],
  base: {
    root: {
      display: 'inline-block', width: 'var(--slot)', height: 'var(--slot)', borderRadius: 'calc(var(--u) * var(--ui-radius-scale))', flexShrink: 0,
      backgroundColor: 'var(--ui-swatch-color, transparent)',
      // Opaque colors paint one layer; translucent or missing ones (data-alpha) sit on a checkerboard.
      '&[data-alpha]': {
        backgroundImage: `linear-gradient(var(--ui-swatch-color, transparent), var(--ui-swatch-color, transparent)), ${CHECKER}`,
        backgroundSize: '100% 100%, calc(2 * var(--u)) calc(2 * var(--u))',
      },
      // A color that does not parse: a diagonal strike over the empty checkerboard.
      '&[data-invalid]': {
        backgroundSize: '100% 100%, calc(2 * var(--u)) calc(2 * var(--u))',
        backgroundImage: `linear-gradient(to top right, transparent calc(50% - 1px), var(--colors-critical-solid) 0 calc(50% + 1px), transparent 0), ${CHECKER}`,
      },
      // React, in a selectable palette: the native radio is invisible; the swatch paints it.
      '&:has(> input)': { position: 'relative' },
      '& > input': { position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: 0, pointerEvents: 'none' },
      [FORCED]: FORCED_EDGE,
    },
  },
});

export const palette = defineSlotRecipe({
  className: 'ui-palette',
  description: 'Strip of swatches (ui-palette, React Palette); selectable makes it a listbox / radio group.',
  slots: ['root'],
  base: {
    root: {
      display: 'inline-flex', position: 'relative', borderRadius: 'calc(2 * var(--u) * var(--ui-radius-scale))', overflow: 'hidden',
      fontFamily: UI_FONT,
      // A subtle edge drawn over the swatches (no space, follows the strip's radius).
      _after: { content: '""', position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: 'inset 0 0 0 1px var(--colors-border)', pointerEvents: 'none' },
      [SWATCH]: { borderRadius: 0, flex: '1 0 var(--slot)', transition: t('feedback', ...PAINT) },
      _disabled: { opacity: 0.5, cursor: 'not-allowed', '& > *': { cursor: 'not-allowed', pointerEvents: 'none' } },
      _invalid: { outline: '2px solid {colors.critical.solid}', outlineOffset: '2px' },
      [FORCED]: { _disabled: { color: 'GrayText' } },
    },
  },
  variants: {
    selectable: {
      true: {
        root: {
          _enabled: {
            cursor: 'pointer',
            [SWATCH]: { cursor: 'pointer' },
            [`${SWATCH}:not(${SELECTED}):hover`]: { boxShadow: 'inset 0 0 0 2px color-mix(in oklch, var(--colors-bg) 70%, transparent)' },
          },
          [`${SWATCH}${SELECTED}`]: { boxShadow: 'inset 0 0 0 2px var(--colors-bg), inset 0 0 0 4px var(--colors-fg)' },
          _keyboard: { [`${SWATCH}${ACTIVE}`]: { outline: '2px solid {colors.focusRing}', outlineOffset: '-2px' } },
        },
      },
      false: {},
    },
    orientation: {
      horizontal: {},
      // Vertical: a column of swatches; each keeps at least 6u of height and fills the strip's width.
      vertical: { root: { flexDirection: 'column', [SWATCH]: { width: 'auto' } } },
    },
  },
  defaultVariants: { selectable: false, orientation: 'horizontal' },
});

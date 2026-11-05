// Slot recipes for <ui-field> / React Field and <ui-field-grid> / React FieldGrid.
// A field is a grid that places children by part: the label, the control (every child that is not
// a part), the readout and the description. Lines are counted from both ends (1 / -1, -2 / -1) so
// the same placement works in the field's own columns and in the three columns of a field grid,
// where each field is a subgrid row. Lengths are Panda spacing and sizes tokens (multiples of u).
import { defineSlotRecipe } from '@pandacss/dev';
import { NUMERIC_FEATURES } from '../../tokens/typography/resolve.ts';
import { voiceFamily } from '../../styles/typography.ts';
import { FIELD_TEXT_EDGE, UI_FONT, fieldParts } from '../recipe-parts.ts';

/** Every child that is not one of the field's parts: the control. */
const CONTROL = '& > :not([data-part])';
/** A field that shows a readout. */
const WITH_READOUT = '&:has(> [data-part=readout]:not([hidden]))';
/**
 * In a field grid the field is a subgrid row over the grid's three columns. Written in each layout
 * variant: Panda layers a recipe's base styles below its variants, so a rule in the grid recipe's
 * base would lose to the variant's own template whatever its specificity.
 */
const IN_GRID = { '.ui-field-grid__root > &': { gridColumn: '1 / -1', gridTemplateColumns: 'subgrid' } };
/** Choices keep their own width (the indicator plus its label), at the start of the column. */
const CHOICE = ':is([role=checkbox], [role=switch], [role=radio], :has(> input:is([type=checkbox], [type=radio])))';

/** Text-entry kit controls, in both renderers: a stacked field's text lines up with theirs. */
const TEXT_CONTROL = ':is(.ui-input__root, .ui-select__root, .ui-combobox__root, .ui-autocomplete__root, .ui-number-field__root)';

export const field = defineSlotRecipe({
  className: 'ui-field',
  description: 'Labelled field row (ui-field, React Field): label with unit, control, readout, description, error.',
  slots: ['root', 'label', 'contents', 'suffix', 'readout', 'description', 'error'],
  base: {
    root: {
      display: 'grid', alignItems: 'center', columnGap: '2', fontFamily: UI_FONT, minWidth: '0',
      [CONTROL]: { minWidth: '0' },
      [`${CONTROL}${CHOICE}`]: { justifySelf: 'start' },
      // Required control (data-required on a kit control's host; a bare native control's [required]):
      // a marker after the label text, as on ui-input and ui-select.
      '&:has(> [data-required], :is(input, select)[required]) > [data-part=label] > [data-part=contents]::after': { content: '" *"', color: 'critical.fg' },
      // Disabled control (data-disabled; a bare native control's :disabled): the label fades with it.
      '&:has(> [data-disabled], :is(input, select):disabled) > [data-part=label]': { opacity: 0.5 },
    },
    label: {
      ...fieldParts.label, paddingInlineStart: 0,
      display: 'flex', alignItems: 'baseline', gap: '1', minWidth: '0', whiteSpace: 'nowrap',
    },
    contents: { overflow: 'hidden', textOverflow: 'ellipsis', minWidth: '0' },
    // The unit reads as a suffix of the label: muted further and never truncated.
    suffix: { flexShrink: 0, color: 'fg.subtle', fontVariantNumeric: NUMERIC_FEATURES },
    // Figures in the numeric voice, end-aligned so a column of readouts lines up on the right.
    // Single line at 1.2 × font (like control text), so at small u the readout never makes the row
    // taller than its 8u control (the label role's 1.4 rounds to 18px at u = 2).
    readout: {
      textStyle: 'label', fontFamily: voiceFamily('numeric'), fontVariantNumeric: NUMERIC_FEATURES,
      color: 'fg.muted', textAlign: 'end', whiteSpace: 'nowrap', minWidth: '10', lineHeight: 'tight',
    },
    description: { ...fieldParts.description, paddingInlineStart: 0, gridColumn: '1 / -1' },
    // The error message (Base UI Field.Error) takes the description's place, after it.
    error: { ...fieldParts.error, paddingInlineStart: 0, gridColumn: '1 / -1' },
  },
  variants: {
    layout: {
      // Label above; the control and the readout share the row below.
      stacked: {
        root: {
          gridTemplateColumns: 'minmax(0, 1fr) auto', rowGap: '1.5',
          '& > [data-part=label]': { gridColumn: '1 / -1' },
          // Over a text control, the field's text starts where the control's text does.
          [`&:has(> ${TEXT_CONTROL}) > :is([data-part=label], [data-part=description], [data-part=error])`]: { paddingInlineStart: FIELD_TEXT_EDGE },
          [CONTROL]: { gridColumn: '1 / -1' },
          [`${WITH_READOUT} > :not([data-part])`]: { gridColumn: '1 / -2' },
          '& > [data-part=readout]': { gridColumn: '-2 / -1' },
          ...IN_GRID,
        },
      },
      // Label beside the control: label | control | readout; the description sits under the control.
      inline: {
        root: {
          gridTemplateColumns: 'auto minmax(0, 1fr) auto', rowGap: '1',
          // The unit sits at the label column's end, next to the control.
          // Single line at 1.2 × font beside the control, so the row stays the control's 8u at small u.
          '& > [data-part=label]': { gridColumn: '1 / 2', alignSelf: 'center', justifyContent: 'space-between', gap: '2', lineHeight: 'tight' },
          [CONTROL]: { gridColumn: '2 / -1' },
          [`${WITH_READOUT} > :not([data-part])`]: { gridColumn: '2 / -2' },
          '& > [data-part=readout]': { gridColumn: '-2 / -1' },
          '& > :is([data-part=description], [data-part=error])': { gridColumn: '2 / -1' },
          ...IN_GRID,
        },
      },
    },
  },
  defaultVariants: { layout: 'stacked' },
});

/**
 * Field grid: shared columns label | control | readout. The label column is content-sized up to 40%
 * of the grid (longer labels truncate), the control fills, the readout column fits the widest
 * readout. Each field child is a subgrid row (IN_GRID, in the field recipe); any other child (a group
 * heading) spans every column.
 */
export const fieldGrid = defineSlotRecipe({
  className: 'ui-field-grid',
  description: 'Shared label | control | readout columns for ui-field rows (ui-field-grid, React FieldGrid).',
  slots: ['root'],
  base: {
    root: {
      display: 'grid', gridTemplateColumns: 'fit-content(40%) minmax(0, 1fr) auto', columnGap: '2', rowGap: '2', alignItems: 'center',
      '& > :not(.ui-field__root)': { gridColumn: '1 / -1' },
      // Group headings: the group kicker, with room above every heading but the first.
      '& > :is(h1, h2, h3, h4, h5, h6, [role=heading])': { textStyle: 'group-kicker', color: 'neutral.10' },
      '& > :is(h1, h2, h3, h4, h5, h6, [role=heading]):not(:first-child)': { paddingTop: '4' },
    },
  },
});

// The manifest names each node's recipe by its id (component:field-grid).
export { fieldGrid as 'field-grid' };

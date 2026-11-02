// Slot recipes for <ui-listbox>, <ui-segmented>, <ui-option> and the React Listbox, Segmented,
// Option (and the native <option>s of the React Select). Lists are composites: their padding, gap,
// border and radius, and each option's height, inset and radius, are the composite geometry in
// styles/geometry.ts, which these recipes leave alone.
import { defineSlotRecipe } from '@pandacss/dev';
import { CRITICAL_TINT, FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, constructionPattern, t } from '../recipe-parts.ts';

// Option state: ARIA on the web component and the React option; a native <option> in the React
// Select uses :checked, :disabled and :focus.
const SELECTED = ':is([aria-selected=true], :checked)';
const ACTIVE = ':is([data-active], :focus)';
const ENABLED = ':not([aria-disabled=true], :disabled)';
const IN_LIST = ':is(ui-listbox, ui-segmented, [data-ui=listbox], [data-ui=segmented]) > &';
const IN_SEGMENTED = ':is(ui-segmented, [data-ui=segmented]) > &';

/** A list host: disabled fades and blocks its options; invalid tints the fill. */
const list = (extra: Record<string, any>) => ({
  root: {
    fontFamily: UI_FONT,
    _disabled: { opacity: 0.5, cursor: 'not-allowed', '& > *': { cursor: 'not-allowed', pointerEvents: 'none' } },
    _userInvalid: { bg: CRITICAL_TINT(14) },
    [FORCED]: { ...FORCED_EDGE, _disabled: { color: 'GrayText' } },
    ...extra,
  },
});

export const listbox = defineSlotRecipe({
  className: 'ui-listbox',
  description: 'Single-choice list (ui-listbox, React Listbox).',
  slots: ['root'],
  base: list({ display: 'flex', flexDirection: 'column', borderColor: 'border', bg: 'bg.subtle' }),
});

export const segmented = defineSlotRecipe({
  className: 'ui-segmented',
  description: 'Segmented control (ui-segmented, React Segmented).',
  slots: ['root'],
  base: list({ display: 'inline-flex', bg: 'bg.muted', borderColor: 'transparent' }),
});

export const option = defineSlotRecipe({
  className: 'ui-option',
  description: 'One choice in a listbox, segmented control or select (ui-option, React Option / SelectOption).',
  slots: ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing'],
  base: {
    root: {
      display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', fontFamily: UI_FONT,
      transition: t('feedback', ...PAINT),
      ...constructionPattern({
        slot: 'var(--u)', bare: 'calc(2 * var(--u))',
        text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)' },
      }),
      '& > [data-part=contents]': { minWidth: 'var(--slot)' },
      [`&${ACTIVE}`]: { bg: 'bg.muted' },
      [`&${SELECTED}`]: { bg: 'primary.subtle', color: 'primary.fg', fontWeight: 'medium', [FORCED]: FORCED_ON },
      '&:is([aria-disabled=true], :disabled)': { opacity: 0.45, cursor: 'not-allowed' },
      [`&${ENABLED}:hover`]: { bg: 'bg.mutedHover' },
      [`&${ENABLED}:active`]: { bg: 'bg.mutedActive' },
      [`&${SELECTED}${ENABLED}:is(:hover, :active)`]: { bg: 'primary.subtleHover' },
      // Segmented: options share the row, labels centered and muted until hovered or selected.
      [IN_SEGMENTED]: { flex: '1', justifyContent: 'center', color: 'fg.muted', '& > [data-part=contents]': { flex: '1', justifyContent: 'center' } },
      [`${IN_SEGMENTED}${ACTIVE}`]: { bg: 'transparent' },
      // Selected option in a listbox or segmented control: the lightest neutral with strong text in
      // light, the primary solid with its contrast text in dark (bg.selected / fg.selected). Select
      // popups keep the primary-subtle selection, since neutral 1 is the popup's own fill.
      [`${IN_LIST}${SELECTED}`]: { bg: 'bg.selected', color: 'fg.selected', boxShadow: 'sm' },
      [`${IN_SEGMENTED}${ENABLED}:hover`]: { color: 'fg' },
      [`${IN_LIST}${SELECTED}${ENABLED}:is(:hover, :active)`]: { bg: 'bg.selected' },
      [FORCED]: { '&:is([aria-disabled=true], :disabled)': { color: 'GrayText' } },
    },
  },
});

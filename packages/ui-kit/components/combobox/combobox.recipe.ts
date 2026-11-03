// Slot recipes for <ui-combobox>, <ui-autocomplete> and their React renderers (combobox, autocomplete), in Base UI Combobox's
// anatomy: the input row (our control part: [leading] [prefix] [chips] [input] [suffix] [clear]
// [trigger], laid out as the select trigger, resolveCombobox), the popup and its list (the select's
// composite floating layer, the options being <ui-option>s / Combobox.Item) and the empty state.
// The web component's input is a contenteditable; the React one a native <input>.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED, anchoredPopup, composite, fieldControl, fieldParts, fieldRoot, floatingOpen, floatingPopup, mergeStyles, sideOrigins, t } from '../recipe-parts.ts';

const INPUT = '[data-part=input]';
const BUTTONS = ':is([data-part=clear], [data-part=trigger])';
const shown = (part: string) => `${part}:not([hidden])`;
// Each combobox scopes one shared anchor name: the popup sits 1u below its own input row.
const ANCHOR = '--ui-combobox-control';
const anchored = anchoredPopup({ anchor: ANCHOR, side: 'bottom', align: 'start' });
/** Chips and the row buttons nest in the row: the control radius less the 1u inset, at most half the slot. */
const NESTED_RADIUS = 'min(calc(var(--slot) / 2), max(0px, calc(var(--radius) - var(--u))))';
const SM_ICON = { width: 'var(--icon-sm)', height: 'var(--icon-sm)', flexShrink: 0 };

const SLOTS = ['root', 'label', 'control', 'leading', 'prefix', 'chips', 'chip', 'chip-remove', 'input', 'suffix', 'clear', 'trigger', 'popup', 'list', 'empty', 'description', 'error'];
const CHIP_SLOTS = ['chips', 'chip', 'chip-remove'];

/** The shared styles by slot; the autocomplete takes them without the chip slots. */
const base = {
    root: { ...fieldRoot, [ANCHORED]: { anchorScope: ANCHOR } },
    ...fieldParts,
    control: mergeStyles(fieldControl({
        invalid: ':is([data-invalid] > *)',
        disabled: ':is([data-disabled] > *, :has(> :disabled))',
        readonly: ':is([data-readonly] > *)',
      }), {
      cursor: 'text',
      // A text field shows focus also after a pointer click; the ring is on the row, not the text.
      ':root[data-modality] &:focus-within': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      [ANCHORED]: { anchorName: ANCHOR },
      // The input is the row's contents: 2u at a bare edge, 1u beside a slot, 0.5u beside text.
      [`& > ${INPUT}`]: {
        display: 'flex', alignItems: 'center', flex: '1', minWidth: 'calc(2 * var(--slot))', minHeight: 'var(--slot)',
        paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)', paddingInline: 'calc(2 * var(--u))', outline: 'none',
      },
      [`& > ${INPUT}[contenteditable]`]: { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none' },
      [`& > ${INPUT}[contenteditable]:empty::before`]: { content: 'attr(data-placeholder)', color: 'fg.subtle', pointerEvents: 'none' },
      [`& > ${INPUT}:is(input)`]: { height: 'var(--slot)', '&::placeholder': { color: 'fg.subtle' } },
      [`& > ${shown('[data-part=leading]')} ~ ${INPUT}`]: { paddingInlineStart: 'var(--u)' },
      [`& > ${shown('[data-part=prefix]')} ~ ${INPUT}${INPUT}`]: { paddingInlineStart: 'calc(0.5 * var(--u))' },
      [`& > [data-part=chips]:has(> *) ~ ${INPUT}${INPUT}${INPUT}`]: { paddingInlineStart: 'calc(0.5 * var(--u))' },
      [`& > ${INPUT}:has(~ ${shown(BUTTONS)})`]: { paddingInlineEnd: 'var(--u)' },
      [`& > ${INPUT}${INPUT}:has(~ ${shown('[data-part=suffix]')})`]: { paddingInlineEnd: 'calc(0.5 * var(--u))' },
      // Prefix and suffix around the input (the shared pattern knows contents and value, not input).
      [`& > [data-part=prefix][data-part=prefix]:has(~ ${INPUT})`]: { paddingInlineEnd: 'calc(0.5 * var(--u))' },
      [`& > ${INPUT} ~ [data-part=suffix][data-part=suffix]`]: { paddingInlineStart: 'calc(0.5 * var(--u))' },
      [`& > [data-part=suffix][data-part=suffix]:has(~ ${shown(BUTTONS)})`]: { paddingInlineEnd: 'var(--u)' },
      // Clear and trigger: 6u slots with an sm icon (Base UI Combobox.Clear, Combobox.Trigger).
      [`& > ${BUTTONS}`]: {
        display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)',
        borderRadius: NESTED_RADIUS, color: 'fg.muted', cursor: 'pointer', transition: t('feedback', 'color', 'background-color'),
        '& > *': SM_ICON,
        '&:hover': { color: 'fg' },
      },
      '& > [data-part=trigger] > *': { transition: t('toggle', 'rotate') },
      '& > [data-part=trigger][data-popup-open] > *': { rotate: '180deg' },
      // Multiple: chips flow in the row before the input; the row wraps, lines 0.5u apart.
      // The clear and trigger slots stay on the first line, at the row's end: out of flow, with the
      // end padding keeping their room, so wrapping never moves them to a line of their own.
      '&:has(> [data-part=chips]:not([hidden]) > *)': {
        flexWrap: 'wrap', height: 'auto', minHeight: 'var(--h)', rowGap: 'calc(0.5 * var(--u))',
        position: 'relative', paddingInlineEnd: 'calc(var(--pad) + var(--slot))',
        '& > [data-part=trigger]': { position: 'absolute', insetBlockStart: 'var(--pad)', insetInlineEnd: 'var(--pad)' },
        '& > [data-part=clear]': { position: 'absolute', insetBlockStart: 'var(--pad)', insetInlineEnd: 'calc(var(--pad) + var(--slot))' },
        '&:has(> [data-part=clear]:not([hidden]))': { paddingInlineEnd: 'calc(var(--pad) + 2 * var(--slot))' },
      },
      // After a leading slot or a prefix, the first chip keeps the 0.5u chip gap from it.
      [`& > :is(${shown('[data-part=leading]')}, ${shown('[data-part=prefix]')}) ~ [data-part=chips] > :first-child`]: { marginInlineStart: 'calc(0.5 * var(--u))' },
    }),
    // Combobox.Chips: no box of its own, so the chips lay out in the row.
    chips: { display: 'contents' },
    chip: {
      display: 'inline-flex', alignItems: 'center', flexShrink: 0, maxWidth: '100%', height: 'var(--slot)',
      marginInlineEnd: 'calc(0.5 * var(--u))', paddingInlineStart: 'var(--u)', borderRadius: NESTED_RADIUS,
      bg: 'bg.control', color: 'fg', lineHeight: 'var(--line)', whiteSpace: 'nowrap', cursor: 'default',
      '& > [data-part=contents]': { overflow: 'hidden', textOverflow: 'ellipsis' },
    },
    'chip-remove': {
      display: 'grid', placeItems: 'center', flexShrink: 0, width: 'var(--slot)', height: 'var(--slot)', borderRadius: 'inherit',
      color: 'fg.muted', cursor: 'pointer', transition: t('feedback', 'color', 'background-color'),
      '& > *': SM_ICON,
      '&:hover': { color: 'fg', bg: 'bg.controlHover' },
    },
    // The popup is the select's floating composite (recipe-parts.ts floatingPopup, anchoredPopup).
    popup: mergeStyles(floatingPopup, composite, { '--ui-gap': 'inherit' }, {
      ...sideOrigins,
      '&:popover-open': { display: 'flex', ...floatingOpen },
      [ANCHORED]: {
        ...anchored,
        '&[data-side=top]': { positionArea: 'block-start span-inline-end', marginBlockStart: 0, marginBlockEnd: 'var(--u)' },
      },
    }),
    // Combobox.List: the items' parent, transparent to layout (the popup is the composite).
    list: { display: 'contents' },
    // Combobox.Empty: one option row, its text where an option's label starts (Ic + 2u).
    empty: {
      display: 'flex', alignItems: 'center', minHeight: 'var(--ch)', paddingInline: 'calc(var(--ci) + 2 * var(--u))',
      color: 'fg.muted', fontSize: 'var(--font)', lineHeight: 'var(--line)',
      '&[hidden]': { display: 'none' },
    },
} as Record<string, Record<string, any>>;

export const combobox = defineSlotRecipe({
  className: 'ui-combobox',
  description: 'Filterable input with a popup list (ui-combobox, React Combobox).',
  slots: SLOTS,
  base,
});

/** ui-autocomplete, React Autocomplete: the combobox without chips (free text, no multiple). */
export const autocomplete = defineSlotRecipe({
  className: 'ui-autocomplete',
  description: 'Free text input with a popup of suggestions (ui-autocomplete, React Autocomplete).',
  slots: SLOTS.filter((x) => !CHIP_SLOTS.includes(x)),
  base: Object.fromEntries(Object.entries(base).filter(([k]) => !CHIP_SLOTS.includes(k))),
});

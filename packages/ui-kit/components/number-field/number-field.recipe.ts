// Slot recipe for <ui-number-field> and the React NumberField (Base UI NumberField anatomy): the scrub
// area holding the label, the group (the field control, resolveNumberField) with the decrement and
// increment steppers in its leading and trailing 6u slots around [prefix] [input] [suffix], then
// the description and error. The web component's input is a contenteditable; the React one a
// native <input>; the React steppers are native buttons.
import { defineSlotRecipe } from '@pandacss/dev';
import { ADORN_COLOR, FORCED, fieldControl, fieldParts, fieldRoot, mergeStyles, t, PAINT } from '../recipe-parts.ts';

// States come from the host's field state (data-invalid, data-disabled, data-readonly on the host,
// both renderers); a native input disabled by a <fieldset> is :disabled.
const INVALID = ':is([data-invalid] > *)';
const DISABLED = ':is([data-disabled] > *, :has(> :disabled))';
const READONLY = ':is([data-readonly] > *)';
const INACTIVE = ':is([data-disabled], [data-readonly])';

// The text run between the steppers (resolveTextRun with both slots): 2u at a bare edge, 1u beside
// a visible stepper, 0.5u beside another visible text part. Steppers and text parts are hidden
// (web) or absent (React) when unused.
const TEXT = ':is([data-part=prefix], [data-part=input], [data-part=suffix])';
const shown = (p: string) => `${p}:not([hidden])`;
const textRun = {
  [`& > ${TEXT}`]: {
    display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)',
    paddingInlineStart: 'calc(2 * var(--u))', paddingInlineEnd: 'calc(2 * var(--u))',
  },
  [`& > ${shown('[data-part=decrement]')} ~ ${TEXT}`]: { paddingInlineStart: 'var(--u)' },
  [`& > ${TEXT}:has(~ ${shown('[data-part=increment]')})`]: { paddingInlineEnd: 'var(--u)' },
  [`& > ${shown(TEXT)} ~ ${TEXT}${TEXT}`]: { paddingInlineStart: 'calc(0.5 * var(--u))' },
  [`& > ${TEXT}${TEXT}:has(~ ${shown(TEXT)})`]: { paddingInlineEnd: 'calc(0.5 * var(--u))' },
  '& > :is([data-part=prefix], [data-part=suffix])': { flexShrink: 0, whiteSpace: 'nowrap', color: ADORN_COLOR },
};

/** A stepper: the 6u slot, the glyph at icon size sm, the radius concentric with the control (R − the control inset). */
const stepper = {
  display: 'grid', placeItems: 'center', flexShrink: 0, width: 'var(--slot)', height: 'var(--slot)', padding: 0, border: 0,
  borderRadius: 'max(0px, calc(var(--radius) - var(--di) * var(--u)))', bg: 'transparent', color: 'fg.muted', cursor: 'default',
  userSelect: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  transition: t('feedback', ...PAINT),
  '& > *': { width: 'var(--icon-sm)', height: 'var(--icon-sm)', flexShrink: 0 },
  [`&:not([data-disabled]):is(:hover)`]: { bg: 'bg.control', color: 'fg' },
  [`&:not([data-disabled]):active`]: { bg: 'bg.controlActive' },
  '&[data-disabled]': { color: 'fg.subtle' },
  // The field's disabled fade already applies to the group; read-only steppers just stop.
  [`${INACTIVE} > * > &`]: { bg: 'transparent', color: 'fg.subtle' },
  [FORCED]: { color: 'ButtonText', '&[data-disabled]': { color: 'GrayText' } },
};

export const numberField = defineSlotRecipe({
  className: 'ui-number-field',
  description: 'Number field with steppers, a scrub area and locale formatting (ui-number-field, React NumberField).',
  slots: ['root', 'scrub-area', 'scrub-area-cursor', 'label', 'group', 'decrement', 'prefix', 'input', 'suffix', 'increment', 'description', 'error'],
  base: {
    root: mergeStyles(fieldRoot, {
      '&:is([hide-label], [data-hide-label]) > [data-part=scrub-area]': {
        position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden',
        clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
      },
      '&[data-required] > [data-part=scrub-area] > [data-part=label]::after': { content: '" *"', color: 'critical.fg' },
    }),
    'scrub-area': {
      display: 'flex', alignSelf: 'start', cursor: 'ew-resize', userSelect: 'none', touchAction: 'none',
      '&[data-direction=vertical]': { cursor: 'ns-resize' },
      [`${INACTIVE} > &`]: { cursor: 'default' },
    },
    // Base UI ScrubAreaCursor: while the pointer is locked to the scrub area, an icon in the top layer
    // at the virtual pointer (--ui-scrub-x / -y, set by script; it wraps at the viewport's edges).
    'scrub-area-cursor': {
      position: 'fixed', inset: '0 auto auto 0', margin: 0, padding: 0, border: 0, bg: 'transparent', overflow: 'visible',
      pointerEvents: 'none', color: 'fg', display: 'none',
      translate: 'calc(var(--ui-scrub-x, 0px) - 50%) calc(var(--ui-scrub-y, 0px) - 50%)',
      '&:popover-open': { display: 'block' },
      '& > i': { display: 'block', width: 'var(--icon)', height: 'var(--icon)' },
      [FORCED]: { color: 'CanvasText' },
    },
    label: { ...fieldParts.label, cursor: 'inherit' },
    description: fieldParts.description,
    error: fieldParts.error,
    group: mergeStyles(fieldControl({ invalid: INVALID, disabled: DISABLED, readonly: READONLY }), textRun, {
      // The ring sits on the group (the shape), not the text part inside it, after any focus.
      ':root[data-modality] &:focus-within': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      '& > [data-part=input]': { flex: '1', minWidth: 'var(--slot)' },
      '& > [data-part=input]:focus-visible': { outline: 'none' },
    }),
    decrement: stepper,
    increment: stepper,
    input: {
      // The web component's contenteditable editor.
      '&[contenteditable]': { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'text', minWidth: 0 },
      '&[contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.subtle', pointerEvents: 'none' },
      // A native text input keeps a minimum line box; pin it to the slot like the editor.
      '&:is(input)': { height: 'var(--slot)', width: '100%', bg: 'transparent', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'var(--line)', border: 0, outline: 'none' },
      '&:is(input)::placeholder': { color: 'fg.subtle' },
    },
  },
});

// The registry looks the recipe up by its component name.
export { numberField as 'number-field' };

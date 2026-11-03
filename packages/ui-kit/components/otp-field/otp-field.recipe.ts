// Slot recipe for <ui-otp-field> and the React OTPField (Base UI OTPField anatomy): the root row of
// input cells (each a square field control, resolveOtpField) and optional separators. The web
// component's cells are contenteditables; the React ones native <input>s.
import { defineSlotRecipe } from '@pandacss/dev';
import { CRITICAL_TINT, FORCED, FORCED_EDGE, UI_FONT, t, PAINT } from '../recipe-parts.ts';

// Cell states come from the cell's own data-* (both renderers set them) and the host's field state.
const INVALID = ':is([data-invalid] > *)';

export const otpField = defineSlotRecipe({
  className: 'ui-otp-field',
  description: 'One-time code field: N single-character cells over one value (ui-otp-field, React OTPField).',
  slots: ['root', 'input', 'separator'],
  base: {
    root: {
      display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap', gap: 'var(--u)', fontFamily: UI_FONT, maxWidth: '100%',
    },
    input: {
      // A square field control: 8u both ways, pad u − B inside the border, one centered character.
      display: 'block', flexShrink: 0, boxSizing: 'border-box', width: 'var(--h)', height: 'var(--h)', paddingInline: 'var(--pad)', paddingBlock: 'calc(var(--pad) + var(--line-pad))',
      borderWidth: 'var(--b)', borderColor: 'border.strong', borderRadius: 'var(--radius)', bg: 'bg.muted', color: 'fg',
      fontFamily: 'inherit', fontSize: 'var(--font)', fontWeight: 'inherit', lineHeight: 'var(--line)',
      textAlign: 'center', whiteSpace: 'pre', overflow: 'hidden', caretColor: 'currentColor', cursor: 'text', outline: 'none',
      transition: t('feedback', ...PAINT),
      '&:not([data-disabled], [data-readonly]):hover': { bg: 'bg.mutedHover' },
      // Text fields show focus after any press (the caret target must be visible).
      ':root[data-modality] &:focus': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      [`&${INVALID}`]: { borderColor: 'critical.solid', bg: CRITICAL_TINT(14), '&:hover': { bg: CRITICAL_TINT(20) } },
      '&[data-readonly]': { bg: 'bg.subtle', cursor: 'default' },
      '&[data-disabled], &:disabled': { opacity: 0.5, cursor: 'not-allowed' },
      '&[data-secret]': { WebkitTextSecurity: 'disc' },
      '&:is(input)': { minWidth: 0 },
      [FORCED]: FORCED_EDGE,
    },
    separator: {
      // A short dash in the 1u gap: 2u × 0.5u, radius 0.25u.
      flexShrink: 0, width: 'calc(2 * var(--u))', height: 'calc(0.5 * var(--u))', borderRadius: 'calc(0.25 * var(--u))', bg: 'fg.subtle',
      [FORCED]: { bg: 'CanvasText' },
    },
  },
});

// The registry looks the recipe up by its component name.
export { otpField as 'otp-field' };

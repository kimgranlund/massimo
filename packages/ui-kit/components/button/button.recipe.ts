// Slot recipe for <ui-button> and the React Button: the host is the button; the parts are the
// construction pattern (resolveButtonContents / resolveTextRun). Lengths are geometry variables.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, PAINT, UI_FONT, constructionPattern, t } from '../recipe-parts.ts';

// Text parts form one run: 0.5u + 0.5u between them, 1u beside a slot, 2u at a bare host edge.
const PATTERN = constructionPattern({
  slot: 'var(--u)', bare: 'calc(2 * var(--u))',
  text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)' },
});
const REDUCED = '@media (prefers-reduced-motion: reduce)';

export const button = defineSlotRecipe({
  className: 'ui-button',
  description: 'Action button (ui-button, React Button): neutral or primary, busy and disabled states.',
  slots: ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing'],
  base: {
    root: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
      borderRadius: 'var(--radius)', bg: 'bg.control', color: 'fg', fontFamily: UI_FONT, fontSize: 'var(--font)', lineHeight: 'var(--line)',
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      ...PATTERN,
      transition: t('feedback', ...PAINT),
      // Hover and press deepen the translucent control fill (matches neutral 3 → 4 → 5 on the page tone,
      // stays visible on muted surfaces). Busy buttons carry
      // aria-disabled too, so they are not enabled.
      _enabled: { _hover: { bg: 'bg.controlHover' }, '&:active': { bg: 'bg.controlActive' } },
      // Busy stays readable (no fade), with an indeterminate sweep along the bottom edge.
      _disabled: { '&:not([aria-busy=true])': { opacity: 0.5, cursor: 'not-allowed' } },
      _busy: {
        cursor: 'progress', position: 'relative', overflow: 'hidden',
        _after: {
          content: '""', position: 'absolute', insetInlineStart: 0, bottom: 0, width: '30%', height: 'calc(0.5 * var(--u))',
          bg: 'primary.solid', animation: 'ui-indeterminate 1.2s ease-in-out infinite',
        },
      },
      // Reduced motion: no sweep; a full, faint bar still says "working".
      [REDUCED]: { _busy: { _after: { animation: 'none', width: '100%', translate: 'none', opacity: 0.4 } } },
      [FORCED]: { ...FORCED_EDGE, _disabled: { color: 'GrayText' } },
    },
    contents: { minWidth: 'var(--slot)' },
  },
  variants: {
    variant: {
      neutral: {},
      // The primary solid with the contrast text color; hover and press use the solid hover step.
      // The busy sweep uses the contrast color, so it shows against the solid fill.
      primary: {
        root: {
          bg: 'primary.solid', color: 'fg.onSolid', borderColor: 'primary.solid',
          _enabled: { '&:is(:hover, :active)': { bg: 'primary.solidHover', borderColor: 'primary.solidHover' } },
          _busy: { _after: { bg: 'fg.onSolid' } },
        },
      },
    },
  },
  defaultVariants: { variant: 'neutral' },
});

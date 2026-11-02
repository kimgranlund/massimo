// Slot recipes for <ui-badge>, <ui-tag>, <ui-chip> and the React Badge, Tag, Chip. The height
// ladder and the local unit u′ (--lu, --pad, --slot, --radius) are geometry variables
// (styles/geometry.ts, resolveBtg); these recipes only say where they apply.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, constructionPattern, t } from '../recipe-parts.ts';

const SLOTS = ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing'] as const;

/** The shared base: host box and the construction-pattern parts in the local unit u′. */
function btgBase(text: Record<string, any>, adornColor: boolean) {
  return {
    root: {
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle', borderColor: 'transparent',
      height: 'var(--h)', minWidth: 'var(--h)', borderWidth: 'var(--b)', borderRadius: 'var(--radius)',
      fontFamily: UI_FONT, fontSize: 'var(--font)', padding: 'var(--pad)',
      [FORCED]: { _disabled: { color: 'GrayText' } },
      // Labels carry 1u′ on both sides (beside a slot too), text parts 0.25u′ + 0.25u′ apart. Icon
      // slots are height − u′ square; fill artwork (avatars) nests inside the 0.5u′ edge.
      ...constructionPattern({
        slot: 'var(--lu)', bare: text.bare ?? 'var(--lu)', between: 'calc(0.25 * var(--lu))', text: text.base,
        fillRadius: 'max(0px, calc(var(--radius) - 0.5 * var(--lu)))', adornColor,
      }),
    },
  };
}

// Tag and badge need no block padding, the row centers the text.
const ROW = { display: 'flex', alignItems: 'center', lineHeight: 'var(--line)' };

export const badge = defineSlotRecipe({
  className: 'ui-badge',
  description: 'Short status or count (ui-badge, React Badge).',
  slots: SLOTS,
  base: (() => {
    const b = btgBase({ base: ROW }, false);
    return { ...b, root: { ...b.root, justifyContent: 'center', bg: 'primary.solid', color: 'fg.onSolid', fontWeight: 'semibold', fontVariantNumeric: 'tabular-nums lining-nums' } };
  })(),
});

export const tag = defineSlotRecipe({
  className: 'ui-tag',
  description: 'Static label (ui-tag, React Tag).',
  slots: SLOTS,
  base: (() => {
    const b = btgBase({ base: { ...ROW, minHeight: 'var(--slot)' } }, true);
    return { ...b, root: { ...b.root, bg: 'bg.muted', color: 'fg' } };
  })(),
});

export const chip = defineSlotRecipe({
  className: 'ui-chip',
  description: 'Interactive label (ui-chip, React Chip): selectable toggle, removable.',
  slots: [...SLOTS, 'remove'],
  base: (() => {
    // Chip centers its text with block padding, and adds 0.5u′ at a bare edge (1.5u′) so text
    // balances an icon's artwork.
    const b = btgBase({ bare: 'calc(1.5 * var(--lu))', base: { ...ROW, minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)' } }, true);
    return {
      ...b,
      root: {
        ...b.root, bg: 'bg.muted', color: 'fg', borderColor: 'border.strong', userSelect: 'none',
        transition: t('feedback', ...PAINT),
        _disabled: { opacity: 0.5, cursor: 'not-allowed' },
        [FORCED]: { ...FORCED_EDGE, _disabled: { color: 'GrayText' } },
      },
      // The remove icon is a click target inside the chip, not a nested button.
      remove: { cursor: 'pointer', opacity: 0.7, transition: t('feedback', ...PAINT), _hover: { opacity: 1 } },
    };
  })(),
  variants: {
    // Only a selectable chip is a button; a plain or removable chip is a label (its x is the control).
    selectable: {
      true: {
        root: {
          _enabled: { cursor: 'pointer', _hover: { bg: 'bg.mutedHover' }, _active: { bg: 'bg.mutedActive' } },
          // Selected chips use the checkbox/switch "on" colors: the primary solid with on-solid text.
          _pressed: {
            bg: 'primary.solid', color: 'fg.onSolid', borderColor: 'primary.solid',
            _enabled: { '&:is(:hover, :active)': { bg: 'primary.solidHover' } },
            [FORCED]: FORCED_ON,
          },
        },
      },
      false: {},
    },
  },
  defaultVariants: { selectable: false },
});

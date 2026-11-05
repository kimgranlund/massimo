// The child of a card: <ui-section> and the React Section. The card holds the inset p (--ui-section-p,
// inherited) and has no padding of its own, so a section supplies it, as a control's slots fill its
// inset. A section of size c sits p − c in from the card's edge and pads c, so its text lands on p
// whatever c is, level with an unsized section and with its neighbors (resolveSection). A CSS-only tag,
// like ui-container.
import { defineSlotRecipe } from '@pandacss/dev';
import { CARD_PADDINGS } from '../../tokens/geometry/resolve.ts';
import { ROW_BLOCK, tagRules } from '../recipe-parts.ts';

const size = (k: string) => `calc(var(--ui-pad-card-${k}) * (0.5 + 0.5 * var(--ui-density)) * var(--ui-unit) * 1px)`;
const INSET = 'max(0px, calc(var(--sp) - var(--sc)))';

export const section = defineSlotRecipe({
  className: 'ui-section',
  description: 'A card\'s child (ui-section, React Section): supplies the card\'s inset, or part of it at a smaller size.',
  slots: ['root'],
  base: {
    root: {
      // Read here and reset for what is inside, so a section in a section adds nothing.
      '--sp': 'var(--ui-section-p, 0px)', '--sc': 'var(--sp)',
      '& > *': { '--ui-section-p': '0px' },
      display: 'flex', flexDirection: 'column', gap: 'inherit', minWidth: 0,
      // Padding equals gap, so one margin gives both: p above the first section, p below the last and,
      // collapsed, p between two. It reaches the card through plain wrappers.
      marginInline: INSET, marginBlock: 'var(--sp)', paddingInline: 'var(--sc)',
      // A sized section is a box: padded all round and spaced by the same length, its corners concentric
      // with the card's.
      '&[size]': {
        marginBlock: INSET, paddingBlock: 'var(--sc)', gap: 'var(--sc)',
        // The box is inside the card's border, so its distance from the card's edge includes it. Flush with
        // the card (inset 0) it is square: the card's own corners clip it, and stacked boxes meet in a line.
        borderRadius: `min(max(calc(var(--ui-section-r, 0px) - ${INSET} - var(--b)), calc(var(--ui-section-r, 0px) * var(--ui-container-ratio))), calc(${INSET} * 1000))`,
      },
      // A header is a row: a divided row's height. Padded, it has no margin, so the next section keeps its
      // own and moves out with its size. With `header="collapse"` the lower half is a margin, which
      // collapses with the next section's, so that section's top stays put at every size.
      '&[header]': { marginBlock: 0, paddingBlock: ROW_BLOCK, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
      '&[header=collapse]': { paddingBlockEnd: 0, marginBlockEnd: ROW_BLOCK },
      // Divided: every child is a full-bleed row, and the rows carry the padding.
      '&[divided]': { padding: 0, gap: 0, overflow: 'hidden', '&[size]': { boxShadow: 'inset 0 0 0 1px var(--colors-border)' } },
      '&[divided] > *': { paddingBlock: ROW_BLOCK, paddingInline: 'var(--sc)' },
      '&[divided] > * + *': { borderBlockStart: '1px solid var(--colors-border)' },
    },
  },
  variants: { size: Object.fromEntries(CARD_PADDINGS.map((k) => [k, { root: { '--sc': size(k) } }])) },
});

export const sectionTags = tagRules(':is(ui-section, [data-ui=section])', section);

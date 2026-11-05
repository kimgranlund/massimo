// React Section: the ui-section element as <div data-ui="section"> (section.recipe.ts), styled by the same global rules.
import type { HTMLAttributes } from 'react';
import type { CardPadding } from '../../tokens/geometry/resolve.ts';

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  /** The padding this section supplies, xs 2u … xl 8u. It sits the rest of the card's inset in from the edge, so its text stays on the card's inset. Default: all of it. */
  size?: CardPadding;
  /** Full-bleed rows with lines between them, outlined when the section has a size. */
  divided?: boolean;
  /** A title row: a divided row's height. `collapse` makes its lower half a margin, so the next section's top stays put at every size. */
  header?: boolean | 'collapse';
}

/** React Section (ui-section): a card's child, supplying the card's inset. */
export function Section({ size, divided, header, ...rest }: SectionProps) {
  return <div {...rest} data-ui="section" {...(size ? { size } : {})} {...(divided ? { divided: '' } : {})} {...(header ? { header: header === true ? '' : header } : {})} />;
}

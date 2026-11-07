// Slot recipe for <ui-button-link> and the React ButtonLink: the host hugs a real link that wears the
// button's own recipe and geometry (data-ui="button"), so the two can't drift apart. This recipe only
// adds what a link needs on top: no underline, and the link's own text color.
import { defineSlotRecipe } from '@pandacss/dev';

export const buttonLink = defineSlotRecipe({
  className: 'ui-button-link',
  description: 'A link that looks like a button (ui-button-link, React ButtonLink).',
  slots: ['root', 'link'],
  base: {
    root: { display: 'inline-flex', verticalAlign: 'middle' },
    link: { textDecoration: 'none' },
  },
});

export { buttonLink as 'button-link' };

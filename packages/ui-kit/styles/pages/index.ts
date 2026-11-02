// Page-level building blocks as Panda patterns: `page()` and `prose()` from styled-system/patterns.
import { definePattern } from '@pandacss/dev';

export const page = definePattern({
  description: 'Centered page column with gutters',
  properties: { width: { type: 'property', value: 'maxWidth' } },
  defaultValues: { width: '72rem' },
  transform: ({ width, ...rest }) => ({ maxWidth: width, marginInline: 'auto', paddingInline: '6', paddingBlock: '10', ...rest }),
});

export const prose = definePattern({
  description: 'Readable long-form text with vertical rhythm',
  transform: (props) => ({
    maxWidth: '65ch',
    '& > * + *': { marginTop: '4' },
    '& h1, & h2, & h3': { textStyle: 'heading' },
    '& a': { color: 'accent.fg', textDecoration: 'underline' },
    ...props,
  }),
});

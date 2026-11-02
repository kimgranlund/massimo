// Page-level building blocks as Panda patterns: `page()` and `prose()` from styled-system/patterns.
import { definePattern } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../../tokens/geometry/resolve.ts';

// page(): the page container level for Panda/React code, same lengths as <ui-page>:
// padding and gap from the theme ladder (inset.page, gap.page; border inside the padding), square,
// centered at a max width. `gap` takes units of u like the gap attribute; `width` sets the max width.
export const page = definePattern({
  description: 'Page container: theme page padding and gap, centered max width',
  properties: { width: { type: 'property', value: 'maxWidth' }, gap: { type: 'number' } },
  defaultValues: { width: `${PAGE_MAX_WIDTH_REM}rem` },
  transform: ({ width, gap, ...rest }) => ({
    display: 'flex', flexDirection: 'column', width: '100%', maxWidth: width, marginInline: 'auto',
    padding: 'inset.page',
    gap: gap === undefined ? 'gap.page' : `calc(${gap} * var(--ui-unit) * 1px)`,
    borderWidth: 'min(calc(var(--ui-border) * 1px), calc(var(--ui-unit) * 0.5px))', borderColor: 'transparent',
    ...rest,
  }),
});

export const prose = definePattern({
  description: 'Readable long-form text with vertical rhythm',
  transform: (props) => ({
    maxWidth: 'prose',
    '& > * + *': { marginTop: '4' },
    '& h1': { textStyle: 'heading-1' }, '& h2': { textStyle: 'heading-2' }, '& h3': { textStyle: 'heading-3' },
    '& a': { color: 'accent.fg', textDecoration: 'underline' },
    ...props,
  }),
});

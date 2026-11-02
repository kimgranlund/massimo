// Page-level building blocks as Panda patterns: `page()` and `prose()` from styled-system/patterns.
import { definePattern } from '@pandacss/dev';
import { PAGE_MAX_WIDTH_REM } from '../../tokens/geometry/resolve.ts';

// page(): the page container level for Panda/React code, same lengths as <ui-page>:
// padding and gap 8u (border inside the padding), square, centered at a max width.
// `gap` takes units of u like the gap attribute; `width` sets the max width.
export const page = definePattern({
  description: 'Page container: 8u padding and gap, centered max width',
  properties: { width: { type: 'property', value: 'maxWidth' }, gap: { type: 'number' } },
  defaultValues: { width: `${PAGE_MAX_WIDTH_REM}rem` },
  transform: ({ width, gap, ...rest }) => ({
    '--u': 'calc(var(--ui-unit) * 1px)',
    '--b': 'min(calc(var(--ui-border) * 1px), calc(var(--u) / 2))',
    display: 'flex', flexDirection: 'column', width: '100%', maxWidth: width, marginInline: 'auto',
    padding: 'max(0px, calc(8 * var(--u) - var(--b)))',
    gap: `calc(${gap ?? 8} * var(--u))`,
    borderWidth: 'var(--b)', borderColor: 'transparent',
    ...rest,
  }),
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

// App shell: <ui-app-shell> and the React AppShell, a CSS-only tag. An application frame of header,
// body and footer; variant="editor" lays the body out as start, main and end panes that scroll alone.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { SCROLL_REGION, SHELL } from '../../tokens/geometry/resolve.ts';

const BAR = { flex: 'none', display: 'flex', alignItems: 'center', gap: `calc(${SCROLL_REGION.gap} * var(--u))`, minHeight: `calc(${SCROLL_REGION.bar} * var(--u))`, paddingInline: `calc(${SCROLL_REGION.inset} * var(--u))` };
const SEP = (edge: string) => ({ [`border${edge}Width`]: 'var(--separator)', [`border${edge}Style`]: 'solid', borderColor: 'border' });
const BODY = '& > [data-part=body]';

export const appShell = defineSlotRecipe({
  className: 'ui-app-shell',
  description: 'An application frame (ui-app-shell, React AppShell).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, minWidth: 0,
      '& > [data-part=header]': { ...BAR, ...SEP('BlockEnd') },
      '& > [data-part=footer]': { ...BAR, ...SEP('BlockStart') },
      [BODY]: { flex: '1 1 0', minHeight: 0, minWidth: 0, overflowY: 'auto', overscrollBehavior: 'contain' },
    },
  },
  variants: {
    variant: {
      default: { root: {} },
      editor: {
        root: {
          [BODY]: { display: 'flex', overflow: 'hidden' },
          [`${BODY} > [data-part=start]`]: { flex: 'none', width: `calc(${SHELL.start} * var(--u))`, minHeight: 0, overflowY: 'auto', ...SEP('InlineEnd') },
          [`${BODY} > [data-part=main]`]: { flex: '1 1 0', minWidth: 0, minHeight: 0, overflow: 'auto' },
          [`${BODY} > [data-part=end]`]: { flex: 'none', width: `calc(${SHELL.end} * var(--u))`, minHeight: 0, overflowY: 'auto', ...SEP('InlineStart') },
        },
      },
    },
  },
  defaultVariants: { variant: 'default' },
});

export const appShellTags = tagRules(':is(ui-app-shell, [data-ui=app-shell])', appShell);
export { appShell as 'app-shell' };

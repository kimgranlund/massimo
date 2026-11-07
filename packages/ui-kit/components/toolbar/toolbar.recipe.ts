// Slot recipe for <ui-toolbar> and the React Toolbar: a named strip of commands, 1u apart. Roving focus
// makes it one tab stop. Items that don't fit move into a More menu.
import { defineSlotRecipe } from '@pandacss/dev';

export const toolbar = defineSlotRecipe({
  className: 'ui-toolbar',
  description: 'A named strip of commands (ui-toolbar, React Toolbar).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', alignItems: 'center', gap: 'var(--u)', minWidth: 0, padding: 'calc(0.5 * var(--u))', borderRadius: 'var(--radius)', bg: 'bg.muted',
      '&[data-orientation=vertical]': { flexDirection: 'column', alignItems: 'stretch', width: 'fit-content' },
      '& > *': { flexShrink: 0 },
      '& > [data-part=spacer]': { flex: '1' },
    },
  },
});

// Slot recipe for <ui-kbd> and the React Kbd (resolveKbd): one 5u cap per key, ½u apart, each at least
// square and growing with its key's name. Passive text: it never takes focus or a hover state. The
// spoken name stays inside the host, so it can't escape a scroller.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, UI_FONT } from '../recipe-parts.ts';
import { KBD } from '../../tokens/geometry/resolve.ts';

export const kbd = defineSlotRecipe({
  className: 'ui-kbd',
  description: 'Keyboard keys and shortcuts (ui-kbd, React Kbd).',
  slots: ['root', 'keys', 'cap', 'label'],
  base: {
    root: { display: 'inline-flex', position: 'relative', verticalAlign: 'middle', fontFamily: UI_FONT, fontWeight: 'regular', whiteSpace: 'nowrap' },
    keys: { display: 'inline-flex', alignItems: 'center', gap: `calc(${KBD.gap} * var(--u))` },
    cap: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', height: `calc(${KBD.height} * var(--u))`, minWidth: `calc(${KBD.height} * var(--u))`,
      paddingInline: `calc(${KBD.inline} * var(--u))`, borderRadius: `min(calc(${KBD.radius} * var(--u) * var(--ui-radius-scale)), calc(${KBD.height} * var(--u) / 2))`,
      fontSize: `calc(10px + ${KBD.font} * var(--u))`, lineHeight: 1, bg: 'bg.muted', color: 'fg',
      [FORCED]: { borderWidth: '1px', borderStyle: 'solid', borderColor: 'CanvasText' },
    },
    label: { position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 },
  },
});

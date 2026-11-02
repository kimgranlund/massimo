// Headless helpers for the display components: the ARIA and data-* state both renderers set, from
// the same inputs. No DOM access.
import type { Attrs } from './attrs.ts';
import type { Orientation } from './listbox.ts';

/** Separator (Base UI Separator): role, aria-orientation and data-orientation. */
export function separatorAttrs(orientation: Orientation | string | null | undefined): Attrs {
  const o = orientation === 'vertical' ? 'vertical' : 'horizontal';
  return { role: 'separator', 'aria-orientation': o, 'data-orientation': o };
}

// Headless link state for a link that looks like a button, shared by both renderers. A disabled link
// has no href, so it can't be followed, and an unsafe URL scheme is dropped.
import type { Attrs } from './attrs.ts';

export interface LinkState { href?: string; target?: string; rel?: string; disabled?: boolean }
const UNSAFE = /^\s*(javascript|vbscript|data):/i;

export function linkAttrs({ href, target, rel, disabled }: LinkState): Attrs {
  const safe = href && !UNSAFE.test(href) ? href : undefined;
  return {
    href: disabled ? undefined : safe,
    target: target || undefined,
    // A new tab shouldn't get a handle on this page unless the author asks for it.
    rel: rel || (target === '_blank' ? 'noopener noreferrer' : undefined),
    role: disabled ? 'link' : undefined,
    'aria-disabled': disabled ? 'true' : undefined,
  };
}

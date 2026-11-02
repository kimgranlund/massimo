// Headless helpers for the display components: the ARIA and data-* state both renderers set, from
// the same inputs. No DOM access.
import type { Attrs } from './attrs.ts';
import type { Orientation } from './listbox.ts';

/** Separator (Base UI Separator): role, aria-orientation and data-orientation. */
export function separatorAttrs(orientation: Orientation | string | null | undefined): Attrs {
  const o = orientation === 'vertical' ? 'vertical' : 'horizontal';
  return { role: 'separator', 'aria-orientation': o, 'data-orientation': o };
}

/** Avatar image loading status (Base UI Avatar.Image onLoadingStatusChange). */
export type ImageStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** The status before any load event: loading with a source, idle without. */
export const initialImageStatus = (src: string | null | undefined): ImageStatus => (src ? 'loading' : 'idle');

/** Avatar image data-* (Base UI Avatar.Image: data-loading while loading, data-error once it failed). */
export function avatarImageAttrs(status: ImageStatus): Attrs {
  return { 'data-loading': status === 'loading' ? '' : undefined, 'data-error': status === 'error' ? '' : undefined };
}

/** Up to two initials from a name: "Maya Lindqvist" → "ML", "kim" → "K". */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '', last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Avatar host ARIA: one image named by alt (else name); its image and fallback are then hidden from the tree. */
export function avatarAttrs(s: { alt?: string; name?: string }): Attrs {
  const label = s.alt || s.name || undefined;
  return { role: label ? 'img' : undefined, 'aria-label': label };
}

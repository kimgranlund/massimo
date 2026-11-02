// The construction pattern for React renderers: [leading] [prefix] [contents] [suffix] [trailing].
// Absent parts are omitted (the CSS handles both hidden and missing parts).
import type { ReactNode } from 'react';

export interface PartProps {
  /** Leading icon (an <i name> or artwork). */
  leading?: ReactNode;
  /** Short text adornment before the label. */
  prefix?: ReactNode;
  /** Short text adornment after the label. */
  suffix?: ReactNode;
  /** Trailing icon. */
  trailing?: ReactNode;
}

export function Parts({ leading, prefix, suffix, trailing, children }: PartProps & { children?: ReactNode }) {
  return (
    <>
      {leading != null && <span data-part="leading">{leading}</span>}
      {prefix != null && <span data-part="prefix">{prefix}</span>}
      {children != null && children !== '' && <span data-part="contents">{children}</span>}
      {suffix != null && <span data-part="suffix">{suffix}</span>}
      {trailing != null && <span data-part="trailing">{trailing}</span>}
    </>
  );
}

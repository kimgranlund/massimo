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

/** Slot classes from a component's slot recipe (styled-system/recipes), keyed by part name. */
export type PartClasses = Partial<Record<'leading' | 'prefix' | 'contents' | 'suffix' | 'trailing', string>>;

export function Parts({ leading, prefix, suffix, trailing, children, classes = {} }: PartProps & { children?: ReactNode; classes?: PartClasses }) {
  return (
    <>
      {leading != null && <span data-part="leading" className={classes.leading}>{leading}</span>}
      {prefix != null && <span data-part="prefix" className={classes.prefix}>{prefix}</span>}
      {children != null && children !== '' && <span data-part="contents" className={classes.contents}>{children}</span>}
      {suffix != null && <span data-part="suffix" className={classes.suffix}>{suffix}</span>}
      {trailing != null && <span data-part="trailing" className={classes.trailing}>{trailing}</span>}
    </>
  );
}

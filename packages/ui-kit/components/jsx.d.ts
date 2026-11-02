// React renderers use the ui-kit icon element <i name="…">; let JSX accept `name` on any element.
import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    /** ui-kit icon name on <i>. */
    name?: string;
  }
}

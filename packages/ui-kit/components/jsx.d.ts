// React renderers use the ui-kit icon element <i name="…">; let JSX accept `name` on any element.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    /** ui-kit icon name on <i>. */
    name?: string;
  }
  namespace JSX {
    interface IntrinsicElements {
      /** Customizable select: shows the selected option's content inside the select's <button>. */
      selectedcontent: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

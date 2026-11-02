// Let JSX accept the ui-kit custom elements with their attributes.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type El<P> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & P;

declare module 'react' {
  interface HTMLAttributes<T> {
    /** ui-kit icon name on <i>. */
    name?: string;
  }
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': El<{ type?: string; disabled?: boolean; loading?: boolean; 'icon-size'?: string; size?: string }>;
      'ui-badge': El<{}>;
      'ui-tag': El<{ 'icon-size'?: string }>;
      'ui-chip': El<{ selectable?: boolean; selected?: boolean; removable?: boolean; disabled?: boolean; 'icon-size'?: string }>;
      'ui-group': El<{ gutters?: string }>;
      'ui-collection': El<{ gutters?: string }>;
      'ui-tile': El<{ gutters?: string }>;
      'ui-card': El<{ gutters?: string }>;
      'ui-panel': El<{ gutters?: string }>;
      'ui-region': El<{ gutters?: string }>;
      'ui-option': El<{ value?: string; disabled?: boolean }>;
      'ui-listbox': El<{ name?: string; value?: string; label?: string; orientation?: string; required?: boolean; disabled?: boolean }>;
      'ui-segmented': El<{ name?: string; value?: string; label?: string; required?: boolean; disabled?: boolean }>;
      'ui-select': El<{ name?: string; value?: string; label?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean }>;
      'ui-input': El<{ label?: string; type?: string; name?: string; value?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; readonly?: boolean; minlength?: number; pattern?: string }>;
    }
  }
}

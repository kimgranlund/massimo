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
      'ui-group': El<{ gap?: string }>;
      'ui-collection': El<{ gap?: string }>;
      'ui-tile': El<{ gap?: string }>;
      'ui-card': El<{ gap?: string }>;
      'ui-panel': El<{ gap?: string }>;
      'ui-region': El<{ gap?: string }>;
      'ui-page': El<{ gap?: string }>;
      'ui-checkbox': El<{ name?: string; value?: string; checked?: boolean; indeterminate?: boolean; required?: boolean; disabled?: boolean }>;
      'ui-radio': El<{ name?: string; value?: string; checked?: boolean; required?: boolean; disabled?: boolean }>;
      'ui-switch': El<{ name?: string; value?: string; checked?: boolean; disabled?: boolean }>;
      'ui-range': El<{ name?: string; value?: number; min?: number; max?: number; step?: number; label?: string; disabled?: boolean }>;
      'ui-progress': El<{ value?: number; max?: number; label?: string }>;
      'ui-swatch': El<{ color?: string; label?: string }>;
      'ui-palette': El<{ name?: string; value?: string; label?: string; selectable?: boolean; orientation?: 'horizontal' | 'vertical' }>;
      'ui-swiper': El<{ label?: string; 'hover-controls'?: boolean; 'no-dots'?: boolean; 'no-paddles'?: boolean }>;
      'ui-image': El<{ src?: string; alt?: string; ratio?: string; fit?: string; position?: string; slideshow?: boolean }>;
      'ui-option': El<{ value?: string; disabled?: boolean }>;
      'ui-listbox': El<{ name?: string; value?: string; label?: string; orientation?: string; required?: boolean; disabled?: boolean }>;
      'ui-segmented': El<{ name?: string; value?: string; label?: string; required?: boolean; disabled?: boolean }>;
      'ui-select': El<{ name?: string; value?: string; label?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean }>;
      'ui-input': El<{ ref?: any; label?: string; type?: string; name?: string; value?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; readonly?: boolean; minlength?: number; pattern?: string }>;
    }
  }
}

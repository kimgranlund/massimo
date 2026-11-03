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
      'ui-button': El<{ type?: string; variant?: 'neutral' | 'primary'; disabled?: boolean; loading?: boolean; 'icon-size'?: string; size?: string }>;
      'ui-badge': El<{}>;
      'ui-tag': El<{ 'icon-size'?: string }>;
      'ui-chip': El<{ selectable?: boolean; selected?: boolean; removable?: boolean; disabled?: boolean; 'icon-size'?: string }>;
      'ui-group': El<{ gap?: string; radius?: string }>;
      'ui-collection': El<{ gap?: string; radius?: string }>;
      'ui-card': El<{ gap?: string; radius?: string; padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>;
      'ui-panel': El<{ gap?: string }>;
      'ui-region': El<{ gap?: string }>;
      'ui-page': El<{ gap?: string }>;
      'ui-checkbox': El<{ name?: string; value?: string; checked?: boolean; indeterminate?: boolean; parent?: boolean; required?: boolean; disabled?: boolean }>;
      'ui-radio': El<{ name?: string; value?: string; checked?: boolean; required?: boolean; disabled?: boolean }>;
      'ui-switch': El<{ name?: string; value?: string; checked?: boolean; disabled?: boolean }>;
      'ui-toggle-group': El<{ value?: string; 'default-value'?: string; multiple?: boolean; disabled?: boolean; orientation?: 'horizontal' | 'vertical'; gap?: number }>;
      'ui-range': El<{ name?: string; value?: number | number[]; min?: number; max?: number; step?: number; label?: string; disabled?: boolean }>;
      'ui-progress': El<{ value?: number; max?: number; label?: string }>;
      'ui-swatch': El<{ color?: string; label?: string }>;
      'ui-palette': El<{ name?: string; value?: string; label?: string; selectable?: boolean; orientation?: 'horizontal' | 'vertical' }>;
      'ui-swiper': El<{ label?: string; 'hover-controls'?: boolean; 'no-dots'?: boolean; 'no-paddles'?: boolean }>;
      'ui-image': El<{ src?: string; alt?: string; ratio?: string; fit?: string; position?: string; slideshow?: boolean }>;
      'ui-option': El<{ value?: string; disabled?: boolean }>;
      'ui-listbox': El<{ name?: string; value?: string; label?: string; orientation?: string; required?: boolean; disabled?: boolean }>;
      'ui-segmented': El<{ name?: string; value?: string; label?: string; required?: boolean; disabled?: boolean }>;
      'ui-select': El<{ name?: string; value?: string; label?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; labelledby?: string; describedby?: string }>;
      'ui-input': El<{ ref?: any; label?: string; type?: string; name?: string; value?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; readonly?: boolean; minlength?: number; pattern?: string; labelledby?: string; describedby?: string }>;
      'ui-field': El<{ label?: string; unit?: string; readout?: string; description?: string; error?: string; layout?: 'stacked' | 'inline' }>;
      'ui-field-grid': El<{}>;
      'ui-separator': El<{ orientation?: 'horizontal' | 'vertical' }>;
      'ui-toggle': El<{ pressed?: boolean; 'default-pressed'?: boolean; disabled?: boolean; value?: string; 'icon-size'?: string }>;
      'ui-meter': El<{ value?: number; min?: number; max?: number; label?: string; format?: string; locale?: string; 'value-text'?: string }>;
      'ui-avatar': El<{ src?: string; alt?: string; name?: string; 'avatar-size'?: 'sm' | 'md' | 'lg' | 'xl'; delay?: number }>;
      'ui-radio-group': El<{ name?: string; value?: string; 'default-value'?: string; label?: string; orientation?: 'vertical' | 'horizontal'; gap?: string; required?: boolean; disabled?: boolean; readonly?: boolean }>;
      'ui-checkbox-group': El<{ name?: string; value?: string; 'default-value'?: string; 'all-values'?: string; label?: string; orientation?: 'vertical' | 'horizontal'; gap?: string; required?: boolean; disabled?: boolean }>;
      'ui-fieldset': El<{ legend?: string; disabled?: boolean; gap?: string }>;
      'ui-toast-viewport': El<{ ref?: any; limit?: number; timeout?: number; placement?: 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center' | 'inline'; 'swipe-direction'?: string; label?: string }>;
      'ui-form': El<{ ref?: any; errors?: string; 'validation-mode'?: 'onSubmit' | 'onBlur' | 'onChange'; gap?: string }>;
      'ui-scroll-area': El<{ ref?: any; 'overflow-edge-threshold'?: number; size?: string }>;
      'ui-menubar': El<{ ref?: any; orientation?: 'horizontal' | 'vertical'; label?: string }>;
      'ui-context-menu': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; label?: string; disabled?: boolean }>;
      'ui-menu': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; label?: string; disabled?: boolean; side?: 'bottom' | 'top'; align?: 'start' | 'center' | 'end'; 'open-on-hover'?: boolean; delay?: number }>;
      'ui-tabs': El<{ ref?: any; value?: string; 'default-value'?: string; orientation?: 'horizontal' | 'vertical'; variant?: 'segmented' | 'underline'; 'activate-on-focus'?: boolean; label?: string }>;
      'ui-combobox': El<{ ref?: any; name?: string; value?: string; 'default-value'?: string; 'input-value'?: string; label?: string; placeholder?: string; description?: string; error?: string; multiple?: boolean; required?: boolean; disabled?: boolean; readonly?: boolean; open?: boolean; 'empty-text'?: string; 'auto-highlight'?: boolean; labelledby?: string; describedby?: string }>;
      'ui-autocomplete': El<{ ref?: any; name?: string; value?: string; 'default-value'?: string; label?: string; placeholder?: string; description?: string; error?: string; mode?: 'list' | 'both' | 'inline' | 'none'; 'show-trigger'?: boolean; required?: boolean; disabled?: boolean; readonly?: boolean; 'empty-text'?: string; 'auto-highlight'?: boolean; labelledby?: string; describedby?: string }>;
      'ui-accordion': El<{ ref?: any; value?: string; 'default-value'?: string; multiple?: boolean; disabled?: boolean; orientation?: 'vertical' | 'horizontal' }>;
      'ui-alert-dialog': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; label?: string; description?: string; gap?: number }>;
      'ui-drawer': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; side?: 'top' | 'right' | 'bottom' | 'left'; modal?: 'true' | 'false' | 'trap-focus'; 'disable-pointer-dismissal'?: boolean; label?: string; description?: string; gap?: number }>;
      'ui-dialog': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; modal?: 'true' | 'false' | 'trap-focus'; 'disable-pointer-dismissal'?: boolean; label?: string; description?: string; gap?: number }>;
      'ui-collapsible': El<{ ref?: any; label?: string; open?: boolean; 'default-open'?: boolean; disabled?: boolean; value?: string }>;
      'ui-otp-field': El<{ ref?: any; name?: string; value?: string; 'default-value'?: string; length?: number; 'validation-type'?: 'numeric' | 'alpha' | 'alphanumeric' | 'none'; mask?: boolean; 'auto-submit'?: boolean; autocomplete?: string; inputmode?: string; label?: string; required?: boolean; disabled?: boolean; readonly?: boolean }>;
      'ui-number-field': El<{ ref?: any; name?: string; label?: string; value?: number; 'default-value'?: number; min?: number; max?: number; step?: number; 'small-step'?: number; 'large-step'?: number; 'snap-on-step'?: boolean; 'allow-out-of-range'?: boolean; 'allow-wheel-scrub'?: boolean; 'scrub-direction'?: 'horizontal' | 'vertical'; 'pixel-sensitivity'?: number; format?: string; locale?: string; placeholder?: string; description?: string; error?: string; required?: boolean; disabled?: boolean; readonly?: boolean; 'hide-label'?: boolean }>;
      'ui-tooltip': El<{ ref?: any; content?: string; open?: boolean; 'default-open'?: boolean; disabled?: boolean; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end'; delay?: number; 'close-delay'?: number }>;
      'ui-preview-card': El<{ ref?: any; open?: boolean; 'default-open'?: boolean; disabled?: boolean; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end'; delay?: number; 'close-delay'?: number; gap?: string }>;
      'ui-navigation-menu': El<{ ref?: any; label?: string; value?: string; 'default-value'?: string; orientation?: 'horizontal' | 'vertical'; delay?: number; 'close-delay'?: number }>;
      'ui-popover': El<{ ref?: any; label?: string; open?: boolean; 'default-open'?: boolean; disabled?: boolean; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end'; modal?: boolean; 'open-on-hover'?: boolean; delay?: number; 'close-delay'?: number; gap?: string }>;
    }
  }
}

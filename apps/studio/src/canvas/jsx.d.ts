// Let JSX accept the ui-kit custom elements with their attributes.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type El<P> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & P;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': El<{ variant?: string; size?: string; type?: string; disabled?: boolean; loading?: boolean }>;
      'ui-input': El<{ label?: string; type?: string; name?: string; value?: string; placeholder?: string; description?: string; error?: string; size?: string; required?: boolean; disabled?: boolean; readonly?: boolean; minlength?: number; pattern?: string }>;
    }
  }
}

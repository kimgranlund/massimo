// Theme-aware icons: <i name="caret-right"></i>. Importing this module starts the runtime.
import { startIcons } from './runtime.ts';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startIcons(), { once: true });
  else startIcons();
}

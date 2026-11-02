// Theme-aware icons: <i name="caret-right"></i>. Importing this module starts the runtime.
export * from './sets.ts';
export * from './runtime.ts';
export { sanitizeSvg } from './sanitize.ts';
import { startIcons } from './runtime.ts';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startIcons(), { once: true });
  else startIcons();
}

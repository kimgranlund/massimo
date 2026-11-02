// Minimal modern reset, emitted through Panda's globalCss so it lands in the reset layer.
import { defineGlobalStyles } from '@pandacss/dev';

export const reset = defineGlobalStyles({
  '*, *::before, *::after': { boxSizing: 'border-box', margin: 0, padding: 0, borderWidth: 0, borderStyle: 'solid', borderColor: 'border' },
  html: { WebkitTextSizeAdjust: '100%', colorScheme: 'light dark', fontFamily: 'sans', lineHeight: 'normal' },
  body: { bg: 'bg', color: 'fg', minHeight: '100dvh', WebkitFontSmoothing: 'antialiased' },
  'img, svg, video, canvas': { display: 'block', maxWidth: '100%' },
  'button, input, select, textarea': { font: 'inherit', color: 'inherit', background: 'transparent' },
  ':focus-visible': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
  '@media (prefers-reduced-motion: reduce)': {
    '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
  },
});

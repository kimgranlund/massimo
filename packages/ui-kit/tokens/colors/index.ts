// Color ramps in OKLCH, 50 (lightest) to 950 (darkest). Lightness and the chroma curve are
// fixed; hue and peak chroma come from theme parameters (--ui-<family>-hue / -chroma).
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const L = [0.98, 0.95, 0.9, 0.82, 0.72, 0.62, 0.53, 0.45, 0.37, 0.28, 0.2];
// Chroma peaks mid-ramp and falls off toward white and black so the ends stay in gamut.
const C = [0.1, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.85, 0.7, 0.55, 0.4];

const paramRamp = (family: string) =>
  Object.fromEntries(STEPS.map((s, i) => [s, { value: `oklch(${L[i]} calc(var(--ui-${family}-chroma) * ${C[i]}) var(--ui-${family}-hue))` }]));
const fixedRamp = (hue: number, chroma: number) =>
  Object.fromEntries(STEPS.map((s, i) => [s, { value: `oklch(${L[i]} ${(chroma * C[i]).toFixed(3)} ${hue})` }]));
// Danger keeps its chroma fixed: only its hue is a theme decision.
const dangerRamp = Object.fromEntries(STEPS.map((s, i) => [s, { value: `oklch(${L[i]} ${(0.2 * C[i]).toFixed(3)} var(--ui-danger-hue))` }]));

export const colors = {
  white: { value: '#fff' },
  black: { value: '#000' },
  gray: paramRamp('neutral'),
  accent: paramRamp('accent'),
  danger: dangerRamp,
  success: fixedRamp(150, 0.15),
  warning: fixedRamp(75, 0.16),
};

// Dark follows the host's prefers-color-scheme; a .light or .dark class on any element forces
// a scheme for its subtree (class specificity beats the :where(:root) media rule).
const role = (light: string, dark: string) => ({
  value: { base: `{colors.${light}}`, _osDark: `{colors.${dark}}`, _dark: `{colors.${dark}}`, _light: `{colors.${light}}` },
});

// Chain: semantic roles -> ramps -> theme parameters.
export const semanticColors = {
  bg: { DEFAULT: role('white', 'gray.950'), subtle: role('gray.50', 'gray.900'), muted: role('gray.100', 'gray.800') },
  fg: { DEFAULT: role('gray.950', 'gray.50'), muted: role('gray.600', 'gray.400'), onSolid: role('white', 'white') },
  border: { DEFAULT: role('gray.200', 'gray.800'), strong: role('gray.300', 'gray.700') },
  accent: { solid: role('accent.600', 'accent.500'), solidHover: role('accent.700', 'accent.400'), subtle: role('accent.50', 'accent.950'), fg: role('accent.700', 'accent.300') },
  danger: { solid: role('danger.600', 'danger.500'), solidHover: role('danger.700', 'danger.400'), fg: role('danger.700', 'danger.300') },
  focusRing: role('accent.500', 'accent.400'),
};

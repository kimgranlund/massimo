// Color ramps in OKLCH, 50 (lightest) to 950 (darkest), plus light/dark semantic roles.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const L = [0.98, 0.95, 0.9, 0.82, 0.72, 0.62, 0.53, 0.45, 0.37, 0.28, 0.2];
// Chroma peaks mid-ramp and falls off toward white and black so the ends stay in gamut.
const C = [0.1, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.85, 0.7, 0.55, 0.4];

const ramp = (hue: number, chroma: number) =>
  Object.fromEntries(STEPS.map((s, i) => [s, { value: `oklch(${L[i]} ${(chroma * C[i]).toFixed(3)} ${hue})` }]));

export const colors = {
  white: { value: '#fff' },
  black: { value: '#000' },
  gray: ramp(260, 0.015),
  accent: ramp(265, 0.19),
  danger: ramp(25, 0.2),
  success: ramp(150, 0.15),
  warning: ramp(75, 0.16),
};

const role = (base: string, dark: string) => ({ value: { base: `{colors.${base}}`, _dark: `{colors.${dark}}` } });

export const semanticColors = {
  bg: { DEFAULT: role('white', 'gray.950'), subtle: role('gray.50', 'gray.900'), muted: role('gray.100', 'gray.800') },
  fg: { DEFAULT: role('gray.950', 'gray.50'), muted: role('gray.600', 'gray.400'), onSolid: role('white', 'white') },
  border: { DEFAULT: role('gray.200', 'gray.800'), strong: role('gray.300', 'gray.700') },
  accent: { solid: role('accent.600', 'accent.500'), solidHover: role('accent.700', 'accent.400'), subtle: role('accent.50', 'accent.950'), fg: role('accent.700', 'accent.300') },
  danger: { solid: role('danger.600', 'danger.500'), solidHover: role('danger.700', 'danger.400'), fg: role('danger.700', 'danger.300') },
  focusRing: role('accent.500', 'accent.400'),
};

// 4px spacing grid stays fixed so layout rhythm is stable across themes.
// Radii scale with --ui-radius-scale and control heights with --ui-density.
const grid = (n: number) => ({ value: `${n * 0.25}rem` });
const scaled = (rem: number, param: string) => ({ value: `calc(${rem}rem * var(--ui-${param}))` });

export const spacing = Object.fromEntries([0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(n => [n, grid(n)]));
export const sizes = { ...spacing, control: { sm: scaled(2, 'density'), md: scaled(2.5, 'density'), lg: scaled(3, 'density') } };
export const radii = {
  none: { value: '0' }, sm: scaled(0.25, 'radius-scale'), md: scaled(0.375, 'radius-scale'),
  lg: scaled(0.5, 'radius-scale'), xl: scaled(0.75, 'radius-scale'), full: { value: '9999px' },
};
export const borderWidths = { thin: { value: '1px' }, thick: { value: '2px' } };

// Component radii, so a theme can round buttons without rounding cards.
export const semanticRadii = {
  control: { value: '{radii.md}' },
  button: { value: '{radii.control}' },
  input: { value: '{radii.control}' },
};

// Responsive breakpoints (Panda's base preset defines none).
export const breakpoints = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' };

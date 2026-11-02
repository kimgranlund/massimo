// 4px spacing grid. Component heights reuse it so controls line up with layout.
const grid = (n: number) => ({ value: `${n * 0.25}rem` });
export const spacing = Object.fromEntries([0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(n => [n, grid(n)]));
export const sizes = { ...spacing, control: { sm: grid(8), md: grid(10), lg: grid(12) } };
export const radii = { none: { value: '0' }, sm: { value: '0.25rem' }, md: { value: '0.375rem' }, lg: { value: '0.5rem' }, xl: { value: '0.75rem' }, full: { value: '9999px' } };
export const borderWidths = { thin: { value: '1px' }, thick: { value: '2px' } };

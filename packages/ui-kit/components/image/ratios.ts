// Aspect ratios for <ui-image ratio>. Named presets are finite choices: CSS maps each
// preset name to a variant of the image recipe (image.recipe.ts). Any other valid "w/h" is a continuous value:
// the element passes it to CSS as --ui-image-ratio. No module here touches the DOM.
export const RATIOS: Record<string, string> = {
  square: '1 / 1', landscape: '4 / 3', portrait: '3 / 4', wide: '16 / 9', ultrawide: '21 / 9', story: '9 / 16', golden: '1.618 / 1',
};
const RATIO = /^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/;

/** A custom "w/h" ratio (not a preset), or null when the value is a preset or invalid. */
export function customRatio(value: string): string | null {
  return !Object.hasOwn(RATIOS, value) && RATIO.test(value) ? value.trim() : null;
}

/** Fits of the image (object-fit), a finite choice: a variant of the image recipe. */
export const FITS = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const;
export type Fit = (typeof FITS)[number];

/** The image recipe's ratio variant for an attribute value: a preset name, custom or none. */
export function ratioVariant(value: string): string {
  return Object.hasOwn(RATIOS, value) ? value : value.trim() ? 'custom' : 'none';
}

/** The image recipe's fit variant for an attribute value (unknown values fall back to cover). */
export const fitVariant = (value: string): Fit => (FITS as readonly string[]).includes(value) ? value as Fit : 'cover';

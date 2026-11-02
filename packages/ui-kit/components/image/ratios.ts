// Aspect ratios for <ui-image ratio>. Named presets are finite choices: CSS maps each
// [ratio=<name>] to its value (styles/defaults.ts). Any other valid "w/h" is a continuous value:
// the element passes it to CSS as --ui-image-ratio. No module here touches the DOM.
export const RATIOS: Record<string, string> = {
  square: '1 / 1', landscape: '4 / 3', portrait: '3 / 4', wide: '16 / 9', ultrawide: '21 / 9', story: '9 / 16', golden: '1.618 / 1',
};
const RATIO = /^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/;

/** A custom "w/h" ratio (not a preset), or null when the value is a preset or invalid. */
export function customRatio(value: string): string | null {
  return !Object.hasOwn(RATIOS, value) && RATIO.test(value) ? value.trim() : null;
}

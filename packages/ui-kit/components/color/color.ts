// Pure color helpers shared by <ui-swatch> and the React Swatch (no DOM, no registration).

// Translucent: transparent, an alpha channel (`/ a`, rgba/hsla, #rgba, #rrggbbaa).
const TRANSLUCENT = /transparent|rgba\(|hsla\(|\/\s*[\d.]+%?\s*\)|#(?:[0-9a-f]{4}|[0-9a-f]{8})\b/i;
export const isTranslucent = (c: string) => TRANSLUCENT.test(c);
/** A parsable CSS color (always true where CSS.supports is unavailable, e.g. server rendering). */
export const validColor = (c: string) => !!c && (typeof CSS === 'undefined' || !CSS.supports || CSS.supports('color', c));

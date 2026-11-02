// Headless behaviors return plain attribute maps in DOM spelling.
// Web components apply them with `applyAttrs`; React spreads `toReactProps(...)`.
export type Attrs = Record<string, string | number | boolean | undefined>;

/** Set or remove each attribute; `false`/`undefined` removes, `true` sets empty. */
export function applyAttrs(el: Element, attrs: Attrs) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) el.removeAttribute(k);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

const REACT_NAMES: Record<string, string> = { tabindex: 'tabIndex', for: 'htmlFor', class: 'className', readonly: 'readOnly' };

/** Rename DOM attribute keys to React prop names. aria-* and data-* pass through. */
export function toReactProps(attrs: Attrs): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) out[REACT_NAMES[k] ?? k] = v;
  return out;
}

let n = 0;
/** Stable-enough unique id for wiring labels in the browser. React uses useId instead. */
export const uid = (prefix = 'ui') => `${prefix}-${++n}`;

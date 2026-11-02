// Native twins for the global rules that are not slot recipes: the layout containers and the
// composite geometry (list and popup padding, gap, radius, option height and inset). The React
// renderers use native HTML with `data-ui="<name>"` on the host instead of the ui-* custom element;
// every rule written for one of these ui-* tags gets a twin selector for its data-ui host, so the
// authored rule stays the single source. Component styles are slot recipes
// (components/<name>/<name>.recipe.ts), which match both renderers through the state conditions
// and need no twins.
//
// Twins are emitted as separate rules (the original selectors are untouched), so web-component
// specificity and order do not change.

type Css = Record<string, any>;

/** Components with a native React twin, and how their state hooks map. */
export const NATIVE_TWINS: Record<string, [RegExp, string][]> = {
  group: [], collection: [], tile: [], card: [], panel: [], region: [], page: [],
  // Listbox and segmented are ARIA listboxes with the web components' attributes (dom/listbox.ts).
  listbox: [],
  segmented: [],
  // Select is a native <select> with customizable-select styling (appearance: base-select): the
  // trigger is its <button>, the value its <selectedcontent>, the popup ::picker(select), the options
  // native <option>s. Browsers without base-select show the platform select.
  select: [
    [/\[data-ui=select\] > \[data-part=popup\]:popover-open$/, '[data-ui=select] > select:open::picker(select)'],
    [/\[data-ui=select\] > \[data-part=popup\]$/, '[data-ui=select] > select::picker(select)'],
    [/\[data-ui=select\] > \[data-part=popup\]/g, '[data-ui=select] > select'],
    [/\[data-ui=select\] > \[data-part=trigger\]\[aria-expanded=true\]/g, '[data-ui=select] > select:open > [data-part=trigger]'],
    [/\[data-ui=select\] > \[data-part=trigger\]/g, '[data-ui=select] > select > [data-part=trigger]'],
    [/\[aria-invalid=true\]/g, ':is(:user-invalid > *, [data-invalid] > select > *)'],
    [/\[aria-disabled=true\]/g, ':is(:disabled > *)'],
    [/\[data-ui=select\]\[required\]/g, '[data-ui=select]:has(> select:required)'],
  ],
  // An option is an ARIA option (listbox, segmented: same attributes as the web component) or a native
  // <option> (select: :checked, :disabled, :focus).
  option: [
    [/:not\(\[aria-disabled=true\]\)/g, ':not([aria-disabled=true], :disabled)'],
    [/\[aria-disabled=true\]/g, ':is([aria-disabled=true], :disabled)'],
    [/\[aria-selected=true\]/g, ':is([aria-selected=true], :checked)'],
    [/\[data-active\]/g, ':is([data-active], :focus)'],
  ],
};

const tagRe = (names: string[]) => new RegExp(`(?<![\\w-])ui-(${names.join('|')})(?![\\w-])`, 'g');

/** Split a selector list on top-level commas (not inside :is()/:not()/:has()/[...]). */
export function splitSelectors(sel: string): string[] {
  const out: string[] = []; let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The twin of one complex selector, or null when it names no twinned component. */
export function twinSelector(sel: string): string | null {
  const names = Object.keys(NATIVE_TWINS);
  const present = [...new Set([...sel.matchAll(tagRe(names))].map((m) => m[1]))];
  if (!present.length) return null;
  let twin = sel.replace(tagRe(names), (_, n) => `[data-ui=${n}]`);
  for (const n of present) for (const [re, to] of NATIVE_TWINS[n]) twin = twin.replace(re, to);
  return twin;
}

/** Add a twin rule for every rule (including inside at-rules) that targets a twinned ui-* tag. */
export function withNativeTwins(css: Css): Css {
  const out: Css = {};
  for (const [key, rule] of Object.entries(css)) {
    if (key.startsWith('@')) { out[key] = withNativeTwins(rule); continue; }
    // Merge, never replace: a twin generated earlier may already use this exact selector.
    out[key] = { ...(out[key] ?? {}), ...rule };
    const twins = splitSelectors(key).map(twinSelector).filter((t): t is string => t !== null);
    if (!twins.length) continue;
    const twinKey = twins.join(', ');
    out[twinKey] = { ...(out[twinKey] ?? {}), ...rule };
  }
  return out;
}

// Native twins: the React renderers use native HTML (input type=checkbox/radio/range, progress, button)
// with `data-ui="<name>"` on the host instead of the ui-* custom element. Every rule written for a
// ui-* tag gets a twin selector for its data-ui host, generated here, so the authored styles stay the
// single source. State hooks are mapped to what the native element carries: a choice or range keeps
// its state in a native <input> that is a direct child of the host, read with :has().
//
// Twins are emitted as separate rules (the original selectors are untouched), so web-component
// specificity and order do not change. ui-button and ui-input have hand-written data-ui twins.

type Css = Record<string, any>;

/** Per-component replacements applied to a twin selector, in order. */
const CHOICE_STATE: [RegExp, string][] = [
  [/:not\(\[aria-checked=true\]\)/g, ':not(:has(> input:checked))'],
  [/\[aria-checked=true\]/g, ':has(> input:checked)'],
  [/\[aria-checked=mixed\]/g, ':has(> input:indeterminate)'],
  [/\[aria-disabled=true\]/g, ':has(> input:disabled)'],
  [/:not\(\[aria-disabled=true\]\)/g, ':not(:has(> input:disabled))'],
  [/\[aria-required=true\]/g, ':has(> input:required)'],
  [/\[aria-invalid=true\]/g, ':is([data-invalid], :has(> input:user-invalid))'],
  [/:focus-visible/g, ':has(> input:focus-visible)'],
];
const RANGE_STATE: [RegExp, string][] = [
  [/:not\(\[aria-disabled=true\]\)/g, ':not(:has(> input:disabled))'],
  [/\[aria-disabled=true\]/g, ':has(> input:disabled)'],
  [/:focus-visible/g, ':has(> input:focus-visible)'],
];

/** Components with a native React twin, and how their state hooks map. */
export const NATIVE_TWINS: Record<string, [RegExp, string][]> = {
  checkbox: CHOICE_STATE,
  radio: CHOICE_STATE,
  switch: CHOICE_STATE,
  range: RANGE_STATE,
  progress: [],
  badge: [],
  tag: [],
  chip: [[/\[selectable\]/g, '[data-selectable]']],
  // A selectable palette is a radio group: each swatch is a label around a native radio.
  palette: [
    [/\[(selectable|name)\]/g, '[data-selectable]'],
    [/\[orientation=vertical\]/g, '[data-orientation=vertical]'],
    [/\[aria-disabled=true\]/g, '[data-disabled]'],
    [/\[aria-invalid=true\]/g, '[data-invalid]'],
  ],
  swatch: [
    [/\[aria-selected=true\]/g, ':has(> input:checked)'],
    [/\[data-active\]/g, ':has(> input:focus-visible)'],
  ],
  image: [
    [/\[ratio(?=[=\]])/g, '[data-ratio'],
    [/\[fit=/g, '[data-fit='],
    [/\[slideshow\]/g, '[data-slideshow]'],
  ],
  group: [], collection: [], card: [], panel: [], region: [], page: [],
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
  swiper: [
    [/\[no-paddles\]/g, '[data-no-paddles]'],
    [/\[no-dots\]/g, '[data-no-dots]'],
    [/\[hover-controls\]/g, '[data-hover-controls]'],
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

/** Native plumbing the twins need: the input that carries state is invisible but interactive. */
export const native = {
  // Choices: the native input sits in the host, visually hidden; the box part paints it.
  [`:is(${['checkbox', 'radio', 'switch'].map((n) => `[data-ui=${n}]`).join(', ')})`]: { position: 'relative' },
  [`:is(${['checkbox', 'radio', 'switch'].map((n) => `[data-ui=${n}]`).join(', ')}) > input`]: {
    position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: 0, pointerEvents: 'none',
  },
  // Range: the native input covers the track, transparent, so pointer and keys are native.
  '[data-ui=range] > input': {
    position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'inherit',
    gridArea: '1 / 1', appearance: 'none', background: 'transparent',
  },
  // The native thumb is as wide as the track, so native travel (width − thumb) equals the painted
  // thumb's travel (width − track) and the pointer lands where the thumb is drawn. One rule per engine.
  '[data-ui=range] > input::-webkit-slider-thumb': { appearance: 'none', width: 'var(--track)', height: 'var(--track)' },
  '[data-ui=range] > input::-moz-range-thumb': { width: 'var(--track)', height: 'var(--track)', border: 0 },
  // Swatch in a selectable palette: the native radio is invisible; the swatch paints it.
  '[data-ui=swatch]': { position: 'relative' },
  '[data-ui=swatch] > input': { position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: 0, pointerEvents: 'none' },
  '[data-ui=palette][data-selectable] > [data-ui=swatch]': { cursor: 'pointer' },
  // Select: opt in to customizable select; the inner <button> is the painted trigger.
  '[data-ui=select] > select, [data-ui=select] > select::picker(select)': { appearance: 'base-select' },
  // The select's own box wraps the trigger exactly: no intrinsic minimum height or line box.
  '[data-ui=select] > select': { display: 'block', width: '100%', padding: 0, border: 0, background: 'none', minWidth: 0, minBlockSize: 0, blockSize: 'auto', lineHeight: 0 },
  '[data-ui=select] > select > [data-part=trigger], [data-ui=select] > select > option': { lineHeight: 'var(--line)' },
  '[data-ui=select] > select::picker-icon': { display: 'none' },
  '[data-ui=select] > select > option::checkmark': { display: 'none' },
  '[data-ui=select] > select > [data-part=trigger]': { width: '100%' },
  '[data-ui=select] > select::picker(select)': { border: 0, marginBlockStart: 'var(--u)' },
  // Input: a native text input keeps a minimum line box; pin it to the slot like the web component's editor.
  '[data-ui=input] > [data-part=control] > input[data-part=contents]': { height: 'var(--slot)' },
  // Progress: the native element stays in the accessibility tree; the track paints it.
  '[data-ui=progress] > progress': { position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' },
} as Css;


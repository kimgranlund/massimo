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

const LIST_STATE: [RegExp, string][] = [
  [/\[aria-disabled=true\]/g, '[data-disabled]'],
  [/\[aria-invalid=true\]/g, '[data-invalid]'],
  [/:focus-visible/g, ':has(input:focus-visible)'],
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
  group: [], collection: [], tile: [], card: [], panel: [], region: [], page: [],
  // Listbox and segmented are radio groups; each option is a <label> around a native radio, so arrow
  // keys move and select (selection follows focus, as in the web component).
  listbox: LIST_STATE,
  segmented: LIST_STATE,
  swiper: [
    [/\[no-paddles\]/g, '[data-no-paddles]'],
    [/\[no-dots\]/g, '[data-no-dots]'],
    [/\[hover-controls\]/g, '[data-hover-controls]'],
  ],
  option: [
    [/:not\(\[aria-disabled=true\]\)/g, ':not(:has(> input:disabled))'],
    [/\[aria-disabled=true\]/g, ':has(> input:disabled)'],
    [/\[aria-selected=true\]/g, ':has(> input:checked)'],
    [/\[data-active\]/g, ':has(> input:focus)'],
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
  // Options: the native radio is invisible; the option row paints it.
  '[data-ui=option]': { position: 'relative' },
  '[data-ui=option] > input': { position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: 0, pointerEvents: 'none' },
  // Progress: the native element stays in the accessibility tree; the track paints it.
  '[data-ui=progress] > progress': { position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' },
} as Css;


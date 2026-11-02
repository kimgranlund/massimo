// Shared pieces for the component slot recipes (components/<name>/<name>.recipe.ts). Lengths come
// from the geometry variables (styles/geometry.ts: --u, --h, --pad, --slot, --icon, --radius, …),
// never literals; states use the preset conditions (styles/conditions.ts), so one rule serves the
// web component (ARIA on the host) and the React renderer (native element, data-ui host).
// Build-time only: element modules import the generated functions in styled-system/recipes.
import type { IntentName } from '../tokens/motion/index.ts';
import { voiceFamily } from '../styles/typography.ts';

type Style = Record<string, any>;

/** Buttons, form controls, badges, tags and chips speak in the UI voice. */
export const UI_FONT = voiceFamily('ui');

/** A transition list for one motion intent (durations.<intent> with easings.<intent>). */
export const t = (intent: IntentName, ...props: string[]) =>
  props.map((p) => `${p} {durations.${intent}} {easings.${intent}}`).join(', ');

/** Paint properties that animate on hover, press, selection and validity (feedback). */
export const PAINT = ['background-color', 'color', 'border-color', 'box-shadow', 'opacity', 'outline-color'];

/** oklab, not oklch: a hue mix with the blue-grey neutral would swing the red through blue. */
export const CRITICAL_TINT = (pct: number) => `color-mix(in oklab, var(--colors-critical-solid) ${pct}%, var(--colors-bg-muted))`;

/** Prefix / suffix adornments: the label's color at 65%, so they read as secondary on any fill. */
export const ADORN_COLOR = 'color-mix(in oklch, currentColor 65%, transparent)';

const TEXT = ':is([data-part=prefix], [data-part=contents], [data-part=suffix])';
const shown = (part: string) => `${part}:not([hidden])`;

/**
 * Inline padding of the text run (resolveTextRun): each text part gets `bare` at a host edge,
 * `slot` beside a visible leading/trailing slot, and `between` beside another visible text part.
 * Web components keep empty parts as [hidden]; React omits them; both work with ~ and :has.
 * The "beside a text part" clauses come last and are more specific, so they win when both apply.
 */
export function textRun(slot: string, bare: string, base: Style = {}, between = 'calc(0.5 * var(--u))'): Style {
  return {
    ...base,
    paddingInlineStart: bare,
    paddingInlineEnd: bare,
    [`${shown('[data-part=leading]')} ~ &`]: { paddingInlineStart: slot },
    [`&:has(~ ${shown('[data-part=trailing]')})`]: { paddingInlineEnd: slot },
    [`${shown(TEXT)} ~ &:is(${TEXT})`]: { paddingInlineStart: between },
    [`&:is(${TEXT}):has(~ ${shown(TEXT)})`]: { paddingInlineEnd: between },
  };
}

const FILL = ':is([icon-size=fill], [data-icon-size=fill])';

/**
 * A leading / trailing icon slot: at least `--slot` square, the glyph at --icon. Indicators (carets,
 * the x) stay at icon size sm; with icon-size=fill the artwork covers the slot with a nested radius.
 */
export function iconSlot(fillRadius = 'max(0px, calc(var(--radius) - var(--u)))'): Style {
  return {
    display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)',
    '& > *': { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
    '& > :is(i[name^="caret-"], i[name="x"])': { width: 'var(--icon-sm)', height: 'var(--icon-sm)' },
    [`${FILL} &`]: { width: 'var(--slot)', height: 'var(--slot)', overflow: 'hidden', borderRadius: fillRadius },
    [`${FILL} & > *`]: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },
  };
}

/** Prefix / suffix adornments keep their width and never wrap. */
export const adornment = (color = true): Style => ({ flexShrink: 0, whiteSpace: 'nowrap', ...(color ? { color: ADORN_COLOR } : {}) });

/** Forced colors (Windows high contrast): a system edge that costs no space. */
export const FORCED_EDGE: Style = { outline: '1px solid CanvasText', outlineOffset: '-1px' };
/** Forced colors: an "on" state painted with Highlight. */
export const FORCED_ON: Style = { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' };
export const FORCED = '@media (forced-colors: active)';

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
const SLOT = ':is([data-part=leading], [data-part=trailing])';
const ADORN = ':is([data-part=prefix], [data-part=suffix])';
const FILL = ':is([icon-size=fill], [data-icon-size=fill], [icon-size=fill] *, [data-icon-size=fill] *)';
const shown = (part: string) => `${part}:not([hidden])`;

export interface PatternOptions {
  /** Text-part padding beside a visible leading / trailing slot. */
  slot: string;
  /** Text-part padding at a bare host edge. */
  bare: string;
  /** Text-part padding beside another visible text part. */
  between?: string;
  /** Extra styles for every text part (display, line box). */
  text?: Style;
  /** Radius of fill artwork in a slot (icon-size=fill), nested inside the host's. */
  fillRadius?: string;
  /** Prefix / suffix in the label color at 65%. */
  adornColor?: boolean;
  /** Style leading / trailing as icon slots (choices put their own indicator there). */
  iconSlots?: boolean;
}

/**
 * The construction pattern [leading] [prefix] [contents] [suffix] [trailing], as rules on the
 * recipe's root (written once per recipe instead of once per part; the parts keep their own slot
 * classes for part-specific styles).
 * - Icon slots: at least --slot square, the glyph at --icon; indicators (carets, the x) stay at icon
 *   size sm; with icon-size=fill (on the host or an ancestor) the artwork covers the slot.
 * - Text run (resolveTextRun): each text part gets `bare` at a host edge, `slot` beside a visible
 *   slot and `between` beside another visible text part. Web components keep empty parts as
 *   [hidden]; React omits them; both work with ~ and :has. The "between" clauses are more specific,
 *   so they win when both apply.
 */
export function constructionPattern({ slot, bare, between = 'calc(0.5 * var(--u))', text = {}, fillRadius = 'max(0px, calc(var(--radius) - var(--u)))', adornColor = true, iconSlots = true }: PatternOptions): Style {
  return {
    ...(iconSlots ? {
    [`& > ${SLOT}`]: { display: 'grid', placeItems: 'center', flexShrink: 0, minWidth: 'var(--slot)', minHeight: 'var(--slot)' },
    [`& > ${SLOT} > *`]: { width: 'var(--icon)', height: 'var(--icon)', flexShrink: 0 },
    [`& > ${SLOT} > :is(i[name^="caret-"], i[name="x"])`]: { width: 'var(--icon-sm)', height: 'var(--icon-sm)' },
    [`&${FILL} > ${SLOT}`]: { width: 'var(--slot)', height: 'var(--slot)', overflow: 'hidden', borderRadius: fillRadius },
    [`&${FILL} > ${SLOT} > *`]: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' },
    } : {}),
    [`& > ${TEXT}`]: { ...text, paddingInlineStart: bare, paddingInlineEnd: bare },
    [`& > ${ADORN}`]: { flexShrink: 0, whiteSpace: 'nowrap', ...(adornColor ? { color: ADORN_COLOR } : {}) },
    [`& > ${shown('[data-part=leading]')} ~ ${TEXT}`]: { paddingInlineStart: slot },
    [`& > ${TEXT}:has(~ ${shown('[data-part=trailing]')})`]: { paddingInlineEnd: slot },
    [`& > ${shown(TEXT)} ~ ${TEXT}${TEXT}`]: { paddingInlineStart: between },
    [`& > ${TEXT}${TEXT}:has(~ ${shown(TEXT)})`]: { paddingInlineEnd: between },
  };
}

/** Forced colors (Windows high contrast): a system edge that costs no space. */
export const FORCED_EDGE: Style = { outline: '1px solid CanvasText', outlineOffset: '-1px' };
/** Forced colors: an "on" state painted with Highlight. */
export const FORCED_ON: Style = { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' };
export const FORCED = '@media (forced-colors: active)';

// Shared pieces for the component slot recipes (components/<name>/<name>.recipe.ts). Lengths come
// from the geometry variables (styles/geometry.ts: --u, --h, --pad, --slot, --icon, --radius, …),
// never literals; states use the preset conditions (styles/conditions.ts), keyed on the data-* state
// contract both renderers set (dom/state.ts), so one rule serves the web component and React.
// Build-time only: element modules import the generated functions in styled-system/recipes.
import type { IntentName } from '../tokens/motion/index.ts';
import { voiceFamily } from '../styles/typography.ts';

type Style = Record<string, any>;

/**
 * Merge style objects key by key, recursing into nested selectors and conditions. A spread would
 * let a later object silently replace an earlier one's whole nested rule when both use the same key.
 */
export function mergeStyles(...parts: Style[]): Style {
  const out: Style = {};
  for (const part of parts) {
    for (const [k, v] of Object.entries(part)) {
      const prev = out[k];
      out[k] = prev && v && typeof prev === 'object' && typeof v === 'object' ? mergeStyles(prev, v) : v;
    }
  }
  return out;
}

interface RootRecipe {
  slots: readonly string[];
  base?: { root?: Style };
  variants?: Record<string, Record<string, { root?: Style }>>;
  defaultVariants?: Record<string, unknown>;
}

/**
 * Global rules that apply a slot recipe to a CSS-only tag (the layout containers, which run no script
 * and so never get the recipe classes): the base plus the default variants on `tag`, every other
 * variant on `tag[<variant>=<value>]`. The style objects are the recipe's own, so the recipe stays the
 * one source; `&` in a nested selector becomes the tag. Root-only recipes: a CSS-only tag has no parts.
 */
export function tagRules(tag: string, { slots, base = {}, variants = {}, defaultVariants = {} }: RootRecipe): Style {
  if (slots.some((s) => s !== 'root')) throw new Error(`${tag}: tagRules takes root-only recipes`);
  const defaults = Object.entries(defaultVariants).map(([v, value]) => variants[v][String(value)].root ?? {});
  const out: Style = { [tag]: mergeStyles(base.root ?? {}, ...defaults) };
  for (const [v, values] of Object.entries(variants)) {
    for (const [value, styles] of Object.entries(values)) if (String(defaultVariants[v]) !== value && styles.root) out[`${tag}[${v}=${value}]`] = styles.root;
  }
  return out;
}

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

// ── Composites (listbox, segmented, the select popup): the 0.5u wrapper level ──

/**
 * Composite geometry, declared on the list or popup; options read the inherited values. D is the
 * composite edge, Ic the option inset, the option height 6u + 2Ic (resolveComposite). Padding and gap
 * are the theme's pad-composite / gap-composite; the gap attribute wins on its own element.
 */
export const composite: Style = {
  '--d': 'max(var(--b), calc(var(--ui-pad-composite) * var(--u)))',
  '--ci': 'max(var(--b), calc(var(--u) - var(--d)))',
  '--ch': 'calc(var(--slot) + 2 * var(--ci))',
  // Container curvature, concentric with the options (composite is exempt from radius ≤ padding).
  '--cr': 'calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale))',
  padding: 'calc(var(--d) - var(--b))',
  gap: 'calc(var(--ui-gap, var(--ui-gap-composite)) * var(--u))',
  borderWidth: 'var(--b)',
  borderRadius: 'var(--cr)',
};

/** An option in a composite: 7u tall with the 3u control radius (concentric with the composite's). */
export const compositeOption: Style = {
  minHeight: 'var(--ch)',
  padding: 'calc(var(--ci) - var(--b))',
  borderWidth: 'var(--b)',
  borderColor: 'transparent',
  borderRadius: 'min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d))))',
  fontSize: 'var(--font)',
};

/** Forced colors (Windows high contrast): a system edge that costs no space. */
export const FORCED_EDGE: Style = { outline: '1px solid CanvasText', outlineOffset: '-1px' };
/** Forced colors: an "on" state painted with Highlight. */
export const FORCED_ON: Style = { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' };
export const FORCED = '@media (forced-colors: active)';

// ── Fields (input, select): label, control, description, error ──

/** Field host: label, control, description and error in a column. */
export const fieldRoot: Style = {
  display: 'flex', flexDirection: 'column', gap: '1.5', fontFamily: UI_FONT,
  // hide-label: the label stays the control's accessible name but is not drawn (visually hidden,
  // out of flow, so the field keeps no gap for it).
  '&:is([hide-label], [data-hide-label]) > [data-part=label]': {
    position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden',
    clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
  },
  // Required: a marker after the label.
  '&[data-required] > [data-part=label]::after': { content: '" *"', color: 'critical.fg' },
};

/** Field label, description and error slots. */
export const fieldParts: Record<'label' | 'description' | 'error', Style> = {
  label: { textStyle: 'label', color: 'fg.muted', alignSelf: 'start', cursor: 'default' },
  description: { textStyle: 'caption', color: 'fg.muted' },
  error: { textStyle: 'caption', color: 'critical.fg' },
};

/**
 * A field control (the input control, the select trigger): laid out as a button, 1u (padding +
 * border) on the host; contents and slots carry the rest. `state` gives the selectors of each state
 * for this control in both renderers. Invalid is a critical-tinted fill (borders default to 0, so the
 * edge alone cannot carry it); read-only drops the fill; disabled fades.
 */
export function fieldControl(state: { invalid: string; disabled: string; readonly: string }): Style {
  return {
    display: 'flex', alignItems: 'center', width: '100%', height: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg.muted', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--line)',
    transition: t('feedback', ...PAINT),
    ...constructionPattern({
      slot: 'var(--u)', bare: 'calc(2 * var(--u))',
      text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)' },
    }),
    // Field text (input, select value) fills the row.
    '& > [data-part=contents]': { flex: '1', minWidth: 'var(--slot)' },
    [`&:not(${state.disabled}, ${state.readonly}):hover`]: { bg: 'bg.mutedHover' },
    [`&${state.invalid}`]: { borderColor: 'critical.solid', bg: CRITICAL_TINT(14), '&:hover': { bg: CRITICAL_TINT(20) } },
    [`&${state.readonly}`]: { bg: 'bg.subtle', cursor: 'default' },
    [`&${state.disabled}`]: { opacity: 0.5, cursor: 'not-allowed' },
    '& > [data-part=contents]::placeholder': { color: 'fg.subtle' },
    [FORCED]: FORCED_EDGE,
  };
}

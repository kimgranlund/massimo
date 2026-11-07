// Shared pieces for the component slot recipes (components/<name>/<name>.recipe.ts). Lengths come
// from the geometry variables (styles/geometry.ts: --u, --h, --pad, --slot, --icon, --radius, …),
// never literals; states use the preset conditions (styles/conditions.ts), keyed on the data-* state
// contract both renderers set (dom/state.ts), so one rule serves the web component and React.
// Build-time only: element modules import the generated functions in styled-system/recipes.
import { DENSITY_INSET_CSS } from '../tokens/geometry/index.ts';
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
    for (const [value, styles] of Object.entries(values)) if (String(defaultVariants[v]) !== value && styles.root) out[`${tag}[${v}=${/^[a-z]/i.test(value) ? value : `"${value}"`}]`] = styles.root;
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

// The select trigger names its contents and trailing places after Base UI (value, icon).
const TEXT = ':is([data-part=prefix], [data-part=contents], [data-part=value], [data-part=suffix])';
const SLOT = ':is([data-part=leading], [data-part=trailing], [data-part=icon])';
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
    [`& > ${TEXT}:has(~ ${shown(':is([data-part=trailing], [data-part=icon])')})`]: { paddingInlineEnd: slot },
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
/** The control radius: 3u × s, capped at half the control height (resolveControl; 8u at default density). */
export const CONTROL_RADIUS = 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(var(--ctl-h) / 2))';

/** An option's concentric radius in its composite: R − D, at most half its height. */
const OPTION_R = 'min(calc(var(--ch) / 2), max(0px, calc(var(--cr) - var(--d))))';

export const composite: Style = {
  '--d': 'max(var(--b), calc(calc(var(--ui-pad-composite) * (0.5 + 0.5 * var(--ui-density))) * var(--u)))',
  // The option inset: the control inset (density) less the composite edge, so one row is the control height.
  '--ci': 'max(var(--b), calc(var(--di) * var(--u) - var(--d)))',
  '--ch': 'calc(var(--slot) + 2 * var(--ci))',
  // A composite is a control: it takes the control radius, min(3u·s, 4u), and its options split the
  // difference, R − D, so they stay concentric with it (composite is exempt from radius ≤ padding).
  '--cr': CONTROL_RADIUS,
  // Attached radii (attachedComposite) stop here, so a composite nested inside an attached one keeps its own.
  '--child-r': 'initial', '--c-ss': 'initial', '--c-se': 'initial', '--c-es': 'initial', '--c-ee': 'initial',
  padding: 'calc(var(--d) - var(--b))',
  gap: 'calc(var(--ui-gap, calc(var(--ui-gap-composite) * (0.5 + 0.5 * var(--ui-density)))) * var(--u))',
  borderWidth: 'var(--b)',
  borderRadius: 'var(--cr)',
};

/** inset="none" on a composite or track control (either renderer: the attribute, or data-inset). */
export const ATTACHED = ':is([inset=none], [data-inset=none])';

/**
 * An attached composite (inset="none"): the edge is the border alone, no gap, the children lose
 * their curvature (radius 0) except the first and last, which keep the container's outer corners
 * (R − D), and a 1px divider of the border role separates neighbours (an inset shadow, so it costs no
 * space and the selected fill keeps it). The selector repeats ATTACHED so it outranks the options'
 * own radius and lift. `direction` is the main axis: row for segmented, column for a list.
 */
export function attachedComposite(direction: 'row' | 'column'): Style {
  const A = `&${ATTACHED}${ATTACHED}`;
  const outer = 'max(0px, calc(var(--cr) - var(--d)))';
  // Corners reach the options as variables (compositeOption reads them), so no selector has to
  // outrank the option's own rules; every corner is set, so a nested orientation (a vertical toggle
  // group) replaces the row's corners.
  const corners = (ss: boolean, se: boolean, es: boolean, ee: boolean) => ({
    '--c-ss': ss ? outer : '0px', '--c-se': se ? outer : '0px', '--c-es': es ? outer : '0px', '--c-ee': ee ? outer : '0px',
  });
  const [first, last] = direction === 'row' ? [corners(true, false, true, false), corners(false, true, false, true)] : [corners(true, true, false, false), corners(false, false, true, true)];
  return {
    [`&${ATTACHED}`]: { '--d': 'var(--b)', gap: '0', '--child-r': '0px' },
    [`${A} > *`]: { boxShadow: 'none' },
    [`${A} > :not(:first-child)`]: { boxShadow: direction === 'row' ? 'inset 1px 0 0 {colors.border}' : 'inset 0 1px 0 {colors.border}' },
    [`${A} > :first-child`]: first,
    [`${A} > :last-child`]: last,
    [`${A} > :only-child`]: corners(true, true, true, true),
  };
}

/** An option in a composite: 7u tall, radius R − D (concentric with the composite's control radius). */
export const compositeOption: Style = {
  minHeight: 'var(--ch)',
  padding: 'calc(var(--ci) - var(--b))',
  borderWidth: 'var(--b)',
  borderColor: 'transparent',
  // Concentric with the composite (R − D); attached composites (inset="none") set --child-r (0) and
  // the outer corners --c-ss / -se / -es / -ee on their first and last children.
  borderStartStartRadius: `var(--c-ss, var(--child-r, ${OPTION_R}))`, borderStartEndRadius: `var(--c-se, var(--child-r, ${OPTION_R}))`,
  borderEndStartRadius: `var(--c-es, var(--child-r, ${OPTION_R}))`, borderEndEndRadius: `var(--c-ee, var(--child-r, ${OPTION_R}))`,
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
  // out of flow, so the field keeps no gap for it). The host holds it: anchored to the page instead,
  // it escapes a scroller and stretches the document.
  '&:is([hide-label], [data-hide-label])': { position: 'relative' },
  '&:is([hide-label], [data-hide-label]) > [data-part=label]': {
    position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden',
    clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
  },
  // Required: a marker after the label.
  '&[data-required] > [data-part=label]::after': { content: '" *"', color: 'critical.fg' },
};

/** The control's inset + its contents' 2u: the left edge of a field's text. */
/** A row's block padding: 3u × the density factor (resolveDividedRow), from the theme. */
export const ROW_BLOCK = 'calc(3 * (0.5 + 0.5 * var(--ui-density)) * var(--ui-unit) * 1px)';
export const FIELD_TEXT_EDGE = `calc((${DENSITY_INSET_CSS} + 2) * var(--ui-unit) * 1px)`; // from the theme: ui-field has no --u of its own

/** Field label, description and error slots. */
/** What the field's action rule applies to: a button in either renderer. */
const FIELD_ACTION = ':is(ui-button, [data-ui=button])';
export const fieldParts: Record<'label' | 'description' | 'error', Style> = {
  // Label and caption take their role's color (muted by default; theme typography.colors).
  // All three start where the control's text starts (resolveField textEdge), not at its edge.
  label: { textStyle: 'label', alignSelf: 'start', cursor: 'default', paddingInlineStart: FIELD_TEXT_EDGE },
  description: { textStyle: 'body-sm', paddingInlineStart: FIELD_TEXT_EDGE },
  error: { textStyle: 'body-sm', color: 'critical.fg', paddingInlineStart: FIELD_TEXT_EDGE },
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
    // Field text (input contents, select value) fills the row.
    '& > :is([data-part=contents], [data-part=value])': { flex: '1', minWidth: 'var(--slot)' },
    [`&:not(${state.disabled}, ${state.readonly}):hover`]: { bg: 'bg.mutedHover' },
    [`&${state.invalid}`]: { borderColor: 'critical.solid', bg: CRITICAL_TINT(14), '&:hover': { bg: CRITICAL_TINT(20) } },
    [`&${state.readonly}`]: { bg: 'bg.subtle', cursor: 'default' },
    [`&${state.disabled}`]: { opacity: 0.5, cursor: 'not-allowed' },
    '& > [data-part=contents]::placeholder': { color: 'fg.subtle' },
    // A button in the trailing slot sits ½u from the edge with nested corners (resolveFieldAction), whatever the density's padding.
    [`& > [data-part=trailing]:has(> ${FIELD_ACTION})`]: { marginBlock: 'calc(0.5 * var(--u) - var(--pad) - var(--b))', marginInlineEnd: 'calc(0.5 * var(--u) - var(--pad) - var(--b))' },
    [`& > [data-part=trailing] > ${FIELD_ACTION}`]: { width: 'auto', height: 'calc(var(--h) - var(--u))', minHeight: 0, borderRadius: 'max(0px, calc(var(--radius) - 0.5 * var(--u)))' },
    [FORCED]: FORCED_EDGE,
  };
}

// ── Floating layers (dom/floating.ts; docs/specs/components.md, Floating layers) ──

type FloatSide = 'top' | 'bottom' | 'left' | 'right';
type FloatAlign = 'start' | 'center' | 'end';

/** Where CSS anchor positioning runs (the same test as dom/floating.ts anchorPositioning). */
export const ANCHORED = '@supports (position-area: block-end) and (anchor-scope: all)';

/**
 * A floating popup's surface: fixed in the top layer ([popover]), the overlay fill and edge, sized
 * from Base UI's positioner variables (computed in CSS by anchoredPopup where anchor positioning
 * runs, set in px by the script positioner elsewhere), and the reveal motion (opacity and scale from
 * the anchor edge, --transform-origin; display and overlay transition discretely so the fade runs
 * while the popover closes). Pair it with floatingOpen on the open state and sideOrigins.
 */
export const floatingPopup: Style = {
  flexDirection: 'column', position: 'fixed', inset: 'auto', margin: 0, overflowY: 'auto', overscrollBehavior: 'contain',
  // Elevation level 4 (floating): the overlay fill and the floating shadow (tokens/elevation).
  bg: 'elevation.overlay', color: 'fg', borderColor: 'border', boxShadow: 'floating',
  minWidth: 'var(--anchor-width)', maxHeight: 'var(--available-height)',
  // Grows from its anchor edge: the top edge below the anchor (the default side), the opposite
  // edge on the other sides (sideOrigins, by data-side).
  '--transform-origin': 'top center',
  transformOrigin: 'var(--transform-origin)', opacity: 0, scale: 0.97,
  transition: `${t('reveal', 'opacity', 'scale')}, display {durations.reveal} allow-discrete, overlay {durations.reveal} allow-discrete`,
  [FORCED]: FORCED_EDGE,
};

/** The open state of a floating popup: shown at full size, entering from the closed look. */
export const floatingOpen: Style = { opacity: 1, scale: 1, '@starting-style': { opacity: 0, scale: 0.97 } };

/** Base UI data-side: the popup grows from the edge that faces its anchor. */
export const sideOrigins: Style = {
  '&[data-side=top]': { '--transform-origin': 'bottom center' },
  '&[data-side=left]': { '--transform-origin': 'right center' },
  '&[data-side=right]': { '--transform-origin': 'left center' },
};

const AREA: Record<FloatSide, string> = { bottom: 'block-end', top: 'block-start', right: 'inline-end', left: 'inline-start' };
const MARGIN: Record<FloatSide, string> = { bottom: 'marginBlockStart', top: 'marginBlockEnd', right: 'marginInlineStart', left: 'marginInlineEnd' };

/**
 * CSS anchor positioning for a popup (inside the ANCHORED condition): placed on `side` of the
 * element whose anchorName is `anchor` (scope it per instance with anchorScope on the host), aligned
 * `align`, 1u away, flipped to the opposite side when there is more room there. The positioner
 * variables hold anchor functions and percentages of the position-area cell (the space beside the
 * anchor), so they resolve where they are used: in sizing, inset and margin properties.
 */
export function anchoredPopup({ anchor, side = 'bottom', align = 'start' }: { anchor: string; side?: FloatSide; align?: FloatAlign }): Style {
  const block = side === 'top' || side === 'bottom';
  const span = align === 'center' ? 'span-all' : `span-${block ? 'inline' : 'block'}-${align === 'start' ? 'end' : 'start'}`;
  return {
    positionAnchor: anchor, positionArea: `${AREA[side]} ${span}`,
    positionTryFallbacks: block ? 'flip-block' : 'flip-inline', positionTryOrder: block ? 'most-block-size' : 'most-inline-size',
    ...(align === 'center' ? { [block ? 'justifySelf' : 'alignSelf']: 'anchor-center' } : {}),
    '--anchor-width': 'anchor-size(width)', '--anchor-height': 'anchor-size(height)',
    // The cell spans from the anchor's start edge (or the whole axis, centered) to the viewport's
    // end, and from the anchor to the viewport edge on the open side; the 1u margin toward the
    // anchor is not available.
    '--available-width': block ? '100%' : 'calc(100% - var(--u))', '--available-height': block ? 'calc(100% - var(--u))' : '100%',
    // One margin toward the anchor; the flip mirrors it.
    [MARGIN[side]]: 'var(--u)',
  };
}

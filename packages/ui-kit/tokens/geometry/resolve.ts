// Component geometry: the numerical reference for every control and composite.
// Based on Differential Forms v0.2.2 (mathematical-design-system skill), adapted:
// - size IS the unit: size="2" … size="12" sets u; a control is 8u tall.
// - controls have leading / contents / trailing slots, each at least 6u square,
//   inside 1u of padding (the border is spent inside that padding, never added).
// - text is 10px + u at line height 1.2 (capped at the 6u slot); contents are centered in the slot by
//   equal block padding.
// styles/geometry.ts implements the same formulas in CSS; tests and the browser
// check (apps/studio/geometry-check.html) keep the two in agreement. Lengths in CSS px.
import { RATIOS, customRatio } from '../../components/image/ratios.ts';

/** Supported units; control height = 8u. 2..4.5 as before, then every 0.5 up to 12 (96px controls). */
export const SIZES = [2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, ...Array.from({ length: 15 }, (_, i) => 5 + i * 0.5)] as const;
/** Gutter values (units of u) accepted by the gap attribute. */
export const GAPS = Array.from({ length: 17 }, (_, i) => i * 0.5);
export type IconSize = 'sm' | 'md' | 'lg' | 'fill';

/** Icon size = font size + k·u (fill takes the whole slot). */
export const ICON_STEPS: Record<Exclude<IconSize, 'fill'>, number> = { sm: -0.5, md: 0.5, lg: 1.5 };

export interface GeometryInput {
  /** Unit u in px (the size). */
  unit?: number;
  /** Border B, 0..u/2. Use whole pixels: browsers snap fractional borders to device pixels. */
  border?: number;
  /** Multiplier on the soft (3u) curvature; 0 = square. */
  radiusScale?: number;
  /** Gap override in units of u (gap attribute); default = the container's padding level. */
  gap?: number;
  iconSize?: IconSize;
}

export const GEOMETRY_DEFAULTS = { unit: 4.5, border: 0, radiusScale: 1, iconSize: 'md' as IconSize };

function inputs(input: GeometryInput) {
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  const bad = (m: string) => { throw new RangeError(m); };
  if (!(x.unit >= 2 && x.unit <= 12)) bad('unit must be 2..12px');
  if (!(x.border >= 0 && x.border <= x.unit / 2)) bad('border must be 0..u/2');
  if (!(x.radiusScale >= 0 && x.radiusScale <= 3)) bad('radius scale must be 0..3');
  if (input.gap !== undefined && !(input.gap >= 0 && input.gap <= 8)) bad('gap must be 0..8u');
  if (!['sm', 'md', 'lg', 'fill'].includes(x.iconSize)) bad('unknown icon size');
  return x;
}

/** Icon artwork, capped at the 6u slot so the control stays 8u (md caps below u≈2.2, lg below u≈2.9). */
export function resolveIcon(fontSize: number, unit: number, size: IconSize, slot: number) {
  return size === 'fill' ? slot : Math.min(fontSize + ICON_STEPS[size] * unit, slot);
}

/** Control family: ui-button, ui-input, ui-select trigger. */
export function resolveControl(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit, b = x.border;
  const slot = 6 * u;
  const inset = u;
  const height = slot + 2 * inset; // 8u
  const fontSize = 10 + u;
  return {
    unit: u, border: b, slot, inset, height,
    padding: inset - b,
    fontSize,
    contents: { paddingInline: u, ...singleLine(fontSize, slot), minSize: slot },
    iconSize: resolveIcon(fontSize, u, x.iconSize, slot),
    radius: Math.min(3 * u * x.radiusScale, height / 2),
  };
}

/** Single-line control text: line height 1.2 × font, capped at the slot, centered by equal block padding. */
export function singleLine(fontSize: number, slot: number) {
  const lineHeight = Math.min(1.2 * fontSize, slot);
  return { lineHeight, paddingBlock: Math.round(((slot - lineHeight) / 2) * 1e6) / 1e6 };
}

/** Button and option label padding: 1u beside a slot, 2u on a side with no leading/trailing element. */
export function resolveButtonContents(leading: boolean, trailing: boolean, input: GeometryInput = {}) {
  const u = resolveControl(input).unit;
  return { start: leading ? u : 2 * u, end: trailing ? u : 2 * u };
}

export type TextPart = 'prefix' | 'contents' | 'suffix';
export interface ControlParts { leading?: boolean; prefix?: boolean; contents?: boolean; suffix?: boolean; trailing?: boolean }

/**
 * Construction pattern for every labelled control:
 *   [leading icon slot] [prefix] [contents (label)] [suffix] [trailing icon slot]
 * The text parts (prefix, contents, suffix) form one run. A text part's inline edge is
 *   0.5u beside another text part (so adjacent text parts sit 1u apart),
 *   `slotEdge` beside a slot (1u for controls), `bareEdge` at the host edge (2u for controls).
 * Absent parts take no space. Badge, tag and chip pass their own edges (resolveBtg).
 */
export function resolveTextRun(parts: ControlParts, input: GeometryInput & { slotEdge?: number; bareEdge?: number; between?: number } = {}) {
  const u = resolveControl(input).unit;
  const slotEdge = input.slotEdge ?? u, bareEdge = input.bareEdge ?? 2 * u, between = input.between ?? 0.5 * u;
  const p = { contents: true, ...parts };
  const order: TextPart[] = ['prefix', 'contents', 'suffix'];
  const shown = order.filter((k) => p[k]);
  const out: Partial<Record<TextPart, { start: number; end: number }>> = {};
  shown.forEach((k, i) => {
    out[k] = {
      start: i > 0 ? between : p.leading ? slotEdge : bareEdge,
      end: i < shown.length - 1 ? between : p.trailing ? slotEdge : bareEdge,
    };
  });
  return out;
}

// ── Containers ──
// Three families, one radius rule each:
// - wrapper (composite, group, collection): hugs its children, so its radius is concentric with
//   them: the 3u control radius + its padding, capped at half its height.
// - container (card, padding xs | sm | md | lg | xl): a self-contained surface; its radius equals its
//   padding, never rounder than it is deep (the corner scale can lower it, not raise it).
// - area (panel, region, page): meets the viewport or other areas, so it is square.
// Padding and gap are theme parameters per level (pad-<level>, gap-<level>, in u); these are their
// defaults. Gap = padding unless the gap attribute overrides it.
export type ContainerFamily = 'wrapper' | 'container' | 'area';
export const CONTAINERS = {
  composite:  { family: 'wrapper',   padding: 0.5, maxRadius: 3.5 },
  group:      { family: 'wrapper',   padding: 1,   maxRadius: 4 },
  collection: { family: 'wrapper',   padding: 2,   maxRadius: 5 },
  'card-xs':  { family: 'container', padding: 2,   maxRadius: 2 },
  'card-sm':  { family: 'container', padding: 3,   maxRadius: 3 },
  'card-md':  { family: 'container', padding: 4,   maxRadius: 4 },
  'card-lg':  { family: 'container', padding: 5,   maxRadius: 5 },
  'card-xl':  { family: 'container', padding: 6,   maxRadius: 6 },
  panel:      { family: 'area',      padding: 6,   maxRadius: 0 },
  region:     { family: 'area',      padding: 8,   maxRadius: 0 },
  // Same spacing as region, plus a centered max width (styles/defaults.ts, page() pattern).
  page:       { family: 'area',      padding: 8,   maxRadius: 0 },
} as const satisfies Record<string, { family: ContainerFamily; padding: number; maxRadius: number }>;
export type ContainerLevel = keyof typeof CONTAINERS;

/** Card padding variants: <ui-card padding="xs | sm | md | lg | xl"> (md is the default). */
export const CARD_PADDINGS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type CardPadding = (typeof CARD_PADDINGS)[number];

/** The element (and attribute) that establishes a level. */
export const levelTag = (level: ContainerLevel) => level.startsWith('card-') ? 'ui-card' : `ui-${level}`;

/** Page max width: 72rem (1152px at a 16px root). Fixed, not u-scaled. */
export const PAGE_MAX_WIDTH_REM = 72;

/** Square levels (the area family): they meet the viewport or other areas, so they get no radius. */
export const SQUARE_LEVELS: ReadonlySet<ContainerLevel> = new Set((Object.keys(CONTAINERS) as ContainerLevel[]).filter((l) => CONTAINERS[l].family === 'area'));

/**
 * Container padding, gap and radius. `padUnits` / `gapUnits` override the level's theme
 * defaults (pad-<level>, gap-<level>); `gap` is the per-element attribute and wins over both.
 * Pass `height` to apply the half-height radius cap.
 */
export function resolveContainer(level: ContainerLevel, input: GeometryInput & { height?: number; padUnits?: number; gapUnits?: number } = {}) {
  const x = inputs(input);
  const u = x.unit;
  const pad = input.padUnits ?? CONTAINERS[level].padding;
  const family = CONTAINERS[level].family;
  const radius = family === 'area' ? 0
    : family === 'wrapper' ? (3 + pad) * u * x.radiusScale // concentric with 3u children
    : pad * u * Math.min(1, x.radiusScale);                // container: at most the padding
  return {
    unit: u, border: x.border,
    padding: Math.max(0, pad * u - x.border),
    edge: pad * u,
    gap: (input.gap ?? input.gapUnits ?? pad) * u,
    radius: input.height === undefined ? radius : Math.min(radius, input.height / 2),
  };
}

/**
 * Composite: ui-listbox, ui-segmented, select popup. Padding is the composite level (0.5u);
 * options use the control anatomy with their inset reduced by that edge, so a one-row
 * segmented control is exactly 8u and its options keep the 3u control radius (concentric: the
 * composite is a wrapper).
 */
export function resolveComposite(input: GeometryInput & { container?: boolean } = {}) {
  const c = resolveControl(input);
  const box = resolveContainer('composite', input);
  const edge = Math.max(c.border, box.edge);             // D
  const childInset = Math.max(c.border, c.inset - edge); // Ic
  const childHeight = c.slot + 2 * childInset;
  const rowHeight = childHeight + 2 * edge;
  const radius = input.container ? box.radius : Math.min(box.radius, rowHeight / 2);
  return {
    edge, padding: edge - c.border, gap: box.gap, radius, rowHeight,
    child: {
      inset: childInset, padding: childInset - c.border, height: childHeight,
      radius: Math.min(childHeight / 2, Math.max(0, radius - edge)),
    },
  };
}

/** Text fields: the editable text sits where button contents sit (padding + 1u). */
export function resolveField(input: GeometryInput = {}) {
  // Laid out as a slotless button: the control has 1u (padding + border); its contents part
  // carries the label padding (2u each side), so text sits where a button label sits.
  const c = resolveControl(input), label = resolveButtonContents(false, false, input);
  return { ...c, contentsStart: label.start, contentsEnd: label.end, paddingStart: c.padding + label.start, paddingEnd: c.padding + label.end };
}

/** Select trigger: value as contents, chevron in a trailing 6u slot. */
export function resolveSelectTrigger(input: GeometryInput = {}) {
  // Laid out as a button with a trailing slot: 1u on the trigger; contents (the value) 2u | 1u;
  // the chevron in the 6u trailing slot.
  const c = resolveControl(input), label = resolveButtonContents(false, true, input);
  // The chevron (like every caret) is icon size sm.
  return { ...c, contentsStart: label.start, contentsEnd: label.end, paddingStart: c.padding + label.start, valueGap: label.end, paddingEnd: c.padding, chevronSlot: c.slot, chevronIcon: resolveIcon(c.fontSize, c.unit, 'sm', c.slot) };
}

// ── Badge / tag / chip ──
// Heights sit on a 12px base plus k·u (badge 1, tag 2, chip 3), capped so a chip is never
// taller than a control and each level stays one u below the next:
//   chip = min(12 + 3u, 8u), tag = min(12 + 2u, chip − u), badge = min(12 + u, tag − u).
// The cap only bites below u = 2.5. Text steps down 0.5u per level from the control font.
export type BtgKind = 'badge' | 'tag' | 'chip';

export function btgHeights(unit: number) {
  const chip = Math.min(12 + 3 * unit, 8 * unit);
  const tag = Math.min(12 + 2 * unit, chip - unit);
  const badge = Math.min(12 + unit, tag - unit);
  return { badge, tag, chip };
}

export function resolveBtg(kind: BtgKind, input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit, b = x.border;
  const height = btgHeights(u)[kind];
  const fontSize = { chip: 10 + u, tag: 10 + 0.5 * u, badge: 10 }[kind];
  // Spacing uses the local unit u′ = height / 8 (a control is 8u tall), so each element is spaced
  // like a scaled-down control: host 0.5u′ − B, slot = height − u′, labels 1u′ on both sides
  // (beside a slot too), text parts 0.5u′ apart.
  const lu = height / 8;
  const slot = height - lu;
  const pad = Math.max(0, 0.5 * lu - b);
  // Chip labels get +0.5u′ compensation at a bare edge so text balances an icon's artwork.
  const edges = { bareEdge: kind === 'chip' ? 1.5 * lu : lu, slotEdge: lu, between: 0.25 * lu };
  return {
    unit: u, localUnit: lu, border: b, height, fontSize, slot,
    minWidth: height,
    padding: pad,
    ...edges,
    contentsPaddingInline: edges.bareEdge,
    // Single-line text at 1.2. Chip centers it in the slot with block padding; tag and badge
    // omit block padding (the row centers the text).
    ...(kind === 'chip' ? singleLine(fontSize, slot) : { lineHeight: Math.min(1.2 * fontSize, slot), paddingBlock: 0 }),
    iconSize: resolveIcon(fontSize, u, x.iconSize, slot),
    // Concentric: edge 0.5u′ + slot / 3 (the button's 1u + 6u / 3), × curvature, pill at height / 2.
    radius: Math.min((0.5 * lu + slot / 3) * x.radiusScale, height / 2),
  };
}

// ── Choices, tracks, swatches ──
// Checkbox, radio and switch sit on a 5u box inside the 6u leading slot (0.5u around it), so
// the label lands 1.5u from the box after its 1u start padding. Range and progress use a 4u box
// whose track fills it (full height, rounded at half height); range adds a 4u thumb inside it.
export type ChoiceKind = 'checkbox' | 'radio' | 'switch';

export function resolveChoice(kind: ChoiceKind, input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  const box = 5 * u;
  const width = kind === 'switch' ? 9 * u : box;
  return {
    unit: u, box, width, slot: 6 * u,
    rowHeight: 6 * u,
    labelPaddingStart: u,
    // Checkbox: 1u corners (scaled); radio and switch stay round.
    radius: kind === 'checkbox' ? u * x.radiusScale : box / 2,
    mark: 4 * u,              // check / minus icon inside the checkbox
    dot: 2 * u,               // radio dot
    thumb: 4 * u,             // switch thumb
    thumbInset: 0.5 * u,
    thumbTravel: width - 4 * u - u, // switch: thumb moves track width - thumb - 2 insets
  };
}

export type TrackKind = 'range' | 'progress';

export function resolveTrack(kind: TrackKind, input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  const height = 4 * u;
  const trackRadius = Math.min(3 * u * x.radiusScale, height / 2);
  // Range thumb sits inside the track like a switch thumb: track − u, inset 0.5u, concentric radius.
  return {
    unit: u, height, track: height, trackRadius, minWidth: 24 * u,
    thumb: kind === 'range' ? height - u : 0, thumbInset: kind === 'range' ? 0.5 * u : 0,
    thumbRadius: kind === 'range' ? Math.max(0, trackRadius - 0.5 * u) : 0,
  };
}

/**
 * Fill width for a track of `width` at `ratio`. Range: the fill ends one track-radius past the
 * thumb's center, track + ratio·(width − track), so its round cap wraps the thumb; progress is
 * proportional.
 */
export function trackFill(kind: TrackKind, ratio: number, width: number, input: GeometryInput = {}) {
  const t = resolveTrack(kind, input);
  return kind === 'range' ? t.track + ratio * (width - t.track) : ratio * width;
}

/** Range thumb offset from the start edge: inset + ratio·(width − track). Its center is track/2 + ratio·(width − track). */
export function thumbOffset(ratio: number, width: number, input: GeometryInput = {}) {
  const t = resolveTrack('range', input);
  return t.thumbInset + ratio * (width - t.track);
}

/** Swatch: a 6u square (the slot size); palettes attach swatches with no gap. */
export function resolveSwatch(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  return { size: 6 * u, radius: u * x.radiusScale, paletteRadius: 2 * u * x.radiusScale };
}

/** Swiper controls: icon-only paddles (8u buttons) inset 2u from the edge; 2u dots (active 4u wide) in 4u hit areas, u apart, 2u above the bottom. */
export function resolveSwiper(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  // Paddles are fully round (radius = half their height); the dots row sits 2u above the bottom edge.
  return { paddle: 8 * u, paddleInset: 2 * u, paddleRadius: 4 * u, dot: 2 * u, dotActive: 4 * u, dotRadius: u, dotHit: 4 * u, dotsGap: u, dotsInset: 2 * u };
}

// ── Field rows ──
// A field row places a label, a control, a readout and a description (components/field/field.recipe.ts);
// the control keeps its own geometry. Every length is a multiple of u (Panda spacing and sizes tokens).
export type FieldRowLayout = 'stacked' | 'inline';

/** ui-field: column gap 2u; row gap 1.5u stacked (label above), 1u inline (description under the control). */
export function resolveFieldRow(layout: FieldRowLayout = 'stacked', input: GeometryInput = {}) {
  const u = inputs(input).unit;
  return {
    unit: u,
    columnGap: 2 * u,
    rowGap: layout === 'stacked' ? 1.5 * u : u,
    // Label to its unit suffix: 1u; inline, the unit sits at the label column's end, at least 2u away.
    unitGap: layout === 'stacked' ? u : 2 * u,
    readoutMinWidth: 10 * u,
  };
}

/** ui-field-grid: shared label | control | readout columns, gaps 2u, label column ≤ 40%, 4u above every heading but the first. */
export function resolveFieldGrid(input: GeometryInput = {}) {
  const u = inputs(input).unit;
  return { unit: u, columnGap: 2 * u, rowGap: 2 * u, labelMaxFraction: 0.4, readoutMinWidth: 10 * u, headingSpace: 4 * u };
}

// ── Image ──
// ui-image is a square-cornered frame whose height follows its cover ratio
// (components/image/ratios.ts: presets, or a custom "w/h"); with no or an invalid ratio the frame
// takes its content's height. A slideshow fills the frame with a swiper (resolveSwiper).
export const IMAGE_RATIOS: Record<string, number> = Object.fromEntries(Object.entries(RATIOS).map(([k, v]) => [k, ratioValue(v)!]));

function ratioValue(value: string): number | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(value);
  return m && +m[2] > 0 ? +m[1] / +m[2] : null;
}

/** Frame height for a width (null: no ratio, the content sets it), radius 0, slideshow parts. */
export function resolveImage(input: GeometryInput & { ratio?: string; width?: number } = {}) {
  const value = input.ratio ?? '';
  const ratio = Object.hasOwn(IMAGE_RATIOS, value) ? IMAGE_RATIOS[value] : customRatio(value) ? ratioValue(value) : null;
  return {
    ratio,
    height: ratio && input.width !== undefined ? input.width / ratio : null,
    radius: 0,
    slideshow: resolveSwiper(input),
  };
}

/** Popup offset from its trigger. */
export const popupOffset = (input: GeometryInput = {}) => inputs(input).unit;

// ── Display: separator ──
// A separator is a rule as thick as the theme border, never thinner than a hairline: max(1px, B)
// with B = min(border, u/2). It spans its container on the other axis and takes no padding.
export type SeparatorOrientation = 'horizontal' | 'vertical';

/** ui-separator: thickness max(1px, B); horizontal = full width × thickness, vertical = thickness × full height. */
export function resolveSeparator(input: GeometryInput = {}) {
  const x = inputs(input);
  const b = Math.min(x.border, x.unit / 2);
  return { unit: x.unit, border: b, thickness: Math.max(1, b) };
}

// ── Display: avatar ──
// An avatar is a square on the slot and control ladder: sm = the 6u slot (it fits a button's
// leading slot), md = the 8u control height (default), lg = 12u, xl = 16u. It is a control scaled by
// k = size / 8u: its initials take the control font × k and its fallback icon the md icon × k, so
// the artwork keeps the control's proportions at every size. It is round: radius = size / 2 ×
// min(1, s) (the corner scale squares it, never rounds it past a circle).
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export const AVATAR_SIZES: Record<AvatarSize, number> = { sm: 6, md: 8, lg: 12, xl: 16 };

/** ui-avatar: box n·u (sm 6, md 8, lg 12, xl 16), initials (10px + u)·k, icon (10px + 1.5u)·k, k = n / 8; radius box/2 · min(1, s). */
export function resolveAvatar(size: AvatarSize = 'md', input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  if (!Object.hasOwn(AVATAR_SIZES, size)) throw new RangeError('unknown avatar size');
  const box = AVATAR_SIZES[size] * u, k = AVATAR_SIZES[size] / 8;
  const fontSize = (10 + u) * k;
  return {
    unit: u, size: box, scale: k, fontSize,
    lineHeight: Math.min(1.2 * fontSize, box),
    iconSize: (10 + u + ICON_STEPS.md * u) * k,
    radius: (box / 2) * Math.min(1, x.radiusScale),
  };
}

// ── Meter ──
// A meter is the progress track (resolveTrack: 4u, fill = ratio × width) under a text row: the label
// at the start and the formatted value at the end, single lines in the control voice (10px + u at
// min(1.2 × font, 6u)), 2u apart at least; the track sits 1.5u below the row (the stacked field gap).

/** ui-meter: the progress track, a label | value row (column gap 2u) 1.5u above it, control text. */
export function resolveMeter(input: GeometryInput = {}) {
  const t = resolveTrack('progress', input);
  const u = t.unit, fontSize = 10 + u;
  return { ...t, rowGap: 1.5 * u, columnGap: 2 * u, fontSize, lineHeight: Math.min(1.2 * fontSize, 6 * u) };
}

// ── Choice groups ──
// ui-radio-group and ui-checkbox-group stack their 6u choice rows (resolveChoice) 1u apart, so the
// pitch is the 7u of a composite item; a horizontal group puts 4u between choices (a choice label
// has no end padding) and wraps with 1u between rows. The gap attribute (g·u) replaces the gap
// along the group's direction.
export type ChoiceGroupOrientation = 'vertical' | 'horizontal';

export function resolveChoiceGroup(orientation: ChoiceGroupOrientation = 'vertical', input: GeometryInput = {}) {
  const u = inputs(input).unit;
  const row = resolveChoice('checkbox', input).rowHeight;
  const gap = (input.gap ?? (orientation === 'vertical' ? 1 : 4)) * u;
  return {
    unit: u, rowHeight: row, gap,
    rowGap: orientation === 'vertical' ? gap : u,
    columnGap: orientation === 'horizontal' ? gap : 0,
    pitch: orientation === 'vertical' ? row + gap : row + u,
  };
}

// ── Fieldset ──
// ui-fieldset stacks its legend and fields with the collection gap (2u by default, the theme's
// gap-collection; the gap attribute wins) and draws no box: no padding, border or radius, so the
// fields keep their own edges and a card around it supplies the surface.
export function resolveFieldset(input: GeometryInput & { gapUnits?: number } = {}) {
  const c = resolveContainer('collection', input);
  return { unit: c.unit, gap: c.gap, padding: 0, border: 0, radius: 0 };
}

// ── Disclosure: collapsible, accordion, tabs ──
// A collapsible's trigger is a control row (8u, pad u − B, the construction pattern with a trailing
// caret at icon size sm); its panel starts at the trigger's label edge (1u host + 2u bare label
// edge = 3u) and ends 2u below its content. Accordion items are collapsibles separated by a thin
// (1px token) divider. Lengths in CSS px.

/** ui-collapsible (and each ui-accordion item): trigger row, caret, panel insets. */
export function resolveDisclosure(input: GeometryInput = {}) {
  const c = resolveControl(input);
  const u = c.unit;
  const label = resolveButtonContents(false, true, input); // bare start 2u, 1u beside the caret slot
  return {
    unit: u, border: c.border,
    height: c.height, padding: c.padding, slot: c.slot, fontSize: c.fontSize, radius: c.radius,
    labelStart: label.start, labelEnd: label.end,
    caret: resolveIcon(c.fontSize, u, 'sm', c.slot),
    // The panel text lines up with the trigger label: the trigger's 1u (padding + border) + its 2u bare edge.
    panelInline: c.inset + label.start,
    panelBlockEnd: 2 * u,
    // Accordion: items are separated by the thin border-width token (1px), outside the trigger's
    // padding, so a closed item is its trigger row plus the divider at any B.
    divider: DIVIDER,
    itemHeight: c.height + DIVIDER,
  };
}

/** The thin border-width token (tokens/geometry/index.ts borderWidths.thin): accordion dividers, the tab underline track. */
export const DIVIDER = 1;

export type TabsVariant = 'segmented' | 'underline';

/**
 * ui-tabs: the list and its indicator, 2u above the panel (beside it when vertical).
 * - segmented: the list is a composite (edge D = max(B, 0.5u), one row 8u); tabs are composite
 *   options (7u, inset Ic); the indicator is the active tab's box with the option radius.
 * - underline: tabs are control rows (8u, pad u − B) side by side with no gap over a thin (1px)
 *   track; the indicator is a 0.5u bar on the track under the active tab, radius 0.25u.
 * Tab labels use the construction pattern (2u at a bare edge, 1u beside a slot).
 */
export function resolveTabs(variant: TabsVariant = 'segmented', input: GeometryInput & { vertical?: boolean } = {}) {
  const c = resolveControl(input);
  const u = c.unit;
  const label = resolveButtonContents(false, false, input);
  const base = { variant, unit: u, border: c.border, fontSize: c.fontSize, labelStart: label.start, labelEnd: label.end, slot: c.slot, gap: 2 * u };
  if (variant === 'segmented') {
    const k = resolveComposite({ ...input, container: !!input.vertical });
    return {
      ...base,
      listHeight: k.rowHeight, listEdge: k.edge, listPadding: k.padding, listGap: k.gap, listRadius: k.radius,
      tabHeight: k.child.height, tabPadding: k.child.padding, tabRadius: k.child.radius,
      indicatorThickness: null, indicatorRadius: k.child.radius, track: 0,
    };
  }
  return {
    ...base,
    listHeight: c.height, listEdge: 0, listPadding: 0, listGap: 0, listRadius: 0,
    tabHeight: c.height, tabPadding: c.padding, tabRadius: c.radius,
    indicatorThickness: 0.5 * u, indicatorRadius: 0.25 * u, track: DIVIDER,
  };
}

/** ui-toast-viewport placements (finite: recipe variants). inline puts the stack in flow (specimens, previews). */
export type ToastPlacement = 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center' | 'inline';

/**
 * ui-toast-viewport and its toasts (Base UI Toast). A toast is a container (the card-sm level): its
 * padding is pad-card-sm (3u) − B and its radius equals that edge, p·u × min(1, s). Inside, the
 * title and description run in one column (0.5u apart), the action is a control row (8u, the
 * control radius, label 2u at its bare edges) and the close is a 6u slot (icon size sm, radius at
 * most half of it), 1u apart. The viewport is 80u wide (at most the window less its 4u margins)
 * and 4u from the window edges; expanded toasts stack 2u apart, collapsed ones peek 2u.
 */
export function resolveToast(input: GeometryInput & { padUnits?: number } = {}) {
  const c = resolveControl(input);
  const u = c.unit;
  const box = resolveContainer('card-sm', input);
  return {
    unit: u, border: c.border, fontSize: c.fontSize,
    padding: box.padding, edge: box.edge, radius: box.radius,
    width: 80 * u, margin: 4 * u, gap: 2 * u, peek: 2 * u,
    columnGap: u, textGap: 0.5 * u,
    actionHeight: c.height, actionPadding: c.padding, actionLabel: 2 * u, actionRadius: c.radius,
    close: c.slot, closeRadius: Math.min(c.radius, c.slot / 2), closeIcon: resolveIcon(c.fontSize, u, 'sm', c.slot),
  };
}

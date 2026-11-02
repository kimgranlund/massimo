// Component geometry: the numerical reference for every control and composite.
// Based on Differential Forms v0.2.2 (mathematical-design-system skill), adapted:
// - size IS the unit: size="2" … size="12" sets u; a control is 8u tall.
// - controls have leading / contents / trailing slots, each at least 6u square,
//   inside 1u of padding (the border is spent inside that padding, never added).
// - text is 10px + u at line height 1.2 (capped at the 6u slot); contents are centered in the slot by
//   equal block padding.
// styles/geometry.ts implements the same formulas in CSS; tests and the browser
// check (apps/studio/geometry-check.html) keep the two in agreement. Lengths in CSS px.

/** Supported units; control height = 8u. 2..4.5 as before, then every 0.5 up to 12 (96px controls). */
export const SIZES = [2, 2.25, 2.5, 3, 3.5, 4, 4.5, ...Array.from({ length: 15 }, (_, i) => 5 + i * 0.5)] as const;
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

export const GEOMETRY_DEFAULTS = { unit: 4, border: 0, radiusScale: 1, iconSize: 'md' as IconSize };

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
export function resolveTextRun(parts: ControlParts, input: GeometryInput & { slotEdge?: number; bareEdge?: number } = {}) {
  const u = resolveControl(input).unit;
  const slotEdge = input.slotEdge ?? u, bareEdge = input.bareEdge ?? 2 * u;
  const p = { contents: true, ...parts };
  const order: TextPart[] = ['prefix', 'contents', 'suffix'];
  const shown = order.filter((k) => p[k]);
  const out: Partial<Record<TextPart, { start: number; end: number }>> = {};
  shown.forEach((k, i) => {
    out[k] = {
      start: i > 0 ? 0.5 * u : p.leading ? slotEdge : bareEdge,
      end: i < shown.length - 1 ? 0.5 * u : p.trailing ? slotEdge : bareEdge,
    };
  });
  return out;
}

// ── Containers ──
// Each level has a padding (units of u) and a max radius that keeps corners concentric with
// a 3u control sitting in the corner (3u + padding). Padding and gap are theme parameters
// (pad-<level>, gap-<level>); these are their defaults. Panel, region and page are square: they usually
// meet the viewport edge. Gap = padding unless the gap attribute overrides it.
export const CONTAINERS = {
  composite:  { padding: 0.5, maxRadius: 3.5 },
  group:      { padding: 1,   maxRadius: 4 },
  collection: { padding: 2,   maxRadius: 5 },
  tile:       { padding: 3,   maxRadius: 6 },
  card:       { padding: 4,   maxRadius: 7 },
  panel:      { padding: 6,   maxRadius: 0 },
  region:     { padding: 8,   maxRadius: 0 },
  // Same spacing as region, plus a centered max width (styles/defaults.ts, page() pattern).
  page:       { padding: 8,   maxRadius: 0 },
} as const;
export type ContainerLevel = keyof typeof CONTAINERS;

/** Page max width: 72rem (1152px at a 16px root). Fixed, not u-scaled. */
export const PAGE_MAX_WIDTH_REM = 72;

/** Square levels: they usually meet the viewport edge, so they get no radius. */
export const SQUARE_LEVELS: ReadonlySet<ContainerLevel> = new Set(['panel', 'region', 'page']);

/**
 * Container padding, gap and radius. `padUnits` / `gapUnits` override the level's theme
 * defaults (pad-<level>, gap-<level>); `gap` is the per-element attribute and wins over both.
 * Pass `height` to apply the half-height radius cap.
 */
export function resolveContainer(level: ContainerLevel, input: GeometryInput & { height?: number; padUnits?: number; gapUnits?: number } = {}) {
  const x = inputs(input);
  const u = x.unit;
  const pad = input.padUnits ?? CONTAINERS[level].padding;
  const radius = SQUARE_LEVELS.has(level) ? 0 : (3 + pad) * u * x.radiusScale;
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
 * segmented control is exactly 8u and its options keep the 3u control radius.
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
  // Tag and chip: slots are the next level's height; badge has no slots.
  const slot = kind === 'badge' ? 0 : height - u;
  return {
    unit: u, border: b, height, fontSize, slot,
    minWidth: height,
    padding: Math.max(0, 0.5 * u - b),
    contentsPaddingInline: u, // same as control contents
    // Single-line text at 1.2. Chip centers it in the slot with block padding; tag and badge
    // omit block padding (the row centers the text).
    ...(kind === 'badge' ? { lineHeight: Math.min(1.2 * fontSize, height), paddingBlock: 0 }
      : kind === 'tag' ? { lineHeight: Math.min(1.2 * fontSize, slot), paddingBlock: 0 } : singleLine(fontSize, slot)),
    iconSize: kind === 'badge' ? 0 : resolveIcon(fontSize, u, x.iconSize, slot),
    radius: Math.min(3 * u * x.radiusScale, height / 2),
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
  return { unit: u, height, track: height, trackRadius: Math.min(3 * u * x.radiusScale, height / 2), thumb: kind === 'range' ? height : 0, minWidth: 24 * u };
}

/** Fill width for a track of `width` at `ratio`: range covers the thumb, progress is proportional. */
export function trackFill(kind: TrackKind, ratio: number, width: number, input: GeometryInput = {}) {
  const t = resolveTrack(kind, input);
  return kind === 'range' ? ratio * (width - t.thumb) + t.thumb : ratio * width;
}

/** Swatch: a 6u square (the slot size); palettes attach swatches with no gap. */
export function resolveSwatch(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  return { size: 6 * u, radius: u * x.radiusScale, paletteRadius: 2 * u * x.radiusScale };
}

/** Swiper controls: icon-only paddles (8u buttons) inset 2u from the edge; 2u dots in 4u hit areas. */
export function resolveSwiper(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  return { paddle: 8 * u, paddleInset: 2 * u, dot: 2 * u, dotActive: 4 * u, dotHit: 4 * u, dotsGap: u };
}

/** Popup offset from its trigger. */
export const popupOffset = (input: GeometryInput = {}) => inputs(input).unit;

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
/** Container radius factors t (the radius attribute, the radius-<family> theme parameters): 0 … 1 in 0.05 steps. */
export const RADIUS_FACTORS = Array.from({ length: 21 }, (_, i) => i / 20);
/** The theme parameter whose factor scales a level's radius (areas and composites have none). */
export const radiusFamily = (level: string) => level === 'group' || level === 'collection' ? level : level.startsWith('card-') ? 'card' : undefined;
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
  /** Density (theme `density` 0, 1, 2; the density attribute per subtree): compact, default, loose. */
  density?: Density;
  /**
   * inset="none" on a composite (listbox, segmented, toggle group) or a track control (range, switch):
   * attached. The edge is the border alone, children touch the edge and each other (gap 0) and lose
   * their curvature (radius 0, the outer corners follow the container); thumbs fill the track.
   */
  inset?: 'none';
}

/**
 * Density: how much fits at the same scale. It changes insets, padding and gaps, never type, slots
 * or icons. Control inset I = 0.5u, 1u, 2u (controls 7u, 8u, 10u); the container ladder (padding and
 * gap) × 0.5, 1, 1.5. As formulas of the index n (0, 1, 2) so CSS can compute them from one
 * variable: I = 0.5 + 0.25n + 0.25n² (in u), ladder factor = 0.5 + 0.5n.
 */
export const DENSITIES = ['compact', 'default', 'loose'] as const;
export type Density = (typeof DENSITIES)[number];
export const densityIndex = (d: Density = 'default') => DENSITIES.indexOf(d);
export const densityInset = (n: number) => 0.5 + 0.25 * n + 0.25 * n * n;
export const densityFactor = (n: number) => 0.5 + 0.5 * n;

export const GEOMETRY_DEFAULTS = { unit: 4.5, border: 0, radiusScale: 1, iconSize: 'md' as IconSize, density: 'default' as Density };

function inputs(input: GeometryInput) {
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  const bad = (m: string) => { throw new RangeError(m); };
  if (!(x.unit >= 2 && x.unit <= 12)) bad('unit must be 2..12px');
  if (!(x.border >= 0 && x.border <= x.unit / 2)) bad('border must be 0..u/2');
  if (!(x.radiusScale >= 0 && x.radiusScale <= 3)) bad('radius scale must be 0..3');
  if (input.gap !== undefined && !(input.gap >= 0 && input.gap <= 8)) bad('gap must be 0..8u');
  if (!['sm', 'md', 'lg', 'fill'].includes(x.iconSize)) bad('unknown icon size');
  if (!DENSITIES.includes(x.density)) bad('density must be compact, default or loose');
  const n = densityIndex(x.density);
  return { ...x, n, inset: densityInset(n), factor: densityFactor(n) };
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
  const inset = x.inset * u; // 0.5u, 1u, 2u by density
  const height = slot + 2 * inset; // 7u, 8u, 10u
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
// Four families, one radius rule each:
// - composite (listbox, segmented, toggle group, select popup): a control; it takes the control
//   radius, min(3u·s, 4u), and its options split the difference (R − D), concentric inside it.
// - wrapper (group, collection): hugs its controls, so its radius is concentric with them: the
//   control radius + its padding (square at s = 0), capped at half its height.
// - container (card, padding xs | sm | md | lg | xl): concentric with the controls it holds, like a
//   wrapper: the control radius + its padding (square at s = 0). Floating and modal surfaces on a
//   card level (toast, popover, preview card, dialog) keep radius = padding × min(1, s) (surface).
// - area (panel, region, page): meets the viewport or other areas, so it is square.
// Padding and gap are theme parameters per level (pad-<level>, gap-<level>, in u); these are their
// defaults. Gap = padding unless the gap attribute overrides it.
export type ContainerFamily = 'composite' | 'wrapper' | 'container' | 'area';
export const CONTAINERS = {
  composite:  { family: 'composite', padding: 0.5, maxRadius: 3 },
  group:      { family: 'wrapper',   padding: 1,   maxRadius: 4 },
  collection: { family: 'wrapper',   padding: 2,   maxRadius: 5 },
  'card-xs':  { family: 'container', padding: 2,   maxRadius: 5 },
  'card-sm':  { family: 'container', padding: 3,   maxRadius: 6 },
  'card-md':  { family: 'container', padding: 4,   maxRadius: 7 },
  'card-lg':  { family: 'container', padding: 5,   maxRadius: 8 },
  'card-xl':  { family: 'container', padding: 6,   maxRadius: 9 },
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

/** The control radius: 3u × s, capped at half the control height (resolveControl: 8u at default density). */
export const controlRadius = (u: number, s: number, height = 8 * u) => Math.min(3 * u * s, height / 2);
/** 1 while the radius scale is on, 0 at s = 0 so everything is square (CSS: min(1, 100 × s)). */
const roundOn = (s: number) => Math.min(1, 100 * s);

/**
 * Container padding, gap and radius. `padUnits` / `gapUnits` override the level's theme
 * defaults (pad-<level>, gap-<level>); `gap` is the per-element attribute and wins over both.
 * The radius is a magnitude t on the family's concentric radius R0: `radius` is the per-element
 * attribute, `radiusFactor` the theme's radius-<family>; R = t × R0 (wrappers and cards only).
 * `surface` is a floating or modal surface on a card level (toast, popover, preview card, dialog):
 * radius = padding × min(1, s), not concentric, no t.
 * Pass `height` to apply the half-height radius cap.
 */
export function resolveContainer(level: ContainerLevel, input: GeometryInput & { height?: number; padUnits?: number; gapUnits?: number; radius?: number; radiusFactor?: number; surface?: boolean } = {}) {
  const x = inputs(input);
  const u = x.unit;
  // The ladder (theme pad-<level> / gap-<level>, the defaults below) × the density factor; an
  // explicit gap attribute is taken as written.
  const pad = (input.padUnits ?? CONTAINERS[level].padding) * x.factor;
  const family = CONTAINERS[level].family;
  const r = controlRadius(u, x.radiusScale, (6 + 2 * x.inset) * u);
  const t = radiusFamily(level) && !input.surface ? input.radius ?? input.radiusFactor ?? 1 : 1;
  if (!(t >= 0 && t <= 1)) throw new Error('container radius factor must be 0..1');
  const r0 = family === 'area' ? 0
    : family === 'composite' ? r                                 // a control: its options take R − D
    : input.surface ? pad * u * Math.min(1, x.radiusScale)        // surface: at most the padding
    : r + pad * u * roundOn(x.radiusScale);                       // wrapper, card: concentric with its controls
  const radius = t * r0;
  return {
    unit: u, border: x.border,
    padding: Math.max(0, pad * u - x.border),
    edge: pad * u,
    gap: (input.gap ?? (input.gapUnits ?? input.padUnits ?? CONTAINERS[level].padding) * x.factor) * u,
    radius: input.height === undefined ? radius : Math.min(radius, input.height / 2),
  };
}

// ── Universal container (ui-container; docs/planning/universal-container.md) ──
export const CONTAINER_PRESETS = ['group', 'collection', 'card', 'panel', 'region', 'page'] as const;
export type ContainerPreset = (typeof CONTAINER_PRESETS)[number];
/** The ladder level a preset (and a card padding) starts from. */
export const presetLevel = (preset: ContainerPreset, padding: CardPadding = 'md'): Exclude<ContainerLevel, 'composite'> =>
  preset === 'card' ? `card-${padding}` : preset;
export const isAreaPreset = (preset: ContainerPreset) => CONTAINERS[presetLevel(preset)].family === 'area';
/** The default container ratio k (theme container-ratio): a nested container's radius is its parent's × k. */
export const CONTAINER_RATIO = 0.6;

export interface ContainerNode { preset?: ContainerPreset; padding?: CardPadding; levels?: number; gap?: number; radius?: number; children?: ContainerNode[] }
export interface ResolvedContainer { preset: ContainerPreset; radius: number; edge: number; padding: number; gap: number; depth: number; children: ResolvedContainer[] }

/**
 * A tree of containers under the universal rule. A root (depth 1, or the first container under an
 * area) keeps its preset geometry: the ladder padding and the concentric radius (control radius +
 * padding, × t). A nested container is concentric with its parent: R = max(0, R_parent − p_parent).
 * Its padding: with `levels` on the root, every level splits evenly, p = (R_root − r_control) / levels
 * (D); else a container that holds containers keeps a ratio for them, p = R − max(r_control, R × k)
 * (C); a leaf fits its controls, p = R − r_control (a root leaf keeps its ladder padding). Areas
 * (panel, region, page) are square and restart the chain. The gap is the padding wherever the padding
 * is derived; an explicit gap attribute wins.
 */
export function resolveContainerTree(node: ContainerNode, input: GeometryInput & { ratio?: number; padUnits?: Partial<Record<string, number>>; gapUnits?: Partial<Record<string, number>>; radiusFactor?: Partial<Record<string, number>> } = {}): ResolvedContainer {
  const x = inputs(input);
  const u = x.unit, k = input.ratio ?? CONTAINER_RATIO;
  const ctl = controlRadius(u, x.radiusScale, (6 + 2 * x.inset) * u);
  const walk = (n: ContainerNode, depth: number, parent?: { r: number; p: number }, step?: number): ResolvedContainer => {
    const preset = n.preset ?? 'collection', level = presetLevel(preset, n.padding);
    const fam = radiusFamily(level);
    const base = resolveContainer(level, { ...input, padUnits: input.padUnits?.[level], gapUnits: input.gapUnits?.[level], radius: n.radius, radiusFactor: fam ? input.radiusFactor?.[fam] : undefined });
    if (isAreaPreset(preset)) return { preset, radius: 0, edge: base.edge, padding: base.padding, gap: n.gap !== undefined ? n.gap * u : base.gap, depth: 0, children: (n.children ?? []).map((c) => walk(c, 1)) };
    const kids = (n.children ?? []).filter((c) => !isAreaPreset(c.preset ?? 'collection'));
    const r = depth === 1 ? base.radius : Math.max(0, parent!.r - parent!.p);
    const s = depth === 1 && n.levels ? Math.max(0, (r - ctl) / n.levels) : step;
    const derived = s !== undefined || kids.length > 0 || depth > 1;
    const p = s !== undefined ? s : kids.length ? r - Math.max(ctl, r * k) : depth === 1 ? base.edge : Math.max(0, r - ctl);
    const gap = n.gap !== undefined ? n.gap * u : derived ? p : base.gap;
    return { preset, radius: r, edge: p, padding: Math.max(0, p - x.border), gap, depth, children: (n.children ?? []).map((c) => walk(c, isAreaPreset(c.preset ?? 'collection') ? 0 : depth + 1, { r, p }, s)) };
  };
  return walk(node, 1);
}

/**
 * Composite: ui-listbox, ui-segmented, select popup. Padding is the composite level (0.5u);
 * options use the control anatomy with their inset reduced by that edge, so a one-row
 * segmented control is exactly 8u. The composite is a control: it takes the control radius and its
 * options R − D, concentric inside it.
 */
export function resolveComposite(input: GeometryInput & { container?: boolean; padUnits?: number } = {}) {
  const c = resolveControl(input);
  const box = resolveContainer('composite', input);
  const attached = input.inset === 'none';
  const edge = attached ? c.border : Math.max(c.border, box.edge); // D: the border alone when attached
  const childInset = Math.max(c.border, c.inset - edge); // Ic
  const childHeight = c.slot + 2 * childInset;
  const rowHeight = childHeight + 2 * edge;
  const radius = input.container ? box.radius : Math.min(box.radius, rowHeight / 2);
  const concentric = Math.min(childHeight / 2, Math.max(0, radius - edge));
  return {
    edge, padding: edge - c.border, gap: attached ? 0 : box.gap, radius, rowHeight, attached,
    child: {
      inset: childInset, padding: childInset - c.border, height: childHeight,
      // Attached children lose their curvature; the first and last keep the container's outer corners (R − D).
      radius: attached ? 0 : concentric,
      outerRadius: attached ? Math.max(0, radius - edge) : concentric,
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
//   chip = min(12 + 3u, H), tag = min(12 + 2u, chip − u), badge = min(12 + u, tag − u), H the
// control height (8u at default density; 7u compact, 10u loose), so a chip is never taller than a control. Text steps down 0.5u per level from the control font.
export type BtgKind = 'badge' | 'tag' | 'chip';

export function btgHeights(unit: number, controlHeight = 8 * unit) {
  const chip = Math.min(12 + 3 * unit, controlHeight);
  const tag = Math.min(12 + 2 * unit, chip - unit);
  const badge = Math.min(12 + unit, tag - unit);
  return { badge, tag, chip };
}

export function resolveBtg(kind: BtgKind, input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit, b = x.border;
  const height = btgHeights(u, (6 + 2 * x.inset) * u)[kind];
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
  // inset="none": the switch thumb fills the track inside its border (5u − 2B) and still travels 4u.
  const attached = kind === 'switch' && input.inset === 'none';
  const thumb = attached ? box - 2 * x.border : 4 * u, thumbInset = attached ? x.border : 0.5 * u;
  return {
    unit: u, box, width, slot: 6 * u,
    rowHeight: 6 * u,
    labelPaddingStart: u,
    // Checkbox: 1u corners (scaled); radio and switch stay round.
    radius: kind === 'checkbox' ? u * x.radiusScale : box / 2,
    mark: 4 * u,              // check / minus icon inside the checkbox
    dot: 2 * u,               // radio dot
    thumb,                    // switch thumb
    thumbInset,
    thumbTravel: width - 2 * thumbInset - thumb, // switch: track width − thumb − 2 insets (4u either way)
  };
}

export type TrackKind = 'range' | 'progress';

export function resolveTrack(kind: TrackKind, input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  const height = 4 * u;
  const trackRadius = Math.min(3 * u * x.radiusScale, height / 2);
  // Range thumb sits inside the track like a switch thumb: track − u, inset 0.5u, concentric radius;
  // inset="none": it fills the track and takes the track's radius (the track's own end cap).
  const attached = kind === 'range' && input.inset === 'none';
  const inset = kind !== 'range' ? 0 : attached ? 0 : 0.5 * u;
  return {
    unit: u, height, track: height, trackRadius, minWidth: 24 * u,
    thumb: kind === 'range' ? height - 2 * inset : 0, thumbInset: inset,
    thumbRadius: kind === 'range' ? Math.max(0, trackRadius - inset) : 0,
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

/**
 * Two-thumb range fill (value [start, end] at ratios r0 ≤ r1): it starts one track-radius before the
 * first thumb's center (offset r0·(width − track)) and ends one past the second's (width track +
 * (r1 − r0)·(width − track)), so both caps wrap their thumbs. r0 = 0 is the one-thumb fill.
 */
export function trackPairFill(r0: number, r1: number, width: number, input: GeometryInput = {}) {
  const t = resolveTrack('range', input);
  return { offset: r0 * (width - t.track), width: t.track + (r1 - r0) * (width - t.track) };
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

/** Swiper controls: icon-only paddles (control-height buttons, 8u by default) inset 2u from the edge; 2u dots (active 4u wide) in 4u hit areas, u apart, 2u above the bottom. */
export function resolveSwiper(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  // Paddles are icon buttons at the control height (density), fully round; the dots row sits 2u above the bottom edge.
  const paddle = (6 + 2 * x.inset) * u;
  return { paddle, paddleInset: 2 * u, paddleRadius: paddle / 2, dot: 2 * u, dotActive: 4 * u, dotRadius: u, dotHit: 4 * u, dotsGap: u, dotsInset: 2 * u };
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

/**
 * A choice card (radio or checkbox group, variant="card"): a card-md surface holding any content.
 * Padding 4u − B (× density), radius the concentric card radius (control radius + padding, × the
 * theme's radius-card), cards the collection gap apart, contents 1u apart.
 */
export function resolveChoiceCard(input: GeometryInput & { radiusFactor?: number } = {}) {
  const card = resolveContainer('card-md', input);
  const gap = resolveContainer('collection', { ...input, padUnits: undefined, radius: undefined }).gap;
  return { padding: card.padding, edge: card.edge, radius: card.radius, gap, contentsGap: card.unit, stroke: 1, checkedStroke: 2 };
}

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
  const box = resolveContainer('card-sm', { ...input, surface: true });
  return {
    unit: u, border: c.border, fontSize: c.fontSize,
    padding: box.padding, edge: box.edge, radius: box.radius,
    width: 80 * u, margin: 4 * u, gap: 2 * u, peek: 2 * u,
    columnGap: u, textGap: 0.5 * u,
    actionHeight: c.height, actionPadding: c.padding, actionLabel: 2 * u, actionRadius: c.radius,
    close: c.slot, closeRadius: Math.min(c.radius, c.slot / 2), closeIcon: resolveIcon(c.fontSize, u, 'sm', c.slot),
  };
}

// ── Form ──
// ui-form stacks its fields, fieldsets and actions with the collection gap (2u by default, the
// theme's gap-collection; the gap attribute wins), like a fieldset, and draws no box: no padding,
// border or radius, so its fields keep their own edges and a card around it supplies the surface.
export function resolveForm(input: GeometryInput & { gapUnits?: number } = {}) {
  const c = resolveContainer('collection', input);
  return { unit: c.unit, gap: c.gap, padding: 0, border: 0, radius: 0 };
}

// ── Scroll area ──
// ui-scroll-area draws its own scrollbars over a natively scrolling viewport: a track 2u thick at
// the inline end (vertical) or the block end (horizontal), the thumb inside it 0.5u from each side
// (so u thick), at least 4u long, a pill (radius half its thickness, scaled by the corner radius
// like a control: min(3u·s, t/2)). Where both bars show, a 2u corner square fills the meeting
// point. No border: the bars overlay the content's edge, which the content pads when it needs to.
export function resolveScrollArea(input: GeometryInput = {}) {
  const x = inputs(input);
  const u = x.unit;
  const thickness = 2 * u, inset = 0.5 * u, thumb = thickness - 2 * inset;
  return {
    unit: u, thickness, inset, thumb, thumbMin: 4 * u,
    trackRadius: Math.min(3 * u * x.radiusScale, thickness / 2),
    thumbRadius: Math.min(3 * u * x.radiusScale, thumb / 2),
    corner: thickness,
  };
}

// ── Number field (ui-number-field, React NumberField) ──
// The field control with its steppers in the construction pattern's slots: the decrement in the
// leading 6u slot, the increment in the trailing one, so the text run is 1u from each (resolveTextRun)
// and the control stays 8u with pad u − B. A stepper is the slot itself, its plus / minus glyph at
// icon size sm (an indicator, like a caret), its radius concentric with the control's: R − u.
// The label sits in the scrub area, 1.5u above the control (the field's row gap).

/** ui-number-field: control row, stepper slots, text run, label gap. */
export function resolveNumberField(input: GeometryInput = {}) {
  const c = resolveControl(input);
  const run = resolveTextRun({ leading: true, trailing: true }, input).contents!;
  return {
    ...c,
    contentsStart: run.start, contentsEnd: run.end,
    stepper: c.slot,
    stepperIcon: resolveIcon(c.fontSize, c.unit, 'sm', c.slot),
    stepperRadius: Math.max(0, c.radius - c.inset),
    rowGap: 1.5 * c.unit,
  };
}

// ── OTP field (ui-otp-field, React OTPField) ──
// Each cell is a square field control: 8u × 8u (the control height both ways), pad u − B, the
// control radius and font, one centered character. Cells sit 1u apart (the group wrapper gap); a
// separator is a 2u dash, 0.5u thick with a 0.25u radius (the tab indicator's bar), in that gap.

/** ui-otp-field: cell size, padding, radius, gap and separator. */
export function resolveOtpField(input: GeometryInput = {}) {
  const c = resolveControl(input);
  const u = c.unit;
  return {
    unit: u, border: c.border, fontSize: c.fontSize, lineHeight: c.contents.lineHeight,
    cell: c.height, padding: c.padding, radius: c.radius,
    gap: u,
    separatorWidth: 2 * u, separatorThickness: 0.5 * u, separatorRadius: 0.25 * u,
  };
}

// ── Menus: menu, context menu, menubar ──

/**
 * ui-menu (and the context menu and menubar built on it): the trigger is a control row (8u, pad
 * u − B, the control radius); the popup is a floating composite 1u from its anchor (edge D =
 * max(B, 0.5u), padding D − B, the composite gap, the control radius like the select popup;
 * items split the difference); items, group labels and submenu triggers are composite options (7u, inset Ic,
 * radius concentric with the popup) in the construction pattern (2u at a bare edge, 1u beside a
 * slot); checkbox and radio items keep a 6u leading indicator slot; a separator is the separator
 * rule (max(1px, B)) with 0.5u above and below, beyond the gap.
 */
export function resolveMenu(input: GeometryInput = {}) {
  const c = resolveControl(input);
  const u = c.unit;
  const k = resolveComposite({ ...input, container: true });
  const bare = resolveButtonContents(false, false, input), slotted = resolveButtonContents(true, true, input);
  return {
    unit: u, border: c.border, fontSize: c.fontSize, slot: c.slot, iconSize: c.iconSize,
    triggerHeight: c.height, triggerPadding: c.padding, triggerRadius: c.radius,
    offset: popupOffset(input),
    popupEdge: k.edge, popupPadding: k.padding, popupGap: k.gap, popupRadius: k.radius,
    itemHeight: k.child.height, itemInset: k.child.inset, itemPadding: k.child.padding, itemRadius: k.child.radius,
    labelStart: bare.start, labelBesideSlot: slotted.start,
    caret: resolveIcon(c.fontSize, u, 'sm', c.slot),
    separator: resolveSeparator(input).thickness, separatorMargin: 0.5 * u,
  };
}

/**
 * ui-combobox, ui-autocomplete: the input row is the select trigger's control row (8u, pad u − B)
 * with the editable text as its contents: 2u at a bare edge, 1u beside a slot (the trailing
 * trigger, the clear button), 1u after the last chip (0.5u chip gap + 0.5u). The trigger and clear
 * buttons are 6u slots holding an sm icon (caret-down, x). Chips (multiple) are slot-sized (6u) and
 * nest in the row: radius min(3u, control radius − u), label 1u from the chip's start edge, a 6u
 * remove square at its end, 0.5u apart; the row wraps onto further lines 0.5u apart, so it grows
 * from 8u by 6.5u a line. The popup is the select's: a composite list 1u from the row; the empty
 * state sits where an option's label would (inset Ic + 2u, one option row tall).
 */
export function resolveCombobox(input: GeometryInput = {}) {
  const t = resolveSelectTrigger(input), k = resolveComposite(input);
  const u = t.unit;
  const chipHeight = t.slot;
  return {
    ...t,
    inputStart: t.contentsStart, inputEnd: t.contentsEnd, inputBareEnd: 2 * u, afterChip: 0.5 * u,
    triggerSlot: t.slot, triggerIcon: t.chevronIcon, clearSlot: t.slot, clearIcon: t.chevronIcon,
    chipHeight, chipRadius: Math.min(chipHeight / 2, Math.max(0, t.radius - u)), chipLabelStart: u, chipRemove: chipHeight, chipGap: 0.5 * u, rowGap: 0.5 * u,
    /** The row's height with chips on `lines` lines. */
    rowHeight: (lines: number) => t.height + (lines - 1) * (chipHeight + 0.5 * u),
    popupOffset: u, popupEdge: k.edge, popupPadding: k.padding, popupRadius: k.radius, optionHeight: k.child.height,
    emptyInline: k.child.inset + 2 * u, emptyHeight: k.child.height,
  };
}

// ── Dialogs: dialog and alert dialog (a container), drawer (an area) ──
// A dialog popup is a card at the xl level (container family): padding p·u − B (p = the theme's
// pad-card-xl, 6u by default), radius p·u × min(1, s), never rounder than it is deep. Its parts
// (title, description, content, actions) stack with the collection gap (2u; the gap attribute
// wins); the actions row ends the popup, its buttons 2u apart. The popup is 96u wide (24rem at
// u = 4), at most the viewport less a 4u margin on each side, and scrolls past the viewport height
// less the same margins. Lengths in CSS px.

/** The viewport margin around a centered dialog, in u. */
export const DIALOG_MARGIN = 4;
/** A dialog popup's width, in u. */
export const DIALOG_WIDTH = 96;

/** ui-dialog, ui-alert-dialog popup: padding, radius, gap, width and the viewport margin. */
export function resolveDialog(input: GeometryInput & { padUnits?: number; gapUnits?: number; viewport?: { width: number; height: number } } = {}) {
  const box = resolveContainer('card-xl', { ...input, surface: true });
  const stack = resolveContainer('collection', { ...input, padUnits: undefined });
  const u = box.unit, margin = DIALOG_MARGIN * u;
  const vp = input.viewport;
  return {
    unit: u, border: box.border,
    padding: box.padding, edge: box.edge, radius: box.radius,
    gap: stack.gap, actionsGap: 2 * u,
    margin,
    width: vp ? Math.min(DIALOG_WIDTH * u, vp.width - 2 * margin) : DIALOG_WIDTH * u,
    maxHeight: vp ? vp.height - 2 * margin : undefined,
  };
}

// A drawer is an edge-anchored sheet: an area at the panel level (it meets the viewport edge, so it
// is square), padding p·u − B (p = the theme's pad-panel, 6u), its parts 2u apart like a dialog's.
// A side sheet (left, right) is the viewport's full height and 80u wide, at most the viewport less
// 8u, so some of the page stays in view; a top or bottom sheet is the full width and as tall as its
// content, at most the viewport less 8u.

/** A drawer's edge: Base UI swipes it away toward that edge. */
export type DrawerSide = 'top' | 'right' | 'bottom' | 'left';
/** A side drawer's width, in u. */
export const DRAWER_WIDTH = 80;

/** ui-drawer popup: padding, radius (0), gap, and its size against a viewport. */
export function resolveDrawer(side: DrawerSide = 'bottom', input: GeometryInput & { padUnits?: number; gapUnits?: number; viewport?: { width: number; height: number } } = {}) {
  const box = resolveContainer('panel', input);
  const stack = resolveContainer('collection', { ...input, padUnits: undefined });
  const u = box.unit, reserve = 2 * DIALOG_MARGIN * u;
  const vp = input.viewport;
  const inline = side === 'left' || side === 'right';
  return {
    side, unit: u, border: box.border,
    padding: box.padding, edge: box.edge, radius: box.radius,
    gap: stack.gap, actionsGap: 2 * u,
    reserve,
    width: inline ? (vp ? Math.min(DRAWER_WIDTH * u, vp.width - reserve) : DRAWER_WIDTH * u) : vp?.width,
    height: inline ? vp?.height : undefined,
    maxHeight: inline ? vp?.height : vp ? vp.height - reserve : undefined,
  };
}

/**
 * ui-menubar: a composite row of its menus' triggers (edge D = max(B, 0.5u), padding D − B, the
 * composite gap; one row 8u, the control radius, vertical too); each
 * trigger is a composite option (7u, inset Ic, the option radius) with its label 2u from a bare edge.
 * The menus open 1u below the bar's trigger (beside it when vertical).
 */
export function resolveMenubar(input: GeometryInput & { vertical?: boolean } = {}) {
  const k = resolveComposite({ ...input, container: !!input.vertical });
  const m = resolveMenu(input);
  return {
    unit: m.unit, border: m.border, fontSize: m.fontSize,
    rowHeight: k.rowHeight, edge: k.edge, padding: k.padding, gap: k.gap, radius: k.radius,
    triggerHeight: k.child.height, triggerPadding: k.child.padding, triggerRadius: k.child.radius,
    labelStart: m.labelStart, offset: m.offset,
  };
}

// ── Popups: popover, tooltip, preview card, navigation menu ──
// Anchored popups share the floating layer: 1u from the anchor (popupOffset), an optional arrow 2u
// wide that spans the 1u gap, the popup at least as wide as its anchor (tooltips excepted) and no
// taller than the space beside it. Surfaces come from the container ladder: a popover is a small
// card (pad 3u, radius ≤ 3u, the group gap 1u between title, description and content), a preview
// card a medium card (pad 4u, radius ≤ 4u, the collection gap 2u); a tooltip is a 7u text row (a
// 6u text slot inside a 0.5u edge, 2u at the bare ends) at the control font. Lengths in CSS px.

export type PopupKind = 'popover' | 'tooltip' | 'preview-card';
/** Widest a popup grows before its text wraps, in u. */
export const POPUP_MAX_WIDTH = { popover: 80, tooltip: 60, 'preview-card': 80 } as const;

/** ui-popover, ui-tooltip, ui-preview-card: offset, arrow, popup padding, radius, gap and width cap. */
export function resolvePopup(kind: PopupKind = 'popover', input: GeometryInput = {}) {
  const x = inputs(input);
  const c = resolveControl(input);
  const u = c.unit, b = c.border;
  const base = { kind, unit: u, border: b, offset: u, arrowWidth: 2 * u, arrowHeight: u, maxWidth: POPUP_MAX_WIDTH[kind] * u };
  if (kind === 'tooltip') {
    const line = singleLine(c.fontSize, c.slot);
    const edge = 0.5 * u;
    const height = c.slot + 2 * edge; // 7u, like a composite item
    return {
      ...base, height, fontSize: c.fontSize, lineHeight: line.lineHeight, minWidthAnchor: false,
      paddingBlock: edge - b + line.paddingBlock, paddingInline: 2 * u - b,
      radius: Math.min(3 * u * x.radiusScale, height / 2), gap: 0,
    };
  }
  const box = resolveContainer(kind === 'popover' ? 'card-sm' : 'card-md', { ...input, surface: true });
  const gap = input.gap !== undefined ? input.gap * u : (kind === 'popover' ? CONTAINERS.group.padding : CONTAINERS.collection.padding) * u;
  return { ...base, height: null, fontSize: c.fontSize, lineHeight: null, minWidthAnchor: true, paddingBlock: box.padding, paddingInline: box.padding, radius: box.radius, gap };
}

/**
 * ui-navigation-menu: the list is a composite row (8u, edge 0.5u) of triggers and links that are
 * composite options (7u, the construction pattern, a trailing caret at icon size sm); the popup is
 * a composite (edge 0.5u, the control radius) 1u below the list, holding the open item's content,
 * whose links are composite options too. The popup's size animates between contents (reveal).
 */
export function resolveNavigationMenu(input: GeometryInput = {}) {
  const k = resolveComposite(input);
  const pop = resolveComposite({ ...input, container: true });
  const c = resolveControl(input);
  const label = resolveButtonContents(false, true, input);
  return {
    unit: c.unit, border: c.border, offset: c.unit,
    listHeight: k.rowHeight, listEdge: k.edge, listPadding: k.padding, listGap: k.gap, listRadius: k.radius,
    itemHeight: k.child.height, itemPadding: k.child.padding, itemRadius: k.child.radius,
    labelStart: label.start, labelEnd: label.end, slot: c.slot, fontSize: c.fontSize,
    caret: resolveIcon(c.fontSize, c.unit, 'sm', c.slot),
    popupEdge: pop.edge, popupPadding: pop.padding, popupGap: pop.gap, popupRadius: pop.radius,
    linkHeight: pop.child.height, linkRadius: pop.child.radius,
  };
}

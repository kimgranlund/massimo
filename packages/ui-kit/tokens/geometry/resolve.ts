// Component geometry: the numerical reference for every control and composite.
// Based on Differential Forms v0.2.2 (mathematical-design-system skill), adapted:
// - size IS the unit: size="2|2.25|2.5|3|3.5|4|4.5" sets u; a control is 8u tall.
// - controls have leading / contents / trailing slots, each at least 6u square,
//   inside 1u of padding (the border is spent inside that padding, never added).
// - text is 10px + u; contents carry 1u inline and 0.75u block padding.
// styles/geometry.ts implements the same formulas in CSS; tests and the browser
// check (apps/studio/geometry-check.html) keep the two in agreement. Lengths in CSS px.

/** Supported units; control height = 8u → 16, 18, 20, 24, 28, 32, 36px. */
export const SIZES = [2, 2.25, 2.5, 3, 3.5, 4, 4.5] as const;
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
  /** Composite inset Q in units of u, 0..1.5. */
  compositeInsetUnits?: number;
  iconSize?: IconSize;
}

export const GEOMETRY_DEFAULTS = { unit: 4, border: 1, radiusScale: 1, compositeInsetUnits: 0.5, iconSize: 'md' as IconSize };

function inputs(input: GeometryInput) {
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  const bad = (m: string) => { throw new RangeError(m); };
  if (!(x.unit >= 2 && x.unit <= 6)) bad('unit must be 2..6px');
  if (!(x.border >= 0 && x.border <= x.unit / 2)) bad('border must be 0..u/2');
  if (!(x.radiusScale >= 0 && x.radiusScale <= 3)) bad('radius scale must be 0..3');
  if (!(x.compositeInsetUnits >= 0 && x.compositeInsetUnits <= 1.5)) bad('composite inset must be 0..1.5u');
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
    contents: { paddingInline: u, paddingBlock: 0.75 * u, lineHeight: 4.5 * u, minSize: slot },
    iconSize: resolveIcon(fontSize, u, x.iconSize, slot),
    radius: Math.min(3 * u * x.radiusScale, height / 2),
  };
}

/** Container curvature (listbox, popup): soft 3u, not capped by height. */
export const containerRadius = (input: GeometryInput = {}) => { const x = inputs(input); return 3 * x.unit * x.radiusScale; };

/**
 * Composite family: ui-listbox, ui-segmented, select popup. Options use the control
 * anatomy with an inset reduced by the parent's edge distance; the composite grows
 * when the border leaves no room (the 6u slot never shrinks).
 */
export function resolveComposite(input: GeometryInput & { container?: boolean } = {}) {
  const c = resolveControl(input);
  const x = inputs(input);
  const requested = x.compositeInsetUnits * c.unit;
  const edge = Math.max(c.border, requested);            // D
  const childInset = Math.max(c.border, c.inset - edge); // Ic
  const childHeight = c.slot + 2 * childInset;
  const rowHeight = childHeight + 2 * edge;
  const radius = input.container ? containerRadius(input) : Math.min(3 * c.unit * x.radiusScale, rowHeight / 2);
  return {
    requestedInset: requested, edge, padding: edge - c.border, gap: requested, radius, rowHeight,
    child: {
      inset: childInset, padding: childInset - c.border, height: childHeight,
      // Q = 0 means an attached group: square children.
      radius: requested === 0 ? 0 : Math.min(childHeight / 2, Math.max(0, radius - edge)),
    },
  };
}

/** Text fields: the editable text sits where button contents sit (padding + 1u). */
export function resolveField(input: GeometryInput = {}) {
  const c = resolveControl(input);
  return { ...c, paddingStart: c.padding + c.contents.paddingInline, paddingEnd: c.padding + c.contents.paddingInline };
}

/** Select trigger: value as contents, chevron in a trailing 6u slot. */
export function resolveSelectTrigger(input: GeometryInput = {}) {
  const c = resolveControl(input);
  return { ...c, paddingStart: c.padding + c.contents.paddingInline, paddingEnd: c.padding, chevronSlot: c.slot };
}

/** Popup offset from its trigger. */
export const popupOffset = (input: GeometryInput = {}) => inputs(input).unit;

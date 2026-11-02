// Component geometry: the numerical reference for every control and composite.
// Adapted from Differential Forms v0.2.2 (mathematical-design-system skill), with one
// change: its density axis is merged into `size` (sm/md/lg = compact/default/loose).
// styles/geometry.ts implements the same formulas in CSS; test/geometry.test.ts and the
// browser check keep the two in agreement. All lengths are CSS px.

export type Size = 'sm' | 'md' | 'lg';

export interface GeometryInput {
  /** Base unit u, 3..6px. */
  unit?: number;
  /** Border B, 0..u/2. Counted inside each owner's inset, never added to height. */
  border?: number;
  size?: Size;
  /** Exposed label edge in units of u, 0..3. */
  labelEdgeUnits?: number;
  /** Multiplier on the soft (3u) curvature; studio's "Corner radius". 0 = square. */
  radiusScale?: number;
  /** Composite inset Q in units of u, 0..1.5. */
  compositeInsetUnits?: number;
}

/** Inset and gap per size, in units of u (Differential Forms compact/default/loose). */
export const SIZE_STEPS: Record<Size, { inset: number; gap: number }> = {
  sm: { inset: 0.5, gap: 0 },
  md: { inset: 1, gap: 1 },
  lg: { inset: 2, gap: 2 },
};

export const GEOMETRY_DEFAULTS = { unit: 4, border: 1, size: 'md' as Size, labelEdgeUnits: 1.5, radiusScale: 1, compositeInsetUnits: 0.5 };

function check(x: Required<GeometryInput>) {
  const bad = (m: string) => { throw new RangeError(m); };
  if (!(x.unit >= 3 && x.unit <= 6)) bad('unit must be 3..6px');
  if (!(x.border >= 0 && x.border <= x.unit / 2)) bad('border must be 0..u/2');
  if (!(x.labelEdgeUnits >= 0 && x.labelEdgeUnits <= 3)) bad('label edge must be 0..3u');
  if (!(x.radiusScale >= 0 && x.radiusScale <= 3)) bad('radius scale must be 0..3');
  if (!(x.compositeInsetUnits >= 0 && x.compositeInsetUnits <= 1.5)) bad('composite inset must be 0..1.5u');
  if (!SIZE_STEPS[x.size]) bad('unknown size');
}

/** Control family: ui-button, ui-input, ui-select trigger. */
export function resolveControl(input: GeometryInput = {}) {
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  check(x);
  const u = x.unit, b = x.border, step = SIZE_STEPS[x.size];
  const slot = 6 * u;
  const inset = step.inset * u;
  const height = slot + 2 * inset;
  return {
    unit: u, border: b, slot, inset, height,
    padding: inset - b,
    gap: step.gap * u,
    labelEdge: x.labelEdgeUnits * u,
    fontSize: 2 * u + 6,
    lineHeight: 5 * u,
    iconSize: Math.min(4 * u, slot - 2 * b),
    radius: Math.min(3 * u * x.radiusScale, height / 2),
  };
}

/**
 * Label edges beside a label: zero on a side occupied by a slot. Buttons and options
 * double the opposite edge when exactly one slot is present; text fields do not.
 */
export function resolveLabelEdges(edge: number, leading: boolean, trailing: boolean, doubleOpposite = true) {
  return {
    start: leading ? 0 : edge * (trailing && doubleOpposite ? 2 : 1),
    end: trailing ? 0 : edge * (leading && doubleOpposite ? 2 : 1),
  };
}

/** Container curvature (listbox, popup): soft 3u, not capped by height. */
export const containerRadius = (input: GeometryInput = {}) => {
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  return 3 * x.unit * x.radiusScale;
};

/**
 * Composite family: ui-listbox, ui-segmented, select popup. Children are control-family
 * options whose inset shrinks by the parent's edge distance; the composite grows when
 * the border leaves no room (never shrinks the slot).
 */
export function resolveComposite(input: GeometryInput & { container?: boolean } = {}) {
  const c = resolveControl(input);
  const x = { ...GEOMETRY_DEFAULTS, ...input };
  const requested = x.compositeInsetUnits * c.unit;
  const edge = Math.max(c.border, requested);            // D
  const childInset = Math.max(c.border, c.inset - edge); // Ic
  const childHeight = c.slot + 2 * childInset;
  const rowHeight = childHeight + 2 * edge;
  const radius = input.container ? containerRadius(input) : Math.min(3 * c.unit * x.radiusScale, rowHeight / 2);
  return {
    requestedInset: requested,
    edge,
    padding: edge - c.border,
    gap: requested,
    radius,
    rowHeight,
    child: {
      inset: childInset,
      padding: childInset - c.border,
      height: childHeight,
      labelEdge: c.labelEdge,
      // Q = 0 means an attached group: square children.
      radius: requested === 0 ? 0 : Math.min(childHeight / 2, Math.max(0, radius - edge)),
    },
  };
}

/** Select trigger: text-field label edge on the start side, a trailing slot for the chevron. */
export function resolveSelectTrigger(input: GeometryInput = {}) {
  const c = resolveControl(input);
  const edges = resolveLabelEdges(c.labelEdge, false, true, false);
  return { ...c, paddingStart: c.padding + edges.start, paddingEnd: c.padding + edges.end, chevronSlot: c.slot };
}

/** Popup offset from its trigger. */
export const popupOffset = (input: GeometryInput = {}) => ({ ...GEOMETRY_DEFAULTS, ...input }).unit;

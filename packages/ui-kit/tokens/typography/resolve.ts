// Typography: massimo-ui's type roles on our u ramp. The base is the control font, 10px + u
// (14px at u = 4). A step role is base × ratio^step; a fixed role is n·u. Line heights round
// up to the rhythm unit (rhythm × u; 0 keeps the natural size × multiplier). Controls keep a
// unitless 1.2. styles/typography.ts computes the same values in CSS with pow() and round().

export interface TypeRole {
  label: string;
  step?: number;
  u?: number;
  lh: number;
  weight: number;
  tracking: number; // em
  upper?: boolean;
  mono?: boolean;
  heading?: boolean;
  control?: boolean; // unitless line height, no rhythm rounding
}

export const TYPE_ROLES = {
  'display':       { label: 'Display',         step: 6,  lh: 1.05, weight: 700, tracking: -0.045, heading: true },
  'heading-1':     { label: 'Heading 1',       step: 4,  lh: 1.1,  weight: 700, tracking: -0.025, heading: true },
  'heading-2':     { label: 'Heading 2',       step: 3,  lh: 1.15, weight: 700, tracking: -0.02, heading: true },
  'heading-3':     { label: 'Heading 3',       step: 2,  lh: 1.2,  weight: 700, tracking: -0.01, heading: true },
  'section-kicker': { label: 'Kicker · Section', step: 0, lh: 1.2, weight: 700, tracking: 0.1, upper: true },
  'group-kicker':  { label: 'Kicker · Group',  step: -1, lh: 1.2,  weight: 400, tracking: 0.08, upper: true },
  'body-large':    { label: 'Body · Large',    step: 1,  lh: 1.5,  weight: 400, tracking: 0 },
  'body':          { label: 'Body',            step: 0,  lh: 1.5,  weight: 400, tracking: 0 },
  'caption':       { label: 'Caption',         u: 3,     lh: 1.45, weight: 400, tracking: 0 },
  'code':          { label: 'Code',            u: 3,     lh: 1.5,  weight: 400, tracking: 0, mono: true },
  'control':       { label: 'Control',         step: 0,  lh: 1.2,  weight: 450, tracking: 0, control: true },
  'label':         { label: 'Label',           step: 0,  lh: 1.4,  weight: 450, tracking: 0 },
  'control-small': { label: 'Control · Small', u: 3,     lh: 1.2,  weight: 450, tracking: 0, control: true },
} as const satisfies Record<string, TypeRole>;
export type TypeRoleName = keyof typeof TYPE_ROLES;

/** Named ratios from massimo-ui. */
export const TYPE_RATIOS: [number, string][] = [[1, 'Product UI'], [1.125, 'Major second'], [1.2, 'Minor third'], [1.25, 'Major third'], [1.333, 'Perfect fourth'], [1.5, 'Perfect fifth']];

export const FONT_FAMILIES = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Baskerville, "Palatino Linotype", Palatino, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

export const TYPE_DEFAULTS = { unit: 4, ratio: 1.333, rhythm: 1, heading: 'sans' as 'sans' | 'serif' };

export function resolveType(role: TypeRoleName, input: Partial<typeof TYPE_DEFAULTS> = {}) {
  const x = { ...TYPE_DEFAULTS, ...input };
  const r: TypeRole = TYPE_ROLES[role];
  const base = 10 + x.unit;
  const size = r.u !== undefined ? r.u * x.unit : base * Math.pow(x.ratio, r.step!);
  const natural = size * r.lh;
  const grid = x.rhythm * x.unit;
  const lineHeight = r.control ? natural : grid > 0 ? Math.ceil(natural / grid - 1e-6) * grid : natural;
  const serif = r.heading && x.heading === 'serif';
  return {
    size, lineHeight, lineHeightRatio: r.control ? r.lh : undefined,
    weight: serif ? 400 : r.weight,
    tracking: r.tracking,
    transform: r.upper ? 'uppercase' : 'none',
    family: r.mono ? 'mono' : serif ? 'serif' : 'sans',
  };
}

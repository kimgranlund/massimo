// Color anchors (docs/reports/2026-11-03-color-anchoring-spike.md): a brand's exact colors placed in
// the generated ramps. Per anchor, on its role's family:
//   1. pin the hue: every step of the family takes the anchor's OKLCH hue (light and dark ramps);
//   2. re-shape the chroma: every step's chroma × (anchor chroma / the anchored step's chroma),
//      clamped into the target gamut, so the neighbors are not washed out beside the anchor;
//   3. override the anchored step with the exact color (light ramp). The step is the one whose
//      contrast target is nearest the anchor's Lc against the light page, unless the anchor names one;
//   4. the role's solid follows the anchored step when the anchor lands on 8–12 (solidSteps.light): a
//      brand's main color is usually its darkest solid.
// An anchor may give its own `dark` color: it is placed in the dark ramp the same way (against the
// dark page, the dark targets) and moves the dark solid (solidSteps.dark). Without one, the dark ramp
// takes the hue and chroma only and the dark solid stays at step 9.
// Lightness (each step's tone) is kept, so the ramp's contrast steps still hold.
// Two surface anchors pin the ends of the neutral ramp instead of a role's family: `ground` is the
// light page (step 1) and the dark ink (step 12); `ink` is the light ink (step 12) and the dark page
// (step 1). `dark` gives the color for the dark scheme; without one the same color is used.
import { apcaLc } from './contrast.ts';
import type { Spectrum, Swatch } from './index.ts';

export interface ColorAnchor { role: string; value: string; step?: number; name?: string; /** The anchor's own color in the dark scheme. */ dark?: string }
export type SolidSteps = { light: Record<string, number>; dark: Record<string, number> };
export interface AnchorResult { role: string; family: string; value: string; step: number; lc: number; target: number; below: number; above: number; inOrder: boolean; inRange: boolean; dE: number; dark?: { value: string; step: number; lc: number; target: number; inOrder: boolean } }

const HEX = /^#[0-9a-f]{6}$/i;
export const isAnchorColor = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

// ── sRGB / Display P3 ↔ OKLab ──
const lin = (c: number) => (Math.abs(c) <= 0.04045 ? c / 12.92 : Math.sign(c) * ((Math.abs(c) + 0.055) / 1.055) ** 2.4);
const LMS_TO_LAB = [[0.2104542553, 0.793617785, -0.0040720468], [1.9779984951, -2.428592205, 0.4505937099], [0.0259040371, 0.7827717662, -0.808675766]];
const mul = (m: number[][], v: number[]) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
function srgbToOklch(hex: string): [number, number, number] {
  const rgb = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const lms = mul([[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]], rgb).map(Math.cbrt);
  const [L, a, b] = mul(LMS_TO_LAB, lms);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}
/** OKLCH → linear RGB in sRGB or Display P3 primaries. */
function oklchToLinear([L, C, h]: number[], gamut: string) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const lms = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.291485548 * b].map((x) => x ** 3);
  const srgb = mul([[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.707614701]], lms);
  return gamut === 'display-p3' ? mul([[0.8224621, 0.177538, 0], [0.0331941, 0.9668058, 0], [0.0170827, 0.0723974, 0.9105199]], srgb) : srgb;
}
const inGamut = (lch: number[], gamut: string) => oklchToLinear(lch, gamut).every((c) => c >= -1e-4 && c <= 1 + 1e-4);
/** The largest chroma ≤ C at this lightness and hue inside the gamut. */
function clampChroma(L: number, C: number, h: number, gamut: string) {
  if (inGamut([L, C, h], gamut)) return C;
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut([L, mid, h], gamut)) lo = mid; else hi = mid; }
  return lo;
}
/** Relative luminance (Y) of an OKLCH color, via sRGB (the APCA input). */
const yOf = (lch: number[]) => { const [r, g, b] = oklchToLinear(lch, 'srgb').map((c) => Math.min(1, Math.max(0, c))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const toneOfY = (Y: number) => (Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y);
const okLab = ([L, C, h]: number[]) => [L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180)];
const deltaE = (p: number[], q: number[]) => { const [a, b] = [okLab(p), okLab(q)]; return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };

/** A swatch's tone: the engine's, or from its color (pure gray ramps carry no HCT). */
const toneOf = (sw: Swatch) => sw.hct?.[2] ?? toneOfY(yOf(sw.oklch));
const css = ([L, C, h]: number[]) => `oklch(${L} ${C} ${h})`;
/** Text on a fill: white or the darkest ink, whichever has the larger APCA Lc. */
function onFill(lch: number[]): Swatch['apca'] {
  const t = toneOfY(yOf(lch));
  const white = apcaLc(100, t), black = apcaLc(0, t);
  return white >= black ? { name: 'white', css: '#fff', lc: -white, ok: white >= 60 } as Swatch['apca'] : { name: 'black', css: '#000', lc: black, ok: black >= 60 } as Swatch['apca'];
}
function setSwatch(sw: Swatch, lch: [number, number, number]) {
  sw.oklch = lch; sw.css = css(lch); sw.apca = onFill(lch);
}

/**
 * Apply anchors to a generated spectrum (a copy is returned). `roles` maps each role to its family.
 * Returns the report per anchor and the solid step per anchored role.
 */
export function applyAnchors(data: Spectrum, roles: Record<string, string>, anchors: ColorAnchor[], targets: { light: number[]; dark: number[] }) {
  const out: Spectrum = structuredClone(data);
  const gamut = String(data.settings.target ?? 'display-p3');
  const report: AnchorResult[] = [];
  const solidSteps: SolidSteps = { light: {}, dark: {} };
  // Each anchor claims its family. Roles often share one (primary and data 1 both default to indigo),
  // so a second anchor on a claimed family moves its role to the nearest free family by hue: first a
  // family no role uses, else one no anchor has claimed.
  const outRoles = { ...roles };
  const claimed = new Map<string, string>();
  const neutralFamilies = new Set(data.metadata?.light.neutrals ?? Object.keys(data.schemes.light).filter((n) => /neutral|gray|mauve|slate|sage|olive|sand/i.test(n)));
  const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  // Claim in role order (brand, feedback, then data), so a brand role keeps its family whatever order
  // the anchors were written in.
  const order = Object.keys(roles);
  const sorted = [...anchors].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  for (const anchor of sorted) {
    let family = outRoles[anchor.role];
    if (!family || !out.schemes.light[family]) continue;
    const want = srgbToOklch(anchor.value);
    if (claimed.has(family) && claimed.get(family) !== anchor.role) {
      const isNeutral = neutralFamilies.has(family);
      const pool = Object.keys(out.schemes.light).filter((f) => neutralFamilies.has(f) === isNeutral && !claimed.has(f));
      const used = new Set(Object.values(outRoles));
      const byHue = (f: string) => hueGap(out.schemes.light[f][8].oklch[2], want[2]);
      const free = pool.filter((f) => !used.has(f));
      const pick = (free.length ? free : pool).sort((a, b) => byHue(a) - byHue(b))[0];
      if (!pick) continue;
      family = pick;
      outRoles[anchor.role] = family;
    }
    claimed.set(family, anchor.role);
    const lightRamp = out.schemes.light[family];
    const page = toneOf(lightRamp[0]);
    const lc = apcaLc(toneOfY(yOfHex(anchor.value)), page);
    // The step whose target is nearest the anchor's Lc (steps 2–12), unless the anchor names one.
    const step = anchor.step ?? 2 + targets.light.reduce((best, t, i) => (Math.abs(t - lc) < Math.abs(targets.light[best] - lc) ? i : best), 0);
    const at = lightRamp[step - 1];
    const before = deltaE(want, at.oklch);
    const ratio = at.oklch[1] > 1e-4 ? want[1] / at.oklch[1] : 1;
    for (const mode of ['light', 'dark'] as const) for (const sw of out.schemes[mode][family]) {
      if (sw.step === 1) continue; // the page keeps its tone and tint
      const [L, C] = sw.oklch;
      setSwatch(sw, [L, clampChroma(L, C * ratio, want[2], gamut), want[2]]);
    }
    setSwatch(lightRamp[step - 1], want);
    const below = step > 2 ? targets.light[step - 3] : 0, above = step < 12 ? targets.light[step - 1] : Infinity;
    // The dark color, when given: exact at its own step in the dark ramp.
    let dark: AnchorResult['dark'];
    if (anchor.dark) {
      const darkRamp = out.schemes.dark[family];
      const lcD = apcaLc(toneOfY(yOfHex(anchor.dark)), toneOf(darkRamp[0]));
      const stepD = 2 + targets.dark.reduce((best, t, i) => (Math.abs(t - lcD) < Math.abs(targets.dark[best] - lcD) ? i : best), 0);
      setSwatch(darkRamp[stepD - 1], srgbToOklch(anchor.dark));
      const lo = stepD > 2 ? targets.dark[stepD - 3] : 0, hi = stepD < 12 ? targets.dark[stepD - 1] : Infinity;
      dark = { value: anchor.dark, step: stepD, lc: Math.round(lcD * 10) / 10, target: targets.dark[stepD - 2], inOrder: lcD > lo && lcD < hi };
      if (stepD >= 8) solidSteps.dark[anchor.role] = stepD;
    }
    report.push({
      role: anchor.role, family, value: anchor.value, step, lc: Math.round(lc * 10) / 10, target: targets.light[step - 2],
      below, above, inOrder: lc > below && lc < above, inRange: lc <= targets.light[10] + 10 && lc >= targets.light[0] / 2,
      dE: Math.round(before * 10) / 10, ...(dark ? { dark } : {}),
    });
    if (step >= 8) solidSteps.light[anchor.role] = step;
  }
  // Surface anchors, last: the neutral family's ends, after any neutral anchor re-shaped it.
  const neutral = out.schemes.light[outRoles.neutral] ? outRoles.neutral : undefined;
  for (const anchor of anchors) {
    if (anchor.role !== 'ground' && anchor.role !== 'ink') continue;
    if (!neutral) continue;
    const [lightStep, darkStep] = anchor.role === 'ground' ? [1, 12] : [12, 1];
    const page = toneOf(data.schemes.light[neutral][0]);
    const lc = apcaLc(toneOfY(yOfHex(anchor.value)), page);
    const pin = (mode: 'light' | 'dark', step: number, hex: string) => {
      const sw = out.schemes[mode][neutral][step - 1], want = srgbToOklch(hex);
      setSwatch(sw, want);
      if (sw.hct) sw.hct[2] = toneOfY(yOf(want)); // the tone contrast reads
    };
    const before = deltaE(srgbToOklch(anchor.value), data.schemes.light[neutral][lightStep - 1].oklch);
    pin('light', lightStep, anchor.value);
    pin('dark', darkStep, anchor.dark ?? anchor.value);
    (out.strongInk ??= {})[anchor.role === 'ink' ? 'light' : 'dark'] = true; // headings use the brand's text color too
    report.push({
      role: anchor.role, family: neutral, value: anchor.value, step: lightStep, lc: Math.round(lc * 10) / 10, target: 0, below: 0, above: Infinity, inOrder: true, inRange: true,
      dE: Math.round(before * 10) / 10, dark: { value: anchor.dark ?? anchor.value, step: darkStep, lc: 0, target: 0, inOrder: true },
    });
  }
  return { data: out, roles: outRoles, report, solidSteps };
}
function yOfHex(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

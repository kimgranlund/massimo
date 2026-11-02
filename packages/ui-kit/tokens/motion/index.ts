// Motion: Apple-style springs, as SwiftUI parameterizes them (a perceptual `duration` and a
// `bounce` from 0 = critically damped to 1 = undamped), solved exactly and sampled into CSS
// linear() easings. Each spring yields an easing and the time it takes to settle; the two are
// a pair (the curve spans exactly that duration).
//
// Spring (unit mass, start 0, rest 1, zero initial velocity):
//   ω0 = 2π / duration          (stiffness k = ω0²)
//   ζ  = 1 − bounce             (damping ratio)
//   ζ < 1: x(t) = 1 − e^(−ζω0t) (cos ωd t + (ζω0/ωd) sin ωd t),  ωd = ω0 √(1 − ζ²)
//   ζ = 1: x(t) = 1 − e^(−ω0t) (1 + ω0t)
// Settle: the last time |x − 1| ≥ ε (ε = 0.001, a thousandth of the distance).

export type Spring = { duration: number; bounce: number };

/** The kit's springs. Durations are perceptual (SwiftUI), not the settle time. */
export const SPRINGS = {
  /** Hover, press, color and opacity changes: quick, no overshoot. */
  quick: { duration: 0.2, bounce: 0 },
  /** Popups, reveals, progress: smooth, no overshoot (SwiftUI .smooth). */
  smooth: { duration: 0.35, bounce: 0 },
  /** Toggles, thumbs, chevrons, indicators: a hint of overshoot (SwiftUI .snappy). */
  snappy: { duration: 0.3, bounce: 0.15 },
  /** Emphasis: visible overshoot (SwiftUI .bouncy). */
  bouncy: { duration: 0.45, bounce: 0.3 },
} as const satisfies Record<string, Spring>;

export type SpringName = keyof typeof SPRINGS;

const EPSILON = 0.001;
const SAMPLES = 48;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Position at time t (seconds) for a spring from 0 to 1. */
export function springAt(t: number, { duration, bounce }: Spring): number {
  const w0 = (2 * Math.PI) / duration;
  const zeta = 1 - Math.min(Math.max(bounce, 0), 0.99);
  if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
}

/** Seconds until the spring stays within ε of rest. */
export function settleTime(s: Spring): number {
  const dt = 0.0005;
  let last = 0;
  for (let t = 0; t < 10; t += dt) if (Math.abs(springAt(t, s) - 1) >= EPSILON) last = t;
  return last + dt;
}

export type ResolvedSpring = Spring & { ms: number; points: number[]; css: string };

/** A spring as a CSS linear() easing over its settle time. */
export function resolveSpring(s: Spring): ResolvedSpring {
  const settle = settleTime(s);
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => (i === SAMPLES ? 1 : round4(springAt((i / SAMPLES) * settle, s))));
  return { ...s, ms: Math.round(settle * 1000), points, css: `linear(${points.join(', ')})` };
}

export const RESOLVED_SPRINGS = Object.fromEntries(
  Object.entries(SPRINGS).map(([k, s]) => [k, resolveSpring(s)]),
) as Record<SpringName, ResolvedSpring>;

// ── Theme inputs (tokens/themes/params.ts) ──
// --ui-motion-scale multiplies every duration (0 = instant, 1 = as designed).
// --ui-motion-bounce (0–1) blends each overshooting spring with its critically damped twin (same
// perceptual duration, bounce 0): settle time and every linear() sample interpolate, so 1 is the
// exact spring, 0 the exact critically damped one, and values between are a blend of the two
// curves (not a solved spring; a CSS custom property cannot re-solve one). The blend is plain
// calc() inside linear(), so it stays a precomputed string with no runtime generation.
export const SCALE_VAR = 'var(--ui-motion-scale)';
export const BOUNCE_VAR = 'var(--ui-motion-bounce)';

/** The spring with its bounce removed: the 0 end of --ui-motion-bounce. */
export const flatSpring = (s: Spring): Spring => ({ duration: s.duration, bounce: 0 });

const fmt = (n: number) => String(round4(n));
const blend = (a: number, b: number, unit = '') => {
  const d = round4(b - a);
  if (d === 0) return `${fmt(a)}${unit}`;
  return `${fmt(a)}${unit} ${d < 0 ? '-' : '+'} ${fmt(Math.abs(d))}${unit} * ${BOUNCE_VAR}`;
};

/** CSS duration of a spring: settle time × --ui-motion-scale, blended by --ui-motion-bounce when it overshoots. */
export function springDurationCss(s: Spring): string {
  const r = resolveSpring(s), f = resolveSpring(flatSpring(s));
  return r.ms === f.ms ? `calc(${r.ms}ms * ${SCALE_VAR})` : `calc((${blend(f.ms, r.ms, 'ms')}) * ${SCALE_VAR})`;
}

/** CSS easing of a spring: its linear() samples, each blended by --ui-motion-bounce when it overshoots. */
export function springEasingCss(s: Spring): string {
  const r = resolveSpring(s);
  if (r.bounce === 0) return r.css;
  const f = resolveSpring(flatSpring(s));
  return `linear(${r.points.map((y, i) => { const b = blend(f.points[i], y); return b.includes(' ') ? `calc(${b})` : b; }).join(', ')})`;
}

// ── Semantic layer: transition intents ──
// Components name what a transition is for; the intent picks the spring.
export const INTENTS = {
  /** Hover, press, selection and validity: color, shadow and opacity changes. */
  feedback: 'quick',
  /** A state flip that moves something: switch thumb, radio dot, chevron, range key steps, swiper dot. */
  toggle: 'snappy',
  /** Something appearing or growing: popups, hover controls, progress fill. */
  reveal: 'smooth',
  /** Drawing attention: visible overshoot (unused by components). */
  emphasis: 'bouncy',
} as const satisfies Record<string, SpringName>;
export type IntentName = keyof typeof INTENTS;

// Panda tokens: durations.<spring> and easings.<spring> are a pair; use them together.
// Durations carry the theme inputs; the static settle times live in RESOLVED_SPRINGS (and DTCG).
type Token = { value: string };
export const durations = {
  instant: { value: '0ms' },
  ...(Object.fromEntries(Object.entries(SPRINGS).map(([k, s]) => [k, { value: springDurationCss(s) }])) as Record<SpringName, Token>),
};
export const easings = {
  ...(Object.fromEntries(Object.entries(SPRINGS).map(([k, s]) => [k, { value: springEasingCss(s) }])) as Record<SpringName, Token>),
  // Plain curve for discrete flips (display/overlay in popovers) and anything that must not overshoot.
  linear: { value: 'linear' },
};
// Semantic tokens: durations.<intent> and easings.<intent> point at their spring's pair.
export const semanticDurations = Object.fromEntries(Object.entries(INTENTS).map(([k, s]) => [k, { value: `{durations.${s}}` }])) as Record<IntentName, Token>;
export const semanticEasings = Object.fromEntries(Object.entries(INTENTS).map(([k, s]) => [k, { value: `{easings.${s}}` }])) as Record<IntentName, Token>;

// ── cubic-bezier approximation (for DTCG and tools without linear()) ──
const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
function bezierY(x: number, [x1, y1, x2, y2]: number[]): number {
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (bez(t, x1, x2) < x) lo = t; else hi = t; }
  return bez(t, y1, y2);
}

/** Least-squares cubic-bezier fit of a resolved spring (x1, x2 kept in [0, 1]). Rounded to 3 decimals. */
export function fitBezier(r: ResolvedSpring): [number, number, number, number] {
  const n = r.points.length - 1;
  const err = (p: number[]) => r.points.reduce((e, y, i) => e + (bezierY(i / n, p) - y) ** 2, 0);
  let p = [0.3, 0.5, 0.2, 1];
  let e = err(p);
  for (let step = 0.1; step > 1e-4; step /= 2) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let k = 0; k < 4; k++) for (const d of [step, -step]) {
        const q = p.slice(); q[k] += d;
        if ((k === 0 || k === 2) && (q[k] < 0 || q[k] > 1)) continue;
        const eq = err(q);
        if (eq < e) { p = q; e = eq; improved = true; }
      }
    }
  }
  return p.map((v) => Math.round(v * 1000) / 1000) as [number, number, number, number];
}

/**
 * The motion token variables (spring durations and easings, then the intents that point at them)
 * as declarations. Panda declares them on :root, where --ui-motion-* resolve with the root values;
 * a scope that sets those params for its subtree (the jig canvas) redeclares them, as with unitTokenCss().
 */
export function motionTokenVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(durations)) if (v.value.includes('--ui-')) out[`--durations-${k}`] = v.value;
  for (const [k, v] of Object.entries(easings)) if (v.value.includes('--ui-')) out[`--easings-${k}`] = v.value;
  for (const [k, s] of Object.entries(INTENTS)) {
    out[`--durations-${k}`] = `var(--durations-${s})`;
    out[`--easings-${k}`] = `var(--easings-${s})`;
  }
  return out;
}
export const motionTokenCss = () => Object.entries(motionTokenVars()).map(([k, v]) => `${k}: ${v};`).join('\n  ');

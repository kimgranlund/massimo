// Motion: Apple-style springs, as SwiftUI parameterizes them (a perceptual `duration` and a
// `bounce` from 0 = critically damped to 1 = undamped), solved exactly and sampled into CSS
// linear() easings. Each spring yields an easing and a span (the transition duration); the two
// are a pair (the curve spans exactly that duration).
//
// Spring (unit mass, start 0, rest 1, zero initial velocity):
//   ω0 = 2π / duration          (stiffness k = ω0²)
//   ζ  = 1 − bounce             (damping ratio)
//   ζ < 1: x(t) = 1 − e^(−ζω0t) (cos ωd t + (ζω0/ωd) sin ωd t),  ωd = ω0 √(1 − ζ²)
//   ζ = 1: x(t) = 1 − e^(−ω0t) (1 + ω0t)
// Time scales with duration: x depends on t / duration and bounce only. So a curve's shape is a
// function of bounce alone, and its span is duration × span(bounce).
//
// Everything is live (docs/specs/motion.md): every spring's duration and bounce, the intent →
// spring mapping and the two global multipliers are theme parameters (tokens/themes/params.ts),
// and the tokens below are static CSS that reads them through custom properties.

export type Spring = { duration: number; bounce: number };

/** The kit's springs at their defaults (the theme params `spring-<name>-duration|bounce`). Durations are perceptual (SwiftUI), not the span. */
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
/** Spring names in parameter order: `intent-<name>` params hold an index into this list. */
export const SPRING_NAMES = Object.keys(SPRINGS) as SpringName[];

const EPSILON = 0.001;
const SAMPLES = 48;
/** Highest bounce the live curves cover (the bounce params' max); effective bounce is clamped to it. */
export const BOUNCE_MAX = 0.6;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Position at time t (seconds) for a spring from 0 to 1. */
export function springAt(t: number, { duration, bounce }: Spring): number {
  const w0 = (2 * Math.PI) / duration;
  const zeta = 1 - Math.min(Math.max(bounce, 0), 0.99);
  if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
}

/** Settle time in units of duration: the last moment |x − 1| ≥ ε, at 1e-5 resolution (a 1e-3 scan, then refined). */
export function settleFactor(bounce: number): number {
  const s = { duration: 1, bounce }, off = (t: number) => Math.abs(springAt(t, s) - 1) >= EPSILON;
  let last = 0;
  for (let t = 0; t < 12; t += 1e-3) if (off(t)) last = t;
  for (let t = last; t < last + 1e-3; t += 1e-5) if (off(t)) last = t;
  return last + 1e-5;
}

// ── Span ──
// Settle time jumps with bounce (by about half a period when an overshoot peak drops under ε), so
// it cannot be a CSS expression. The span is instead a quadratic in bounce through the exact
// settle factors at bounce 0, 0.15 and 0.3 (the default springs' bounces), and at or above the
// settle time across 0–BOUNCE_MAX within rounding: within 0.21% of rest when it ends. The
// duration token is this quadratic, live and exact.
const SPAN_ANCHORS = [0, 0.15, 0.3] as const;
export const SPAN_COEFFS = (() => {
  const [s0, s1, s2] = SPAN_ANCHORS.map(settleFactor);
  const h = SPAN_ANCHORS[1];
  const c2 = (s2 - 2 * s1 + s0) / (2 * h * h);
  return [round5(s0), round5((s1 - s0) / h - c2 * h), round5(c2)] as const;
})();
/** Span of a spring in units of its duration, as a function of bounce. */
export const spanFactor = (bounce: number) => SPAN_COEFFS[0] + SPAN_COEFFS[1] * bounce + SPAN_COEFFS[2] * bounce * bounce;

/** The curve shape for a bounce: 49 samples of x over the span, normalized time 0..1. */
export const shapeAt = (bounce: number) => {
  const span = spanFactor(bounce), s = { duration: 1, bounce };
  return Array.from({ length: SAMPLES + 1 }, (_, i) => (i === SAMPLES ? 1 : round4(springAt((i / SAMPLES) * span, s))));
};

export type ResolvedSpring = Spring & { ms: number; points: number[]; css: string };

/** A spring solved exactly: span in ms and its linear() easing. */
export function resolveSpring(s: Spring): ResolvedSpring {
  const points = shapeAt(s.bounce);
  return { ...s, ms: Math.round(s.duration * spanFactor(s.bounce) * 1000), points, css: `linear(${points.join(', ')})` };
}

export const RESOLVED_SPRINGS = Object.fromEntries(
  Object.entries(SPRINGS).map(([k, s]) => [k, resolveSpring(s)]),
) as Record<SpringName, ResolvedSpring>;

// ── Semantic layer: transition intents ──
// Components name what a transition is for; the intent picks the spring (default mapping; the
// theme params `intent-<name>` change it live).
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

// ── Live parameters, in JS (the jig's Motion page; the CSS below computes the same) ──
type MotionParams = Record<string, number>;
const num = (p: MotionParams, k: string, d: number) => (typeof p[k] === 'number' ? p[k] : d);

/** A spring as the theme params make it: its duration and its effective bounce (× motion-bounce, clamped). */
export function liveSpring(p: MotionParams, name: SpringName): Spring {
  return {
    duration: num(p, `spring-${name}-duration`, SPRINGS[name].duration),
    bounce: clamp(num(p, `spring-${name}-bounce`, SPRINGS[name].bounce) * num(p, 'motion-bounce', 1), 0, BOUNCE_MAX),
  };
}
/** The spring an intent uses under the theme params. */
export const intentSpring = (p: MotionParams, intent: IntentName): SpringName =>
  SPRING_NAMES[clamp(Math.round(num(p, `intent-${intent}`, SPRING_NAMES.indexOf(INTENTS[intent]))), 0, SPRING_NAMES.length - 1)];
/** Live span in ms (× motion-scale) and live easing samples for a spring under the theme params. */
export function liveMotion(p: MotionParams, name: SpringName): { spring: Spring; ms: number; points: number[] } {
  const spring = liveSpring(p, name);
  return { spring, ms: spring.duration * spanFactor(spring.bounce) * 1000 * num(p, 'motion-scale', 1), points: shapeAt(spring.bounce) };
}

// ── CSS ──
// Theme inputs (all `--ui-*`, tokens/themes/params.ts):
//   --ui-spring-<s>-duration (seconds), --ui-spring-<s>-bounce (0..BOUNCE_MAX)
//   --ui-intent-<i> (0..3: index into SPRING_NAMES)
//   --ui-motion-scale (× every span; 0 = instant), --ui-motion-bounce (× every bounce)
// Derived variables (motionVars(), declared next to the tokens and redeclared with them), for
// x = a spring or an intent:
//   --motion-<x>-d     perceptual duration (seconds)
//   --motion-<x>-b     effective bounce: bounce × motion-bounce, clamped to 0..BOUNCE_MAX
//   --motion-<x>-span  span factor, the quadratic spanFactor(b)
//   --motion-<x>-a|f|r per-sample decay ζω0Δt, angular step ωdΔt and ζω0/ωd (Δt = span / 48)
//   --motion-<i>-s<n>  intent i selects spring n: max(0, 1 − |intent − n|), 1 for the chosen one
// Each linear() sample is the solved spring itself, 1 − e^(−a j)(cos f j + r sin f j), evaluated
// by CSS math functions (exp, cos, sin, sqrt): exact at any bounce, no precomputed curve. At
// bounce 0, ωd is floored at 0.001 ω0, where r sin(f j) is ω0 t within 2e-5 (the critical limit).
// An intent is a spring by value: its d and b are the selected spring's (Σ s<n> × spring value),
// then it runs the same formulas. No selector, no runtime CSS.
const P = (name: string) => `var(--ui-${name})`;
const M = (x: string, k: string) => `var(--motion-${x}-${k})`;
const fmt = (n: number) => String(Math.round(n * 1e9) / 1e9);
const signed = (n: number, term: string) => `${n < 0 ? '-' : '+'} ${fmt(Math.abs(n))} * ${term}`;
const STEP = (2 * Math.PI) / SAMPLES;

/** The derived motion variables for springs and intents: name → CSS value. */
export function motionVars(): Record<string, string> {
  const out: Record<string, string> = {};
  const solve = (x: string) => {
    const [c0, c1, c2] = SPAN_COEFFS, b = M(x, 'b');
    out[`--motion-${x}-span`] = `calc(${fmt(c0)} ${signed(c1, b)} ${signed(c2, `${b} * ${b}`)})`;
    out[`--motion-${x}-q`] = `max(0.001, sqrt(${b} * (2 - ${b})))`;
    out[`--motion-${x}-a`] = `calc((1 - ${b}) * ${fmt(STEP)} * ${M(x, 'span')})`;
    out[`--motion-${x}-f`] = `calc(${fmt(STEP)} * ${M(x, 'span')} * ${M(x, 'q')})`;
    out[`--motion-${x}-r`] = `calc((1 - ${b}) / ${M(x, 'q')})`;
  };
  for (const s of SPRING_NAMES) {
    out[`--motion-${s}-d`] = P(`spring-${s}-duration`);
    out[`--motion-${s}-b`] = `clamp(0, ${P(`spring-${s}-bounce`)} * ${P('motion-bounce')}, ${BOUNCE_MAX})`;
    solve(s);
  }
  for (const i of Object.keys(INTENTS)) {
    const v = P(`intent-${i}`);
    SPRING_NAMES.forEach((_, n) => { out[`--motion-${i}-s${n}`] = `max(0, 1 - max(${v} - ${n}, ${n} - ${v}))`; });
    const pick = (k: 'd' | 'b') => `calc(${SPRING_NAMES.map((s, n) => `${M(s, k)} * ${M(i, `s${n}`)}`).join(' + ')})`;
    out[`--motion-${i}-d`] = pick('d');
    out[`--motion-${i}-b`] = pick('b');
    solve(i);
  }
  return out;
}

/** CSS span of a spring or intent: d × span × 1000ms × --ui-motion-scale. */
export const durationCss = (x: string) => `calc(${M(x, 'd')} * ${M(x, 'span')} * 1000ms * ${P('motion-scale')})`;

/** CSS easing of a spring or intent: 49 linear() samples of the solved spring. */
export function easingCss(x: string): string {
  const a = M(x, 'a'), f = M(x, 'f'), r = M(x, 'r');
  const pts = Array.from({ length: SAMPLES + 1 }, (_, j) =>
    j === 0 ? '0' : j === SAMPLES ? '1' : `calc(1 - exp(${a} * -${j}) * (cos(${f} * ${j}) + ${r} * sin(${f} * ${j})))`);
  return `linear(${pts.join(', ')})`;
}

// Panda tokens: durations.<spring> and easings.<spring> are a pair; use them together.
// The static spans live in RESOLVED_SPRINGS (and DTCG).
type Token = { value: string };
export const durations = {
  instant: { value: '0ms' },
  ...(Object.fromEntries(SPRING_NAMES.map((s) => [s, { value: durationCss(s) }])) as Record<SpringName, Token>),
};
export const easings = {
  ...(Object.fromEntries(SPRING_NAMES.map((s) => [s, { value: easingCss(s) }])) as Record<SpringName, Token>),
  // Plain curve for discrete flips (display/overlay in popovers) and anything that must not overshoot.
  linear: { value: 'linear' },
};
// Semantic tokens: durations.<intent> and easings.<intent>, the spring the intent selects, live.
export const semanticDurations = Object.fromEntries(Object.keys(INTENTS).map((i) => [i, { value: durationCss(i) }])) as Record<IntentName, Token>;
export const semanticEasings = Object.fromEntries(Object.keys(INTENTS).map((i) => [i, { value: easingCss(i) }])) as Record<IntentName, Token>;

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

/**
 * Every motion variable that reads a theme input: the derived --motion-* variables, then the spring
 * and intent tokens. Panda declares the tokens on :root and styles/motion.ts the derived variables,
 * where --ui-* resolve with the root values; a scope that sets the params for its subtree (the jig
 * canvas) redeclares them all, as with unitTokenCss().
 */
export function motionTokenVars(): Record<string, string> {
  const out: Record<string, string> = { ...motionVars() };
  for (const [k, v] of Object.entries(durations)) if (v.value.includes('--')) out[`--durations-${k}`] = v.value;
  for (const [k, v] of Object.entries(easings)) if (v.value.includes('--')) out[`--easings-${k}`] = v.value;
  for (const [k, v] of Object.entries(semanticDurations)) out[`--durations-${k}`] = v.value;
  for (const [k, v] of Object.entries(semanticEasings)) out[`--easings-${k}`] = v.value;
  return out;
}
export const motionTokenCss = () => Object.entries(motionTokenVars()).map(([k, v]) => `${k}: ${v};`).join('\n  ');

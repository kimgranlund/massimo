# Motion

Apple-style springs, parameterized as SwiftUI does: a perceptual `duration` and a `bounce` (0 = critically damped). `tokens/motion/index.ts` solves each spring exactly and samples it into a CSS `linear()` easing over its settle time, names the intents that use them, and takes two theme inputs; `styles/motion.ts` says which properties animate for which intent.

## Springs

ω0 = 2π / duration, ζ = 1 − bounce, unit mass, from 0 to rest at 1 with no initial velocity:

- ζ < 1: x(t) = 1 − e^(−ζω0t) (cos ωd t + (ζω0/ωd) sin ωd t), ωd = ω0 √(1 − ζ²)
- ζ = 1: x(t) = 1 − e^(−ω0t) (1 + ω0t)

Settle time is the last moment |x − 1| ≥ 0.001. The easing is 49 samples over that time, so `durations.<name>` and `easings.<name>` are a pair: always use them together.

| Spring | duration, bounce | Settle | Settle at bounce 0 |
|---|---|---|---|
| `quick` | 0.2s, 0 | 294ms | 294ms |
| `smooth` | 0.35s, 0 | 514ms | 514ms |
| `snappy` | 0.3s, 0.15 | 419ms | 441ms |
| `bouncy` | 0.45s, 0.3 | 737ms | 661ms |

Critically damped springs share one shape; only their settle time differs.

## Intents

The semantic layer: components name what a transition is for, the intent picks the spring (`INTENTS`).

| Intent | Spring | Use |
|---|---|---|
| `feedback` | `quick` | hover, press, selection and validity: color, shadow, opacity |
| `toggle` | `snappy` | switch thumb, radio dot, chevron, range thumb and fill on key steps, swiper dot |
| `reveal` | `smooth` | popups (and their discrete `display`/`overlay`), hover controls, progress fill |
| `emphasis` | `bouncy` | drawing attention (unused by components) |

Each component's transitions live in its slot recipe (`components/<name>/<name>.recipe.ts`, helper `t()` in `components/recipe-parts.ts`), which use intents only (a test fails on a spring name there). One spring per intent today; a new intent may reuse a spring.

## Theme inputs

Two parameters ([theming](theming.md)), both live custom properties:

- `motion-scale` (0–2, default 1) multiplies every duration: `durations.<spring>` is `calc(<settle>ms * var(--ui-motion-scale))`. 0 is instant, 2 is half speed. The easing curve is unchanged.
- `motion-bounce` (0–1, default 1) scales overshoot. It blends each overshooting spring with its critically damped twin (same perceptual duration, bounce 0): the settle time and each of the 49 `linear()` samples are `calc(a + d * var(--ui-motion-bounce))`. At 1 the result is the exact spring, at 0 the exact critically damped one; values between blend the two curves and are not a solved spring.

Why this set: duration and overshoot are the two things people tune about motion feel; per-spring bounce would add four controls for one idea. Bounce cannot re-solve a spring live, since `linear()` is a precomputed string and components may not generate stylesheets. The alternatives were a finite set of precomputed easings picked by attribute (a selector per value, doubling every overshooting rule) or keeping bounce fixed; the calc() blend keeps one rule, stays continuous and is exact at both ends. Cost: each overshooting easing is ~2.3 KB, declared once as a token. Springs with bounce 0 carry no blend.

The motion tokens resolve `var(--ui-motion-*)` where they are declared (`:root`). A scope that sets the params for a subtree redeclares them with `motionTokenCss()`, as the jig canvas does (like `unitTokenCss()`).

## Rules

- Animate paint and transforms only (`background-color`, `color`, `border-color`, `box-shadow`, `opacity`, `translate`, `scale`, `rotate`); the range/progress fill width, range thumb offset and swiper dot width are the exceptions (they own their box).
- Range tracks the pointer 1:1 while dragging (`:active` drops the transition); key steps glide.
- The select popup fades and scales from 0.97 with `@starting-style` and `allow-discrete` display/overlay.
- Reduced motion collapses every duration whatever `motion-scale` is (`styles/reset.ts`), turns off smooth scrolling, and replaces indeterminate sweeps with a faint static fill.

## Tokens

- Panda tokens: `durations.{instant,quick,smooth,snappy,bouncy}`, `easings.{quick,smooth,snappy,bouncy,linear}`, carrying the theme inputs.
- Panda semantic tokens: `durations.{feedback,toggle,reveal,emphasis}` and `easings.{…}`, each pointing at its spring's pair. Use these in components.
- DTCG: `tokens/dtcg/motion.dtcg.json`, per spring a `duration`, a `cubicBezier` least-squares fit (`fitBezier`, for tools without `linear()`) and a `transition`; the exact spring and its `linear()` ride in `$extensions["com.massimo.spring"]`; `motion.intent.<intent>` aliases the spring's transition. Values are at the defaults (scale 1, bounce 1): DTCG has no arithmetic, and the params are CSS inputs.

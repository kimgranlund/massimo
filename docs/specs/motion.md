# Motion

Apple-style springs, parameterized as SwiftUI does: a perceptual `duration` and a `bounce` (0 = critically damped). Every spring's duration and bounce, the spring each intent runs, and two global multipliers are live theme parameters; `tokens/motion/index.ts` turns them into static CSS that solves each spring in the browser and samples it into a `linear()` easing. Components name intents in their slot recipes. Neighbors: [theming](theming.md) (the parameters), [components](components.md#states) (the states that transition).

## Springs

ω0 = 2π / duration, ζ = 1 − bounce, unit mass, from 0 to rest at 1 with no initial velocity:

- ζ < 1: x(t) = 1 − e^(−ζω0t) (cos ωd t + (ζω0/ωd) sin ωd t), ωd = ω0 √(1 − ζ²)
- ζ = 1: x(t) = 1 − e^(−ω0t) (1 + ω0t)

x depends only on t / duration and bounce, so a curve's shape is a function of bounce alone and its length scales with duration. The easing is 49 samples over the span, so `durations.<name>` and `easings.<name>` are a pair: always use them together.

**Span.** The span is duration × span(bounce), where span(b) = 1.46955 − 1.57517 b + 7.11667 b², the quadratic through the exact settle factors (last moment |x − 1| ≥ 0.001) at bounce 0, 0.15 and 0.3. The true settle time jumps with bounce (by about half a period when an overshoot peak drops under 0.001), so it cannot be a CSS expression; the quadratic is smooth, equals the settle time at those three bounces, and lies at or past it everywhere else in 0–0.6 (a test holds every spring within 0.25% of rest after its span; the worst is 0.21%).

| Spring | duration, bounce (defaults) | Span | Span at bounce 0 |
|---|---|---|---|
| `quick` | 0.2s, 0 | 294ms | 294ms |
| `smooth` | 0.35s, 0 | 514ms | 514ms |
| `snappy` | 0.3s, 0.15 | 418ms | 441ms |
| `bouncy` | 0.45s, 0.3 | 737ms | 661ms |

Before the parameters went live, settle times were measured on a 0.5 ms grid per spring; they now come from one scale-free factor per bounce, which moved `snappy` from 419 to 418 ms and no sample by more than 0.0007.

## Intents

The semantic layer: components name what a transition is for, the intent picks the spring (`INTENTS` holds the defaults; the `intent-<intent>` parameters change them live).

| Intent | Default spring | Use |
|---|---|---|
| `feedback` | `quick` | hover, press, selection and validity: color, shadow, opacity |
| `toggle` | `snappy` | switch thumb, radio dot, chevron, range thumb and fill on key steps, swiper dot |
| `reveal` | `smooth` | popups (and their discrete `display`/`overlay`), hover controls, progress fill |
| `emphasis` | `bouncy` | drawing attention (unused by components) |

Each component's transitions live in its slot recipe (`components/<name>/<name>.recipe.ts`, helper `t()` in `components/recipe-parts.ts`), which use intents only (a test fails on a spring name there). Several intents may run the same spring.

## Theme inputs

All live custom properties ([theming](theming.md#theme-parameters)):

| Parameter | Range | Effect |
|---|---|---|
| `motion-scale` | 0–2 | × every span: 0 instant, 2 half speed; the curve is unchanged |
| `motion-bounce` | 0–1 | × every spring's bounce: 0 gives each its critically damped twin, 1 the springs as set |
| `spring-<s>-duration` | 0.05–1.5 s | the spring's perceptual duration |
| `spring-<s>-bounce` | 0–0.6 | the spring's bounce; effective bounce = bounce × `motion-bounce`, clamped to 0.6 |
| `intent-<i>` | 0–3 | the spring intent `i` runs: 0 `quick`, 1 `smooth`, 2 `snappy`, 3 `bouncy` (`SPRING_NAMES` order) |

**Live solve.** Each `linear()` sample is the solved spring itself, evaluated by CSS math functions: sample j is `1 − exp(−a·j) · (cos(f·j) + r · sin(f·j))`, with a = ζω0Δt, f = ωdΔt, r = ζω0/ωd and Δt = span / 48, read from derived variables. At bounce 0, ωd is floored at 0.001 ω0, where r · sin(f·j) matches the critical term ω0t to within 2e-5. The derived variables (`motionVars()`, declared by `styles/motion.ts`) per spring and intent x are `--motion-<x>-d` (duration), `-b` (effective bounce), `-span`, `-q` (ωd/ω0), `-a`, `-f`, `-r`, and per intent `--motion-<i>-s<n>`, the selector weight for spring n. They are registered `@property … { syntax: '<number>' }` (Panda `globalVars`), so each computes to a number where it is declared; unregistered, every `var()` in the 47 samples would carry the whole expression chain behind it.

Accuracy: the CSS evaluates the same formula as `resolveSpring()` (tests hold every sample to 1e-4 of the JS solve at the defaults, at off-default durations and bounces, and per intent mapping). What remains is the `linear()` sampling itself, 49 points joined by straight segments: at most 0.4% of the distance off the continuous spring at bounce 0 and 0.15, 0.5% at 0.3, 0.9% at 0.45, 1.7% at the 0.6 maximum (which is why bounce stops there). Durations follow the parameters exactly: `durations.<x>` is `calc(var(--motion-<x>-d) * var(--motion-<x>-span) * 1000ms * var(--ui-motion-scale))`.

**Intent selection.** An intent choice is finite, but the parameter is a number in a custom property, and CSS cannot pick a declaration by a custom property's value without style queries or `if()` (not portable yet) or a selector per choice (the jig sets parameters as custom properties on a scope, not attributes). So an intent is a spring by value: s<n> = max(0, 1 − |intent − n|) is 1 for the chosen spring and 0 for the others, the intent's duration and effective bounce are Σ s<n> × the spring's, and the intent runs the same solve. The CSS stays static, an intent always equals its spring exactly, and a non-integer value (outside the parameter's whole steps) blends neighbouring springs' duration and bounce, still a solved spring.

The rejected alternatives: blending precomputed curves over a bounce grid (exact only at grid points, and 47 × segment terms per easing, about twice the size), a cubic-bezier fit (cannot overshoot and settle), and attribute-selected easings (a rule per choice per intent, and not settable from the jig's parameter scope).

Cost: eight live easings (four springs, four intents), each 47 `calc()` samples of about 140 characters; with the derived variables and their registrations, about 63 KB of motion CSS before compression and 5 KB gzipped, declared once on the root. Browsers need `exp()`, `sin()`, `cos()` and `sqrt()` in `calc()` (2023 baseline) and `linear()` easing.

The motion tokens and derived variables resolve `var(--ui-*)` where they are declared (`:root`). A scope that sets the parameters for a subtree redeclares them all with `motionTokenCss()`, as the jig canvas does (like `unitTokenCss()`). The jig's Motion page computes the same curves in JS with `liveMotion()` and `intentSpring()`.

## Rules

- Animate paint and transforms only (`background-color`, `color`, `border-color`, `box-shadow`, `opacity`, `translate`, `scale`, `rotate`); the range/progress fill width, range thumb offset and swiper dot width are the exceptions (they own their box).
- Range tracks the pointer 1:1 while dragging (`:active` drops the transition); key steps glide.
- The select popup fades and scales from 0.97 with `@starting-style` and `allow-discrete` display/overlay.
- Reduced motion collapses every duration whatever `motion-scale` is (`styles/reset.ts`), turns off smooth scrolling, and replaces indeterminate sweeps with a faint static fill.

## Tokens

- Panda tokens: `durations.{instant,quick,smooth,snappy,bouncy}`, `easings.{quick,smooth,snappy,bouncy,linear}`, solved live from the parameters.
- Panda semantic tokens: `durations.{feedback,toggle,reveal,emphasis}` and `easings.{…}`, the spring the intent selects, live. Use these in components.
- DTCG: `tokens/dtcg/motion.dtcg.json`, per spring a `duration` (the span), a `cubicBezier` least-squares fit (`fitBezier`, for tools without `linear()`) and a `transition`; the exact spring, its `linear()` and its parameter names ride in `$extensions["com.massimo.spring"]`; `motion.intent.<intent>` aliases the default spring's transition and names its parameter in `com.massimo.param`. Values are at the defaults: DTCG has no arithmetic, and the parameters are CSS inputs.

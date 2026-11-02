# Motion

Apple-style springs, parameterized as SwiftUI does: a perceptual `duration` and a `bounce` (0 = critically damped). `tokens/motion/index.ts` solves each spring exactly and samples it into a CSS `linear()` easing over its settle time; `styles/motion.ts` says which properties animate on which spring.

## Springs

ω0 = 2π / duration, ζ = 1 − bounce, unit mass, from 0 to rest at 1 with no initial velocity:

- ζ < 1: x(t) = 1 − e^(−ζω0t) (cos ωd t + (ζω0/ωd) sin ωd t), ωd = ω0 √(1 − ζ²)
- ζ = 1: x(t) = 1 − e^(−ω0t) (1 + ω0t)

Settle time is the last moment |x − 1| ≥ 0.001. The easing is 49 samples over that time, so `durations.<name>` and `easings.<name>` are a pair: always use them together.

| Spring | duration, bounce | Settle | Use |
|---|---|---|---|
| `quick` | 0.2s, 0 | 294ms | hover, press, color, shadow, opacity |
| `smooth` | 0.35s, 0 | 514ms | popups, reveals, progress, hover controls |
| `snappy` | 0.3s, 0.15 | 419ms | switch thumb, radio dot, chevron, range thumb on key steps, swiper dot |
| `bouncy` | 0.45s, 0.3 | 737ms | emphasis (unused by components) |

Critically damped springs share one shape; only their settle time differs.

## Rules

- Animate paint and transforms only (`background-color`, `color`, `border-color`, `box-shadow`, `opacity`, `translate`, `scale`, `rotate`); the range/progress fill width, range thumb offset and swiper dot width are the exceptions (they own their box).
- Range tracks the pointer 1:1 while dragging (`:active` drops the transition); key steps glide.
- The select popup fades and scales from 0.97 with `@starting-style` and `allow-discrete` display/overlay.
- Reduced motion collapses every duration (`styles/reset.ts`), turns off smooth scrolling, and replaces indeterminate sweeps with a faint static fill.

## Tokens

- Panda: `durations.{instant,quick,smooth,snappy,bouncy}`, `easings.{quick,smooth,snappy,bouncy,linear}`.
- DTCG: `tokens/dtcg/motion.dtcg.json`, per spring a `duration`, a `cubicBezier` least-squares fit (`fitBezier`, for tools without `linear()`) and a `transition`; the exact spring and its `linear()` ride in `$extensions["com.massimo.spring"]`.

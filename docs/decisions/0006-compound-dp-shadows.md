---
status: accepted
date: 2026-11-03
---

# 0006. Compound shadows, continuous in dp

**Context.** Two fixed shadows (sm, md) could not express Material-style elevation.

**Decision.** Every shadow is umbra, penumbra and ambient, each offset, blur and spread linear in the elevation e (dp), fitted to Material at 2, 8 and 24dp; tinted by the shadow role with per-scheme alphas; raised 2, floating 8, modal 24 by default.

**Alternatives.** Keep none/sm/md steps with three-layer compounds.

**Consequences.** Any elevation is valid and tunable; 0dp casts nothing.

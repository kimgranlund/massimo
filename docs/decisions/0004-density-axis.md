---
status: accepted
date: 2026-11-03
---

# 0004. Density is separate from scale

**Context.** size changed u, so density and scale were one input and type shrank with density.

**Decision.** density (compact, default, loose; theme and attribute) sets control insets 0.5u, 1u, 2u (controls 7u, 8u, 10u) and scales the container ladder × 0.5, 1, 1.5. Type, the 6u slot and icons never change.

**Alternatives.** Treat the ladder as density with no inset change; offsets of ±1u to the ladder.

**Consequences.** Every component follows the inset; one-row composites grow where the compact inset cannot hold two borders (u = 2, B = 1).

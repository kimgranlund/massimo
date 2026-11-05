---
status: accepted
date: 2026-11-04
---

# 0017. Padding first in nested containers

**Context.** Decision 0014 made containers concentric: a card's radius was the control radius + its padding, and a nested container's padding was derived from what the radius left. Radius drove padding, so padding shrank with depth. At u = 4.5 a card had radius 31 and padding 13, and a nested card had padding 6. Group and collection also counted as containers, so a card holding one group lost its ladder padding, and their invisible padding pushed contents off the edge of the text beside them.

**Decision.** Padding is the input and radius follows. A card's radius is its padding × min(1, s). A nested container is concentric when its parent has room, R = max(R_parent − p_parent, R_parent × k), and a card's magnitude t runs to 4, so a card can be rounder than it is deep. A nested card steps down the ladder to 3u. A wrapper that paints nothing has no padding or border and passes its parent through. The `levels` attribute is removed, because it split a padding that is no longer derived.

**Alternatives.** Lowering `radius-card` alone (the padding stays thin). Keeping strict concentricity (radius stays large). Keeping `levels` under a new meaning (nothing left to split).

**Consequences.** Supersedes the nesting rule of 0014. Nested corners are concentric only when the parent is rounder than it is deep, and a button can be rounder than a nested card, because padding now keeps them apart. A wrapper that needs padding sets `surface` or `padding`. Cards lose some roundness on a high corner scale, because the radius stops at the padding.

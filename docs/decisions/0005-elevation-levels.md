---
status: accepted
date: 2026-11-03
---

# 0005. Elevation is six levels

**Context.** Fills by depth, shadows, the overlay and the layers lived in four places with no owner.

**Decision.** Six levels (page, panel, card, raised, floating, modal), each a fill, a shadow and a layer, owned by docs/specs/elevation.md; tunable by shadow strength, surface contrast, an elevation per lifted level and raised cards.

**Alternatives.** Four levels; document as-is.

**Consequences.** Surfaces read from one table; a theme can flatten or deepen the stack.

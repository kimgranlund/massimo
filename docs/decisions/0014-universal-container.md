---
status: accepted
date: 2026-11-03
---

# 0014. One container for every level

**Context.** Six level tags with their own radius rules could not nest concentrically, and nesting a card in a card broke the curve.

**Decision.** ui-container with presets (group … page): a root keeps its preset geometry; a nested container is concentric with its parent (R − p); a container of containers keeps the ratio k (C) or splits evenly with levels (D); a leaf fits its controls; areas restart the chain. CSS reads the parent through exact-depth variables. The level tags are deprecated aliases.

**Alternatives.** Outward anchoring (needs child depth, not CSS-able); constant padding (collapses).

**Consequences.** Nested containers change look: a card holding containers derives its padding. docs/planning/universal-container.md.

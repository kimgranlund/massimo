---
status: accepted
date: 2026-11-03
---

# 0007. inset="none" attaches composites and tracks

**Context.** Some designs want rows edge to edge (settings lists, a plan picker inside a card) or thumbs that fill the track.

**Decision.** inset="none" on listbox, segmented, toggle group, range and switch: the edge is the border alone, no gap, square children whose first and last keep the outer corners, 1px dividers; thumbs fill the track and take its radius.

**Alternatives.** A theme-wide setting; square thumbs.

**Consequences.** Radii reach options as variables (--child-r, --c-ss …) so no selector outranks the option's own rules.

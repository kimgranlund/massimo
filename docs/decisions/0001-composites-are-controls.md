---
status: accepted
date: 2026-11-03
---

# 0001. Composites are controls

**Context.** Listbox, segmented, toggle group, tabs list, menubar and the select, menu and navigation popups used the wrapper radius (3u + p) × s, so a segmented control was rounder than the button beside it.

**Decision.** A composite takes the control radius, min(3u·s, H/2), like a button; its options split the difference, R − D, concentric inside it.

**Alternatives.** Keep the wrapper rule (rounder than controls); give options the control radius (not concentric with the composite).

**Consequences.** Composites line up with buttons in a row; option radii shrink by the edge D. geometry.md#containers, resolveComposite.

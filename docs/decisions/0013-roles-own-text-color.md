---
status: accepted
date: 2026-11-03
---

# 0013. The type role is the one source of a text's color

**Context.** Pages set a color next to each role, so a role remap never reached them.

**Decision.** Each type role has a text color (typography.colors; strong for display, headings, title; muted for body-large, caption, code, label; inherit otherwise). Components and pages do not pair a role with an explicit color unless it is a deliberate one-off.

**Alternatives.** Let remaps override explicit colors (specificity games).

**Consequences.** A remap reaches every use; one-offs are visible in review.

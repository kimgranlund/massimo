---
status: accepted
date: 2026-11-03
---

# 0002. Wrappers and cards are concentric with their controls

**Context.** Wrappers scaled (3u + p) by s, which drifted off concentric at every scale but 1, and cards used radius = padding, so a button at a card's edge did not follow its curve.

**Decision.** Group, collection and card take R = min(3u·s, H/2) + p, square at s = 0 (the padding term × min(1, 100·s)). Toast, popover, preview card and dialog surfaces keep radius = padding × min(1, s).

**Alternatives.** Concentric everywhere (dialogs reach 40px); keep radius = padding for cards.

**Consequences.** Cards are rounder (31.5px for card-md at u = 4.5); floating and modal surfaces keep their shape. Superseded for nested containers by 0014.

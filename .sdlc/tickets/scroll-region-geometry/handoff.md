---
id: T-0055
title: "Parity W5 · Pane and scroll-region geometry foundation"
type: chore           # feature | bug | chore | spike | idea
status: done     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L2             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P2         # P1 | P2 | P3
depends: [T-0031]
created: 2026-11-06
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
budget_usd: 30
---

## Goal
Maison UI parity, wave 5: Pane and scroll-region geometry foundation is in place.

## Intent
- Do: The geometry family and resolver for scrolling regions with persistent headers and footers, shared by every wave 5 component; a spec change in docs/specs/geometry.md.
- Non-goals: porting Maison source; a new visual language; changes to existing components' APIs unless this ticket says so; shared infrastructure beyond what this ticket names.
- Done when: the module or resolver has unit tests, the owning spec is updated, and the components that depend on it can consume it without further API changes.

## Context
- Kit pattern: docs/specs/components.md, docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; icons through the pinned Phosphor runtime; no runtime stylesheets.

## Outcome

2026-11-06 · lane: full L2 · verdict: closed by reason (delivered with waves 5 and 6; gates green in three engines) · verifier: none · base: none
- Changed: shipped in the waves 5 and 6 commit
- Commits: none

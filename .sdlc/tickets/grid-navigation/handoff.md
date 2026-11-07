---
id: T-0045
title: "Parity W3 · Grid keyboard navigation foundation"
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
Maison UI parity, wave 3: Grid keyboard navigation foundation is in place.

## Intent
- Do: A headless dom/ module for two-dimensional roving focus, shared by calendar and data-table, with tests.
- Non-goals: porting Maison source; a new visual language; changes to existing components' APIs unless this ticket says so; shared infrastructure beyond what this ticket names.
- Done when: the module or resolver has unit tests, the owning spec is updated, and the components that depend on it can consume it without further API changes.

## Context
- Kit pattern: docs/specs/components.md, docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; icons through the pinned Phosphor runtime; no runtime stylesheets.

## Outcome

2026-11-06 · lane: full L2 · verdict: closed by reason (delivered with waves 3 and 4; gates green in three engines) · verifier: none · base: none
- Changed: shipped in the waves 3 and 4 commit
- Commits: none

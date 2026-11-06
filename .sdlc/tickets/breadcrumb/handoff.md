---
id: T-0036
title: "Parity W1 · Breadcrumb"
type: feature        # feature | bug | chore | spike | idea
status: done     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L1             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P2         # P1 | P2 | P3
depends: [T-0031]
created: 2026-11-06
claimed_by: claude 2026-11-06
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
budget_usd: 5
---

## Goal
Maison UI parity, wave 1: Breadcrumb exists in ui-kit for both renderers and passes the geometry review.

## Intent
- Do: Ordered ancestor navigation with current page and truncation.
- Non-goals: porting Maison source; a new visual language; changes to existing components' APIs unless this ticket says so; shared infrastructure beyond what this ticket names.
- Done when: the component follows the kit pattern (web component and React renderer, Panda recipe, manifest, guide, examples, contract, tests), appears on the docs site, and every item of docs/guides/geometry-review.md is satisfied (enforced items green in `test/geometry-acceptance.test.ts` with no new KNOWN_GAPS; manual items recorded in its verification record).

## Context
- Maison reference for intent and behavior, not code to port: ~/Projects/maison-ui/packages/ui-kit/src/components/breadcrumb/breadcrumb.manifest.json
- Kit pattern: docs/specs/components.md, docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; icons through the pinned Phosphor runtime; no runtime stylesheets.

## Outcome

2026-11-06 · lane: full L1 · verdict: closed by reason (built live; gates passed in Chromium, Firefox and WebKit) · verifier: none · base: none
- Changed: components/breadcrumb: ui-breadcrumb, React Breadcrumb, resolveBreadcrumb, dom/breadcrumb
- Commits: none

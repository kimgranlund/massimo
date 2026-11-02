---
id: T-0019
title: "W3 · Toast"
type: feature        # feature | bug | chore | spike | idea
status: proposed     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L3             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P2         # P1 | P2 | P3
depends: [T-0001]
created: 2026-11-02
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
budget_usd: 60
---

## Goal
Base UI parity, wave 3: Toast exists in ui-kit for both renderers (web component and React) and passes the geometry review.

## Intent
- Do: Toast Provider/Viewport/Root/Title/Description/Action/Close with a queue, timeouts paused on hover/focus, swipe dismiss, aria-live regions, feedback colour roles.
- Non-goals: new visual language; anything outside this component (shared infrastructure belongs to its own ticket).
- Done when: the component follows the kit pattern (web component + React compound parts with `render` and state `className`, Panda slot recipe, Base UI data-* state attributes, part names and event details), has manifest, guide, examples, contracts and tests, and every item of docs/guides/geometry-review.md is satisfied (enforced items green in `test/geometry-acceptance.test.ts` with no new KNOWN_GAPS; manual items recorded in its verification record).

## Context
- Base UI reference: https://base-ui.com/react/components/toast (anatomy, data attributes, props, keyboard).
- Kit pattern and alignment: docs/specs/components.md (State attributes, Part names, Composition), docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.
- Show it in the jig: Components page family and a size ladder (apps/studio/src/pages/Components.tsx, shared.tsx SizeLadder).

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; class names unhashed; existing components' APIs unchanged.

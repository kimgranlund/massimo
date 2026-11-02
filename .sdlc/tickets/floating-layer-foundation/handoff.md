---
id: T-0001
title: "W1 · Floating layer foundation: positioner, dismiss layer, focus scope"
type: feature        # feature | bug | chore | spike | idea
status: done     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L3             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P1         # P1 | P2 | P3
depends: []
created: 2026-11-02
claimed_by: claude-live 2026-11-02
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
budget_usd: 60
---

## Goal
Base UI parity, wave 1: Floating layer foundation: positioner, dismiss layer, focus scope exists in ui-kit for both renderers (web component and React) and passes the geometry review.

## Intent
- Do: Generalise the select popup's positioning into a shared positioner (CSS anchor positioning with the script fallback, Base UI positioner variables --anchor-width/--available-height/--transform-origin, data-side/data-align, 1u offset, flip), a dismiss layer (outside press, Escape, focus-out, with Base UI reason strings), a focus scope (trap and return) and top-layer placement (popover API), shared by both renderers; refactor ui-select onto it with no visual change. No new public component.
- Non-goals: new visual language; anything outside this component (shared infrastructure belongs to its own ticket).
- Done when: the component follows the kit pattern (web component + React compound parts with `render` and state `className`, Panda slot recipe, Base UI data-* state attributes, part names and event details), has manifest, guide, examples, contracts and tests, and every item of docs/guides/geometry-review.md is satisfied (enforced items green in `test/geometry-acceptance.test.ts` with no new KNOWN_GAPS; manual items recorded in its verification record).

## Context
- Base UI reference: https://base-ui.com/react/components/popover (anatomy, data attributes, props, keyboard).
- Kit pattern and alignment: docs/specs/components.md (State attributes, Part names, Composition), docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.
- Show it in the jig: Components page family and a size ladder (apps/studio/src/pages/Components.tsx, shared.tsx SizeLadder).

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; class names unhashed; existing components' APIs unchanged.

## Outcome

2026-11-02 · lane: full L3 · verdict: closed by reason (delivered in d2ce99f, merged ae9bf32; checks green (202 tests, geometry-check 12098, react-check 4456)) · verifier: none · base: none
- Changed: shared positioner, dismiss layer, focus scope and top layer in dom/floating.ts; ui-select and React Select moved onto it with no visual change
- Commits: none

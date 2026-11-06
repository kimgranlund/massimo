---
id: T-0031
title: "Parity W0 · Docs site"
type: feature        # feature | bug | chore | spike | idea
status: claimed     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L3             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P1         # P1 | P2 | P3
depends: []
created: 2026-11-06
claimed_by: claude 2026-11-06
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
budget_usd: 60
---

## Goal
Maison UI parity, wave 0: Docs site is in place.

## Intent
- Do: Add apps/docs, separate from Studio, deployed to /massimo/docs/ by the Pages workflow. One generated page per component from its manifest and examples file: live examples, API tables, usage guidance, use-instead links, web component and React code. Theme select across the 46 reference brands. A check fails when a component has no page.
- Non-goals: porting Maison source; a new visual language; changes to existing components' APIs unless this ticket says so; shared infrastructure beyond what this ticket names.
- Done when: the site builds from the existing 42 examples files with no hand-written component page, every kit component has a page, the coverage check bites, Studio's jig is unchanged, and `npm run lighthouse` and `check:browsers` cover the new app.

## Context
- Kit pattern: docs/specs/components.md, docs/specs/authoring.md, docs/guides/change-a-component.md.
- Geometry acceptance: docs/guides/geometry-review.md; families in packages/ui-kit/contracts/geometry-families.json.

## Constraints
Zero native form elements in web components; every length from the geometry system; colours from Spectrum roles; motion via intent tokens; icons through the pinned Phosphor runtime; no runtime stylesheets.

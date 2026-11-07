---
id: T-0074
title: "A separate patterns package for the specialist components"
type: feature        # feature | bug | chore | spike | idea
status: proposed     # proposed | ready | claimed | paused | blocked | done | dropped (build progress lives in /board)
size: L2             # L1 | L2 | L3 | L4 (L5 reserved)
priority: P2         # P1 | P2 | P3
depends: []          # T-NNNN, file:<path>, cap:<name>; e.g. [T-0002]
created: 2026-11-06
router: .sdlc/tickets/AGENTS.md  # how to claim and close this ticket
---

## Goal
Create a separate patterns package for image-lightbox, interactive-canvas, inspector, rich-text, video, audio-player, barcode, map-preview, composer, response-actions and trace (the T-0064 decision), so heavy dependencies stay out of the core kit.

## Intent
- Do:
- Non-goals:
- Done when:
- If Do needs more steps than this level allows (L1-L2 3, L3 6, L4 10, L5 15), file two tickets.

## Context
Decisions made, paths, links. Everything a clean-context agent needs; it sees nothing else.

## Constraints
What must not change. "None" if none.

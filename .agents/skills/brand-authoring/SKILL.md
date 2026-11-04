---
name: brand-authoring
description: Capture a brand for the massimo ui-kit from a brief, a reference site or a design, frame first (subject, grounding, visual territories, creative muse), then hydrate it into a theme and review it in the jig. Use when asked to brand a project, create a theme from a brief, or turn a design into the kit's tokens.
---

# Brand authoring

Follow [docs/guides/author-a-brand.md](../../../docs/guides/author-a-brand.md) step by step; the rules are in [docs/specs/theming.md#brand](../../../docs/specs/theming.md#brand).

- The output is `brand.json` (schema `packages/ui-kit/contracts/brand.schema.json`), not hand-set parameters. Hydrate makes the theme.
- Capture the frame before any closed choice, and tie every choice to the frame with a `rationale` line.
- Ask the person about what the brief leaves open, in one round: the source of visual character, the grounding's relation, and the anchors. Never invent a brand color or a source.
- Validate, lint and hydrate with `npm run brand -- <validate|lint|hydrate> <file>` from `packages/ui-kit`. Revise any choice the lint calls generic, out of bounds or untraced, starting from the step it came from.
- Render it: Load the brand in the jig (`npm run studio`) and check the Brand page, Home and Components in light and dark.
- The worked brands and their briefs (`packages/ui-kit/tokens/brand/examples/`) are the reference for depth and tone.

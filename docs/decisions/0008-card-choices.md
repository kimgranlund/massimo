---
status: accepted
date: 2026-11-03
---

# 0008. Card choices are a variant of the choice groups

**Context.** Pricing and plan pickers need whole cards as the choice.

**Decision.** radio-group and checkbox-group take variant="card": each choice is a card-md surface holding any content, checked with a primary stroke and fill.

**Alternatives.** A new ui-card-group; a selectable ui-card.

**Consequences.** Keyboard, ARIA and the form value come from the groups; content inside a radio is presentational to assistive technology.

# 0018. A card's children supply its padding

Status: accepted (2026-11-05)

## Context

Decision 0017 made padding the input to a card's geometry, and the card padded its own box. To align a list's text with the card's title, the kit added a separate text edge, first as selectors on text in a card, then as an inherited inset on `ui-row`. Both needed a second number beside the card's padding, and neither let a child box sit partway out.

## Decision

A card holds an inset p and has no padding of its own. Its content sits in `ui-section`, the same pattern as a control's slots. A section of size c sits p − c in from the card's edge and pads c, so its text lands on p for any c. A bare child is full-bleed, and the card clips to its corners.

Areas and painted wrappers keep their padding: they hold cards and controls, not text.

`divided` moves to `ui-section`, since its rows need the section's size.

A card is block flow, and sections are spaced by collapsing margins. Padding equals gap, so one margin gives the inset and the space between sections. A section can use either: `ui-section header` is padded, so the next section keeps its margin, and `header="collapse"` spends its lower half as a margin, so the next section's top stays put.

## Consequences

- Text alignment needs no second number: every section's text lands on the card's p.
- Full-bleed media needs no option.
- A card's `gap` applies inside its unsized sections (a sized section's gap is its size), and `layout` has no effect on a card.
- Every card must wrap its content. A card that doesn't sits edge to edge, which is visible at once.
- A card clips with `overflow: clip`. Floating popups are fixed, so they aren't clipped.

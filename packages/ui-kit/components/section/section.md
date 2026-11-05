# Section

`ui-section` (React `Section`): a card's child. A card holds an inset and has no padding of its own, so its content sits in sections, the way a control's content sits in slots. API, defaults and avoidance guidance: [section.manifest.json](section.manifest.json).

## Intent

The card's `padding` p is where text starts. A section supplies it.

- No `size`: the section pads all of p.
- `size="md"`: the section pads c = md and sits p − c in from the card's edge, so its text still lands on p. Its box is what moves, which is how a list or a tinted panel sits inside a card with its text level with the card's title.
- A child that isn't a section is full-bleed: an image goes edge to edge, clipped to the card's corners.

| Card `padding` | Section `size` | Box starts at | Text starts at |
|---|---|---|---|
| `xl` (8u) | none | 0 | 8u |
| `xl` (8u) | `md` (4u) | 4u | 8u |
| `xl` (8u) | `sm` (3u) | 5u | 8u |

`size` larger than the card's inset stops at the edge.

## Usage

```html
<ui-container preset="card" padding="lg" radius="1.65">
  <ui-image src="…" alt="…"></ui-image>
  <ui-section header><strong>Options</strong></ui-section>
  <ui-section size="sm" divided>
    <ui-row>Option 1</ui-row>
    <ui-row>Option 2</ui-row>
  </ui-section>
</ui-container>
```

- `divided` makes every child a full-bleed row with lines between them, 3u above and below (× density). With a `size` the list is outlined; its rows pad `size`, so their text meets the card's title. At the card's own size the rows run edge to edge.
- `header` makes the section a title row: a divided row's height, laid out in a line. Padded, it has no margin, so the next section keeps its own and moves out as its size drops. With `header="collapse"` the lower half is a margin that collapses with the next section's, so that section's top stays put at every size.
- Sections are spaced by collapsing margins: p above the first, p below the last and p between two, or p − c for a sized one. The margins collapse through plain wrappers, so they stay right wherever a section sits. Inside, a sized section's gap is its size, and an unsized one takes the card's `gap`.
- A title can sit above sized panels two ways, both 2p + its height tall. At the panels' `size` it is transparent and its margin collapses with theirs. At the card's own size it is flush, so it can be painted, and the panels keep their margin of p − c below it.
- A section works through plain wrappers. In an area or a painted wrapper, which pad themselves, it adds nothing.

## Geometry and appearance

Radius is concentric with the card, max(R − (p − c), kR), and 0 when the section is flush with it, since the card's corners clip it. No fill of its own: add one for a tinted box. Numbers: `resolveSection`.

## Renderers and verification

The web tag has no script. React `Section` renders `<div data-ui="section">` with the same rules.

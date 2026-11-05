# Row

`ui-row` (React `Row`): a composed row of text and actions. API, defaults and avoidance guidance: [row.manifest.json](row.manifest.json).

## Intent

A row declares that its content is composed, so its text starts on the text edge, in line with field labels and control text. Text outside a row stays on its container's padding edge.

- `ui-row` lays out its children in a line, spaced apart and centered.
- `header` marks a title row. It gets the height of a divided row, so a title above a list reads as part of it.

## Inset

The row reads its inset from the container that holds it, by inheritance, so wrappers in between change nothing:

| Container | Row inset |
|---|---|
| `card`, except `padding="xs"` | the text edge |
| `divided`, or a group or collection with `padding` or a `surface` | the text edge |
| an unpainted group, collection or plain element | its parent's |
| `card padding="xs"`, `panel`, `region`, `page` | none |

Inside a `divided` list a row also takes the list's block padding. Any child of a `divided` list is already a row, so `ui-row` is only needed there for its line layout.

## Usage

```html
<ui-container preset="card">
  <ui-row header><strong>Notifications</strong><ui-button variant="ghost">Edit</ui-button></ui-row>
  <ui-container preset="collection" divided>
    <ui-row><span>Comments</span><ui-switch label="Comments"></ui-switch></ui-row>
    <ui-row><span>Mentions</span><ui-switch label="Mentions"></ui-switch></ui-row>
  </ui-container>
</ui-container>
```

## Geometry and appearance

No fill or border of its own. The inset is the text edge, the control inset + 2u (`resolveField` textEdge); block padding is 3u × the density factor (`resolveDividedRow`).

## Renderers and verification

The web tag has no script. React `Row` renders `<div data-ui="row">` with the same rules.

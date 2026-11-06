# Textarea

`ui-textarea` (React `Textarea`): multiline plain text. API, defaults and avoidance guidance: [textarea.manifest.json](textarea.manifest.json).

## Intent

Take text that runs past one line, such as a note or a description. For one line, use [`ui-input`](../input/input.md). It edits plain text, not rich text.

## Usage

```html
<ui-textarea label="Notes" name="notes" placeholder="Add a note" description="Only your team can see this."></ui-textarea>
<ui-textarea label="Summary" rows="6" required></ui-textarea>
```

```tsx
<Textarea label="Notes" rows={6} onValueChange={setNotes} />
```

- It has the same anatomy, validation and form behavior as `ui-input`. Enter adds a line and pastes keep theirs, so Enter never submits the form.
- `rows` is the height to hold before the text grows the field, 3 by default. The field grows with its text and doesn't scroll on its own.
- `pattern` applies to the whole value, line breaks included.

## Geometry and appearance

One row is an input's height, and each further row adds one text line (`resolveTextarea`). Labels, help and errors sit on the same text edge as an input's.

## Renderers and verification

The web tag uses a contenteditable editor and no native form element. React renders a native `textarea`. `apps/studio/geometry-check.html` compares the height with the resolver, `react-check.html` compares the twins, and `check:browsers` types and pastes multiple lines in each engine.

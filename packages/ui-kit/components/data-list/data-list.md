# Data list

`ui-data-list` (React `DataList`): labelled records with wrapping values. API, defaults and avoidance guidance: [data-list.manifest.json](data-list.manifest.json).

## Intent

Show facts about one thing, such as an order or an account, as label and value pairs. For many records with the same columns, use a table.

## Usage

```html
<ui-data-list divided>
  <dl>
    <div><dt>Plan</dt><dd>Pro</dd></div>
    <div><dt>Renews</dt><dd>March 3, 2027</dd></div>
    <div><dt>Owner</dt><dd><a href="/members/ada">Ada Lindqvist</a></dd></div>
  </dl>
</ui-data-list>
```

```tsx
<DataList divided>
  <DataList.Item label="Plan">Pro</DataList.Item>
  <DataList.Item label="Renews">March 3, 2027</DataList.Item>
</DataList>
```

- The native `dl` carries the meaning, so write it inside the web tag with a `div` per record.
- `divided` rules the rows, and `layout="stacked"` puts each label above its value.
- Values wrap rather than overflow, and can hold links and controls.

## Geometry and appearance

Rows own their gutters, so the list has no gap: each row has 1.5u above and below (× density), and the label column is 30u (`resolveDataList`). Labels use the label role and values body text.

## Renderers and verification

The web tag has no script. React renders `<div data-ui="data-list">` around a `dl` with the same rules.

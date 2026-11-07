# Search trigger

`ui-search-trigger` (React `SearchTrigger`): a button drawn like a search field that opens a command bar. API, defaults and avoidance guidance: [search-trigger.manifest.json](search-trigger.manifest.json).

## Usage

```html
<ui-search-trigger for="commands" label="Search"></ui-search-trigger>
<ui-command-bar id="commands"></ui-command-bar>
```

`shortcut` shows a key hint, and doesn't listen for it: the app owns global shortcuts.

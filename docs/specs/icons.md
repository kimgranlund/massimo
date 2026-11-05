# Icons

`import '@massimo/ui-kit/icons'` starts a runtime that fills every `<i name="…">` with an SVG, including icons added later. This spec covers set selection, loading, safety and sizes; slot sizes come from [geometry](geometry.md), the set from the theme's `icons` value ([theming](theming.md)).

- **Which set:** `data-icons` on the icon itself; else, for **system glyphs**, Phosphor; else the nearest ancestor `data-icons`, the active theme's `icons` value, or the default `phosphor`.
- **System glyphs** always render from Phosphor on the CDN, whatever the theme's set: plus, minus, x, check, check-bold and minus-bold (checkbox marks), caret-up/down/left/right, arrow-up/down/left/right, dots-three, dots-three-vertical, magnifying-glass.
- **Built-in sets** load on demand from jsDelivr at pinned versions: `phosphor` (@phosphor-icons/core 2.1.1), `lucide` (lucide-static 1.57.0), `tabler` (@tabler/icons 3.49.0). Names are Phosphor's; Lucide and Tabler map common names through aliases (`icons/sets.ts`).
- **Bundled sets:** `registerIconSet(name, moduleSet(import.meta.glob(…, { query: '?raw', import: 'default' })))`.
- **Safety:** fetched SVG is sanitized (drawing elements and presentation attributes only; no scripts, handlers, external references, `<use>`, `<image>`, `<foreignObject>`).
- **Accessibility:** decorative (`aria-hidden`) unless the `<i>` has `aria-label`; missing icons get `data-icon-missing`.
- **Sizes:** outside a component, the icon formula against the surrounding font, 1em + k·u (k from `icon-size` on the icon or an ancestor, `md` = 0.5 by default: 16.75px beside 14.5px text at u = 4.5); in slots `sm` / `md` / `lg` / `xl` / `fill` from the geometry ([geometry](geometry.md)); carets, the select chevron and the `x` close icon (chip remove, dismiss) are always `sm`.
- **Weights:** with the Phosphor set, a name ending in `-bold` or `-fill` loads that weight (`check-bold`, `heart-fill`).

# Icons

`import '@massimo/ui-kit/icons'` starts a runtime that fills every `<i name="…">` with an SVG, including icons added later.

- **Which set:** `data-icons` on the icon itself; else, for **system glyphs**, Phosphor; else the nearest ancestor `data-icons`, the active theme's `icons` value, or the default `phosphor`.
- **System glyphs** always render from Phosphor on the CDN, whatever the theme's set: plus, minus, x, check, caret-up/down/left/right, arrow-up/down/left/right, dots-three, dots-three-vertical, magnifying-glass.
- **Built-in sets** load on demand from jsDelivr at pinned versions: `phosphor` (@phosphor-icons/core 2.1.1), `lucide` (lucide-static 1.57.0), `tabler` (@tabler/icons 3.49.0). Names are Phosphor's; Lucide and Tabler map 30 common names through aliases.
- **Bundled sets:** `registerIconSet(name, moduleSet(import.meta.glob(…, { query: '?raw', import: 'default' })))`.
- **Safety:** fetched SVG is sanitized (drawing elements and presentation attributes only; no scripts, handlers, external references, `<use>`, `<image>`, `<foreignObject>`).
- **Accessibility:** decorative (`aria-hidden`) unless the `<i>` has `aria-label`; missing icons get `data-icon-missing`.
- **Sizes:** 1em by default; in slots `sm` / `md` / `lg` / `fill` from the geometry ([geometry](geometry.md)); carets, the select chevron and the `x` close icon (chip remove, dismiss) are always `sm`.

# Brand expression references

Use this directory to document how a brand looks, speaks and behaves across its materials. Start with the [brand expression rubric](brand-expression-rubric.md) for the six fields and controlled language rules. Use [Halfkey’s Colour manifest](Halfkey/manifests/d07.json) and [its slide image](Halfkey/manifests/d07.png) to calibrate the level of detail.

## 1. Inventory the source material

- Keep original files in the brand’s folder. Inspect the complete set to establish its order, then inspect each slide at the clearest available resolution. For a deck or PDF, render the individual pages. For a contact sheet, identify the artwork boundaries before cropping.
- Count distinct slides. When an overview and an enlargement show the same page, assign one ID and use the clearer source. Give a sequence its own entry when its arrangement teaches something. Give separately presented panels their own IDs and link them from the sequence manifest’s optional `panels` list. See [Halfkey’s App Store sequence](Halfkey/manifests/d15.json).
- Preserve printed titles and page order. If a slide has no title, use a short descriptive label. Assign stable IDs within each series and keep existing IDs when adding material. Record gaps or illegible details in the collection index.

## 2. Read each slide

Write in the rubric’s field order. Inspect the image while writing each entry.

| Manifest field | Question to answer |
| --- | --- |
| `slide_intent` | What judgment does the slide teach, and why does it matter to what a person can notice, feel, understand or remember? |
| `strategic_value` | What can this particular brand gain from that choice? Ground the interpretation in a visible detail. |
| `demonstration` | What does the slide actually pair, compare, construct or sequence? Preserve units and scope. Distinguish a headline’s promise from what its example shows. |
| `category` | Under which single category would a reader search for this lesson? Use the rubric’s vocabulary, including Color for a slide titled Colour. |
| `practical_value` | What decision can another designer make using this example? |
| `content_islands` | Which groups carry distinct jobs? In reading order, give each a concrete `name` and a `spec` describing placement, contents and its relationship to nearby groups. Keep a caption with its specimen. |

Use present tense for observations and *can* for inferred benefits. To identify an island’s contribution, ask what the reader would lose if it were removed. For example, removing Halfkey’s usage strip leaves the swatches intact but takes away the guidance about proportion.

## 3. Document and verify

1. Under `<brand>/manifests/`, save a JSON manifest and a PNG of the complete artwork with the same lowercase basename. Crop raster sources at native resolution. Exclude contact-sheet gutters and external labels while retaining slide headers, captions and margins.
2. Begin the JSON with `id`, `title`, `image`, `source` and `location`, followed by the six rubric fields. Resolve file paths relative to the manifest. For a contact sheet, record one-based `row` and `column` from the upper left. For a deck or PDF, record its one-based `page`. For a standalone image, identify the whole source as the location.
3. List every pair in `<brand>/manifests/README.md` in source order with its title and category. Explain multiple series, repeated views and any limits on what could be inspected. Link the collection from this entry file. When a gallery is present or requested, use the collection’s actual slide IDs and read the specs from the manifests. The [Halfkey gallery](Halfkey/index.html) is a working example.
4. Reconcile the inventory with the index. Parse every JSON, resolve its source, image and panel links, and compare each crop with the original slide. Check that the six fields are populated and the island instructions describe the visible composition.

## 4. Make galleries portable

- Place `index.html` inside the brand folder. Opening it directly from disk must show the complete gallery with working filters. Deliver all files needed to browse it.
- Use document-relative paths for every link and asset, including links built by JavaScript. Keep images, manifests, scripts, styles and fonts inside the brand folder so the whole folder can be moved or renamed.
- Package manifest data for direct opening. One option is to generate a classic JavaScript data file from the canonical JSON and load it with a relative script tag. Document how to refresh that file when a manifest changes. Browsers may block local JSON fetches and module imports under `file://`.
- For a small collection, run `python3 build-gallery.py <brand-folder> "<display name>"` from this directory to render its standalone HTML from the manifests. Rerun after changing them. The optional `motion` field points to a local clip relative to the manifest.
- Verify from disk. Copy the folder to a different location, open its `index.html` with networking disabled, select each category, and check slide images, specs and links.

## Collections

Register each new gallery in the [browsable collection index](index.html). Add a collection card with the brand name, a brief description, a relative link to the brand’s index.html and a preview image from that collection. Open the collection index from disk and follow the card to verify the gallery loads.

- [Halfkey](Halfkey/manifests/README.md) · Brand book and App Store panels.
- [NASA vehicle identification](NASA/manifests/README.md) · Color, lettering and placement across a fleet.
- [NN North Sea Jazz Festival](North-Sea-Jazz/manifests/README.md) · Rhythm across posters, motion and print.
- [Mozilla Protocol](Mozilla-Protocol/manifests/README.md) · Typography and navigation across two brand themes.

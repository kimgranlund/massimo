# Brand expression references

Use this directory to document how a brand looks, speaks and behaves across its materials. Start with the [brand expression rubric](brand-expression-rubric.md) for the six fields and controlled language rules. Use [Halfkey’s Colour manifest](Halfkey/manifests/d07.json) and [its slide image](Halfkey/manifests/d07.png) to calibrate the level of detail.

## 1. Inventory the source material

- Keep original files in the brand’s folder. Inspect the complete set to establish its order, then inspect each slide at the clearest available resolution. For a deck or PDF, render the individual pages. For a contact sheet, identify the artwork boundaries before cropping.
- Count distinct slides. When an overview and an enlargement show the same page, assign one ID and use the clearer source. Give a sequence its own entry when its arrangement teaches something. Give separately presented panels their own IDs and link them from the sequence manifest’s optional `panels` list. See [Halfkey’s App Store sequence](Halfkey/manifests/d15.json).
- For a complete book or deck, ingest every physical page in source order, including covers, separators, credits, unnumbered pages and blank leaves. Give each a PNG and a page-specific manifest. Record blank or unfinished content accurately. Keep the one-based PDF page as the locator even when the printed folio differs. An independent case study or an excerpt belongs in the source leads until the complete deck is available or the user requests a different scope.
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

When a slide teaches a reusable choice for one brand element, add the optional `ingredient` record with `name`, `role`, `application` and `scope` as defined in the [rubric](brand-expression-rubric.md#optional-ingredient-record).

For each newly analyzed slide, add `reference_purposes` using the [purpose definitions](brand-expression-rubric.md#reference-purpose). Map each supported purpose (Intent, Expression, Application, Constraint) to its source evidence. Multiple purposes may apply. Do not tag Intent merely because our analysis includes a `slide_intent`. Preserve the difference between a source requirement and an observed example. Existing entries without this object remain Not reviewed; an empty object records a reviewed slide with no supported purpose. Regenerate the collection gallery and cross-brand catalog after a review.

Use present tense for observations and *can* for inferred benefits. To identify an island’s contribution, ask what the reader would lose if it were removed. For example, removing Halfkey’s usage strip leaves the swatches intact but takes away the guidance about proportion.

## 3. Document and verify

1. Under `<brand>/manifests/`, save a JSON manifest and a PNG of the complete artwork with the same lowercase basename. Crop raster sources at native resolution. Exclude contact-sheet gutters and external labels while retaining slide headers, captions and margins.
2. Begin the JSON with `id`, `title`, `image`, `source` and `location`, followed by the six rubric fields. Resolve file paths relative to the manifest. For a contact sheet, record one-based `row` and `column` from the upper left. For a deck or PDF, record its one-based `page`. For a standalone image, identify the whole source as the location. When a collection combines several sources or interleaves section introductions and examples, assign a numeric `location.order` to every entry in the intended overall reading order. Both gallery generators prioritize this value; keep physical PDF page numbers unchanged.
3. List every pair in `<brand>/manifests/README.md` in source order with its title and category. Explain multiple series, repeated views and any limits on what could be inspected. Link the collection from this entry file. When a gallery is present or requested, use the collection’s actual slide IDs and read the specs from the manifests. The [Halfkey gallery](Halfkey/index.html) is a working example.
4. Reconcile the inventory with the index. Parse every JSON, resolve its source, image and panel links, and compare each crop with the original slide. Check that the six fields are populated and the island instructions describe the visible composition.

## 4. Make galleries portable

- Place `index.html` inside the brand folder. Opening it directly from disk must show the complete gallery with working filters. Deliver all files needed to browse it.
- Use document-relative paths for every link and asset, including links built by JavaScript. Keep images, manifests, scripts, styles and fonts inside the brand folder so the whole folder can be moved or renamed.
- Package manifest data for direct opening. One option is to generate a classic JavaScript data file from the canonical JSON and load it with a relative script tag. Document how to refresh that file when a manifest changes. Browsers may block local JSON fetches and module imports under `file://`.
- Use local video files with native controls, a poster image and `preload="none"`. Load clips when playback begins; metadata preloading can stall initial local playback in Firefox. Verify natural playback without forcing `load()` or resetting the source in the test.
- For a small collection, run `python3 build-gallery.py <brand-folder> "<display name>"` from this directory to render its standalone HTML from the manifests. Rerun after changing them. The optional `motion` field points to a local clip relative to the manifest.
- Verify from disk. Copy the folder to a different location, open its `index.html` with networking disabled, select each category, and check slide images, specs and links.

## Collections

Keep requested but uncollected books in the [download wishlist](index.html#download-wishlist). Register each new gallery in the [browsable collection index](index.html). Add a collection card with the brand name, a brief description, a relative link to the brand’s index.html and a preview image from that collection. After adding a collection or editing any manifest, run `python3 build-category-index.py` here to refresh the offline cross-brand catalog. Each slide title in the category view links to its collection gallery using the manifest ID as its fragment. Open the collection index from disk and verify the collection card, category thumbnail and slide link.

- [Halfkey](Halfkey/manifests/README.md) · Brand book and App Store panels.
- [NASA Graphics Standards Manual](NASA/manifests/README.md) · Complete January 1976 manual.
- [NN North Sea Jazz Festival](North-Sea-Jazz/manifests/README.md) · Rhythm across posters, motion and print.
- [Mozilla Protocol](Mozilla-Protocol/manifests/README.md) · Typography and navigation across two brand themes.
- [Bolt](Bolt/manifests/README.md) · Color, hierarchy and word emphasis across checkout communications.
- [Sheffield Museums](Sheffield-Museums/manifests/README.md) · Exhibition color, guest typefaces and gallery signage.
- [Voltera](Voltera/manifests/README.md) · Circuit-pad geometry, printer photography and product voice.
- [MIT CSAIL](MIT-CSAIL/manifests/README.md) · Architecture, geometric patterns and event graphics.
- [Special Olympics](Special-Olympics/manifests/README.md) · Brand platform, visual identity and program applications.
- [Frontline AIDS](Frontline-AIDS/manifests/README.md) · Campaign identity, illustration, photography and writing.
- [Slack](Slack/manifests/README.md) · Voice, visual identity and video treatments.
- [Instacart](Instacart/manifests/README.md) · Shop + Savor, brand elements and applications.
- [Spectrum](Spectrum/manifests/README.md) · Complete 2017 retail guide and Life Unlimited brand evolution case study.
- [Cox Communications](Cox/manifests/README.md) · Retail case study, with the unavailable identity source documented as a gap.
- [T-Mobile](T-Mobile/manifests/README.md) · Complete Un-carrier brand guidelines.
- [Xfinity](Xfinity/manifests/README.md) · venturethree brand-purpose case study.
- [O2](O2/manifests/README.md) · Neil Cooper’s 2023 refresh case study.
- [Swisscom](Swisscom/manifests/README.md) · Historical Moving Brands identity case study.
- [Verizon](Verizon/manifests/README.md) · Jessie W. Lee’s master brand and digital design case study.
- [Instagram](Instagram/manifests/README.md) · Elvis Dinh’s 2022 identity case study.
- [Google](Google/manifests/README.md) · 2015 identity evolution and complete Product Sans specimen.
- [Mastercard](Mastercard/manifests/README.md) · Pentagram’s identity evolution and applications.
- [Spotify](Spotify/manifests/README.md) · COLLINS’ identity case study.
- [MIT Media Lab](MIT-Media-Lab/manifests/README.md) · Pentagram’s geometric identity and wayfinding system.
- [Uber](Uber/manifests/README.md) · Complete October 2018 partner and sponsor quick guide.
- [ITV / ITVX](ITV/manifests/README.md) · DixonBaxi’s broadcast and streaming identity case study.
- [IBM](IBM/manifests/README.md) · Design Language guidelines, alternate states and two complete logo guides.
- [Duolingo](Duolingo/manifests/README.md) · Recovered official guidelines and Johnson Banks case study · Voice, character and illustration.
- [Burger King](Burger-King/manifests/README.md) · Complete 129-page partner guide and JKR identity case study.
- [San Francisco Symphony](San-Francisco-Symphony/manifests/README.md) · COLLINS identity case study · Expressive typography and motion.
- [Helsinki](Helsinki/manifests/README.md) · Official visual guidelines, heraldry, font specimen and complete illustration deck.
- [Dropbox](Dropbox/manifests/README.md) · COLLINS identity case study · Color combinations, typography and collaboration.
- [Mailchimp](Mailchimp/manifests/README.md) · COLLINS identity and guideline excerpts · Voice, color and illustration.
- [Wise](Wise/manifests/README.md) · Ragged Edge identity · Typography, global expression and motion.
- [Whitney Museum](Whitney/manifests/README.md) · Responsive W · Identity process and launch applications.
- [Natural History Museum](Natural-History-Museum/manifests/README.md) · Pentagram and Nomad identity · Symbol, color and motion.
- [MoMA](MoMA/manifests/README.md) · 2009 institutional identity · Artwork, layout and environmental applications.
- [The Public Theater](Public-Theater/manifests/README.md) · Historical identity and campaigns · Typography and environmental applications.
- [Twitch](Twitch/manifests/README.md) · COLLINS identity case study · Creator expression, color and motion.
- [Channel 4](Channel-4/manifests/README.md) · 2023 masterbrand · Cube worlds, typography and motion.
- [Sweetgreen](Sweetgreen/manifests/README.md) · COLLINS identity · Food-derived geometry and applied illustration.
- [Figma](Figma/manifests/README.md) · Nothing Great Is Made Alone · Collaboration expressed through product cues.
- [Deutsche Bahn](Deutsche-Bahn/manifests/README.md) · Official new-design guidelines · Sections, alternate states and motion demonstrations.
- [Lufthansa](Lufthansa/manifests/README.md) · 2018 airline identity · Crane geometry, typography and applications.
- [Audi](Audi/manifests/README.md) · Historical KMS TEAM identity · Flexible principles across media.
- [Nike Sportswear](Nike-Sportswear/manifests/README.md) · Holiday 2019 Sportswear and Run · Campaign layouts and retail applications.

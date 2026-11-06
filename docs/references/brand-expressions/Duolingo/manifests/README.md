# Duolingo reference manifest index

This collection preserves two distinct sources: the complete recovered historical web guideline application and Johnson Banks’ complete 2019 identity case study. These are original web materials, not a claimed downloadable master brand book.

## Source scope and provenance

- **DW001–DW144:** Every default header/content section across the recovered application’s 18 routes: home, five identity pages, six writing pages, three illustration pages, marketing assets, resources and help. The home is one complete page; the other routes contain 17 introduction headers and 126 content sections. Repeated source headings remain separate when their subject changes.
- **DV01–DV10:** Every non-default fixed color presentation available through the six radio-control groups on Logos, Typography and Brand family. These supplement the default states and appear beside their related sections in the gallery. Editable specimen text retains its original sample; arbitrary user-entered text and responsive viewport permutations are not additional authored reference material.
- **DJ01–DJ21:** All 21 distinct artworks in Johnson Banks’ 2019 case study, in source order. DJ20 retains the original 86-frame GIF and a complete 4.8-second local MP4 playback copy. DJ10 is the whole nine-page guideline overview as published; its tiny page text is not treated as legible specification.

Retrieved **2026-11-05**. The live [guideline address](https://design.duolingo.com/) and its former subpages now redirect to Duolingo’s design blog hub. Search-engine snippets still expose older text; they are not used to reconstruct missing artwork.

The original application HTML was recovered from [the January 23, 2025 capture](https://web.archive.org/web/20250123183609id_/https://design.duolingo.com/identity/typography). Its archived original Last-Modified header is December 9, 2024. Asset retrieval was anchored to December 10, 2024; the saved [retrieval inventory](../sources/archive/retrieval.json) records requested archival URLs and returned capture URLs where retained. The content-hashed original JavaScript, CSS and all 331 referenced hashed image/font assets are preserved under `sources/archive/`. This dates the recovered source, not every statement within it: legacy Duolingo Plus and iOS 11 guidance are historical.

The [Johnson Banks source](https://www.johnsonbanks.co.uk/work/duolingo) identifies the project year as 2019. Its [original case-study body](../sources/johnson-banks/case-study.html) and [media inventory](../sources/johnson-banks/inventory.json) retain the source prose, order, filenames and original media URLs.

## Capture and interpretation

The archived original application was rendered with its own recovered JavaScript, CSS, SVGs and fonts in Chromium at **1440 CSS pixels and 2× device scale**. Full-page PNGs preserve source context. Each DW/DV image is an exact pixel crop from its corresponding full-page PNG; [crop coordinates](../sources/capture-crops.json) make that relationship checkable. These are faithful webpage-section captures, not newly designed expression boards.

Only the source’s offscreen “All good.” transient notification was hidden for capture. Otherwise, extending a screenshot beyond the viewport could reveal that normally hidden overlay across the reference. After selecting a color state, capture waits for the source’s scroll and repaint to settle so offscreen annotations remain visible. No content or layout rule was rewritten. Gzip-encoded archive transport bodies were decoded before rendering; all nine source fonts were loaded and checked. The capture metadata retains source routes, section locators and the historical rendering context.

The static screenshots preserve the complete visible sections. Controls and links depicted inside images are source evidence, not live controls in this gallery. The gallery itself embeds its specs and uses local relative links; opening or moving its `index.html` requires no server. Original archived application files are retained for provenance, not presented as a separately deployed live site.

## Source limitations retained

- DW027’s last type specimen clips its final line inside the source’s fixed-height SVG `foreignObject`. The DOM contains additional text, but the manifest distinguishes what is visible. The original geometry is retained.
- DW142–DW144 are unfinished Help material containing lorem ipsum and unanswered questions. The source application contains this route even though its main Help link points to the external contact page. It is retained for source completeness, not promoted into guidance.
- Emoji are the original Unicode characters rendered by the capture environment, not proprietary Duolingo illustrations. DW141’s iOS 11 and audience-share claims are historical source statements.
- The archived writing and illustration rules may differ from later product or marketing behavior. Source rules, examples and analyst interpretations are kept separate.
- No guideline PDF was recovered or substituted. No missing diagrams were recreated from snippets or third-party summaries.

## Regeneration

From the parent `brand-expressions` folder:

```sh
python3 build-gallery.py Duolingo "Duolingo" "Complete archived web guidelines and the 2019 Johnson Banks identity case study. Historical scope and source limitations are documented in the manifest index."
```

The canonical JSON pairs below drive the gallery. `location.order` keeps alternate states beside their default reference, followed by the separate 2019 case-study series. Original source locators are also retained.

## Complete reference inventory

| ID | Reference | Category | Image |
| --- | --- | --- | --- |
| DW001 | [Guidelines / Hola](dw001.json) | Brand | [PNG](dw001.png) |
| DW002 | [Identity / Logos introduction](dw002.json) | Brand | [PNG](dw002.png) |
| DW003 | [Logos / Logotype](dw003.json) | Brand | [PNG](dw003.png) |
| DV01 | [Logotype / Gray variant](dv01.json) | Brand | [PNG](dv01.png) |
| DV02 | [Logotype / White variant](dv02.json) | Color | [PNG](dv02.png) |
| DW004 | [Logotype / Clear space](dw004.json) | Geometry | [PNG](dw004.png) |
| DW005 | [Logotype / Minimum sizes](dw005.json) | Geometry | [PNG](dw005.png) |
| DW006 | [Logotype / General positioning](dw006.json) | Layout | [PNG](dw006.png) |
| DW007 | [Logotype / Rotation](dw007.json) | Layout | [PNG](dw007.png) |
| DW008 | [Logotype / Please don’t](dw008.json) | Brand | [PNG](dw008.png) |
| DW009 | [Logos / Landscape lockup](dw009.json) | Brand | [PNG](dw009.png) |
| DW010 | [Landscape lockup / Clear space](dw010.json) | Geometry | [PNG](dw010.png) |
| DW011 | [Landscape lockup / Please don’t](dw011.json) | Geometry | [PNG](dw011.png) |
| DW012 | [Logos / Portrait lockup](dw012.json) | Brand | [PNG](dw012.png) |
| DW013 | [Portrait lockup / Clear space](dw013.json) | Geometry | [PNG](dw013.png) |
| DW014 | [Logos / Icon](dw014.json) | Brand | [PNG](dw014.png) |
| DW015 | [Icon / Avatars](dw015.json) | Geometry | [PNG](dw015.png) |
| DW016 | [Identity / Color introduction](dw016.json) | Color | [PNG](dw016.png) |
| DW017 | [Color / Core brand colors](dw017.json) | Color | [PNG](dw017.png) |
| DW018 | [Color / Secondary colors](dw018.json) | Color | [PNG](dw018.png) |
| DW019 | [Color / Neutrals](dw019.json) | Color | [PNG](dw019.png) |
| DW020 | [Color / Duo’s palette](dw020.json) | Color | [PNG](dw020.png) |
| DW021 | [Identity / Typography introduction](dw021.json) | Typography | [PNG](dw021.png) |
| DW022 | [Typography / Feather Bold specimen](dw022.json) | Typography | [PNG](dw022.png) |
| DV03 | [Typography / Feather Bold / White variant](dv03.json) | Typography | [PNG](dv03.png) |
| DW023 | [Feather Bold / Usage](dw023.json) | Typography | [PNG](dw023.png) |
| DW024 | [Typography / DIN Next Rounded specimen](dw024.json) | Typography | [PNG](dw024.png) |
| DV04 | [Typography / DIN Next Rounded / Gray variant](dv04.json) | Typography | [PNG](dv04.png) |
| DV05 | [Typography / DIN Next Rounded / White variant](dv05.json) | Typography | [PNG](dv05.png) |
| DW025 | [DIN Next Rounded / Usage](dw025.json) | Typography | [PNG](dw025.png) |
| DW026 | [Typography / Hierarchy with the logotype](dw026.json) | Typography | [PNG](dw026.png) |
| DW027 | [Typography / Combining typefaces](dw027.json) | Typography | [PNG](dw027.png) |
| DW028 | [Typography / Typesetting Duolingo](dw028.json) | Typography | [PNG](dw028.png) |
| DW029 | [Typography / Substitute font Nunito](dw029.json) | Typography | [PNG](dw029.png) |
| DV06 | [Typography / Nunito / Gray variant](dv06.json) | Typography | [PNG](dv06.png) |
| DV07 | [Typography / Nunito / White variant](dv07.json) | Typography | [PNG](dv07.png) |
| DW030 | [Typography / Please don’t](dw030.json) | Typography | [PNG](dw030.png) |
| DW031 | [Identity / Imagery introduction](dw031.json) | Imagery | [PNG](dw031.png) |
| DW032 | [Imagery / Illustration](dw032.json) | Imagery | [PNG](dw032.png) |
| DW033 | [Imagery / Duo’s personality](dw033.json) | Imagery | [PNG](dw033.png) |
| DW034 | [Imagery / Characters](dw034.json) | Imagery | [PNG](dw034.png) |
| DW035 | [Imagery / Communication](dw035.json) | Imagery | [PNG](dw035.png) |
| DW036 | [Imagery / Connection](dw036.json) | Imagery | [PNG](dw036.png) |
| DW037 | [Imagery / Photography](dw037.json) | Imagery | [PNG](dw037.png) |
| DW038 | [Photography / Portraits](dw038.json) | Imagery | [PNG](dw038.png) |
| DW039 | [Identity / Brand family introduction](dw039.json) | Brand | [PNG](dw039.png) |
| DW040 | [Brand family / Duolingo Plus](dw040.json) | Brand | [PNG](dw040.png) |
| DV08 | [Brand family / Duolingo Plus / White variant](dv08.json) | Brand | [PNG](dv08.png) |
| DW041 | [Duolingo Plus / Construction](dw041.json) | Geometry | [PNG](dw041.png) |
| DW042 | [Duolingo Plus / Clear space](dw042.json) | Geometry | [PNG](dw042.png) |
| DW043 | [Brand family / Sub-brands](dw043.json) | Brand | [PNG](dw043.png) |
| DV09 | [Brand family / Sub-brands / Gray variant](dv09.json) | Brand | [PNG](dv09.png) |
| DV10 | [Brand family / Sub-brands / White variant](dv10.json) | Color | [PNG](dv10.png) |
| DW044 | [Sub-brands / Construction](dw044.json) | Geometry | [PNG](dw044.png) |
| DW045 | [Sub-brands / Alternate layout](dw045.json) | Layout | [PNG](dw045.png) |
| DW046 | [Sub-brands / Examples](dw046.json) | Brand | [PNG](dw046.png) |
| DW047 | [Writing / Brand Narrative](dw047.json) | Voice | [PNG](dw047.png) |
| DW048 | [Writing / Brand Narrative / Principles](dw048.json) | Brand | [PNG](dw048.png) |
| DW049 | [Writing / Brand Narrative / The Duolingo difference](dw049.json) | Brand | [PNG](dw049.png) |
| DW050 | [Writing / Brand Narrative / Brand personality](dw050.json) | Brand | [PNG](dw050.png) |
| DW051 | [Writing / Brand Narrative / If Duolingo were a...](dw051.json) | Brand | [PNG](dw051.png) |
| DW052 | [Writing / Brand Narrative / Sample messaging](dw052.json) | Voice | [PNG](dw052.png) |
| DW053 | [Writing / Brand Narrative / Messages by audience](dw053.json) | Voice | [PNG](dw053.png) |
| DW054 | [Writing / Voice](dw054.json) | Voice | [PNG](dw054.png) |
| DW055 | [Writing / Voice / Voice qualities](dw055.json) | Voice | [PNG](dw055.png) |
| DW056 | [Writing / Voice / Expressive](dw056.json) | Voice | [PNG](dw056.png) |
| DW057 | [Writing / Voice / Playful](dw057.json) | Voice | [PNG](dw057.png) |
| DW058 | [Writing / Voice / Embracing](dw058.json) | Voice | [PNG](dw058.png) |
| DW059 | [Writing / Voice / Worldly](dw059.json) | Voice | [PNG](dw059.png) |
| DW060 | [Writing / Tone](dw060.json) | Voice | [PNG](dw060.png) |
| DW061 | [Writing / Tone / Content](dw061.json) | Voice | [PNG](dw061.png) |
| DW062 | [Writing / Tone / Context](dw062.json) | Voice | [PNG](dw062.png) |
| DW063 | [Writing / Duo](dw063.json) | Voice | [PNG](dw063.png) |
| DW064 | [Writing / Duo / Duo's voice and tone](dw064.json) | Voice | [PNG](dw064.png) |
| DW065 | [Writing / Duo / Duos and duon'ts](dw065.json) | Voice | [PNG](dw065.png) |
| DW066 | [Writing / Style](dw066.json) | Voice | [PNG](dw066.png) |
| DW067 | [Writing / Style / Numerals](dw067.json) | Voice | [PNG](dw067.png) |
| DW068 | [Writing / Style / Emoji](dw068.json) | Voice | [PNG](dw068.png) |
| DW069 | [Writing / Style / Punctuation](dw069.json) | Voice | [PNG](dw069.png) |
| DW070 | [Writing / Style / Periods](dw070.json) | Voice | [PNG](dw070.png) |
| DW071 | [Writing / Style / Dashes](dw071.json) | Voice | [PNG](dw071.png) |
| DW072 | [Writing / Style / Colons](dw072.json) | Voice | [PNG](dw072.png) |
| DW073 | [Writing / Style / Commas](dw073.json) | Voice | [PNG](dw073.png) |
| DW074 | [Writing / Style / Ellipses](dw074.json) | Voice | [PNG](dw074.png) |
| DW075 | [Writing / Style / Semicolons](dw075.json) | Voice | [PNG](dw075.png) |
| DW076 | [Writing / Style / Apostrophes](dw076.json) | Voice | [PNG](dw076.png) |
| DW077 | [Writing / Style / Quotes and quotation marks](dw077.json) | Voice | [PNG](dw077.png) |
| DW078 | [Writing / Style / Ampersands](dw078.json) | Voice | [PNG](dw078.png) |
| DW079 | [Writing / Style / Formatting](dw079.json) | Voice | [PNG](dw079.png) |
| DW080 | [Writing / Style / Capitalization](dw080.json) | Voice | [PNG](dw080.png) |
| DW081 | [Writing / Style / Lists](dw081.json) | Voice | [PNG](dw081.png) |
| DW082 | [Writing / Style / Bold](dw082.json) | Voice | [PNG](dw082.png) |
| DW083 | [Writing / Style / Italics](dw083.json) | Voice | [PNG](dw083.png) |
| DW084 | [Writing / Style / URLs and email addresses](dw084.json) | Voice | [PNG](dw084.png) |
| DW085 | [Writing / Style / Parts of speech](dw085.json) | Voice | [PNG](dw085.png) |
| DW086 | [Writing / Style / Contractions](dw086.json) | Voice | [PNG](dw086.png) |
| DW087 | [Writing / Style / Conjunctions](dw087.json) | Voice | [PNG](dw087.png) |
| DW088 | [Writing / Style / Prepositions](dw088.json) | Voice | [PNG](dw088.png) |
| DW089 | [Writing / Style / Etc.](dw089.json) | Voice | [PNG](dw089.png) |
| DW090 | [Writing / Style / Phone numbers](dw090.json) | Voice | [PNG](dw090.png) |
| DW091 | [Writing / Style / Money](dw091.json) | Voice | [PNG](dw091.png) |
| DW092 | [Writing / Style / Percentages](dw092.json) | Voice | [PNG](dw092.png) |
| DW093 | [Writing / Style / Time](dw093.json) | Voice | [PNG](dw093.png) |
| DW094 | [Writing / Style / Capitalization](dw094.json) | Voice | [PNG](dw094.png) |
| DW095 | [Writing / Style / Capitalize](dw095.json) | Voice | [PNG](dw095.png) |
| DW096 | [Writing / Style / Don't capitalize](dw096.json) | Voice | [PNG](dw096.png) |
| DW097 | [Writing / Glossary](dw097.json) | Voice | [PNG](dw097.png) |
| DW098 | [Writing / Glossary / Definitions](dw098.json) | Voice | [PNG](dw098.png) |
| DW099 | [Writing / Glossary / Words to use](dw099.json) | Voice | [PNG](dw099.png) |
| DW100 | [Writing / Glossary / Words to avoid](dw100.json) | Voice | [PNG](dw100.png) |
| DW101 | [Illustration / Shape language / Introduction](dw101.json) | Imagery | [PNG](dw101.png) |
| DW102 | [Illustration / Shape language / Construction](dw102.json) | Geometry | [PNG](dw102.png) |
| DW103 | [Illustration / Shape language / Rhythm](dw103.json) | Geometry | [PNG](dw103.png) |
| DW104 | [Illustration / Shape language / Simplicity](dw104.json) | Geometry | [PNG](dw104.png) |
| DW105 | [Illustration / Objects in space](dw105.json) | Geometry | [PNG](dw105.png) |
| DW106 | [Illustration / Shadows and shading](dw106.json) | Geometry | [PNG](dw106.png) |
| DW107 | [Illustration / Shape language / Color palette](dw107.json) | Color | [PNG](dw107.png) |
| DW108 | [Illustration / Assigning color](dw108.json) | Color | [PNG](dw108.png) |
| DW109 | [Illustration / Pastels versus gray](dw109.json) | Color | [PNG](dw109.png) |
| DW110 | [Illustration / Too much color](dw110.json) | Color | [PNG](dw110.png) |
| DW111 | [Illustration / Floating accents](dw111.json) | Geometry | [PNG](dw111.png) |
| DW112 | [Illustration / Duo / Introduction](dw112.json) | Imagery | [PNG](dw112.png) |
| DW113 | [Illustration / Duo / Perspective](dw113.json) | Geometry | [PNG](dw113.png) |
| DW114 | [Illustration / Duo / Joints](dw114.json) | Geometry | [PNG](dw114.png) |
| DW115 | [Illustration / Duo / Feet](dw115.json) | Motion | [PNG](dw115.png) |
| DW116 | [Illustration / Duo / Please don’t](dw116.json) | Imagery | [PNG](dw116.png) |
| DW117 | [Illustration / Characters / Introduction](dw117.json) | Imagery | [PNG](dw117.png) |
| DW118 | [Illustration / Characters / Body types](dw118.json) | Geometry | [PNG](dw118.png) |
| DW119 | [Illustration / Characters / Body types / Repetition](dw119.json) | Geometry | [PNG](dw119.png) |
| DW120 | [Illustration / Characters / Body types / Shoulders](dw120.json) | Geometry | [PNG](dw120.png) |
| DW121 | [Illustration / Characters / Eyes](dw121.json) | Imagery | [PNG](dw121.png) |
| DW122 | [Illustration / Characters / Eyes / Emotions](dw122.json) | Imagery | [PNG](dw122.png) |
| DW123 | [Illustration / Characters / Eye mistakes](dw123.json) | Geometry | [PNG](dw123.png) |
| DW124 | [Illustration / Characters / Noses](dw124.json) | Geometry | [PNG](dw124.png) |
| DW125 | [Illustration / Characters / Noses / Angles](dw125.json) | Geometry | [PNG](dw125.png) |
| DW126 | [Illustration / Characters / Noses / Please don’t…](dw126.json) | Geometry | [PNG](dw126.png) |
| DW127 | [Illustration / Characters / Mouths](dw127.json) | Imagery | [PNG](dw127.png) |
| DW128 | [Illustration / Characters / Mouths / No boundaries](dw128.json) | Imagery | [PNG](dw128.png) |
| DW129 | [Illustration / Characters / Hair](dw129.json) | Geometry | [PNG](dw129.png) |
| DW130 | [Illustration / Characters / Hair / Be careful](dw130.json) | Imagery | [PNG](dw130.png) |
| DW131 | [Illustration / Characters / Arms and hands](dw131.json) | Geometry | [PNG](dw131.png) |
| DW132 | [Illustration / Characters / Arms and hands / Please don’t…](dw132.json) | Geometry | [PNG](dw132.png) |
| DW133 | [Illustration / Characters / Posing](dw133.json) | Imagery | [PNG](dw133.png) |
| DW134 | [Marketing / Assets / Introduction](dw134.json) | Brand | [PNG](dw134.png) |
| DW135 | [Marketing / Duo](dw135.json) | Imagery | [PNG](dw135.png) |
| DW136 | [Marketing / Duo / Background choices](dw136.json) | Color | [PNG](dw136.png) |
| DW137 | [Marketing / Cast of characters](dw137.json) | Imagery | [PNG](dw137.png) |
| DW138 | [Marketing / Cast / Background choices](dw138.json) | Color | [PNG](dw138.png) |
| DW139 | [Resources / Introduction](dw139.json) | Brand | [PNG](dw139.png) |
| DW140 | [Resources / Emoji](dw140.json) | Voice | [PNG](dw140.png) |
| DW141 | [Resources / Emoji 5.0 compatibility](dw141.json) | Voice | [PNG](dw141.png) |
| DW142 | [Help / Unfinished introduction](dw142.json) | Brand | [PNG](dw142.png) |
| DW143 | [Help / Unanswered logo questions](dw143.json) | Brand | [PNG](dw143.png) |
| DW144 | [Help / Unanswered color questions](dw144.json) | Color | [PNG](dw144.png) |
| DJ01 | [Everyone can Duolingo](dj01.json) | Voice | [PNG](dj01.png) |
| DJ02 | [Duo and the Feather Bold g](dj02.json) | Typography | [PNG](dj02.png) |
| DJ03 | [Wing form and letter construction](dj03.json) | Geometry | [PNG](dj03.png) |
| DJ04 | [Duolingo wordmark](dj04.json) | Brand | [PNG](dj04.png) |
| DJ05 | [Wordmark anatomy](dj05.json) | Typography | [PNG](dj05.png) |
| DJ06 | [Lowercase g exploration](dj06.json) | Typography | [PNG](dj06.png) |
| DJ07 | [Feather bold character specimen](dj07.json) | Typography | [PNG](dj07.png) |
| DJ08 | [Change the world. One word at a time.](dj08.json) | Typography | [PNG](dj08.png) |
| DJ09 | [Messaging and illustration quartet](dj09.json) | Voice | [PNG](dj09.png) |
| DJ10 | [Brand guideline overview](dj10.json) | Brand | [PNG](dj10.png) |
| DJ11 | [Multilingual illustrated posters](dj11.json) | Application | [PNG](dj11.png) |
| DJ12 | [Social composition grid](dj12.json) | Layout | [PNG](dj12.png) |
| DJ13 | [Portrait campaign pair](dj13.json) | Imagery | [PNG](dj13.png) |
| DJ14 | [London Underground poster](dj14.json) | Application | [PNG](dj14.png) |
| DJ15 | [Pittsburgh billboard](dj15.json) | Application | [PNG](dj15.png) |
| DJ16 | [Pocket T-shirt](dj16.json) | Application | [PNG](dj16.png) |
| DJ17 | [Green wordmark cap](dj17.json) | Application | [PNG](dj17.png) |
| DJ18 | [Passport holder](dj18.json) | Application | [PNG](dj18.png) |
| DJ19 | [Travel stickers on a suitcase](dj19.json) | Application | [PNG](dj19.png) |
| DJ20 | [Duolingo and Plus launch sequence](dj20.json) | Motion | [PNG](dj20.png) |
| DJ21 | [Goodbye language barriers](dj21.json) | Voice | [PNG](dj21.png) |

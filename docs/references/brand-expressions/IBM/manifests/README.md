# IBM brand expression references

This collection contains **117 image/manifest pairs**: 47 complete public-guidance webpage content captures, 25 alternate tab specimens, one non-default carousel specimen, and all 44 physical pages of two official logo PDFs. It is a public Design Language reference collection, not a single master brand book.

## Sources and scope

Retrieved 2026-11-05 from [IBM Design Language](https://www.ibm.com/design/language/). The source defines the intended uses and requirements; inferred strategic effects in our manifests remain interpretations. The webpages reflect the retrieved edition. Footer dates vary and are not treated as a single book publication date.

The complete 47-page guidance scope covers philosophy, typography, color, 2x Grid, logos, iconography design/use/contribution, illustration design/use/production, photography, data visualization, technical diagrams, infograms, layout, animation and the resources index. Page URLs, heading inventories, raw-HTML SHA-256 hashes and complete readable transcripts are in [page-inventory.json](../sources/page-inventory.json). Each page has original HTML and a UTF-8 text transcript in `sources/`.

Excluded from this finite guidance scope: the showcase gallery, news/help pages, searchable icon asset catalogs and external component/API documentation. Linked Figma files, starter-tool packages and restricted resources are references within the captured guidance, not claimed as collected artifacts. The original crawl exposed four malformed relative links returning 404: `iconography/overview/ui-icons/design/`, `iconography/overview/app-icons/design/`, `iconography/overview/pictograms/design/` and `iconography/typography/typeface/`. Correct canonical guidance pages are included.

Complete PDFs:

- [IBM logo and brand guidelines for third-party users](https://www.ibm.com/design/language/files/IBM_Logo_3rdParties_300822.pdf): [local original](../sources/ibm-logo-third-parties.pdf), 17 physical pages, copyright 2022. IDs IBT01–IBT17.
- [IBM Logo Guidelines for Strategic Partners, Version 1.2](https://www.ibm.com/design/language/files/IBM_logo_guidelines_strategic_partners_v_1_2.pdf): [local original](../sources/ibm-logo-strategic-partners.pdf), 27 physical pages, copyright 2023. IDs IBS01–IBS27. Physical page 14 retains a Version 1.1 footer; the cover and other headers identify Version 1.2.

## Capture and motion

Webpage PNGs preserve the complete content area at a 1440px browser viewport, with the 256px sidebar reserve cropped away. This removes navigation/privacy chrome while retaining article headings, examples, captions and the site's in-content footer. Original uncropped content captures remain in [captures](../sources/captures/). These are labelled webpage captures, not original presentation slides.

Images were eagerly decoded before capture to avoid false blank specimens. Video examples without posters are represented by an early rendered frame. The default-state page is supplemented by every non-default guidance tab and carousel specimen; the typography tables also include the complete 1x state with the scroll container expanded. Scrollable tab tables are expanded to retain every row. Alternate video specimens are paused late enough to show complete labels. [Alternate-state metadata](../sources/alternate-tabs.json) preserves active-tab text, page, group and state; [carousel inventory](../sources/carousel-inventory.json) records the live audit across all 47 pages.

87 local playable clips are associated with their source pages:77 original videos plus 10 MP4 playback copies of original GIFs. Original GIFs and the original MOV remain intact. The MOV has a browser-compatible MP4 copy. Each clip was inspected using six uniformly spaced frames across its complete duration; no audio interpretation is claimed. [Motion inventory](../sources/motion-inventory.json) records source URL, duration, local original/playback paths, associated page and inspection method. Clip titles distinguish source-approved and source-discouraged examples.

The [media inventory](../sources/media-inventory.json) records every downloaded image/video URL, status and local file. The source contains one malformed animation image URL ending `{animation_tt_ex2}` which returns 404; this is recorded as a source defect. Available static poster artwork remains separately archived; the missing URL is not silently reconstructed. Classic animation-principle specimens supplied as PNG stills are not misrepresented as playable clips.

## Source qualifications

- Public web guidance, third-party logo guidance and strategic-partner guidance have different audiences. Their rules remain scoped to their respective sources.
- Alternate 4x typography table repeats a numeric row; the capture preserves it.
- One dark-background pictogram specimen is captioned “Black” although it shows white strokes; the manifest records the mismatch.
- Pictogram 48px minimum, larger expressive specimens, icon touch-target 44px minimum and artwork dimensions are different units of judgment.
- Hybrid UI illustrations are for high-level product communications; they are not permitted inside the actual product. The source separately allows composition-inspired illustrations without high-fidelity UI.
- The default preview is a static captured state. Associated clips and alternate specimens provide the remaining states; a PNG alone is not motion evidence.

## Offline gallery

Open [the gallery](../index.html) directly from disk. Each complete webpage preview scrolls within its panel, and its full-size PNG opens separately. Expand **Local motion examples** beneath a page to play its associated clips. Every gallery asset/link is relative and stays inside this folder. Original archived HTML depends on the original site's assets; gallery source links instead open the readable local transcripts.

Rebuild after editing manifests with `python3 IBM/build-gallery.py` from the parent brand-expressions folder. This local wrapper runs the shared generator, then adds scrollable webpage previews and associated local media from `motion_assets`. Running only the shared generator omits those supplemental players. Regenerate the parent category catalog separately. Numeric `location.order` keeps alternates beside their page and each PDF in physical sequence.

## Reference inventory

| ID | Reference | Category | Image |
| --- | --- | --- | --- |
| IB001 | [IBM Design Language / Home](ib001.json) | Brand | [PNG](ib001.png) |
| IB002 | [Philosophy / Point of view](ib002.json) | Brand | [PNG](ib002.png) |
| IB003 | [Philosophy / Principles](ib003.json) | Brand | [PNG](ib003.png) |
| IB004 | [Typography / Typeface](ib004.json) | Typography | [PNG](ib004.png) |
| IB005 | [Typography / Type basics](ib005.json) | Typography | [PNG](ib005.png) |
| IB006 | [Typography / Type scale](ib006.json) | Typography | [PNG](ib006.png) |
| IB006T11 | [Typography / Large-format scale — 1x table](ib006t11.json) | Typography | [PNG](ib006t11.png) |
| IB006T12 | [Typography / Large-format scale — 4x table](ib006t12.json) | Typography | [PNG](ib006t12.png) |
| IB006T13 | [Typography / Large-format scale — 8x table](ib006t13.json) | Typography | [PNG](ib006t13.png) |
| IB007 | [Color / Palette, combination and accessibility](ib007.json) | Color | [PNG](ib007.png) |
| IB007T12 | [Color / Full palette — RGB specifications](ib007t12.json) | Color | [PNG](ib007t12.png) |
| IB007T13 | [Color / Full palette — PMS specifications](ib007t13.json) | Color | [PNG](ib007t13.png) |
| IB007T14 | [Color / Full palette — CMYK specifications](ib007t14.json) | Color | [PNG](ib007t14.png) |
| IB007T22 | [Color / UI palette — RGB specifications](ib007t22.json) | Color | [PNG](ib007t22.png) |
| IB007T23 | [Color / UI palette — PMS references](ib007t23.json) | Color | [PNG](ib007t23.png) |
| IB007T24 | [Color / UI palette — CMYK specifications](ib007t24.json) | Color | [PNG](ib007t24.png) |
| IB008 | [Geometry / 2x Grid](ib008.json) | Geometry | [PNG](ib008.png) |
| IB009 | [IBM logos / 8-Bar](ib009.json) | Brand | [PNG](ib009.png) |
| IB010 | [IBM logos / Rebus](ib010.json) | Brand | [PNG](ib010.png) |
| IB011 | [Iconography / Overview](ib011.json) | Imagery | [PNG](ib011.png) |
| IB011T12 | [Iconography / Expressive pictogram vocabulary](ib011t12.json) | Imagery | [PNG](ib011t12.png) |
| IB012 | [Illustration / Overview](ib012.json) | Imagery | [PNG](ib012.png) |
| IB013 | [Illustration / Tips and techniques](ib013.json) | Imagery | [PNG](ib013.png) |
| IB014 | [Illustration / Line style — Design](ib014.json) | Geometry | [PNG](ib014.png) |
| IB015 | [Illustration / Flat style — Design](ib015.json) | Geometry | [PNG](ib015.png) |
| IB016 | [Illustration / Isometric style — Design](ib016.json) | Geometry | [PNG](ib016.png) |
| IB017 | [Illustration / Hybrid UI style — Design](ib017.json) | Imagery | [PNG](ib017.png) |
| IB017T12 | [Hybrid UI illustration / Greeked text — Dark themes](ib017t12.json) | Typography | [PNG](ib017t12.png) |
| IB018 | [Illustration / People](ib018.json) | Imagery | [PNG](ib018.png) |
| IB018T12 | [People illustration / Isometric character construction](ib018t12.json) | Geometry | [PNG](ib018t12.png) |
| IB018T22 | [People illustration / Isometric pose progression](ib018t22.json) | Geometry | [PNG](ib018t22.png) |
| IB018T32 | [People illustration / Rose and Almond — RGB palette](ib018t32.json) | Color | [PNG](ib018t32.png) |
| IB018T33 | [People illustration / Rose and Almond — CMYK palette](ib018t33.json) | Color | [PNG](ib018t33.png) |
| IB019 | [Photography / Overview](ib019.json) | Imagery | [PNG](ib019.png) |
| IB020 | [Photography / Tips and techniques](ib020.json) | Imagery | [PNG](ib020.png) |
| IB021 | [Data visualization / Overview](ib021.json) | Application | [PNG](ib021.png) |
| IB022 | [Data visualization / Charts](ib022.json) | Application | [PNG](ib022.png) |
| IB023 | [Data visualization / Design — Basics](ib023.json) | Application | [PNG](ib023.png) |
| IB024 | [Infographics / Technical diagrams — Design](ib024.json) | Geometry | [PNG](ib024.png) |
| IB024T12 | [Technical diagrams / Large node — Side bar](ib024t12.json) | Geometry | [PNG](ib024t12.png) |
| IB024T13 | [Technical diagrams / Large node — Color block](ib024t13.json) | Geometry | [PNG](ib024t13.png) |
| IB024T22 | [Technical diagrams / Node colors — Dark theme](ib024t22.json) | Color | [PNG](ib024t22.png) |
| IB025 | [Infographics / Infograms](ib025.json) | Geometry | [PNG](ib025.png) |
| IB026 | [Layout / Overview](ib026.json) | Layout | [PNG](ib026.png) |
| IB027 | [Layout / Tips and techniques](ib027.json) | Layout | [PNG](ib027.png) |
| IB028 | [Animation / Overview](ib028.json) | Motion | [PNG](ib028.png) |
| IB029 | [Animation / Classic principles](ib029.json) | Motion | [PNG](ib029.png) |
| IB030 | [Animation / Tips and techniques](ib030.json) | Motion | [PNG](ib030.png) |
| IB031 | [Resources / Brand tools and repositories](ib031.json) | Brand | [PNG](ib031.png) |
| IB032 | [Iconography / UI icons — Design](ib032.json) | Geometry | [PNG](ib032.png) |
| IB033 | [Pictograms / Design](ib033.json) | Geometry | [PNG](ib033.png) |
| IB033T12 | [Pictograms / Color treatments — Dark background](ib033t12.json) | Color | [PNG](ib033t12.png) |
| IB033T22 | [Pictograms / Tints and shades — Dark background](ib033t22.json) | Color | [PNG](ib033t22.png) |
| IB033T32 | [Pictograms / Gradient treatments — Dark background](ib033t32.json) | Color | [PNG](ib033t32.png) |
| IB033T42 | [Pictograms / Expressive strokes — Dark background](ib033t42.json) | Color | [PNG](ib033t42.png) |
| IB034 | [UI icons / Usage](ib034.json) | Application | [PNG](ib034.png) |
| IB034C01 | [UI icons / Alignment — Optical balance](ib034c01.json) | Geometry | [PNG](ib034c01.png) |
| IB035 | [UI icons / Contribution](ib035.json) | Application | [PNG](ib035.png) |
| IB036 | [App icons / Design](ib036.json) | Geometry | [PNG](ib036.png) |
| IB037 | [App icons / Usage](ib037.json) | Application | [PNG](ib037.png) |
| IB037T12 | [App icons / Sizing specifications](ib037t12.json) | Geometry | [PNG](ib037t12.png) |
| IB038 | [App icons / Contribution](ib038.json) | Application | [PNG](ib038.png) |
| IB039 | [Pictograms / Usage](ib039.json) | Application | [PNG](ib039.png) |
| IB039T12 | [Pictograms / Expressive application — Automation collateral](ib039t12.json) | Application | [PNG](ib039t12.png) |
| IB039T22 | [Pictograms / Expressive size progression](ib039t22.json) | Geometry | [PNG](ib039t22.png) |
| IB040 | [Pictograms / Contribution](ib040.json) | Application | [PNG](ib040.png) |
| IB041 | [Line illustration / Usage](ib041.json) | Motion | [PNG](ib041.png) |
| IB042 | [Flat illustration / Usage](ib042.json) | Motion | [PNG](ib042.png) |
| IB043 | [Isometric illustration / Usage](ib043.json) | Motion | [PNG](ib043.png) |
| IB044 | [Isometric illustration / Production](ib044.json) | Geometry | [PNG](ib044.png) |
| IB045 | [Hybrid UI illustration / Usage](ib045.json) | Application | [PNG](ib045.png) |
| IB046 | [Data visualization / Usage](ib046.json) | Application | [PNG](ib046.png) |
| IB047 | [Technical diagrams / Usage](ib047.json) | Application | [PNG](ib047.png) |
| IBT01 | [IBM Logo and Brand Guidelines for Third Parties](ibt01.json) | Brand | [PNG](ibt01.png) |
| IBT02 | [Purpose and compliance](ibt02.json) | Brand | [PNG](ibt02.png) |
| IBT03 | [Contents](ibt03.json) | Layout | [PNG](ibt03.png) |
| IBT04 | [Appropiate trademark usage](ibt04.json) | Brand | [PNG](ibt04.png) |
| IBT05 | [Trademark license agreement](ibt05.json) | Brand | [PNG](ibt05.png) |
| IBT06 | [Trademark clarity and context](ibt06.json) | Brand | [PNG](ibt06.png) |
| IBT07 | [Usage](ibt07.json) | Application | [PNG](ibt07.png) |
| IBT08 | [Clear space requirements](ibt08.json) | Geometry | [PNG](ibt08.png) |
| IBT09 | [Usage examples](ibt09.json) | Application | [PNG](ibt09.png) |
| IBT10 | [Logos and color](ibt10.json) | Color | [PNG](ibt10.png) |
| IBT11 | [Things to avoid](ibt11.json) | Brand | [PNG](ibt11.png) |
| IBT12 | [Misuse](ibt12.json) | Application | [PNG](ibt12.png) |
| IBT13 | [Merchandise](ibt13.json) | Application | [PNG](ibt13.png) |
| IBT14 | [Merchandise placement](ibt14.json) | Application | [PNG](ibt14.png) |
| IBT15 | [Attribution](ibt15.json) | Brand | [PNG](ibt15.png) |
| IBT16 | [IBM creative review](ibt16.json) | Brand | [PNG](ibt16.png) |
| IBT17 | [Closing / Copyright 2022](ibt17.json) | Brand | [PNG](ibt17.png) |
| IBS01 | [IBM Logo Guidelines for Strategic Partners / Version 1.2](ibs01.json) | Brand | [PNG](ibs01.png) |
| IBS02 | [Contents](ibs02.json) | Layout | [PNG](ibs02.png) |
| IBS03 | [Purpose](ibs03.json) | Brand | [PNG](ibs03.png) |
| IBS04 | [Trademark license](ibs04.json) | Brand | [PNG](ibs04.png) |
| IBS05 | [Fundamentals](ibs05.json) | Brand | [PNG](ibs05.png) |
| IBS06 | [IBM 8-bar logo](ibs06.json) | Geometry | [PNG](ibs06.png) |
| IBS07 | [Logo versions](ibs07.json) | Geometry | [PNG](ibs07.png) |
| IBS08 | [Logo color options](ibs08.json) | Color | [PNG](ibs08.png) |
| IBS09 | [Logo misuse](ibs09.json) | Brand | [PNG](ibs09.png) |
| IBS10 | [Usage](ibs10.json) | Brand | [PNG](ibs10.png) |
| IBS11 | [Logo relationships](ibs11.json) | Brand | [PNG](ibs11.png) |
| IBS12 | [Representation](ibs12.json) | Brand | [PNG](ibs12.png) |
| IBS13 | [Size and position](ibs13.json) | Layout | [PNG](ibs13.png) |
| IBS14 | [Examples / Social](ibs14.json) | Application | [PNG](ibs14.png) |
| IBS15 | [Examples / Paid media](ibs15.json) | Application | [PNG](ibs15.png) |
| IBS16 | [Examples / Collateral](ibs16.json) | Application | [PNG](ibs16.png) |
| IBS17 | [Examples / Presentations](ibs17.json) | Application | [PNG](ibs17.png) |
| IBS18 | [Examples / Displays](ibs18.json) | Application | [PNG](ibs18.png) |
| IBS19 | [Examples / Websites](ibs19.json) | Application | [PNG](ibs19.png) |
| IBS20 | [Examples / Video](ibs20.json) | Application | [PNG](ibs20.png) |
| IBS21 | [Examples / Misuse — Mastheads and banners](ibs21.json) | Application | [PNG](ibs21.png) |
| IBS22 | [Examples / Misuse — Prominence and signatures](ibs22.json) | Application | [PNG](ibs22.png) |
| IBS23 | [Merchandise](ibs23.json) | Application | [PNG](ibs23.png) |
| IBS24 | [Joint logo lockup](ibs24.json) | Brand | [PNG](ibs24.png) |
| IBS25 | [Misuse / Joint logo lockup](ibs25.json) | Application | [PNG](ibs25.png) |
| IBS26 | [Review and approval](ibs26.json) | Brand | [PNG](ibs26.png) |
| IBS27 | [Corporate signature / Copyright 2023](ibs27.json) | Brand | [PNG](ibs27.png) |

## Media totals

The final inventory records 1161 unique requested URLs: 1160 retrieved successfully and 1 failed source URL. It preserves 1083 original image assets and 77 original videos; responsive assets are not counted as separate slide references.

# Uber · Brand system quick guide

[Open the offline gallery](../index.html) · [Original PDF](../uber-brand-system-quick-guide-2018.pdf)

Complete October 2018 partner and sponsor quick guide: 10 physical pages, in source order, each preserved as a 1920 × 1080 PNG and a separate manifest. Covers, welcome, asset directory and closing page are included. All ten pages were visually inspected alongside extracted text. PDF metadata identifies the source as `Uber_BrandSystem_QuickGuide.key`, created and modified October 3, 2018 with Keynote/Quartz.

## Provenance and scope

Downloaded November 5, 2026 from [The Palladium Agency’s third-party mirror](https://thepalladium.agency/wp-content/uploads/2024/09/Uber_2018.pdf). This is a historical quick guide for Uber’s partner and sponsor ecosystem, not a complete master identity manual or a statement of current Uber standards. The mirror’s 2024 URL path is not the guide’s edition date. The PDF’s original artwork is retained without alteration.

Page 2 requires Uber brand-team pre-approval of partner-led creative. Page 9 points to historical Google Drive asset folders; those linked assets were not downloaded or verified and are not included in this archive. The offline gallery needs no access to those links.

Page 6 describes secondary-color use in illustration, photography and product before narrowing it to illustrations and product. The manifest preserves that ambiguity. Its proportion diagram gives no numerical percentages. Printed production values are visible in the source rather than normalized into a new token set; the red RGB and hex values disagree, so this archive should not be treated as an independently verified production palette.

Each manifest separates analyst interpretation from source evidence through `reference_purposes`. Intent is assigned only when the source explains a reason; Constraint is assigned only for stated limits. The ingredient records on pages 3–8 preserve application scope.

## Page index

| PDF page | ID | Title | Category | Pair |
| --- | --- | --- | --- | --- |
| 1 | U01 | Brand system quick guide / October 2018 | Brand | [PNG](u01.png) · [JSON](u01.json) |
| 2 | U02 | Welcome | Brand | [PNG](u02.png) · [JSON](u02.json) |
| 3 | U03 | Logo / Logo and clearspace | Brand | [PNG](u03.png) · [JSON](u03.json) |
| 4 | U04 | Logo / Product and partnership lockups | Brand | [PNG](u04.png) · [JSON](u04.json) |
| 5 | U05 | Color / Primary brand colors and Safety Blue | Color | [PNG](u05.png) · [JSON](u05.json) |
| 6 | U06 | Color / Secondary colors and usage proportions | Color | [PNG](u06.png) · [JSON](u06.json) |
| 7 | U07 | Typography / Uber Move and display pairings | Typography | [PNG](u07.png) · [JSON](u07.json) |
| 8 | U08 | Typography / Hierarchy example and calls to action | Typography | [PNG](u08.png) · [JSON](u08.json) |
| 9 | U09 | Assets | Application | [PNG](u09.png) · [JSON](u09.json) |
| 10 | U10 | Thank you. | Brand | [PNG](u10.png) · [JSON](u10.json) |

## Refresh

From the parent `brand-expressions` folder, regenerate the standalone gallery after editing manifests:

```sh
python3 build-gallery.py Uber "Uber" "Complete October 2018 partner and sponsor quick guide: 10 pages. Historical third-party mirror; not a complete master identity manual."
```

The generated HTML embeds its specifications and uses relative links. Open `../index.html` directly; no server is required. Copy the entire Uber folder to preserve its source PDF, page images and manifests.

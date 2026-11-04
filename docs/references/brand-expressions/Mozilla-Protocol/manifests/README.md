# Mozilla Protocol reference studies

Three editorial comparisons examine Mozilla and Firefox in Protocol 22.0.0. The titles and arrangements belong to this collection. Protocol publishes the type specimens, scale definitions and component examples that supply the evidence.

| Study | Image | Title | Category |
| --- | --- | --- | --- |
| [P01](p01.json) | [PNG](p01.png) | Typefaces by brand and role | Typography |
| [P02](p02.json) | [PNG](p02.png) | One set of roles, two type scales | Typography |
| [P03](p03.json) | [PNG](p03.png) | Two marks in one navigation pattern | Application |

## Provenance

- **Edition.** Mozilla Protocol documentation, version 22.0.0, site build dated October 3, 2025. Collected November 4, 2026. The [brand-theme guide](https://protocol.mozilla.org/docs/fundamentals/brand-themes) explains how the two brands share a framework. The [local HTML snapshot](../sources/brand-themes.html) preserves its text and section order. The original HTML snapshots are source records and reference the publisher’s own site assets.
- **P01.** The [Typography page](https://protocol.mozilla.org/docs/fundamentals/typography#typefaces) supplies four letter specimens and their brand and role assignments. Each sample contains the first eight uppercase/lowercase pairs from the bold and regular lines. Chromium rendered the figures at the page’s 48 px specimen size after all four families loaded. For the excerpts, each figure was restricted to those letters and the two weight lines were separated before capture. The two-column layout and role labels were added for comparison. [Source snapshot](../sources/typography.html)
- **P02.** The [Themes section](https://protocol.mozilla.org/docs/fundamentals/typography#themes) explains the difference in apparent size. The two columns are a new rendering using the published font families and values from release 22.0.0’s [Mozilla](https://github.com/mozilla/protocol/blob/v22.0.0/assets/sass/protocol/includes/themes/_mozilla.scss) and [Firefox](https://github.com/mozilla/protocol/blob/v22.0.0/assets/sass/protocol/includes/themes/_firefox.scss) definitions. Labels show font size in pixels and unitless line height. This study samples three roles from the standard desktop scale. Context-specific condensed and mobile scales have separate definitions. [Mozilla source snapshot](../sources/_mozilla.scss) · [Firefox source snapshot](../sources/_firefox.scss)
- **P03.** Protocol’s [Default navigation preview](https://protocol.mozilla.org/components/preview/navigation) and [Firefox navigation preview](https://protocol.mozilla.org/components/preview/navigation--firefox) supply the two header images. Each capture shows the complete navigation component with its menu closed in a 1120 CSS px viewport. The developer example uses generic link labels. Both captures preserve the logo and controls shown in the preview. [Default source snapshot](../sources/navigation.html) · [Firefox source snapshot](../sources/navigation--firefox.html)

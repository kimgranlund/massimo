# Sweetgreen — COLLINS identity case study

Complete distinct artwork sequence from [COLLINS](https://wearecollins.com/case-studies/sweetgreen/), retrieved 2026-11-05. This is a public agency case study, not a complete master guideline book. The historical redesign is discussed in linked 2021 press; the retrieved page also contains later explanatory annotations. Do not treat example claims, UI content or environmental ambitions as current operational facts.

## Coverage and source handling

- 38 PNG/JSON pairs: seven annotated explanatory boards and 31 gallery artworks, including 13 complete local videos.
- SG01 is reserved for the cover crop. Its original 960×1200 JPEG is retained, but the fuller 4688×3125 bag photograph is cataloged once as SG39.
- All case-study body media were acquired. Related-project thumbnails, site navigation, press logos and decorative interface elements are outside the collection.
- Seven board asset names declare 12500×8333, but the unparameterized Sanity CDN delivers actual 8192×5461 images. These published responses are preserved without upscaling. Other stills retain their delivered native dimensions.
- Mux high.mp4 endpoints returned 404; complete HLS streams were retrieved at the highest advertised video rendition and remuxed without video re-encoding into MP4. Audio, where present, is retained but not analyzed. PNG posters are first frames; motion claims come from inspection across each full timeline.
- Source HTML and decoded case-study data are retained beside [the asset inventory](../sources/inventory.json). The inventory records original URLs, delivered dimensions and video duration. The HTML is provenance, not the offline gallery.
- All still PNGs reproduce the delivered source pixels. No percentage, color specification, font-axis value or application prohibition is inferred from an illustrative example.
- The Ode to Cookbooks caption describes 1940s/1950s inspiration, while the board visibly includes a 1922 catalogue and a Moosewood Cookbook cover. The manifest describes the actual objects without assigning the caption’s period to both.
- SG21 records a historical Carbon Neutrality by 2027 ambition; it does not establish achievement.

## References

| ID | Title | Category | Manifest | Image |
| --- | --- | --- | --- | --- |
| SG02 | Ode to Cookbooks | Imagery | [sg02.json](sg02.json) | [PNG](sg02.png) |
| SG03 | Taste Cues | Imagery | [sg03.json](sg03.json) | [PNG](sg03.png) |
| SG04 | Signature Illustration | Imagery | [sg04.json](sg04.json) | [PNG](sg04.png) |
| SG05 | Validated Versatility | Application | [sg05.json](sg05.json) | [PNG](sg05.png) |
| SG06 | Custom Icon System | Geometry | [sg06.json](sg06.json) | [PNG](sg06.png) |
| SG07 | Extensibility | Imagery | [sg07.json](sg07.json) | [PNG](sg07.png) |
| SG08 | 3P IP Adapter: Frame | Geometry | [sg08.json](sg08.json) | [PNG](sg08.png) |
| SG09 | Produce in motion | Motion | [sg09.json](sg09.json) | [PNG](sg09.png) |
| SG10 | App signature animation | Motion | [sg10.json](sg10.json) | [PNG](sg10.png) |
| SG11 | More gardens, less carbon | Motion | [sg11.json](sg11.json) | [PNG](sg11.png) |
| SG12 | Salad in the meadow | Imagery | [sg12.json](sg12.json) | [PNG](sg12.png) |
| SG13 | Harvest carried close | Imagery | [sg13.json](sg13.json) | [PNG](sg13.png) |
| SG14 | Finding a bit of each season | Motion | [sg14.json](sg14.json) | [PNG](sg14.png) |
| SG15 | Website across a landscape | Application | [sg15.json](sg15.json) | [PNG](sg15.png) |
| SG16 | Missing-page illustration | Application | [sg16.json](sg16.json) | [PNG](sg16.png) |
| SG17 | Ingredient and grower cards | Imagery | [sg17.json](sg17.json) | [PNG](sg17.png) |
| SG18 | Ingredient selection grid | Application | [sg18.json](sg18.json) | [PNG](sg18.png) |
| SG19 | App browsing sequence | Application | [sg19.json](sg19.json) | [PNG](sg19.png) |
| SG20 | Ordering and delivery screens | Application | [sg20.json](sg20.json) | [PNG](sg20.png) |
| SG21 | Plant Forward environmental message | Voice | [sg21.json](sg21.json) | [PNG](sg21.png) |
| SG22 | Open-source recipe book | Application | [sg22.json](sg22.json) | [PNG](sg22.png) |
| SG23 | Seasonal bowl-drop social film | Motion | [sg23.json](sg23.json) | [PNG](sg23.png) |
| SG24 | Deliciousness is in the details | Motion | [sg24.json](sg24.json) | [PNG](sg24.png) |
| SG25 | Better when roasted | Voice | [sg25.json](sg25.json) | [PNG](sg25.png) |
| SG26 | Carbon-footprint social diagram | Application | [sg26.json](sg26.json) | [PNG](sg26.png) |
| SG27 | Let nature lead shirt | Application | [sg27.json](sg27.json) | [PNG](sg27.png) |
| SG28 | Sweet Sans / Dressing portion | Typography | [sg28.json](sg28.json) | [PNG](sg28.png) |
| SG29 | You are where you eat tote | Application | [sg29.json](sg29.json) | [PNG](sg29.png) |
| SG30 | Wordmark cap | Application | [sg30.json](sg30.json) | [PNG](sg30.png) |
| SG31 | Farm names on a hoodie | Application | [sg31.json](sg31.json) | [PNG](sg31.png) |
| SG32 | Restaurant entrance wordmark | Application | [sg32.json](sg32.json) | [PNG](sg32.png) |
| SG33 | Projecting sg sign | Application | [sg33.json](sg33.json) | [PNG](sg33.png) |
| SG34 | Window signature and hours | Application | [sg34.json](sg34.json) | [PNG](sg34.png) |
| SG35 | Team uniform signature | Application | [sg35.json](sg35.json) | [PNG](sg35.png) |
| SG36 | Embossed bowl signature | Application | [sg36.json](sg36.json) | [PNG](sg36.png) |
| SG37 | Get the app to get your greens | Application | [sg37.json](sg37.json) | [PNG](sg37.png) |
| SG38 | Bowls and bags display | Application | [sg38.json](sg38.json) | [PNG](sg38.png) |
| SG39 | Carry bag in greenery | Application | [sg39.json](sg39.json) | [PNG](sg39.png) |

## Refresh gallery

From the parent folder run `python3 build-gallery.py Sweetgreen Sweetgreen`. The generated HTML embeds the specs and uses only relative local media paths. Open `../index.html` directly from disk.

## Original asset URLs

- SG01: [sg01.jpg](../sources/sg01.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/294143bba0cc4157e6306f3724c9893b2c0de457-960x1200.jpg
- SG02: [sg02.jpg](../sources/sg02.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/1ce8e70b12dc7184df62c031f471eafec3032c87-12500x8333.jpg
- SG03: [sg03.jpg](../sources/sg03.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/4e9ca9b3e59ada27fb6533827aac49e4580945b4-12500x8333.jpg
- SG04: [sg04.jpg](../sources/sg04.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/f1d2e3ed56d6ce55be0314681c9b247e79aebfdc-12500x8333.jpg
- SG05: [sg05.jpg](../sources/sg05.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/2c9cbda421ed39a5dbae0c9f1044c0ba63e92fa0-12500x8333.jpg
- SG06: [sg06.jpg](../sources/sg06.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/3e87ce57c767fd07f551c1310b82a73803b41a24-12500x8333.jpg
- SG07: [sg07.jpg](../sources/sg07.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/55cdf2f0a3812763f612c9bb1fcb01995bacf967-12500x8333.jpg
- SG08: [sg08.jpg](../sources/sg08.jpg) — https://cdn.sanity.io/images/fmzd4n68/production/6ea5731d74c110cb676aec7d9308583d3cb8a954-12500x8333.jpg
- SG09: [sg09.mp4](../sources/sg09.mp4) — https://stream.mux.com/eWbEggXsKUlkrvQ5Y8l000222JEBgXf4pHniL2RKOqAxM.m3u8; 13.37s
- SG10: [sg10.mp4](../sources/sg10.mp4) — https://stream.mux.com/iYQpbKBwp7iFnLwyNWNzRgPhwBXYdS4N025EvjiptK8A.m3u8; 5.01s
- SG11: [sg11.mp4](../sources/sg11.mp4) — https://stream.mux.com/BKY8bdOvDQxMfgEp8602rzCcnjOxLzOQ8300Acw9wdvIw.m3u8; 8.51s
- SG12: [sg12.png](../sources/sg12.png) — https://cdn.sanity.io/images/fmzd4n68/production/6ea3850aecb801ec7af2ce654a06c134c719daa4-4688x3125.png
- SG13: [sg13.png](../sources/sg13.png) — https://cdn.sanity.io/images/fmzd4n68/production/18005d461cc74ee03d2966225c8a4725d92fc4be-2579x3438.png
- SG14: [sg14.mp4](../sources/sg14.mp4) — https://stream.mux.com/aCZDa1YCsXnVVGArimravkEhKa00hZiP8AdbcuY7ydm00.m3u8; 17.07s
- SG15: [sg15.mp4](../sources/sg15.mp4) — https://stream.mux.com/tfQQPSF5E8fvx6WSyi01n026apZ1VMxboy8LEmwlshL1Y.m3u8; 19.78s
- SG16: [sg16.mp4](../sources/sg16.mp4) — https://stream.mux.com/ehYTvLFlRziMkNigr02ojrerQ301FMKdlx00o02cIextHiY.m3u8; 5.25s
- SG17: [sg17.mp4](../sources/sg17.mp4) — https://stream.mux.com/L1Stu0296P7OEXEITdS5THiak7YWC3CokSzavzwOZnIE.m3u8; 10.01s
- SG18: [sg18.mp4](../sources/sg18.mp4) — https://stream.mux.com/CL401NwEK28VqMpWaQMjUuoaylMIGl1luPP1BrYPQeV4.m3u8; 6.00s
- SG19: [sg19.mp4](../sources/sg19.mp4) — https://stream.mux.com/ygJphE7JJnGSXQpjvSFsb300pEYcvnuLPt9E02lFmqAl8.m3u8; 19.93s
- SG20: [sg20.mp4](../sources/sg20.mp4) — https://stream.mux.com/UUMzxgG01G4RboE2vmPSm9gLUVFwmvVh00aVEA8YPvdCw.m3u8; 8.60s
- SG21: [sg21.png](../sources/sg21.png) — https://cdn.sanity.io/images/fmzd4n68/production/2211fafa9344037b253e2922e7005a395f1ed74f-4688x3125.png
- SG22: [sg22.png](../sources/sg22.png) — https://cdn.sanity.io/images/fmzd4n68/production/22e3b7ecca09e180dfd34b1d91ce65f040388a0c-4688x3125.png
- SG23: [sg23.mp4](../sources/sg23.mp4) — https://stream.mux.com/11F02ivUyPAEQej4iuEPcKsIcUxRjZoO00UFr02k0054UtI.m3u8; 9.93s
- SG24: [sg24.mp4](../sources/sg24.mp4) — https://stream.mux.com/zGJouUx00gmKQRk3fKPSe720136dQAzT01CvDdsOnRujDE.m3u8; 8.15s
- SG25: [sg25.png](../sources/sg25.png) — https://cdn.sanity.io/images/fmzd4n68/production/74d9b53d1c22983c85f95f2a05057c9df3a0afd7-2579x3438.png
- SG26: [sg26.png](../sources/sg26.png) — https://cdn.sanity.io/images/fmzd4n68/production/c90d92e074187dd4d0e1f2a1936500f9017ca96f-2579x3438.png
- SG27: [sg27.png](../sources/sg27.png) — https://cdn.sanity.io/images/fmzd4n68/production/50c9dfd78600d44dae0fc11273a2216f402755b3-4688x3125.png
- SG28: [sg28.mp4](../sources/sg28.mp4) — https://stream.mux.com/MQ3tv02CQLTdQ02YM4ml6biTgbCwPP7KxPcyWY01cckf68.m3u8; 5.97s
- SG29: [sg29.png](../sources/sg29.png) — https://cdn.sanity.io/images/fmzd4n68/production/8d7b66fbe14459b602b53b0e224ce0e1922e61e1-2579x3438.png
- SG30: [sg30.png](../sources/sg30.png) — https://cdn.sanity.io/images/fmzd4n68/production/6e205d557cbc017925389d87bed17578003c59f5-2579x3438.png
- SG31: [sg31.png](../sources/sg31.png) — https://cdn.sanity.io/images/fmzd4n68/production/89e5d2a9c855afd5a002f04de234f86ea718af61-2579x3438.png
- SG32: [sg32.png](../sources/sg32.png) — https://cdn.sanity.io/images/fmzd4n68/production/bf703c927b4df2efa6c1222e9956a432a794bf84-4688x3125.png
- SG33: [sg33.png](../sources/sg33.png) — https://cdn.sanity.io/images/fmzd4n68/production/1c14e5e7a0249c16ab114f73778802cc57dd2820-2579x3438.png
- SG34: [sg34.png](../sources/sg34.png) — https://cdn.sanity.io/images/fmzd4n68/production/108531a9249b4f87d7af89a4dbef3db7f2c1d56a-2579x3438.png
- SG35: [sg35.png](../sources/sg35.png) — https://cdn.sanity.io/images/fmzd4n68/production/4cae232017ceab9deb817dcd0a234041f52a092d-2579x3438.png
- SG36: [sg36.png](../sources/sg36.png) — https://cdn.sanity.io/images/fmzd4n68/production/53b2d22305e35c80f470f54a7b7fdc6a3d4fc0b5-2579x3438.png
- SG37: [sg37.png](../sources/sg37.png) — https://cdn.sanity.io/images/fmzd4n68/production/9211566341f028852ec6bd12989dd80a2f7a6d7e-2579x3438.png
- SG38: [sg38.png](../sources/sg38.png) — https://cdn.sanity.io/images/fmzd4n68/production/eef0007a0110b0616a9046d9dc87fbfdf713887d-2579x3438.png
- SG39: [sg39.png](../sources/sg39.png) — https://cdn.sanity.io/images/fmzd4n68/production/7a4a6385a25816cd29b3d37b1b3f3ef5d8088b4d-4688x3125.png

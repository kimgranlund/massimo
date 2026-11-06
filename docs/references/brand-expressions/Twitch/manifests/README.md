# Twitch — COLLINS identity case study

Source: [COLLINS / Twitch](https://wearecollins.com/case-studies/twitch/), retrieved 2026-11-05. This collection preserves the complete distinct artwork sequence exposed by the source payload: cover, four annotated explanatory studies, and gallery. It is a historical identity case study, not a complete master brand book. The source describes the platform’s 2017–2019 expansion but does not print a single edition date for every artwork. Current product behavior is not inferred from these examples.

## Coverage and preservation

- 30 source items inventoried; 27 distinct references retained after three duplicate renditions are removed from the gallery. All downloaded originals remain in `sources/`.
- Stills retain the pixels delivered by the original CDN URLs. The three annotated JPEG assets advertise 12500×8333 in their asset IDs but the CDN delivers 8192×5461; this is the published rendition, not a local downsample.
- Nine playable clips accompany the retained references: eight source MP4/HLS presentations and one MP4 playback copy of the original two-frame GIF. HLS is remuxed into MP4 without re-encoding.
- The offline gallery uses `preload="none"`. Firefox stalls TW07 and TW13 with metadata preloading; TW07 reproduces in a minimal single-video page, while the same original media plays with initial preload none or auto. The generator avoids the failing metadata-preload path. All original source clips remain unchanged.
- TW23 is a two-frame appearance comparison, not evidence of an implemented product transition.
- Every still was visually inspected; each video was inspected at twelve positions spanning its duration. The two GIF scenes were inspected. Audio is retained where present but is not analyzed or claimed in the specs.
- No missing media records or failed final downloads. Related-case-study teasers and general site chrome are outside this Twitch source body.
- Orange annotations in TW03–TW05 are part of the published source artworks, not analyst additions. Companion caption rationale is attributed as such in purpose evidence.
- No source constraints are invented from the examples. Named color and gradient references do not provide production values or numerical proportions.

## Duplicate source items

| Source item | Treatment |
| --- | --- |
| 02 | Portrait rendition of the same logo animation as TW07; original retained. |
| 26 | Same photographed wall as TW01 at lower resolution; original retained. |
| 30 | Same 65-second motion study as TW06 under a second playback ID; original retained. |

## References

| ID | Title | Category | Manifest | PNG |
| --- | --- | --- | --- | --- |
| TW01 | You’re already one of us / Street posters | Application | [Spec](tw01.json) | [Image](tw01.png) |
| TW03 | 3P IP Adapter: Frame | Layout | [Spec](tw03.json) | [Image](tw03.png) |
| TW04 | Community Canvas | Layout | [Spec](tw04.json) | [Image](tw04.png) |
| TW05 | Validated Versatility | Application | [Spec](tw05.json) | [Image](tw05.png) |
| TW06 | High Expressive Ratio / Motion study | Motion | [Spec](tw06.json) | [Image](tw06.png) |
| TW07 | Wordmark / Depth and color animation | Motion | [Spec](tw07.json) | [Image](tw07.png) |
| TW08 | Wordmark / Four color treatments | Color | [Spec](tw08.json) | [Image](tw08.png) |
| TW09 | Glitch / Animated symbol | Motion | [Spec](tw09.json) | [Image](tw09.png) |
| TW10 | Twitch Roobert / Custom typeface | Typography | [Spec](tw10.json) | [Image](tw10.png) |
| TW11 | Emotes / Eight-card vocabulary | Imagery | [Spec](tw11.json) | [Image](tw11.png) |
| TW12 | Emotes and creator names / Animated grid | Motion | [Spec](tw12.json) | [Image](tw12.png) |
| TW13 | Not everyone’s going to get it | Voice | [Spec](tw13.json) | [Image](tw13.png) |
| TW14 | Named color palette / Scrolling swatches | Color | [Spec](tw14.json) | [Image](tw14.png) |
| TW15 | Gradient palette / Named combinations | Color | [Spec](tw15.json) | [Image](tw15.png) |
| TW16 | Creator portrait / Greeting | Imagery | [Spec](tw16.json) | [Image](tw16.png) |
| TW17 | Creator portrait / Gesture | Imagery | [Spec](tw17.json) | [Image](tw17.png) |
| TW18 | Creator card family | Application | [Spec](tw18.json) | [Image](tw18.png) |
| TW19 | Desktop / Discover | Application | [Spec](tw19.json) | [Image](tw19.png) |
| TW20 | Desktop / Browse | Application | [Spec](tw20.json) | [Image](tw20.png) |
| TW21 | Desktop / Following | Application | [Spec](tw21.json) | [Image](tw21.png) |
| TW22 | Mobile / Launch screen | Application | [Spec](tw22.json) | [Image](tw22.png) |
| TW23 | Mobile / Browse in light and dark | Application | [Spec](tw23.json) | [Image](tw23.png) |
| TW24 | Social / Three content types | Application | [Spec](tw24.json) | [Image](tw24.png) |
| TW25 | Emotes / Layered game animation | Motion | [Spec](tw25.json) | [Image](tw25.png) |
| TW27 | Street / Oversized wordmarks | Application | [Spec](tw27.json) | [Image](tw27.png) |
| TW28 | Exterior / Glitch cube sign | Application | [Spec](tw28.json) | [Image](tw28.png) |
| TW29 | TwitchCon / Stage identity | Application | [Spec](tw29.json) | [Image](tw29.png) |

## Original source inventory

[Machine-readable source inventory](../sources/media-inventory.json) records source order, original URLs, captions and downloaded filenames. [Preserved HTML](../sources/case-study.html), [Nuxt payload](../sources/payload.json) and [decoded source](../sources/decoded-source.json) retain the surrounding evidence.

| Item | Section | Original | Source URL |
| --- | --- | --- | --- |
| 01 | Cover still | [File](../sources/tw01.tif) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/2348a6e494d7acb2d933d52479eda9cace6bbc40-3000x2000.tif) |
| 02 | Cover motion | [File](../sources/tw02.mp4) | [Source](https://stream.mux.com/OLO4O5BEdMpfDgFdLnALNdz02WG9lBOtXH00yQW8RCRzg/high.mp4) |
| 03 | 3P IP Adapter: Frame | [File](../sources/tw03.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/ff437c50af8aa796f8e3be58a879d1eca75192f1-12500x8333.jpg) |
| 04 | Community Canvas | [File](../sources/tw04.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/9a42aba0e5f4bba90b48d11075a6d27a4b92199f-12500x8333.jpg) |
| 05 | Validated Versatility | [File](../sources/tw05.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/b9e7d8986148b968989a8ad629b2500beaf3fbc6-12500x8333.jpg) |
| 06 | High Expressive Ratio | [File](../sources/tw06.mp4) | [Source](https://stream.mux.com/odK3eTYqQdNBvMBl2hsobC018taZbpvKjWS004lqqrsW00.m3u8) |
| 07 | Gallery | [File](../sources/tw07.mp4) | [Source](https://stream.mux.com/p7riU7lNJ004Ydd00l00VDB02o4c2XUgCPMe7oPDl7xOl6U.m3u8) |
| 08 | Gallery | [File](../sources/tw08.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/36027835e9d6e86e901d942920990ba1cd5b1f99-3000x2000.jpg) |
| 09 | Gallery | [File](../sources/tw09.mp4) | [Source](https://stream.mux.com/hjg3t2X3dFGmnYmaZxtSG6aE6Vb3W02GFbXYaxNGaZdQ.m3u8) |
| 10 | Gallery | [File](../sources/tw10.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/bf5898e79f353bc12b2703a154263c95b70cb492-3000x2000.jpg) |
| 11 | Gallery | [File](../sources/tw11.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/4d95fdc6ad234ab3f14644fd45f36d88ee94b4c8-3000x2000.jpg) |
| 12 | Gallery | [File](../sources/tw12.mp4) | [Source](https://stream.mux.com/qQP8JE012z828KBiFV1HQXVgv18YA01x8TJ7afKVttt200.m3u8) |
| 13 | Gallery | [File](../sources/tw13.mp4) | [Source](https://stream.mux.com/8b02TL27pBoQ2HRV01qYNmxgEsFIwKm00eJ01FIKOT547800.m3u8) |
| 14 | Gallery | [File](../sources/tw14.mp4) | [Source](https://stream.mux.com/uy02qWcT00K4smNHstXuYa4DWyoUrEftbuosT4JABXPB4.m3u8) |
| 15 | Gallery | [File](../sources/tw15.mp4) | [Source](https://stream.mux.com/BPjJHT1N4683vLXZmcW7voOHmKsG8a4G5t2kt5YHm4k.m3u8) |
| 16 | Gallery | [File](../sources/tw16.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/461761951a03e48d5ce4f132f3d84374ebf16619-1050x1400.jpg) |
| 17 | Gallery | [File](../sources/tw17.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/e54307980b67f66c51f9cad8eac2983f8b5cb3fc-1050x1400.jpg) |
| 18 | Gallery | [File](../sources/tw18.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/dc21772d48a2d6061463738a49958ada11fa042e-3000x2000.jpg) |
| 19 | Gallery | [File](../sources/tw19.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/f9f9fa90d5916df26f00f2d8829f9e7a71343796-2200x1467.jpg) |
| 20 | Gallery | [File](../sources/tw20.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/5a811d8e4af5a6c2c55a3f8aad950fbfbe594516-2200x1467.jpg) |
| 21 | Gallery | [File](../sources/tw21.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/e1de5c9e59fea48ebd035a3208baf39b426aafdf-3333x2222.jpg) |
| 22 | Gallery | [File](../sources/tw22.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/69f3173b7456b136809a0e4b27a31f5a178ef48d-1050x1400.jpg) |
| 23 | Gallery | [File](../sources/tw23.gif) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/5fd093a9d792c4b9520c7f40393bfb06f3fcdca9-1050x1400.gif) |
| 24 | Gallery | [File](../sources/tw24.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/dee68a6af3b66867e44924e8a8a6de5d3ed7de0b-3333x2222.jpg) |
| 25 | Gallery | [File](../sources/tw25.mp4) | [Source](https://stream.mux.com/ymeiExWGs2FDa02usSDle02KiITuNkHGaSLFmsUSBcH3k.m3u8) |
| 26 | Gallery | [File](../sources/tw26.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/d8f815c923f1d8bfe8997c71e80e1b91ab9eb0ef-2200x1467.jpg) |
| 27 | Gallery | [File](../sources/tw27.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/f83dc4e03de2ee0790b94839dbec580f1060d94d-3000x2000.jpg) |
| 28 | Gallery | [File](../sources/tw28.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/ce3afdb79a6120674b202161a13d3e79e56ce2dd-2200x1467.jpg) |
| 29 | Gallery | [File](../sources/tw29.jpg) | [Source](https://cdn.sanity.io/images/fmzd4n68/production/5578d21af99ee163e999263ba16793b846a307db-3000x2000.jpg) |
| 30 | Gallery | [File](../sources/tw30.mp4) | [Source](https://stream.mux.com/m018xqxHIpoXs3Op5mcPUrtgnHTMEK3XgTCuzn5WWPAI.m3u8) |

## Gallery maintenance

Run `python3 build-gallery.py Twitch "Twitch"` from the parent brand-expressions directory after editing canonical manifests. The generated gallery embeds the specs and uses local relative links; open `index.html` directly without a server.

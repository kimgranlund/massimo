---
date: 2026-11-03
kind: spike
plan: ../planning/brand-schema.md
---

# Color anchoring spike

Question (brand schema step 3): can Spectrum's generated ramps reproduce a brand's exact colors by tuning the generation inputs alone, or does a brand need exact-color overrides, and if so, does an override break the ramp's contrast order?

Method: `packages/ui-kit/scripts/anchor-spike.ts`. Three published palettes, 15 anchors in all: IBM Carbon (blue 60, gray 100, red 60, green 50, yellow 30), Material 3 baseline (primary, secondary, tertiary, error, neutral) and Atlassian (B400, G300, R300, Y300, P300). For each anchor it takes the nearest generated light swatch (accents against accent families, neutrals against neutral families), measured as ΔE in OKLab × 100, where about 2 is just noticeable. It measures first at the default settings, then after a grid search over hue set, first hue, requested chroma and base chroma (100 generations per palette, about 25 s). Raw results: [anchors.json](2026-11-03-color-anchoring-spike/anchors.json).

## Results

| Palette | Mean ΔE, defaults | Mean ΔE, best fit | Best fit |
|---|---|---|---|
| IBM Carbon | 10.6 | 10.5 | quad, hue 117, chroma 60 |
| Material 3 baseline | 6.2 | 5.3 | radix, chroma 60 |
| Atlassian | 6.4 | 6.1 | quad, hue 252, chroma 60 |

Only one anchor of 15 lands under ΔE 2 (Atlassian G300, 1.6). Splitting the remaining error:

- **Chroma dominates.** Anchors carry +4 to +11 more chroma (OKLCH × 100) than the nearest swatch. For example, IBM blue 60 has C 0.243 against the swatch's 0.130, and Atlassian B400 has 0.201 against 0.102. The engine's chroma envelope peaks at step 9 and falls toward steps 10–12, while brand primaries sit at the gamut edge exactly where the ramp has thinned.
- **Lightness lands between steps.** ΔL is usually 1–4, because step tones are shared by every family and solved from the contrast targets. An anchor rarely sits exactly on one. IBM gray 100 (near black) is ΔL −20: it is darker than step 12, outside the ramp.
- **Hue is mostly close** once the hue grid aligns (±0–12°). Two low-chroma anchors are the exception (Material tertiary −44°, Material neutral +33°), where hue is barely defined.
- **Brand primaries are darker than the kit's solid.** 9 of 15 anchors land at steps 10–11, with Lc 70–78 against the solid's target of 52. Brands use their main color as a dark solid, so a button painted at step 9 would not be the brand color.
- **Exact overrides keep the contrast order.** If each anchor replaces its nearest step exactly, its Lc against the page stays strictly between its neighbors' targets in 15 of 15 cases. The ramp stays monotonic, so the step semantics (backgrounds, borders, solids, text) survive.

## Conclusions

1. **Generator-only fitting is not enough.** Searching the inputs moves the mean ΔE by less than 1. The gap is structural (the chroma envelope and shared tones), not a matter of tuning.
2. **Anchoring has three parts:**
   - Pin a family's hue to the anchor's hue, so a family exists at that hue.
   - Override the anchor's nearest step exactly; the order check above shows this is safe.
   - Re-shape that family's chroma toward the anchor, so the neighboring steps don't look washed out next to it.
3. **A role's solid step should follow its anchor.** When a brand anchors a role's solid (primary, critical), the role maps `solid` to the anchored step instead of step 9. The text-on-solid check (`emphasis.on-solid`) then runs against that step.
4. **Out-of-range anchors are reported, not forced.** An anchor beyond step 12 (IBM gray 100) or above the page tone maps to the nearest end step plus a lint warning, or to the black or white endpoint when its role is ink.

Decision for the brand schema: anchors are exact colors. Hydrate pins each anchor's family hue and overrides the nearest step with the exact color; it re-shapes that family's chroma toward the anchor and points the role's solid at the anchored step. Provenance records each overridden step, and the lint flags an override that breaks contrast order or lands outside the ramp. Generator tuning remains the method for everything the brand does not anchor.

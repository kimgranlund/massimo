---
date: 2026-11-03
kind: evaluation
plan: ../planning/brand-schema.md
---

# Brand reproduction check

Question (brand schema step 6): can an agent given a brief and [author a brand](../guides/author-a-brand.md) reproduce a worked brand?

Method: one fresh agent got the Fjord Ledger brief (`packages/ui-kit/tokens/brand/examples/briefs.md`), the guide, the Brand section of the theming spec, the schema and both catalogues. It was barred from the worked brand's JSON. It authored a brand, then validated, linted and hydrated it. Its brand ([fjord-ledger-reproduced.json](2026-11-03-brand-reproduction/fjord-ledger-reproduced.json)) was compared with the worked one by `describeTheme` on each hydrated theme.

## Results

- The reproduced brand validated and linted clean, with nothing unresolved, on its first attempt.
- Grounding (Swiss International), territory (harbor) and signature (density) match.
- 10 of 13 scales match. The differences: scale sm against md, elevation flat against layered, vibrancy muted against natural. Each is defensible from the brief: denser, flatter and quieter suits "precise and calm".

**Contamination.** The theming spec's Brand section then named each worked brand's grounding, territory and signature, and the agent read it. The three frame matches are therefore not evidence. The 13 scales were not listed anywhere the agent read, so the 10 of 13 stands. The spec now names the worked brands only.

## Gaps the agent reported, and what changed

| Gap | Change |
|---|---|
| The spec gave the answer | the Brand section names the worked brands only, and says why |
| Which rationale keys count | the guide lists the five path forms the lint checks |
| Overriding a grounding's canon, and excluding a canon value | the guide states the precedence (explicit wins), and that `outOfBounds` can exclude a canon value |
| The lint printed one line | the CLI prints brand and theme finding counts separately |
| Anchor `step`, and face `ref` with `family` | the guide covers both; a face `ref` now fills family, descriptor and source |
| No steps for `iconography` and `avoid` | guide steps 11 and 12 |

## Clean rerun

After the fixes, a second fresh agent got the Night Signal brief under the same rules, and was also barred from reports, tests and the Brand page. Its brand ([night-signal-reproduced.json](2026-11-03-brand-reproduction/night-signal-reproduced.json)) validated with no findings and nothing unresolved on its first attempt.

- 9 of 13 scales match the worked brand, and so do the territory (nocturne) and the signature scale (harmony). It chose complementary harmony where the worked brand chose triadic.
- The grounding differs. The worked brand reinterprets Bauhaus against Memphis; the reproduction reacts against Memphis with no positive grounding. Both read the brief's "without the confetti-and-squiggles look" as a reaction against Memphis.
- The other differences: hairline against borderless, layered against floating ("shadows barely read on dark", a sound argument), classic against dramatic type.

Three more guide gaps, now closed:

- What `react-against` does to the rejected canon: the lint now reports overlaps as info (`brand.reacted-canon`), and the guide says so.
- Where an artist or movement outside the catalogue goes: a movement goes in the grounding as a `name`, a person or work in the muse.
- Which scheme anchors are measured in: the light page, unless the anchor gives a `dark` value (see [color](../specs/color.md#anchors)).

## Round 2: briefs that state the frame

Round 1 missed the 0.8 target ([K-001](../kpi/001-brand-reproduction.md)) on the frame decisions, not the scales. A grounding, a territory or a signature that differs costs a quarter of the score, and the briefs never stated those decisions: they left them to inference. A real client brief usually names them ("we love classic Swiss design", "not the Memphis look", "the rim's curve is the one thing to get right"). Each brief now states its heritage and the relation to it, its world, and its one thing that must stand out, without naming any scale value. Three fresh agents then ran under the same isolation rules:

- Fjord Ledger 0.93 (11 of 15 scales)
- Kiln & Cup 0.95 (12 of 15)
- Night Signal 0.92 (10 of 15)

In all three, the grounding, the territory and the signature matched, with no lint warnings and nothing unresolved ([round-2 brands](2026-11-03-brand-reproduction/)).

The runs found three defects, now fixed:

- free-text `outOfBounds` entries printed "undefined" in a lint message;
- a malformed `avoid` key (`color.vibrancy.vivid`) passed silently, and is now an info finding;
- three catalogue palette colors lay beyond the ramp (a test now holds every palette inside it).

They also asked four guide questions, now answered in the guide:

- how to say what the brand is not;
- what a near-black anchor does;
- why a family name can look wrong;
- when a signature must leave its default.

Conclusion (round 1): from a brief and the guide alone, a fresh agent lands on the same territory and signature scale and on about 70% of the scales, with defensible reasons for the rest. The guide is sufficient. The brief leaves the grounding open, and a brief that names one would settle it.

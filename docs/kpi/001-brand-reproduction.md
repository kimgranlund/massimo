---
id: K-001
title: Brand reproduction score
status: active
owner: kim
created: 2026-11-03
measure: node scripts/brand-eval.ts <brief> <candidate.json> (packages/ui-kit), per brief
unit: score 0–1 (mean of scale agreement and the grounding, territory and signature matches)
direction: up
target: 0.8 per brief, with no lint warnings
goals: [G-001]
---

# 001. Brand reproduction

How well a fresh agent, given one brief and [author a brand](../guides/author-a-brand.md) (and barred from the worked brands), reproduces the worked brand from that brief. It measures whether the guide and catalogues carry enough to land on the same brand, not whether the agent is talented.

**Command.** For each brief in `packages/ui-kit/tokens/brand/examples/briefs.md`, run a fresh agent under the rules in [the first report](../reports/2026-11-03-brand-reproduction.md), then score its brand:

```sh
cd packages/ui-kit
node scripts/brand-eval.ts <fjord-ledger | kiln-and-cup | night-signal> <candidate.json> --note "what changed" --log ../../docs/reports/<date>-brand-reproduction
```

Each run appends one row to that report folder's `eval.jsonl`. A row holds:

- the 15 descriptor scales that agree, and which ones differ;
- whether the grounding (ref and relation), the primary territory and the signature scale match;
- the candidate's lint warnings and unresolved questions;
- the score.

**Values** ([eval.jsonl](../reports/2026-11-03-brand-reproduction/eval.jsonl)), every candidate validating with no lint warnings:

| Round | Fjord Ledger | Kiln & Cup | Night Signal | What changed |
|---|---|---|---|---|
| 1 | 0.70 (contaminated) | 0.72 | 0.67 | the guide alone; the briefs left the heritage, world and signature to inference |
| 2 | 0.93 | 0.95 | 0.92 | the briefs state the heritage (and its relation), the world and the one thing that must stand out, as a client would |

Target met in round 2. Every frame decision matches; the remaining differences are scales the briefs leave open (elevation, emphasis, iconography).

**Serves.** The [brand schema plan](../planning/brand-schema.md): the brand is authored first, from a brief.

---
status: proposed
owner: kim
date: 2026-11-03
---

# Brand schema

A plan for a brand authoring workflow. Describing a project or a design starts by capturing its **brand**, a typed object. The brand then **hydrates** four domain parts of the theme: typography, color, geometry and motion. Together they are the full theme the kit renders. This extends [theme-schema.md](theme-schema.md): the Brand schema is that plan's L0 Intent and L1 Character, made concrete and typed. The domain parts are its L2, split by concept.

The model is the `artifact-design` skill ([reference copy](../references/claude-artifacts-skills/artifact-design/SKILL.md)). Before building, it writes a compact plan (subject, color, type, layout, signature), reviews the plan for generic choices, then builds from it. Here that plan becomes a stored, typed object that agents can validate, diff and reuse, not prose scratch work.

## Where we are (2026-11-03)

| Part | Schema today | Manifest / registry | Verified by | Gap |
|---|---|---|---|---|
| Brand | `intent` (an untyped object) and `character` (a string map) are placeholders in `theme.schema.json` | none | nothing | no schema, no vocabulary, no resolver |
| Typography | `typography.{faces, voices, colors}`; `type-ratio` and `type-rhythm` in the shared `parameters` bag | concept `typography`; groups `type-scale`, `faces`, `voices` | `validateThemeObject`; numerals feature detection | faces are free font-stack strings: no descriptors, weights, metrics or sources |
| Color | `color.{spectrum, roles, endpoints}`, validated per field | concepts `vibrancy` and `emphasis`; groups `spectrum`, `roles` | APCA lint (`vibrancy.text-contrast`, `emphasis.on-solid`) | brand colors cannot be pinned; only generator inputs (hue, chroma) exist |
| Geometry | the shared `parameters` bag (unit, border, density, curvature, the container ladder; elevation sits there too) | concepts `scale`, `density`, `space`, `curvature`, `line`, `elevation`; geometry families | 31,487 CSS-against-resolver checks in three engines | not a part of its own; no descriptor layer |
| Motion | the shared `parameters` bag (scale, bounce, springs, intents) | concept `movement`; groups `motion-global`, `springs`, `intents` | the easing check in three engines | not a part of its own; no descriptor layer |

Components have manifests (intent, avoidWhen, constraints, verification records). The token domains do not: they appear only as concept and group entries in `contracts/parameters.json`.

## Target shape

```
brand (L0 + L1)                         authored first, by a person or an agent from a brief
  └─ hydrate(brand) ─► theme v2
        ├─ typography   faces, voices, type scale, text colors
        ├─ color        spectrum settings, roles, endpoints, anchors
        ├─ geometry     unit, density, border, curvature, ladder, elevation
        ├─ motion       scale, bounce, springs, intents
        ├─ icons, scheme
        └─ provenance   per value: brand | descriptor | hand, with a reason
  └─ resolvers ─► tokens (CSS, DTCG, CSV; generated)
describe(theme) ─► nearest brand character (reading, diffs, "start from the nearest theme")
```

### The Brand object

Closed vocabularies wherever a value steers generation. Free text appears only where a person reads it: rationale fields, voice samples and the subject's sources.

| Field | Holds | From artifact-design | Hydrates |
|---|---|---|---|
| `subject` | name, audience, primary job, `sources` (materials, instruments, environment, history), `kind` (product, editorial, tool, campaign, institution) | Subject | the expression budget: how far descriptors may sit from the defaults |
| `color.anchors` | 2–6 named colors, each `{ name, value (any CSS color), role: primary, secondary, neutral, accent or data }` | Color: four to six named colors with exact values and roles | `color` (see Color anchoring) |
| `color.feedback` | `independent` (generated apart from the accent) or explicit anchors for critical, warning, success, info | semantic colors independent of the accent | roles |
| `color.character` | vibrancy (muted, natural, vivid), harmony (mono, analogous, complementary, split, triadic), neutral (cool, true, warm, tinted-from-primary) | specific palette; neutrals related to the accent | spectrum chroma, base, falloff, harmony, tint |
| `type.faces` | display, body, utility: each `{ family, source (system, google, self-hosted with URL), weights, descriptor }` | Type: distinct roles | `typography.faces`, `typography.voices` |
| `type.character` | scale (flat, gentle, dramatic), measure (55–75ch), numerals (tabular, proportional) | type scale; tabular figures | `type-ratio`, `type-rhythm`, numeric voice |
| `form` | scale (xs–xl), density (compact, default, loose), curvature (square, crisp, soft, round, pill) and shape (round, squircle, bevel), line (borderless, hairline, outlined), elevation (flat, layered, floating) | layout creates spacing | `geometry` |
| `movement` | still, calm, lively, playful; reduced-motion stance | motion as an orchestrated moment | `motion` |
| `adaptivity` | light-first, dark-first, both; page tones | color schemes intentionally | scheme, `toneMax`, `darkTone`, endpoints |
| `voice` | tone words (closed set), sample microcopy (action, confirmation, error) | words as design material | not tokens; the guides and examples |
| `iconography` | set, weight | | `icons` |
| `signature` | one concept to push, with a reason | Signature | which descriptor leaves the defaults |
| `avoid` | anti-defaults, plus the built-in list (warm cream, serif and terracotta; near-black with one acid accent; purple-to-blue; pill-everything) | avoid generated-looking defaults | brand lint |
| `rationale` | per field, one line tying the choice to `subject.sources` | "if a choice could be pasted into another subject, revise it" | provenance reasons |

### Domain parts and domain manifests

Theme schema v2 moves the shared `parameters` bag into named parts: `geometry`, `motion`, `typography` (type scale joins faces and voices) and `color`. A v1 migration maps every parameter by its group in `parameters.json`, and the existing member test keeps the split complete.

Each domain gets a manifest (`contracts/domains/<domain>.json`) shaped like a component manifest:

- `concepts` and `inputs`: the members, owned by their export, as in `parameters.json`.
- `descriptors`: the closed scales and the table mapping each scale value to parameters, plus the range each value accepts when read back. Each value becomes a graph node `descriptor:<concept>.<value>`.
- `constraints`: the rules from `theme-constraints.json` that this domain owns.
- `verification`: the checks that prove the domain (geometry check, react check, easing check, APCA lint), as hashed records like the component verification records. A domain goes stale when its resolver changes.
- `avoidWhen` and `useInstead`: for example, "pill curvature on containers: use round".

### Color anchoring

Brand colors are the one place where hydrate is not a table lookup. The Spectrum engine generates ramps from a hue set and chroma; a brand arrives with exact hex values. The resolver:

1. Converts each anchor to HCT and assigns it to a family: its own hue, the nearest generated hue, or a pinned hue added to the set.
2. Fits the spectrum settings (first hue, chroma, base, falloff, tint) to the anchors.
3. Places each anchor at the step whose Lc target is nearest its tone against the page (a primary often lands at step 9).
4. Reports per anchor: the step it landed on, ΔE (OKLab) between the anchor and the generated swatch, and whether an exact-color override is needed. Overrides are allowed and recorded, and the lint flags them when they break the ramp's contrast order.

This is the riskiest step, so it opens with a spike: fit three real brand palettes and measure ΔE before committing to the interface.

### hydrate, describe, lint

- `hydrate(brand) → { theme, provenance, unresolved }` is deterministic from the descriptor tables plus color anchoring. Fields it cannot fill go to `unresolved`, each with a question, never a guess. Hand overrides on the theme win, and provenance records them.
- `describe(theme) → brand.character` gives the nearest descriptor per concept and its distance. It is used for reading, diffs and "start from the nearest saved theme". The round-trip test: describe(hydrate(b)) equals b's character for every descriptor value.
- `lintBrand(brand)` checks the genericness review (an `avoid` hit, a choice with no rationale, more than one pushed concept) and coherence (feedback anchors too close to the primary in hue; a display face without the weights the roles need). `lintTheme` runs after hydrate, as today. Both are advisory: they warn and never block.

### The authoring workflow

1. **Capture.** From a brief, a reference site or a design file, an agent fills the brand object. It returns `unresolved` questions instead of guessing, then asks them in one round.
2. **Review.** `lintBrand`; revise any choice that fails the genericness review.
3. **Hydrate.** Produce theme v2 with provenance.
4. **Render.** In the jig: a Brand page showing the brand object, its anchors against the generated ramps, the faces and the signature, with every other page under the theme, in light and dark, at three densities.
5. **Tune.** Hand edits in the jig land in provenance as `hand`; Copy hands over the brand and the theme together.
6. **Read back.** `describe` on a hand-tuned theme proposes brand character updates, so the brand stays the source of truth.

## Plan

| Step | Delivers | Done when |
|---|---|---|
| 1 | theme schema v2 (domain parts, v1 migration); `contracts/domains/*.json` manifests with verification records; registry nodes for domains | every saved theme migrates and round-trips; each domain manifest lists exactly its export's members; graph has `domain:` nodes |
| 2 | descriptor tables per domain; `describe` and the descriptor resolver | every descriptor resolves inside the parameter ranges; the round trip holds for every descriptor value |
| 3 | spike: color anchoring on three real palettes | a report with ΔE per anchor and step placement; decide the override rule |
| 4 | `brand.schema.json` (generated, like the theme schema), `validateBrand`, `lintBrand`, `hydrate` with provenance and `unresolved` | three worked brands validate, lint and hydrate into themes that pass `lintTheme` |
| 5 | face catalogue: curated stacks and web sources with descriptors, weights and measured metrics | every catalogue face loads in the jig and reports its weights; type lint uses it |
| 6 | the workflow: a brand-authoring skill (capture, review, hydrate, render) and the jig Brand page; Copy and Load carry the brand | three distinct briefs produce three brands whose themes read as different side by side, and an agent can reproduce one from its brief |

Step 1 of [theme-schema.md](theme-schema.md) (the theme object) and step 3 (lint) are built. This plan replaces its steps 2, 4 and 5 and keeps step 6 (scoped themes) as it is.

## Open questions

- Scope of color anchors: hue only (the engine generates the ramp), or exact steps that may break the ramp's contrast order?
- Is the brand stored beside the theme (`brand.json` plus `theme.json`) or inside it (`theme.brand`)?
- Does `voice` stay prose with closed tone words, or get its own small vocabulary for microcopy patterns?
- Font sources: which hosts may a theme name (system, Google Fonts, self-hosted), and who measures metrics: the catalogue or the runtime?

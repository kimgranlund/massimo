---
status: proposed
owner: kim
date: 2026-11-03
---

# Brand schema

A plan for a brand authoring workflow. Describing a project or a design starts by capturing its **brand**, a typed object. The brand then **hydrates** four domain parts of the theme: typography, color, geometry and motion. Together they are the full theme the kit renders. This extends [theme-schema.md](theme-schema.md): the Brand schema is that plan's L0 Intent and L1 Character, made concrete and typed. The domain parts are its L2, split by concept.

The model is the `artifact-design` skill ([reference copy](../references/claude-artifacts-skills/artifact-design/skill.md)). Before building, it writes a compact plan (subject, color, type, layout, signature), reviews the plan for generic choices, then builds from it. Here that plan becomes a stored, typed object that agents can validate, diff and reuse, not prose scratch work.

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
| `grounding` | the cultural heritage, movement, school or tradition the brand stands in: `{ name (e.g. Swiss International Style, Bauhaus, Memphis, Arts and Crafts, Japanese mingei, Brutalism, Californian modernism, Scandinavian functionalism), period, place, principles (3–5 lines), relation: inherit, reinterpret or react against }`, one primary plus optional secondary | one source of visual character, drawn from history | the defaults each territory starts from; the avoid list (what the movement rejects); face descriptors (a movement's typographic canon); the curvature and line character |
| `territories` | 1–3 visual territories: named, bounded worlds the brand may draw from, each `{ name, description, materials, palette (anchor-like colors), textures, light, composition, type, motion, imagery, out-of-bounds }`, one marked `primary` | the subject's materials, environment and instruments, made explicit and bounded | descriptor choices per concept (each territory proposes one value per concept and hydrate takes the primary territory's, unless a field overrides it); candidate color anchors; imagery and icon treatment |
| `muse` | the creative muse: a person, work, object, place or archetype the brand is in conversation with, `{ kind (person, work, object, place, archetype), name, what to take (a quality, never a copy), what to leave }` | the "one real aesthetic risk that serves the subject" | the `signature` (which concept the muse pushes) and its rationale; the expressive end of a territory |
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
| `rationale` | per field, one line tying the choice to `subject.sources`, `grounding`, a territory or the muse | "if a choice could be pasted into another subject, revise it" | provenance reasons |

### Grounding, territories and muse

These three fields are the brand's creative frame. Every closed choice below them (`color`, `type`, `form`, `movement`) has to trace back to one of them, so the frame is what makes a brand specific rather than generic.

- **Grounding** answers where the brand comes from. A movement or heritage comes with principles and a canon: the Swiss International Style brings grotesque faces, grids, flat elevation and a crisp curvature; Arts and Crafts brings humanist and serif faces, warm tinted neutrals and soft curvature. `relation` matters: a brand that reacts against Brutalism takes its principles as the avoid list, not as defaults.
- **Territories** answer what world the brand draws from. They are bounded: `out-of-bounds` lists what a territory excludes, and the brand lint flags a choice that lands there. Two or three territories let one brand serve different surfaces (a product UI from the primary territory, a campaign from a secondary one) without breaking character.
- **The muse** answers what the brand is in conversation with. It sets the one pushed concept (the signature) and its reason. `what to take` names a quality ("the restraint of a Dieter Rams radio", "the color temperature of a Hammershøi interior"), never a copy, and `what to leave` keeps the reference from becoming pastiche.

Precedence in hydrate: explicit fields, then the primary territory, then grounding, then the kit defaults. Provenance records which source set each value (`brand.territory:<name>`, `brand.grounding`, `brand.muse`).

Vocabulary: grounding names and territory archetypes come from a curated catalogue (`contracts/brand-catalogue.json`). Each entry carries its principles, a canon (faces, palette tendencies, curvature, line, elevation and movement descriptors), its known clichés and its sources. Free names are allowed, but they come back from hydrate as `unresolved`, with the nearest catalogue entries listed, until a person confirms or describes them. The catalogue is data and appears in the registry as `grounding:` and `territory:` nodes.

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

1. **Capture.** From a brief, a reference site or a design file, an agent fills the brand object, frame first: grounding, territories and muse, then the closed choices that follow from them. It returns `unresolved` questions instead of guessing, then asks them in one round.
2. **Review.** `lintBrand`. Revise any choice that fails the genericness review, has no trace to the frame, lands out of a territory's bounds, or copies the muse instead of taking a quality from it.
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
| 4 | `brand.schema.json` (generated, like the theme schema), `validateBrand`, `lintBrand`, `hydrate` with provenance and `unresolved`; `brand-catalogue.json` with a first set of groundings and territory archetypes | three worked brands with different groundings validate, lint and hydrate into themes that pass `lintTheme`; every hydrated value traces to a field, a territory, the grounding or the muse |
| 5 | face catalogue: curated stacks and web sources with descriptors, weights and measured metrics | every catalogue face loads in the jig and reports its weights; type lint uses it |
| 6 | the workflow: a brand-authoring skill (capture, review, hydrate, render) and the jig Brand page; Copy and Load carry the brand | three distinct briefs produce three brands whose themes read as different side by side, and an agent can reproduce one from its brief |

Step 1 of [theme-schema.md](theme-schema.md) (the theme object) and step 3 (lint) are built. This plan replaces its steps 2, 4 and 5 and keeps step 6 (scoped themes) as it is.

## Progress

- Step 1 built 2026-11-03. Theme schema version 2 adds the `geometry`, `typography`, `color` and `motion` parts, with `migrateTheme` and `loadTheme` for version 1; the jig's Copy writes v2 and Load accepts both. Each parameter's domain is declared in `PARAMS`. The domain manifests live in `contracts/domains/`, each with a verification record, and the registry gains `domain:` and `constraint:` nodes. The domain tests keep the manifests a partition of the groups, concepts and constraints.

## Decided

- Brand storage (2026-11-03): the brand is its own file beside the theme (`brand.json`; schema `contracts/brand.schema.json`). The theme stays a pure render input, one brand can hydrate several themes (product, campaign), and theme provenance points into the brand by path.

## Open questions

- Scope of color anchors: hue only (the engine generates the ramp), or exact steps that may break the ramp's contrast order?
- Does `voice` stay prose with closed tone words, or get its own small vocabulary for microcopy patterns?
- Catalogue breadth: how many groundings and territory archetypes before it earns its keep, and who curates them (sources required per entry)?
- Can a muse be a living person or a current brand, or only a quality description, to avoid imitation?
- Font sources: which hosts may a theme name (system, Google Fonts, self-hosted), and who measures metrics: the catalogue or the runtime?

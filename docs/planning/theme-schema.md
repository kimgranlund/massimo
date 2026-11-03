---
status: proposed
owner: kim
date: 2026-11-03
---

# Theme Schema

A review of the architecture through one question: what does it take for a coding agent or an LLM to produce, read and change a theme anywhere in the range of visual languages the kit can express, and to generate a net-new one from a creative brief? It proposes a layered Theme Schema with one role per layer, the vocabularies, classifiers and resolvers each layer needs, and an outside-in generation method modeled on the `artifact-design` skill.

## Where we are

The kit is already a function of a small set of inputs (`system.md#the-system-as-a-function`). This table sorts what exists by the role it plays.

| Role | What exists | Where |
|---|---|---|
| Taxonomy | 13 concepts (scale, density, space, curvature, line, elevation, vibrancy, emphasis, typography, movement, state, iconography, adaptivity); parameter groups; geometry families; container families (composite, wrapper, container, area); elevation levels; role families; type roles; spring intents | `contracts/parameters.json`, `contracts/geometry-families.json`, `tokens/elevation`, `tokens/colors/spectrum` |
| Knowledge organization | One owning spec per topic; the registry graph (components, parts, foundations, geometry, contexts, tokens, parameters, concepts and their edges); component manifests | `docs/specs/`, `graph.json`, `components/*/*.manifest.json` |
| Controlled language | Manifest writing rules (one term per concept, mechanism-stated claims); the parameter and concept names | `docs/specs/manifest-language.md` |
| Inputs and their ranges | `PARAMS` (about 50 numbers), `SPECTRUM_FIELDS` (24 settings), role mapping, faces and voices, icon set | `tokens/themes/params.ts`, `tokens/colors/spectrum/config.ts` |
| Resolvers (inputs to values) | Geometry, typography, Spectrum, motion, elevation; CSS computes the same formulas live | `tokens/*`, `styles/*` |
| Validators | `validateTheme` (known parameter, in range), `normalizeSpectrum` (per field); the geometry and React checks (CSS against resolvers) | `tokens/themes/validate.ts`, `apps/studio/*-check.html` |
| Hand-off | Jig Copy JSON (theme, scheme, spectrum settings, roles, faces, voices, howToApply) | `apps/studio` |

## Generative friction

Each item below is a place where an agent generating or editing a theme gets stuck or has to guess.

1. **Two theme formats, neither complete.** A saved theme (`themes.json`, `validateTheme`) holds only `PARAMS` and an icon set. Colors (Spectrum settings, roles), faces and voices exist only in the jig's Copy JSON, which nothing validates or loads. A theme cannot be stored, diffed or reviewed as one object.
2. **No layer between intent and numbers.** Parameters say what they change (`radius-scale` 0–3), not what a value means. Nothing tells an agent that "soft" is about 1, "round" about 2, or that a quiet, editorial brand wants low chroma, a 1.2 type ratio and flat elevation. Every brief → number translation is improvised, so two agents given the same brief diverge.
3. **No coherence rules.** Ranges are checked one parameter at a time. Nothing catches combinations that break the design: surface-contrast 0 with every shadow off (surfaces vanish); a border of 2px at compact density (the composite grows); a bouncy reveal on modal surfaces; a display face without the weights the type roles ask for; roles whose solids fail APCA against their text.
4. **No reverse reading.** There is no way to describe an existing theme in words ("compact, crisp, layered, muted"), so an agent cannot compare a theme to a brief, summarize a change, or start from the nearest existing theme.
5. **Fixed constants sit outside the schema.** The control height (6u + 2I), the slot (6u), the 3u curvature, 10px + u fonts and the role step table are design constants. They are listed (`constants` in the parameters contract) but not themeable, so some visual languages (taller controls relative to type, a different role step map) are unreachable. This is right for a system, but the schema should say so explicitly, so a generator knows to stop rather than fake it.
6. **Thin vocabularies for type and icons.** Faces are font stacks with no descriptors (geometric, humanist, grotesque, slab, mono; contrast, width, x-height), and icon sets have no character (stroke weight, corner treatment, fill). These are the concepts where a brand's character lives most, and they are the least described.
7. **Theme scope.** Themes apply at the document root; the jig redeclares derived tokens on its canvas (`unitTokenCss`, `motionTokenCss`, `elevationTokenCss`). A theme per region or per product surface needs the same redeclaration, which is a hand-written step today.
8. **No evaluation hook.** The checks prove CSS equals resolvers. Nothing scores a theme against its brief or flags a generated-looking default.

## Proposal: a layered Theme Schema

One theme object with four layers. Each layer has one role, is written in its own vocabulary, and is resolved into the next by a named resolver. An agent can work at any layer; lower layers stay overridable.

| Layer | Role | Written as | Resolved by |
|---|---|---|---|
| L0 Intent | why: subject, audience, primary job, character words, references, one signature | controlled natural language (closed adjective sets per concept, free text only in `rationale`) | intent classifier → L1 |
| L1 Character | what it should feel like, per concept, on closed scales | one descriptor per concept (see below) | descriptor tables → L2 (deterministic) |
| L2 Parameters | the exact inputs | today's `PARAMS`, Spectrum settings, roles, faces, voices, icons, density | the existing resolvers → L3 |
| L3 Tokens | values | generated CSS variables, DTCG, CSV | (generated; never edited) |

Plus three cross-cutting parts: **constraints** (coherence rules over L1 and L2), **provenance** (which layer set each value: intent-derived, character-derived, or hand-tuned, with a reason), and **evaluation** (checks that must pass before a theme is accepted).

### L1 descriptors (closed scales)

| Concept | Scale | Maps mainly to |
|---|---|---|
| Scale | xs, sm, md, lg, xl | `unit` |
| Density | compact, default, loose | `density` |
| Space | tight, balanced, airy | the ladder (`pad-*`, `gap-*`) |
| Curvature | square, crisp, soft, round, pill; shape: round, squircle, bevel | `radius-scale`, `corner-shape`, container magnitudes |
| Line | borderless, hairline, outlined | `border`, surface contrast |
| Elevation | flat, layered, floating | `shadow-strength`, `surface-contrast`, shadow per level, `card-raised` |
| Vibrancy | muted, natural, vivid; harmony: mono, analogous, complementary | Spectrum chroma, base, falloff, harmony |
| Emphasis | quiet, balanced, loud | role mapping, solid vs subtle defaults |
| Typography | voice pairing (from face descriptors); scale: flat, gentle, dramatic | faces, voices, `type-ratio`, `type-rhythm` |
| Movement | still, calm, lively, playful | `motion-scale`, `motion-bounce`, springs, intents |
| Iconography | set + weight | `icons` |
| Adaptivity | light-first, dark-first, both | default scheme, endpoint tones |

Each descriptor value is a row in a descriptor table: the parameter values it resolves to, plus the range it accepts when read back (for inference). The tables are data, not prose, so they are testable and graph nodes (`descriptor:curvature.soft`).

### Files

- `contracts/theme.schema.json`: the JSON Schema of a theme object (all four layers, constraints, provenance), the single format the jig's Copy, saved themes and generators all emit and accept.
- `contracts/theme-descriptors.json`: the closed vocabularies and their descriptor → parameter tables, with a `concept` on each (extends `contracts/parameters.json`).
- `contracts/theme-constraints.json`: coherence rules, each with an id, a predicate over parameters, a severity, and a fix hint (for example `elevation.visible`: surface-contrast > 0 or some shadow > 0).
- `tokens/themes/`: `resolveTheme(theme)` (L0/L1 → L2 with provenance), `describeTheme(params)` (L2 → nearest L1, for reading and diffs), `lintTheme(theme)` (constraints, plus APCA on roles), `themeScopeCss(theme, selector)` (the redeclaration for a scoped theme).
- Registry: `descriptor:` and `constraint:` nodes, `resolvesTo` and `checks` edges, so `--find soft` and `--assembly` reach them.
- CLI: `npm run theme -- --resolve brief.json`, `--describe <theme>`, `--lint <theme>`, `--diff <a> <b>`.

### Classifiers and resolvers

Following the classify-and-resolve pattern, each step has a closed output set, an explicit unclassified route, and a contract:

- **Intent classifier** (LLM): brief → L0 fields and one L1 descriptor per concept, each with a confidence and the brief phrase that justified it. Anything unclear is returned as `unresolved` with a question, never guessed.
- **Descriptor resolver** (deterministic): L1 → L2 from the tables; hand overrides win and are recorded in provenance.
- **Theme linter** (deterministic): constraints and contrast over the resolved L2, returning violations with fix hints.
- **Theme describer** (deterministic): L2 → nearest L1, with the distance; used for reading, diffs and "start from the nearest saved theme".
- **Evaluator**: the existing geometry and React checks, plus a rendered specimen (the jig's pages under the theme) for human or model review against L0.

## Generating net-new themes: outside in

The artifact-design skill decomposes a creative intent into a compact plan (subject, color, type, layout, signature), reviews it for genericness, then builds from the plan. A theme skill does the same, but its output is a theme object, not a page.

1. **Subject.** Name the brand or product, the audience, the primary job, and one source of visual character drawn from the subject (its materials, instruments, history, environment). No source, no theme: ask.
2. **Character.** Choose one L1 descriptor per concept, each with a one-line reason tied to the subject. Concepts without a reason take the defaults and are marked so.
3. **Signature.** Pick one concept to push (a distinctive curvature, an unusual type pairing, a vivid harmony, a still motion world) and keep the others quieter.
4. **Genericness review.** Reject any choice that could be pasted unchanged into another brand's theme, and the known defaults (warm cream with serif and terracotta; near-black with one acid accent; purple-to-blue; everything pill-rounded and floating). Revise before resolving.
5. **Resolve.** L1 → L2 through the descriptor tables; tune L2 by hand only where the tables cannot reach, and record why.
6. **Lint.** Run the constraints and contrast; fix violations or justify them.
7. **Render and review.** Load the theme in the jig (Copy and load use the same schema), look at every page in light and dark at all three densities, and check it against L0. Iterate from the step where the problem started, not by nudging numbers.
8. **Hand off.** Save the theme object; the provenance tells the next agent what is intended and what is free to change.

Precedence, as in artifact-design: the user's words, the brand's existing system, the schema's constraints, then the skill's defaults.

## Plan

| Step | Delivers | Done when |
|---|---|---|
| 1 | `theme.schema.json`; saved themes and jig Copy/Load use it (Spectrum, roles, faces, voices, density, elevation included) | a theme round-trips jig → file → jig unchanged; `validateTheme` validates the whole object |
| 2 | `theme-descriptors.json` and `resolveTheme` / `describeTheme` | every descriptor resolves inside the parameter ranges; describe(resolve(d)) = d for every descriptor |
| 3 | `theme-constraints.json` and `lintTheme` (with APCA on roles) | each rule has a passing and a failing fixture |
| 4 | registry nodes and the `theme` CLI | `--find soft`, `--describe`, `--lint` work from the root |
| 5 | the theme-generation skill (steps above) with three worked briefs | three distinct briefs produce three themes that pass lint and read as different in a side-by-side specimen |
| 6 | scoped themes (`themeScopeCss`) | a region can carry its own theme without hand-written redeclaration |

## Open questions

- Descriptor granularity: three to five values per concept, or a continuous position with named anchors?
- Should fixed constants become a guarded L2 tier (structural parameters with warnings), or stay outside the schema?
- Face descriptors: a curated catalogue of stacks with metrics, or measured at runtime (as the numerals specimen does)?
- Where does the intent classifier run: in the skill (model) only, or also as a deterministic keyword pass for common briefs?

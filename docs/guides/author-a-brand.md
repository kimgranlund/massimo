# Author a brand

Steps for turning a brief, a reference site or a design into a brand, and the brand into a theme. The rules: [theming, Brand](../specs/theming.md#brand); the design: [brand schema plan](../planning/brand-schema.md). Three worked brands and the briefs that produced them: `packages/ui-kit/tokens/brand/examples/` and [their briefs](../../packages/ui-kit/tokens/brand/examples/briefs.md).

## 1. Capture the frame first

Write `brand.json` (schema `packages/ui-kit/contracts/brand.schema.json`), starting with the fields that make a brand specific. Choose every closed value after them, and from them.

1. `subject`: name, audience, primary job, kind, and at least one source of visual character taken from the subject itself (its materials, instruments, environment or history). With no source, ask; never invent one.
2. `grounding`: the heritage or movement the brand stands in. Use a catalogue `ref` (`npm run registry -- --find <term>` lists `grounding:` nodes) and its `relation`. `inherit` takes the canon, `reinterpret` takes it and departs where the subject says, `react-against` takes nothing and puts the canon on the avoid list. A movement outside the catalogue goes in as a `name`; hydrate returns it as a question.
3. `territories`: 1–3 bounded worlds (materials, light, palette, imagery), one marked `primary`, each with `outOfBounds` as `<scale>.<value>` entries the world excludes. Use a catalogue `ref` (`territory:` nodes) where one fits.
4. `muse`: what the brand is in conversation with, with `take` (a quality, never a copy) and `leave`.

## 2. Choose from the frame

5. `color.anchors`: 2–6 exact brand colors, each with its role. Keep feedback colors independent of the accent unless the brand owns them.
6. `type.faces`: display, body and utility, each with a descriptor, a source and the weights you need.
7. Closed choices: `form` (scale, density, space, curvature, corner, line, elevation), `color.character`, `type.character`, `movement`, `adaptivity`. Leave out a scale the frame does not speak to: the territory, then the grounding, fill it.
8. `signature`: the one scale the brand pushes, with a reason tied to the muse or the territory. Keep the others quieter.
9. `rationale`: one line per explicit choice, keyed by its path (`form.curvature`), naming the source in the frame it comes from.
10. `voice`: tone words and three microcopy samples (an action, a confirmation, an error).

## 3. Review, hydrate, render

```sh
cd packages/ui-kit
npm run brand -- validate path/to/brand.json
npm run brand -- lint path/to/brand.json      # brand findings, then the hydrated theme's lint
npm run brand -- hydrate path/to/brand.json   # the theme and the open questions
```

- Answer every open question (`unresolved`) in one round with the person; never fill one with a guess.
- Treat each lint warning as a design question. A cliché, an out-of-bounds value or an idle signature means revising the choice, starting at the step where it came from. The lint never blocks.
- In the jig (`npm run studio`), **Load** the brand JSON (or Apply a worked brand on the Brand page). Every page renders under it. Look at Home, Components and the Brand page in light and dark, at all three densities. The Brand page shows where each value came from, the anchors beside their steps, the faces and voice, and both lints.
- Tune by hand in the panel only where the descriptors cannot reach; the Brand page's Live column shows what moved. **Copy** writes the `{ brand, theme }` bundle: the brand stays the source, and the theme carries the hand tuning.

## 4. Hand off

Save `brand.json` beside the theme. A theme saved in `tokens/themes/themes.json` takes the hydrated theme (or the bundle's tuned `theme`), under the brand's name. Run `npm run ui-kit:test`.

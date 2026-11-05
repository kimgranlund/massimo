# Author a brand

Steps for turning a brief, a reference site or a design into a brand, and the brand into a theme. The rules: [theming, Brand](../specs/theming.md#brand); the design: [brand schema plan](../planning/brand-schema.md). Three worked brands and the briefs that produced them: `packages/ui-kit/tokens/brand/examples/` and [their briefs](../../packages/ui-kit/tokens/brand/examples/briefs.md).

## 1. Capture the frame first

Write `brand.json` (schema `packages/ui-kit/contracts/brand.schema.json`), starting with the fields that make a brand specific. Choose every closed value after them, and from them.

1. `subject`: name, audience, primary job, kind, and at least one source of visual character taken from the subject itself (its materials, instruments, environment or history). With no source, ask; never invent one.
2. `grounding`: the heritage or movement the brand stands in. Write 2–5 `principles`: what the brand takes from it. When you `reinterpret`, say what departs in the `grounding.primary` rationale. Use a catalogue `ref` (`npm run registry -- --find <term>` lists `grounding:` nodes) and its `relation`. `inherit` takes the canon, `reinterpret` takes it and departs where the subject says, `react-against` takes nothing and puts the canon on the avoid list. A movement outside the catalogue goes in as a `name`; hydrate returns it as a question. A person or a single work (an artist, a building) is a muse, not a grounding. To say what the brand is not, add that movement as `grounding.secondary` with `react-against`; use `avoid` only for specific values. Reacting against a grounding is automatic: its canon adds nothing, and the lint reports as info any choice that matches the rejected canon. Keep such a choice if the territory or the subject wants it.
3. `territories`: 1–3 bounded worlds (materials, light, palette, imagery), one marked `primary`, each with `outOfBounds` as `<scale>.<value>` entries the world excludes. Give every territory its own `name` and `description`. Add a catalogue `ref` (`territory:` nodes) when one fits: it supplies the archetype's canon and bounds underneath yours.
4. `muse`: what the brand is in conversation with, with `take` (a quality, never a copy) and `leave`.

## 2. Choose from the frame

5. `color.anchors`: 2–8 exact brand colors, each with its role (one anchor per role). Hydrate places each at the step whose contrast against the light page is nearest, at render time, so the theme stores no step. `npm run brand -- hydrate` prints where each anchor lands (`anchors`: step, contrast, order), and so does the jig's Brand page; give `step` (2–12) only to pin one. A brand that leads dark can give an anchor its own `dark` color, placed against the dark page the same way. A near-black or near-white anchor lies beyond the ramp and draws `vibrancy.anchor-range`. Give the brand's printed ink and page as `ink` and `ground` anchors instead: they pin the neutral ramp's ends, and in dark the two swap (`dark` overrides that). Up to 10 anchors in all. The family keeps its generated name (a green anchor may sit in the family called "indigo"); the anchor re-hues it, so the name does not matter. A brand's main color is usually a dark solid: landing on steps 8–12 moves the role's solid there. A strong key color stays on the solids and text by default, so the tints match the rest of the system; give `reach: 'ramp'` to a brand whose tints should carry the color too. Keep feedback colors independent of the accent unless the brand owns them.
6. `type.faces`: display, body and utility. Prefer a [face catalogue](../specs/typography.md#face-catalogue) entry: `ref` alone (its id) fills the family and descriptor, and hydrate adds its stylesheet. A face outside the catalogue needs `family`, `descriptor` and `source` (and an https `url` when self-hosted); it comes back as a question, because its weights are unknown. `type.weights` sets the display and heading voice weights when a brand's headlines are not bold.
7. Closed choices: `form` (scale, density, space, curvature, corner, line, elevation), `color.character`, `type.character`, `movement`, `adaptivity`. Leave out a scale the frame does not speak to: the primary territory, then the grounding, fill it. An explicit choice always wins over both. To depart from the grounding's canon, set the scale explicitly and say why in its rationale. To keep a canon value out entirely, list it in the territory's `outOfBounds`; the lint then flags it if it ever ends up chosen.
8. `signature`: the one scale the brand pushes, with a reason tied to the muse or the territory. Its value must leave the kit default (the lint checks this). If the grounding or territory already sets it, you need not restate it. Set a scale explicitly only to depart from the frame or to pin your signature. Keep the others quieter.
9. `rationale`: one line per explicit closed choice, keyed by its path: `form.<scale>`, `color.character.<scale>`, `type.character.<scale>`, `movement`, `adaptivity`, `iconography.set`. The lint asks for exactly these. Other keys (`color.anchors.0`, `grounding.primary`) are welcome, but the lint does not check them.
10. `voice`: tone words and three microcopy samples (an action, a confirmation, an error).
11. `iconography`: the icon set (phosphor, lucide, tabler) and a weight that matches the line character.
12. `avoid`: brand-wide anti-choices as `<scale>.<value>` (the lint flags them) or free text, including what a grounding you react against stands for. A value already in the primary territory's `outOfBounds` needs no repeat here; `avoid` is for what the brand rejects whatever the territory.

## 3. Review, hydrate, render

```sh
cd packages/ui-kit
npm run brand -- validate path/to/brand.json
npm run brand -- lint path/to/brand.json      # brand findings, then the hydrated theme's lint, then the counts of each
npm run brand -- hydrate path/to/brand.json   # the theme and the open questions
```

- Answer every open question (`unresolved`) in one round with the person; never fill one with a guess.
- Treat each lint warning as a design question. A cliché, an out-of-bounds value or an idle signature means revising the choice, starting at the step where it came from. The lint never blocks.
- In the jig (`npm run studio`), **Load** the brand JSON, Apply a worked brand on the Brand page, or pick a reference brand under Start from in the panel's Brand tab. Every page renders under it. Look at Home, Components and the Brand page in light and dark, at all three densities. The Brand page shows where each value came from, the anchors beside their steps, the faces and voice, and both lints.
- Tune by hand in the panel only where the descriptors cannot reach; the Brand page's Live column shows what moved. **Copy** writes the `{ brand, theme }` bundle: the brand stays the source, and the theme carries the hand tuning.

## 4. Hand off

Save `brand.json` beside the theme, then build what the app loads:

```sh
cd packages/ui-kit
npm run brand -- build path/to/brand.json --out path/to/app/public/brand          # the theme on the document root
npm run brand -- build path/to/brand.json --out path/to/app/public/brand --scope  # or inside [data-ui-scope="<name>"]
```

It writes `<name>.css` (with `--scope`, `<name>.scope.css`; load it after the kit CSS), `<name>.fonts.html` (the font `<link>` tags for the document head) and `<name>.theme.json` (the hydrated theme). Rebuild whenever the brand changes; the files are generated. Massimo brands itself this way. `apps/studio/brand/massimo.brand.json` is built by `npm run brand:studio` into `apps/studio/public/brand/`. The jig's own panel wears the scoped build (`data-ui-scope="massimo"`), while its canvas keeps the theme being tuned. `apps/studio/brand-demo.html` loads only the kit and the root build. `check:browsers` checks both in every engine.

To keep a brand inside the kit instead, save its hydrated theme (or a bundle's tuned `theme`) in `tokens/themes/themes.json` under its name. Run `npm run ui-kit:test`.

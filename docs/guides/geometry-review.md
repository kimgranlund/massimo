# Geometry review

The acceptance checklist every new or reshaped component passes before it ships. The rules live in [geometry](../specs/geometry.md); this guide is the review order. Items marked **enforced** fail `npm run ui-kit:test` when missing (`packages/ui-kit/test/geometry-acceptance.test.ts`); the others need eyes and are recorded in the component's verification record notes.

1. **Family** (enforced). The component is a member of a geometry family in `packages/ui-kit/contracts/geometry-families.json` (control, field, field-row, btg, choice, track, swatch, swiper, container, …), and the family names at least one resolver exported from `tokens/geometry/resolve.ts` that returns every length the component renders.
2. **Unit.** Every length derives from u (or the family's local unit u′). Recipes use u-based tokens or geometry variables, never literal lengths (strict tokens reject non-tokens; one-offs need `[..]` and a reason). The component follows `size` / `data-size` subtrees.
3. **Heights and slots.** Control rows 8u, slots 6u, composite items 7u inside a 0.5u edge. Icon slots have a set size; icons use sm / md / lg (carets sm).
4. **Construction pattern.** Labelled parts are `[leading] [prefix] [contents] [suffix] [trailing]`: 1u beside a slot, 2u at a bare edge, 0.5u between text parts; absent parts take no space.
5. **Border budget.** The border lives inside the padding (inset − B, B = min(border, u/2)); a transparent border keeps its space in every state; the outer size is identical at B = 0 and B = 1.
6. **Radius by family.** Control min(3u·s, h/2); wrapper concentric (child radius + padding); container padding × min(1, s); area 0. Nested radii are R − inset; corner shape applies.
7. **Type.** Text uses a type role or 10px + u at line height 1.2 capped at the slot; text and slots do not shrink with density.
8. **Spacing.** Paddings and gaps come from the container ladder (`pad.*`, `gap.*`, `inset.*`); the `gap` attribute is honoured.
9. **Floating layers.** Offset 1u from the anchor, min width = anchor width, max height = available − u, family radius, flips when space runs out, Base UI positioner variables exposed.
10. **Growth.** Long labels, u = 2 and tight budgets grow the container; slots and artwork never shrink to fit; RTL mirrors.
11. **Focus.** The keyboard ring never changes dimensions; inside a group it stays within the group contour.
12. **Parity.** The React renderer has identical computed geometry (`react-check.html`, `"fails": []`).
13. **Evidence.**
    - Resolver unit tests in `packages/ui-kit/test/geometry.test.ts`.
    - Rows in `packages/ui-kit/docs/geometry.csv` for the family (enforced) and the DTCG output (`npm run geometry:csv`, `npm run tokens:dtcg`).
    - `apps/studio/geometry-check.html` renders every member tag and compares it with the resolver (enforced: the tag appears), sizes × borders × icon sizes, `"fails": []`.
    - A size-ladder metrics family in the jig (`LADDER_METRICS` in `apps/studio/src/pages/shared.tsx`, named by the family's `ladder` field; enforced) and a row on the Geometry page.
    - Light and dark screenshots at u = 3, the theme unit and 6.

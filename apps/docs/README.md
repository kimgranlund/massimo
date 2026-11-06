# Component docs

`apps/docs` is the public component site, served at `/massimo/docs/` beside the studio. Run it with `npm run docs` from the root.

The site opens on the System and Guides pages (`src/foundations/`). Their numbers come from the kit's resolvers and exports; Accessibility measures the live theme, and Theming runs the real color engine, loaded with that page. There are no hand-written component pages. `src/content.ts` reads every `*.manifest.json` and `*.examples.json` in the kit, and `src/ComponentPage.tsx` is the one template. To change a page, change the component's manifest or examples.

- Every page belongs to one sidebar group (`src/groups.ts`).
- A component needs a manifest node and at least one example with that node as its `subject`. `npm run coverage -w @massimo/docs` fails otherwise, and the build runs it.
- React code is derived from the example's markup (`src/react-code.ts`). Examples built from parts or slots, and components whose React props differ from their attributes, show the import and the React props instead.
- `scripts/brands.ts` builds every reference brand with a `brand.json` into `public/brands/` (git-ignored), and the Theme select loads one on demand.
- `npm run check:browsers` walks every page in each engine. `npm run lighthouse` covers the site's index after a build.

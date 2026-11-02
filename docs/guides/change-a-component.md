# Change a component

Steps for changing an existing ui-kit component or adding one. The rules and the full what-changes-together table are in [authoring](../specs/authoring.md); manifest wording in [manifest language](../specs/manifest-language.md). Commands run from the repository root.

1. Find it and read its bounded view:
   ```sh
   npm run registry -- --find <term>
   npm run registry -- --assembly component:<id>
   npm run registry -- --packet author web-component component:<id> --page 0
   ```
   Check `avoidWhen` before adding a new component; reuse one whose intent fits.
2. Change the source in `packages/ui-kit/components/<folder>/` (element, React renderer) and, when needed, `dom/`, `contracts/components.json`, `contracts/states.json`, and the geometry resolver with its CSS twin (`tokens/geometry/resolve.ts` and `styles/geometry.ts` together).
3. Regenerate what mirrors source, then write the human fields the generator leaves (a new property's `description` or `inspector`, a new event's `trigger`):
   ```sh
   npm run manifests -w @massimo/ui-kit
   npm run registry:graph -w @massimo/ui-kit
   ```
4. Update the guide (`<folder>.md`) and examples (`<folder>.examples.json`) in the same commit; update [components](../specs/components.md) or [geometry](../specs/geometry.md) when behavior or lengths change.
5. After a length or type change, regenerate the token outputs:
   ```sh
   npm run geometry:csv -w @massimo/ui-kit
   npm run tokens:dtcg -w @massimo/ui-kit
   ```
6. Check, then stamp the verification record (it stamps only when its checks pass):
   ```sh
   npm run ui-kit:test
   npm run ui-kit:typecheck && npm run typecheck -w @massimo/studio && npm run ui-kit:build
   npm run verification -w @massimo/ui-kit -- run <folder>
   ```
7. Look at it in the jig (`npm run studio`) in light and dark, and open `/geometry-check.html` and `/react-check.html`; each prints `"fails": []` when it agrees. Say which checks ran.

A new component also needs a `define('ui-<tag>', …)`, a `package.json` export, the tag in `GEOMETRY_SCOPE` and `styles/pending.ts`, JSX types in `apps/studio/src/canvas/jsx.d.ts`, a specimen on the canvas, a manifest and a verification record ([authoring](../specs/authoring.md#change-together)).

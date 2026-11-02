# Registry and manifests

How the kit describes itself so a person, a tool or an agent can find a component, decide whether it fits, and build or change it without reading the whole package. Modeled on maison-ui's component graph, sized for this kit.

## Pieces

All paths are relative to `packages/ui-kit`.

| File | Holds | Written by |
|---|---|---|
| `registry.json` | Entry: workflows, CLI commands, delivery rules | people |
| `system.manifest.json` | Identity, authority order, routes to specs, foundations, contract index, packet limits | people |
| `graph.json` | Every graph ID (kind, source, availability, search terms) and every edge | `npm run registry:graph` (never by hand) |
| `components/<name>/<name>.manifest.json` | One folder's graph fragment: component and part nodes, edges, renderers | people, except the [generated fields](#generated-manifest-fields) (`npm run manifests`) |
| `components/<name>/<name>.md` | The guide: intent, usage, anatomy, keyboard, geometry, renderers | people |
| `components/<name>/<name>.examples.json` | Runnable markup per node | people; mounted by tests |
| `components/<name>/verification/<name>.verification.json` | Checks, bound source hashes, latest passing run | `npm run verification -- run <name>` |
| `contracts/*.json` | Schemas and shared contracts: components, parts, composition, geometry families, foundations, states, tokens | people |

## Folder layout

One folder per element module. A folder may hold several public components (`btg`: badge, tag, chip; `choice`: checkbox, radio, switch; `listbox`: listbox, segmented, option; `range`: range, progress; `color`: swatch, palette). The CSS-only container tags live in `components/container/` with a manifest and no module.

```
components/button/
  button.element.ts        web component (registers ui-button on import)
  button.react.tsx         React renderer
  button.recipe.ts         Panda slot recipe (styles)
  button.manifest.json     graph fragment
  button.md                guide
  button.examples.json     examples
  verification/button.verification.json
```

Styles are the folder's slot recipe module, named by the manifest's `styleSource` (`{ format: 'panda-slot-recipe', module: './<name>.recipe.ts' }`): one recipe per component node, exported under the node's name and registered in the preset. Its slots are `root` plus one per owned part (the part's last `[data-part=x]` or `[data-x]`); `test/recipes.test.ts` fails when a manifest's parts and its recipe's slots differ. Foundations (geometry variables, conditions, reset, typography, the FOUC guard) stay in `styles/`. The CSS-only containers have a recipe too (`container.recipe.ts`), also emitted on their tags ([components](components.md#styles)).

## Graph IDs

| Prefix | Meaning | Source |
|---|---|---|
| `component:` | A public tag (`ui-*`) | manifest node |
| `part:` | Anatomy; owning a part does not make it an insertion slot unless its record says so | manifest node, or `contracts/parts.json` for shared parts |
| `foundation:` | A governing system (colors, typography, geometry, motion, icons, states, element, form-element, slots, modality, pending) | `contracts/foundations.json` |
| `geometry:` | A geometry family and its resolvers | `contracts/geometry-families.json` |
| `context:` | A place a component may sit; containers `establish` one | `contracts/composition.json` |
| `tokens:` | A token group: color roles, type roles, font sizes, motion, geometry parameters, spacing, the container ladder, sizes, radii, borders and shadows, conditions; each lists its Panda paths under `panda` | `contracts/tokens.json` |

IDs are identities, not paths: moving a folder changes `source`, not the ID. Availability: `implemented` (registered element), `css-only` (container tags).

## The manifest

Schema: `contracts/component-manifest.schema.json`. File-level fields: `primary`, `module`, `registration` (`on-import` or `none`), `documentation`, `examples`, `contract` (JSON Pointer into `contracts/components.json`; a node may override it), `stateContract`, `styleSource`, `independentLayers` (behavior, DOM and geometry modules usable without the element), `nodes`, `edges`, `renderers`.

A component node carries:

- `intent`: the user action or content purpose, a verb and an object.
- `properties`: every `static properties` entry with `type`, `default`, `attribute`, `reflects` (generated), optional `enum` and `description`, and an `inspector` control for generated editors (written by people, kept by key).
- `attributes`: attribute-only inputs (read by CSS or once at connect), such as `size`, `icon-size`, `gap`.
- `events`, `methods`, `semantics` (role, form association, form value, keyboard, accessible name), `content` (who owns children), `layout` (default `display` and inline `sizing`).
- `constraints`: behavior a reader must respect that the types cannot express.
- `avoidWhen`: `{ when, reason, useInstead? }`. `useInstead` is a conditional recommendation, not a replacement or permission to compose.
- `searchTerms`: discovery phrases, not aliases.

Relationships:

| Relation | Meaning |
|---|---|
| `extends` | The base: `foundation:element` or `foundation:form-element` |
| `usesFoundation` | Follows the foundation's policy; every component has colors, typography, geometry, motion and states |
| `usesGeometry` | Its geometry family (must match `contracts/components.json`) |
| `usesTokens` | Token groups it consumes |
| `ownsPart` | Its anatomy |
| `acceptsChild` / `requiresParent` | Public child relationship; required parent (several `requiresParent` edges mean one of them) |
| `allowedIn` | Supported contexts (must match the contract's `allowedParents`) |
| `establishes` | A container creates this context |
| `uses` | Depends on another capability (a component, icons, slots) |

Renderers: `webComponent` (required), `react`, `html` (plain markup styled by the kit CSS through `data-ui` selectors). Status is per renderer: `completed` needs a module or documentation and a verification record pointer. `react.props` (generated) maps each graph ID to its React props: `inherits` (base types the kit does not declare, such as `Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>`) and `props`, one TypeScript-style line per declared prop (`size?: number = 50 // JSDoc description`). `--assembly` shows them under `react`.

## Generated manifest fields

`npm run manifests` (`scripts/manifests.ts`; `--check` exits 1 when stale) rewrites only the fields that mirror source and keeps every other byte:

| Field | Source |
|---|---|
| component `class`, `extends`, `semantics.formAssociated`, the `extends` edge | the registered element class |
| `properties[].key`, `type`, `default`, `attribute`, `reflects` (one per `static properties` key, in order) | the class's `static properties`; `enum`, `description` and `inspector` are kept by key, a new key gets a default inspector control |
| `events[].name`, `type`, `bubbles`, `cancelable` | every `new Event` / `new CustomEvent('<name>', {…})` in the node's class or a base class in the folder's `*.element.ts` (acorn over the type-stripped source); `trigger` and `detail` are kept by name, a new event gets an empty `trigger` that the tests reject. Events the source does not dispatch (the button's managed native `click`) stay as written |
| `usesGeometry`, `ownsPart`, `allowedIn` edges | `contracts/components.json` (`geometryFamily`, `parts`, `allowedParents`), in contract order, where the node's edges of that relation were |
| `renderers.react.props` | the React module's types (`scripts/react-props.ts`) |

Everything else is written by people: intent, attributes, methods, the rest of semantics, content, layout, constraints, avoidWhen, searchTerms, parts, the other edges and the renderer records.

The React props come from a small parser of the module's type text, because node strips types and acorn never sees them. It reads `interface … extends … { … }` and `type … = …` declarations (local, or imported from another `.tsx` module by a relative import), intersections, type literals, `Omit<…>` over a declared type, and members with their JSDoc; a base the kit does not declare stays as text under `inherits`. The props type of an export is the annotation on the first parameter of `export function Name(…)`, or of the first `function` in the factory of `export const Name = factory(…)`; defaults are that parameter's destructuring defaults. Any other syntax throws (`test/react-props.test.ts`), so a renderer that outgrows the parser fails loudly instead of being misread.

## The construction pattern

Every labelled component shares one anatomy, recorded as shared parts:

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
part:slot-leading  part:slot-prefix  part:slot-contents  part:slot-suffix  part:slot-trailing
```

Button, option, tag, chip and the choices sort authored children into these parts; the input control and select trigger have the same parts around their editor and value. Spacing: [geometry](geometry.md).

## Choose a component

1. `npm run registry -- --start` for authority, routes and workflows.
2. `npm run registry` lists components with intent and layout; `--find <term>` searches IDs, tags, paths and search terms (case and separator insensitive, word-start prefixes, no synonyms).
3. `npm run registry -- --assembly component:select` gives the bounded view: intent, constraints, contract, registration, paths, geometry, parts, children, parents, contexts and alternatives with their availability.
4. Check `avoidWhen` against the task. When an entry applies, look up its `useInstead` and check that one against the original intent; do not substitute recursively.
5. Read the guide and contract (`--read components/select/select.md`, `--read contracts/components.json#/components/select`).
6. For implementation, request a packet: `--packet consumer web-component component:select --page 0`.

Exact lookup (`npm run registry -- component:chip`) returns the node, contract and documentation paths, registration, foundations, outgoing and incoming edges and the referenced records' locations.

`--audit-recommendations` lists every `avoidWhen` entry with its target's availability; a missing or self-referencing target fails.

## Delivery

- Default output is the whole JSON response.
- `--page 0` returns bounded pages of at most 4,500 bytes including the envelope: `{ complete, offset, length, sha256, contentSha256 (first page), next: { args }, content }`. Run `next.args` until `complete` is true. Offsets count code points. The page `sha256` binds the selection and the full content; if a source changes between pages, the continuation fails and you restart.
- `--out <new-file>` writes the whole response and prints a receipt (path, sha256, bytes). The folder must exist and the file must not.
- `--packet <consumer|author> <web-component|react|html> <ids>` requires `--page` or `--out`. A consumer packet holds the node, assembly, guide and examples. An author packet adds the manifest, element and renderer modules, geometry family, verification record, the manifest schema and the [authoring](authoring.md) and [manifest language](manifest-language.md) specs. Packets over `system.manifest.json` `taskPackets.maxBytes` are refused.

## Checks

`npm test` (in `test/manifests.test.ts`) fails when:

- a manifest, examples file or verification record breaks its schema (with a rejecting control);
- a registered `ui-*` tag has no manifest node, or a node has no element;
- a manifest differs from `npm run manifests` output (properties, class, form association, dispatched events, contract edges or React props changed in source but not in the manifest, or were edited by hand), with a control that edits each mirrored field and checks that the generator restores it;
- an event a module dispatches is not declared (a second, regex derivation), or an event has an empty `trigger`;
- `contracts/tokens.json` names a Panda path (`tokens.*`, `semanticTokens.*`, `conditions.*`) that does not exist, or a Panda token category or condition is covered by no entry (`test/tokens-contract.test.ts`, with controls);
- a path, JSON Pointer, part, edge target or `useInstead` target does not resolve;
- a public component lacks a required `usesFoundation` edge, or its geometry family, contexts or parts disagree with `contracts/components.json`;
- an example does not mount, contains a native form element or names an unknown subject;
- `graph.json` is stale;
- a verification record's bound sources changed since its last passing run.

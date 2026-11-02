# Manifest language

How to write intent, descriptions, constraints and avoidance guidance in component manifests. The schema governs structure; source governs truth. Fluent prose cannot establish a capability, and a test passing the schema proves nothing about meaning.

## Write a precise contract

- **Intent**: the user action or content purpose, a concrete verb and object, with any required condition: "Submit the owning form when type is submit." No decoration, no search synonyms (those go in `searchTerms`). Parts get a `summary`, not an invented action.
- **Descriptions** (property `description`): only for traps the type and default cannot express: reset defaults versus live values, submission conditions, value formats, inherited properties that do nothing. Name the owner, trigger, result and limit.
- **Constraints**: behavior a builder must respect: who owns children, which element carries the role, what blocks activation, what the application owns. Distinguish browser behavior, component behavior and application responsibility.
- **Avoidance** (`avoidWhen`): a concrete unsuitable context and its reason. Add `useInstead` only for an existing graph ID you checked fits that context; omit it when nothing in the kit does, and say what is missing in the reason. An empty array means no meaningful guidance, not "suitable everywhere".
- **Vocabulary**: one term per concept, active voice, short sentences. Keep size (u), scale, density, curvature and corner shape separate. Avoid "automatically", "accessible", "seamless" or "preserves" without a stated mechanism.
- **Generated fields**: property keys, types, defaults, attributes and reflection, class and form association, dispatched event flags, contract edges and React props (`renderers.react.props`) come from source through `npm run manifests` ([registry](registry.md#generated-manifest-fields)). Do not edit them; change the source and rerun. Describe a React prop in a JSDoc comment on its member, which becomes the text after `//` in its line.
- **Schema**: use existing fields. Keep IDs and API names stable unless a migration is intended. Put review notes in the commit, not in invented manifest fields.

## Composition roles

Name the real reuse: a public component, an independent layer, or only an HTML element. A `role=button` on a chip does not make it a ui-button; a clickable option is not a button. Use `acceptsChild`, `requiresParent` and `uses` only when source supports them, and do not give a standalone primitive a required parent. When a recommendation points from a primitive to a composition that accepts it (button → segmented), say so in the reason.

## Review a change

1. Freeze the current manifest and write the questions a reader must answer from it (what it is for, when not to use it, who owns state and focus, how to configure it).
2. Check each changed field against its authority: the element class, `dom/` helpers, resolvers, styles and the platform specs. Check enums, defaults and inspector bounds, not only sentences.
3. Rewrite only supported claims. Run `npm run manifests`, then `npm test`: the manifest tests fail when a generated field differs from source, resolve every path and edge, and check recommendation targets.
4. Where metadata declares a bound or domain, compare it with the resolver, and keep a test that rejects the old defect.
5. For metadata-only changes, say that runtime and styles are unchanged and that no visual or accessibility review was run. Re-run `npm run verification -- run <name>` because the manifest is a bound source.

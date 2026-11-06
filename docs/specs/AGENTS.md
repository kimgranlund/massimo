# Specs

What the system is and must do, edited in place. Start with the overview.

- [system.md](system.md): principles, the system as a function (every input and what it drives), layers, generated outputs and their commands, the DTCG export.
- [geometry.md](geometry.md): the unit u, controls and slots, badges/tags/chips, choices and tracks, containers, verification.
- [color.md](color.md): color ramps, step semantics, roles, schemes, snapshot and runtime overrides.
- [components.md](components.md): foundations (UIElement, UIFormElement, slots, modality, FOUC) and the component inventory.
- [elevation.md](elevation.md): how surfaces stack: six levels (fill, shadow, layer), shadow strength, surface contrast, the shadow per level, raised cards.
- [typography.md](typography.md): type roles on the u ramp, ratio and rhythm, font families, serif headings.
- [motion.md](motion.md): SwiftUI-style springs solved live in CSS as linear() easings, intents, the spring, intent and global motion parameters, reduced motion.
- [icons.md](icons.md): the `<i name>` runtime, sets, system glyphs, sanitizing, sizes.
- [theming.md](theming.md): theme parameters, saved themes, per-element inputs, the Panda preset, state conditions and Panda configs (strict tokens).
- [registry.md](registry.md): component folders, manifests, the graph, the registry CLI, paging and packets, verification records.
- [authoring.md](authoring.md): adding or changing a component: rules, what changes together, how to verify.
- [manifest-language.md](manifest-language.md): writing intent, descriptions, constraints and avoidance guidance.
- [studio.md](studio.md): the jig: panel, canvas scoping, Copy JSON, checks.

When a change alters behavior described here, update the spec in the same commit. Step-by-step how-tos: [guides](../guides/AGENTS.md).

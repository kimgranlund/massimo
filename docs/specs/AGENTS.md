# Specs

What the system is and must do, edited in place. Start with the overview.

- [system.md](system.md): principles, layers, generated outputs, the jig.
- [geometry.md](geometry.md): the unit u, controls and slots, badges/tags/chips, choices and tracks, containers, verification.
- [color.md](color.md): Spectrum ramps, step semantics, roles, schemes, snapshot and runtime overrides.
- [components.md](components.md): foundations (UIElement, UIFormElement, slots, modality, FOUC) and the component inventory.
- [typography.md](typography.md): type roles on the u ramp, ratio and rhythm, font families, serif headings.
- [motion.md](motion.md): SwiftUI-style springs as CSS linear() easings, what animates on which spring, reduced motion.
- [icons.md](icons.md): the `<i name>` runtime, sets, system glyphs, sanitizing, sizes.
- [theming.md](theming.md): theme parameters, saved themes, per-element inputs, the Panda preset.
- [registry.md](registry.md): component folders, manifests, the graph, the registry CLI, paging and packets, verification records.
- [authoring.md](authoring.md): adding or changing a component: rules, what changes together, how to verify.
- [manifest-language.md](manifest-language.md): writing intent, descriptions, constraints and avoidance guidance.
- [studio.md](studio.md): the jig: panel, canvas scoping, Copy JSON, checks.

When a change alters behavior described here, update the spec in the same commit.

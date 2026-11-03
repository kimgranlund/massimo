---
status: proposed
owner: kim
date: 2026-11-03
---

# Universal container

Proposal to replace the six layout tags (ui-group, ui-collection, ui-card, ui-panel, ui-region, ui-page) with one `ui-container` whose radius and padding follow a single nesting rule from the page down to the controls it holds. Form controls (button, input, select, listbox, segmented, …) keep their own fixed geometry. The jig's Containers page has the exploration: **Nested cards** compares the models below side by side, and **U** is a working CSS prototype.

## The rule

Every curve in the kit obeys one relation: an outer radius is the inner radius plus the distance between the edges, **R_parent = R_child + p_parent**. The models differ only in which end is anchored.

| Model | Anchor | Result at an xl outer card (R 40.5, u = 4.5), depth 2 | Verdict |
|---|---|---|---|
| A, outward (today) | each level's own padding; R = r_control + p | 40.5 → 36 → 31.5; inner cards miss the outer curve by 18–22px | consistent per type, never concentric when nested |
| B, inward subtraction (the listbox model) | the root's R and p, p constant | 40.5 → 13.5 → 0; collapses | concentric, but only while R ≫ p |
| C, ratio ladder | the root's R; R_child = max(r_control, R·k), p = R − R_child | 40.5 → 24.3 → 14.6 (p 16.2, 9.7, 1.1) | concentric to the control; the last padding gets tiny |
| D, even split | the root's R and the control radius; p = (R − r_control) / levels | 40.5 → 31.5 → 22.5, p 9, control inside at 13.5 | concentric from root to control with even padding |

The answer to "r = 40, p = ?": p = (R − r_control) / levels. For R 40.5, a 13.5 control and three levels (the card and two nested), p = 9.

## Why inward, and how CSS does it

Outward anchoring (A) needs a parent to know its children's depth, which CSS cannot read. Inward anchoring only needs a child to read its ancestors' values, which custom properties inherit. The one catch is a cycle: a container cannot define `--r` from an inherited `--r`. The prototype avoids it with **depth-indexed variables**: depth n defines `--uc-r<n>` from `--uc-r<n−1>`, selected by nesting (`[data-uc] [data-uc]` is depth 2), up to a fixed maximum depth (6 covers page › region › panel › card › collection › group). Measured in the jig, it reproduces model C exactly (40.5 · 16.2 → 24.3 · 9.72).

D needs the number of levels below the root. Two ways to have it: the root declares it (`levels="3"`, or a preset that implies it), or the container sets padding from its own R and a target inner radius, which is C. A hybrid is likely best: C's ratio for deep trees, with D's even split when the root declares its levels.

## Proposed API

`<ui-container>` (CSS-only like today's tags; React `Container`):

| Attribute | Values | Effect |
|---|---|---|
| `preset` | group, collection, card, panel, region, page | starting values for everything below; the registry and composition rules keep these names as contexts |
| `radius` | `inherit` (the rule), a magnitude t (0–1), `square` | areas (panel, region, page) default to square, which resets the chain: below a square area the rule restarts |
| `levels` | 1–6 | D: the padding splits R − r_control evenly over this many levels |
| `padding`, `gap` | a ladder level or u | override the derived padding; gap defaults to the padding (composite rule: gap = inset) |
| `surface` | none, panel, card, raised | the elevation level (fill, shadow) |
| `layout` | stack, row, wrap, grid | the flow |

Form controls are the leaves: their radius stays min(3u·s, H/2). A container is concentric with them when its inside, R − p, equals the control radius; the lint can check it (`curvature.concentric-leaves`).

## Migration

1. Prototype `ui-container` beside the tags (presets reproduce today's tags exactly; the geometry check runs both).
2. The old tags become aliases (`ui-card` = `ui-container preset="card"`), with manifests pointing at the new component.
3. Composition contracts move from tag contexts to preset contexts; the registry keeps `context:card` and the rest.
4. Remove the aliases after one release.

## Decided

- Default model (2026-11-03): D (even split) when the root declares `levels`, else C (the ratio ladder), which needs no depth.

## Open questions

- Should a container ever grow its radius to fit content that is rounder than its inherited radius (A's behavior), or always inherit (B/C/D)?
- Does `surface` belong on the container or stay a separate elevation attribute usable on any element?
- Maximum depth: 6 indexed levels, or 8?

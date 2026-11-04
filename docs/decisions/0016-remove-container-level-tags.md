---
status: accepted
date: 2026-11-03
---

# 0016. Remove the container level tags

**Context.** `ui-container` replaced the six level tags (`ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page`) and the React `Group` … `Page`, which stayed as deprecated aliases. The plan was to remove them after one release ([universal container](../planning/universal-container.md), step 4). The kit is private at 0.0.0 and has never been tagged or published, so no consumer outside the repository can depend on them. Every page, example and guide already uses `ui-container`. Keeping the aliases cost a second rule set per level, longer chain selectors, and a React renderer that used recipe classes in a later CSS layer than the nesting chain, so React containers silently skipped the nesting. The React parity check found that.

**Decision.** Remove the tags, their recipes, their React renderers and their manifest and contract nodes now. `ui-container` (React `Container`) is the only container, styled by one rule set on `:is(ui-container, [data-ui=container])`, which both renderers share.

**Alternatives.** Keep the aliases until a first release. Rejected: nothing has been released, and the aliases were already breaking React parity. Keep only the React aliases. Rejected, for the same layer problem.

**Consequences.** Geometry, DTCG and CSV outputs name the presets (`ui-container[preset=card][padding=sm]`). The geometry and React checks render `ui-container` only. Recommendations that pointed at `component:card` or `component:collection` point at `component:container`. A future breaking change of this kind needs a release note, once there are releases.

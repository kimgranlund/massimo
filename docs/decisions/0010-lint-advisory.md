---
status: accepted
date: 2026-11-03
---

# 0010. Theme lint advises, never blocks

**Context.** Errors read as blocking in the jig, and a warning should not stop exploration.

**Decision.** contracts/theme-constraints.json holds warnings and info only; lintTheme never blocks a setting, a save or a build; theme:lint exits 0 unless --strict.

**Alternatives.** Error severity that fails the CLI.

**Consequences.** Findings explain the cause (they name changed settings) instead of gating.

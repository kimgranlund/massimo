---
status: accepted
date: 2026-11-03
---

# 0009. One theme object

**Context.** Saved themes held only parameters; colors and fonts lived in the jig's Copy JSON, which nothing validated.

**Decision.** A theme is one object (schemaVersion 1): parameters, icons, scheme, color, typography, and reserved intent, character and provenance; validateThemeObject reports every problem; contracts/theme.schema.json is generated from the same exports; saved themes, Copy and Load use it.

**Alternatives.** Keep two formats.

**Consequences.** A theme round-trips through the jig; saved themes render colors and fonts.

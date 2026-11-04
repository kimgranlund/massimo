---
status: accepted
date: 2026-11-03
---

# 0011. Ramps are contrast-targeted (the Leonardo model)

**Context.** The tone controls (automatic peak tone, peak tone, endpoints) were unintuitive, and moving an endpoint silently broke text contrast. An interim fix set the peak tone to 62.

**Decision.** Step 1 is the page tone per scheme; steps 2–12 take APCA Lc targets against it, per scheme; tones are solved and handed to the engine through its internal tone map (the vendored runtime unchanged). Defaults are measured from the old ramp.

**Alternatives.** Material 3 contrast levels; re-toning after generation; WCAG ratios.

**Consequences.** Moving a page keeps every step's contrast; legacy peak tones map to measured targets.

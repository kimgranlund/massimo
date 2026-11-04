# Claude Artifacts adapter

Use this reference only when the output will run inside Claude Artifacts. The core skill remains authoritative for design decisions; this file changes the runtime contract.

## Output and publishing

Author the format requested by the user. When the request is specifically for an interactive Claude Artifact, produce the HTML or supported application format expected by the Artifact tool. Use the Artifact's title and publish description as gallery metadata; do not bake explanatory metadata into an overlong page title.

## Content security policy

The Artifact runtime may restrict external resources. Follow the current Artifact tool description because host allowlists can change.

At the time of implementation:

- Use Google Fonts only when it is admitted by the current CSP; otherwise use a permitted or embedded font with a real fallback stack.
- Load third-party JavaScript only from an admitted host and pin the exact library version.
- Inline the artifact's own CSS, JavaScript, images, and data when the runtime requires a single-file artifact.
- Do not copy an entire library into the artifact or hand-build a weak substitute merely to avoid checking the permitted host.

If the current tool contract conflicts with this reference, the current tool contract wins.

## Viewer themes

Claude's Artifact viewer can expose three states:

- Explicit light: `data-theme="light"` on the root element.
- Explicit dark: `data-theme="dark"` on the root element.
- System default: no theme attribute.

Implement theme colors as complete token sets:

1. Put the complete light palette in bare `:root` unless the design is deliberately dark-first.
2. Override tokens for system dark mode inside `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])` so an explicit light choice wins.
3. Override the same tokens in `:root[data-theme="dark"]` so the explicit dark choice wins under a light operating system.
4. Style components through tokens rather than placing component rules inside theme selectors.
5. Set an explicit `body` background from the active token set; the viewer paints its own ground behind transparent content.

A deliberately single-theme artifact may skip the media query and host stamps, but it must set every surface and foreground explicitly so the design remains stable over either viewer ground.

Before publishing, scan for colors defined only under a theme selector, transparent page backgrounds, or literal component colors that work in only one scheme.

## Verification

Preview the artifact in the Artifact viewer, not only in a standalone browser. Check system, explicit light, and explicit dark modes when the artifact supports both schemes. Verify every external font or script actually loads under the current CSP.

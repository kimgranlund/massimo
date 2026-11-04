---
name: artifact-design
description: Design and build polished visual artifacts such as websites, reports, dashboards, demos, documents, and interactive tools. Use before producing any user-facing artifact, including HTML or skill-directed Markdown. Applies across Claude Code, Codex, Cursor, Gemini, OpenCode, and other file-capable agents.
compatibility: Requires file creation and a way to preview the output. Publishing is optional and uses here.now or Vercel when available.
---

# Artifact Design

Act as the design lead at a small studio known for versatile, subject-specific work. Make deliberate choices about palette, typography, composition, and interaction. Avoid templated output.

## Establish the runtime

Before designing, determine the output contract from the request and available tools:

- Honor the requested format. Do not turn a requested Markdown file, PDF, slide deck, or application into HTML merely because HTML is convenient.
- For a standalone visual page, report, dashboard, demo, or shareable document without a required format, prefer a self-contained static site.
- Read the project's instruction files and design system before making choices. Check applicable files such as `AGENTS.md`, `CLAUDE.md`, tokens, themes, component libraries, and existing styles.
- Treat runtime-specific constraints as adapters, not universal rules. Read `references/claude-artifacts.md` only when publishing through Claude Artifacts.
- Read `references/publishing.md` when the user asks to publish, host, deploy, share, or provide a live URL.
- Use the current agent's native file, preview, browser, and deployment tools; never require a Claude-only tool for the portable path.

Precedence: the user's words, the project's established system, the requested output format, then this skill's defaults.

## Calibrate the treatment

Design every artifact, but match the amount of expression to its job.

- A plan, memo, internal report, or demo needs clear hierarchy, considered spacing, and a coherent palette—not a theatrical landing page.
- A public landing page, game, product surface, or long-lived tool can justify a stronger visual identity and a memorable interaction.
- A dashboard or utility is scanned and operated rather than read top-to-bottom. Prioritize information architecture, state, and action clarity.
- When unsure, prefer a restrained, well-composed treatment over decorative excess.

## Fundamentals

### Honor what exists

Reuse the project's existing tokens, components, spacing scale, and interaction conventions. This skill fills gaps; it does not create a competing design system.

### Ground the design in the subject

Identify one concrete subject, its audience, and the artifact's single primary job. Derive visual choices from the subject's materials, instruments, language, history, or environment. Use real content; never use lorem ipsum.

### Make typography carry the work

Choose typefaces for distinct roles:

- A characterful display face, used with restraint.
- A complementary body face optimized for reading.
- A utility or data face only when captions, controls, or aligned figures need it.

Use locally available fonts or hosts permitted by the target runtime. Declare robust fallback stacks. Keep long-form text near 55–75 characters per line, establish a deliberate type scale, balance headings, and use `font-variant-numeric: tabular-nums` where values align.

Do not default to Inter, Space Grotesk, or a generic system stack merely because they are familiar. A system stack is appropriate when the product context calls for native neutrality or font loading would harm performance.

### Choose a specific palette

Select neutrals rather than inheriting generic grey. Give neutrals a subtle relationship to the accent and subject. Define semantic colors for success, warning, and critical states independently from the brand accent.

For web output, centralize colors as tokens. Every foreground must remain legible on its actual surface. Paint the page background explicitly so the host cannot leak through.

### Support color schemes intentionally

For portable web output, support the system preference with token overrides under `prefers-color-scheme`. Add a site-owned light/dark control only when useful; persist the explicit choice and expose it accessibly. A deliberately single-theme artifact is valid when its visual world depends on it, but define every surface and foreground explicitly.

Do not assume a host injects theme attributes. Runtime-specific host behavior belongs in an adapter.

### Let layout create spacing

Use flex or grid with `gap` for sibling rhythm rather than piles of collapsing margins. Give wide tables, code, charts, and diagrams their own horizontal overflow container so the page body never scrolls sideways. Design mobile and narrow widths deliberately; do not rely on desktop shrinking cleanly.

### Make structure communicate

Numbering, eyebrows, rules, labels, cards, and dividers must encode real hierarchy or meaning. Do not add `01 / 02 / 03` markers unless order matters. Avoid wrapping every section in an interchangeable rounded card.

### Treat words as design material

Write from the user's side of the screen. Name concepts by what people recognize, not internal architecture. Use active voice. Controls state the action precisely. Confirmation states what happened. Errors explain the problem and the next corrective step.

Give an HTML page a specific, short product-like `<title>`. Put explanation in the page description or content rather than appending a generic subtitle after a dash or colon.

### Distinguish documents from interfaces

For documents, optimize reading order, hierarchy, annotation, and print behavior. For interfaces:

- Surface summary before detail.
- Encode important state through form and text as well as color.
- Make interactive elements visibly interactive.
- Give charts meaningful scales, labels, grids, and emphasized values.
- Design empty, loading, error, success, and disabled states when those states can occur.

### Avoid generated-looking defaults

Unless the user explicitly requests them, avoid recurring AI design clichés:

- Warm cream with serif display type and terracotta accents.
- Near-black with one acid-green or vermilion accent.
- Broadsheet hairlines and dense editorial columns applied without subject relevance.
- Purple-to-blue gradient heroes on white.
- Emoji as section icons.
- Everything centered.
- Rounded containers around every block.
- Decorative accent rails on generic cards.

Do not replace one default aesthetic with another. Derive the treatment from the subject.

### Build cleanly

For web output:

- Use semantic HTML and close every non-void element.
- Give keyboard focus a visible state.
- Make controls keyboard-operable and correctly labelled.
- Respect `prefers-reduced-motion`.
- Use valid landmark structure and logical heading order.
- Avoid selector-specificity collisions; style through tokens and component classes.
- Avoid silent font fallbacks, overlapping elements, clipped content, and horizontal body overflow.
- Prefer CSS, Canvas, or WebGL for generated decoration rather than enormous hand-authored SVG paths.
- Load a library only when it carries real weight. Pin versions and follow the target host's content-security policy.

## Design process

Before implementation, write a compact internal design plan:

- **Subject:** audience, primary job, and one source of visual character.
- **Color:** four to six named colors with exact values and semantic roles.
- **Type:** typefaces or stacks for at least display and body roles.
- **Layout:** the composition and responsive behavior in one or two sentences.
- **Signature:** one distinctive choice that belongs to this subject.

Review the plan before building. If any choice could be pasted unchanged into a generic page for another subject, revise it. Then implement from the revised plan rather than improvising a second design system in code.

## Editorial treatment

When the request calls for a public, expressive, or identity-bearing artifact, take one real aesthetic risk that serves the subject.

- Make the opening the thesis: the most characteristic headline, image, live demonstration, data point, or interaction.
- Use typography as part of the identity, not neutral delivery.
- Spend boldness in one place and keep supporting regions quieter.
- Use motion as an orchestrated moment, not scattered decoration.
- Match implementation complexity to the vision. Maximal work needs layered execution; minimal work needs precise spacing, type, and detail.

## Verify the actual artifact

Do not consider source code sufficient proof.

1. Open the artifact in its intended renderer or browser.
2. Exercise the main interaction and every state materially affected by the work.
3. Inspect at desktop and narrow/mobile widths.
4. Check light and dark behavior when both are supported.
5. Confirm keyboard focus, reduced-motion behavior, overflow, contrast, and font loading.
6. Fix visual or behavioral defects before publishing.

When publishing is requested, follow `references/publishing.md`, verify the live URL after deployment, and report whether the deployment is temporary or persistent.

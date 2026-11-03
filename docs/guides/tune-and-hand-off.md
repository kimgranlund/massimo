# Tune in the jig and hand off

Steps for tuning a theme in the jig and handing the result to an agent, which applies it to the kit. The jig itself: [studio](../specs/studio.md).

1. Start it: `npm run studio`, then open http://localhost:5173.
2. Tune in the panel tabs. Geometry: unit, border, corner radius and shape, icon set, padding and gap per level. Colors: Spectrum settings and role families. Typography: ratio, rhythm, a stack per face and a face per voice. Motion: duration scale, bounce, springs and intents. Pick the page to look at from the content header's page menu (the URL hash, e.g. `#/geometry`); its trailing button cycles the scheme, so check both light and dark.
3. Press **Copy**. The clipboard holds one [theme object](../specs/theming.md#theme-object): every setting that differs from the defaults (`parameters`, `icons`, `scheme`, `color.spectrum`, `color.roles`, `typography.faces`, `typography.voices`). **Load** takes one back from the clipboard, so a saved or generated theme can be opened, tuned and copied again.
4. Paste the JSON into the agent prompt with what it is for: a saved theme, or new kit defaults.

## Applying it (the agent)

- **A saved theme:** set its `name` (kebab-case), drop `$schema`, and add the object to `packages/ui-kit/tokens/themes/themes.json` under that name; it applies with `<html data-ui-theme="name">`, colors and fonts included ([theming](../specs/theming.md#theme-object)). `npm run ui-kit:test` validates it.
- **New kit defaults:** change the `default` of each parameter in `tokens/themes/params.ts`, the Spectrum defaults in `SPECTRUM_FIELDS` / `DEFAULT_ROLES`, or the face stacks and voices (`FONT_FAMILIES`, `DEFAULT_VOICES` in `tokens/typography/resolve.ts`); then regenerate as in [add a token or theme parameter](add-a-token-or-theme-parameter.md#regenerate-and-check).
- **At runtime, without changing the kit:** `generateSpectrum(spectrum.settings)` and `spectrumCSS(data, resolveRoles(data, spectrum.roles))` from `@massimo/ui-kit/spectrum`, emitted after the kit stylesheet; voices as `data-font-<voice>="<face>"`, faces as `--fonts-<face>`.

Then run `npm run ui-kit:test` and reopen the jig: with the new defaults applied, **Copy** returns a theme with no sections but its name.

# Spectrum engine: provenance

`runtime.json` is copied unchanged from massimo-ui (`packages/massimo-ui/tokens/data/spectrum-runtime.json`).
It is an esbuild bundle (global `SpectrumRuntime`) of the HCT spectrum generator:

- source: `hct-spectrum-2026-10-30`, commit `9160c3dadccaa04793db83c4a807f5c4149a8a25` (private, Kim Granlund)
- engine sha256 `a5e029449341ac3305fce2df3fbbdf5f9aa74a7c7731a94b127a41766d95a4e4`, runtime sha256 `849a8e5603017aabdbcd35408e317c88a5609d7fa73810b16e47a607641d642f`

The bundle inlines third-party code whose notices travel inside it and must stay with it:
colorjs (MIT, Lea Verou and Chris Lilley), ultimate-tokens (MIT, Kim Granlund), `@stdlib` math (Apache-2.0)
and a Go-derived `atan2` (BSD). Do not strip or minify the embedded notices. To rebuild, use the source repo's
`build-spectrum-runtime.mjs` (massimo-ui) with `--check` to confirm it reproduces.

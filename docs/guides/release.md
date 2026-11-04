# Cut a release

Steps for versioning `@massimo/ui-kit`. The changelog is `packages/ui-kit/CHANGELOG.md`; the package version is in `packages/ui-kit/package.json`, and a test keeps the two equal.

1. Pick the version. Before 1.0.0: a minor bump for anything listed under **Breaking**, a patch bump otherwise.
2. Add a `## <version> (<date>)` section at the top of the changelog, with **Breaking**, **Added** and **Fixed** lists. A break names what to use instead, and links the decision when there is one.
3. Set `"version"` in `packages/ui-kit/package.json` to the same version.
4. Run every gate: `npm run ui-kit:test`, `npm run ui-kit:typecheck`, `npm run typecheck -w @massimo/studio`, `npm run ui-kit:build`, `npm run check:browsers`, `npm run icons:check`.
5. Commit as `release: ui-kit <version>`.
6. Tag and publish only with the owner's approval for that release: `git tag ui-kit-v<version>`, then push the tag. The package is private, so publishing to a registry is a separate decision.

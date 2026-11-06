# massimo

A design system and the jig that tunes it.

- **[`@massimo/ui-kit`](packages/ui-kit/README.md)**: light-DOM web components and React renderers that share one anatomy, one headless behavior layer (`dom/`) and one PandaCSS preset. Geometry comes from a single unit u, colors are color roles, motion is springs, and the kit ships icons plus generated CSV and DTCG tokens. The components follow [Base UI](https://base-ui.com)'s anatomy, state attributes and event reasons.
- **[Studio](apps/studio/README.md)**: the jig. It tunes a theme live on pages of every component, and **Copy** hands the settings to an agent as JSON.

## Quick start

Requirements: Node 22.18 or later (scripts run `.ts` files directly) and npm.

```sh
npm install
npm run dev           # the jig at http://localhost:5173 (same as npm run studio)
npm run build         # the ui-kit, then the studio for production
npm run preview       # serve that production build
```

Each push to `main` publishes the studio to [kimgranlund.github.io/massimo](https://kimgranlund.github.io/massimo/), with `geometry-check.html` and `react-check.html` beside it (`.github/workflows/pages.yml`; `STUDIO_BASE=/massimo/` sets the Vite base).

Use the kit from an app:

```js
import '@massimo/ui-kit/css';
import '@massimo/ui-kit/components/button/element';          // <ui-button variant="primary">Save</ui-button>
import { Button } from '@massimo/ui-kit/components/button/react';
```

More entry points and the Panda preset: [ui-kit README](packages/ui-kit/README.md).

## Checks

| Command | What it checks |
|---|---|
| `npm run ui-kit:test` | unit tests, manifests, generated files, verification records |
| `npm run ui-kit:typecheck`, `npm run typecheck -w @massimo/studio` | types |
| `npm run ui-kit:build` | Panda codegen, CSS and the package build |
| `npm run theme:lint -w @massimo/ui-kit` | the theme coherence rules over the defaults and saved themes |
| `npm run check:browsers` | `geometry-check.html`, `react-check.html`, select placement and motion easings in Chromium, Firefox and WebKit (first time: `npx playwright install chromium firefox webkit`) |

With `npm run studio` running, `/geometry-check.html` and `/react-check.html` print `"fails": []` when the CSS matches the geometry resolvers and the React renderers match the web components.

## Finding things

- Components: ask the registry before reading source with `npm run registry -- --start`, `--find <term>` or `--assembly component:<id>`.
- Specs: [docs/specs/system.md](docs/specs/system.md) maps the system, and one spec owns each topic (geometry, color, typography, motion, theming, components, registry, icons, studio).
- Guides for routine work: [change a component](docs/guides/change-a-component.md), [add a token or theme parameter](docs/guides/add-a-token-or-theme-parameter.md), [tune and hand off](docs/guides/tune-and-hand-off.md), [geometry review](docs/guides/geometry-review.md).
- Working in the repo as an agent: [AGENTS.md](AGENTS.md).

## Layout

```
packages/ui-kit/   the kit: core, dom, tokens, styles, components/<name>/, icons, contracts, generators
apps/studio/       the jig, plus geometry-check.html and react-check.html
docs/              specs, guides, planning, reports
```

## License

MIT. Third-party notices for the color engine are in [NOTICE.md](packages/ui-kit/tokens/colors/spectrum/NOTICE.md). Brand names in the reference brands belong to their owners.

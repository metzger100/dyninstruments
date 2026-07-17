# Guide: Documentation Maintenance

**Status:** ✅ Active | Workflow for keeping docs aligned with code

## Overview

Use this workflow whenever code changes touch architecture, module wiring, or widget behavior.
User-facing changes must also keep `README.md` current in the same task.

## Workflow

1. Identify touched code areas (`config/`, `runtime/`, `widgets/`, `plugin.js`, `plugin.mjs`)
2. Update the mapped docs in `documentation/`
3. Update root docs (`README.md`, `AGENTS.md`) when architecture guidance changes; keep `CLAUDE.md` as a short pointer unless Claude-specific notes are required.
4. Fail-closed README sync: if a task changes theming, clusters/kinds, layouts, installation, configuration, requirements, or development workflow, update `README.md` in the same task.
5. Fail-closed fixture sync:
   - If theme tokens/input vars/default theming behavior changes, update `tests/css/theme-token-extremes.user.css` (and related `tests/css` fixtures when relevant).
   - If a new kind or changed kind introduces user-visible visual/layout behavior, update `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js`.
6. Every new documentation file must be linked from at least one other doc that is itself reachable from AGENTS.md. The easiest way: add an entry to TABLEOFCONTENTS.md.
7. Run default validation gate:

```bash
npm run check:all
```

8. During iteration, optionally run targeted checks (`npm run check:fast`, `npm run check:core`, `npm test`) for faster feedback.

9. Fix all failures and review all warnings before finishing

## Quality and Regression Commands

Run from repository root:

```bash
npm run check:all
```

`check:all` is the default completion gate and runs:

- `npm run check:core`
- `npm run test:coverage:check`

For the full command graph and checker ownership map, see [../conventions/quality-gates.md](../conventions/quality-gates.md).

`check:core` includes:

- `npm run check:standard` (scoped Prettier, ESLint, Stylelint, actionlint, jscpd)
- `npm run typecheck` (strict no-emit `checkJs` scope in `tsconfig.checkjs.json`)
- `npm run package:check` (Ajv schema validation plus release/package contract tests)
- `npm run test:contract` (VM-based AVnav/plugin registry, bootstrap, bundled
  layout, and runtime loading contracts)
- `npm run docs:check` (markdownlint, offline Linkinator local link/fragment checks, plus project-specific docs contracts)
- `npm run check:filesize` (hard-fails at `>400` for all scanned files and blocks on oneliner findings via `--oneliner=block`; no warning tier)

Optional exploratory variant during cleanup:
- `npm run check:filesize:warn` (uses `--oneliner=warn`)

`check:fast` runs:

- `npm run check:standard`
- `npm run typecheck`
- `npm run test:node`

`check:standard` includes:

- `npm run format:check` (currently scoped to package/workflow/quality config files)
- `npm run lint` (`eslint .` plus CSS Stylelint)
- `npm run actions:lint` (pinned actionlint workflow validation)
- `npm run duplication:check` (`jscpd --config jscpd.config.json --exit-code=1`)

ESLint also requires one leading `@file` overview on every shipped JavaScript
file. The documentation contract separately resolves any `Documentation:` path;
component registry entries remain the dependency source of truth.

Run `npm run setup` before the first gate. Setup provisions the pinned,
checksum-verified actionlint binary in the persistent cache; ordinary gates
never download it and point to setup when the cache is missing.

Runtime, test, tool, CSS, and Markdown Prettier scope is tracked explicitly in
`documentation/conventions/quality-gates.md`; the migration-owned config,
workflow, type, and schema scope is the blocking formatter gate until each
deferred directory can be split and formatted without violating the absolute
400-line policy.

`typecheck` currently covers 211 production JavaScript files plus the
`vitest.config.js` tool configuration and six
declaration files (218 strict files total): shared format/value helpers,
layout/geometry/responsive math, canvas cache, text/layout kits,
selected radial/linear/nav/XTE/state/HTML lifecycle/DOM/measure/widget helpers,
selected nav interaction/info-text/AIS-target-sizing/fit/render-model/layout-geometry/route-points-sizing/row-geometry/center-display layout
helpers, selected nav render-model helpers, selected vessel render-model/markup
and regatta audio/session/markup/HTML-fit helpers, selected alarm chrome helpers,
active-route layout/HTML fit, AIS target layout/markup, edit-route HTML fit/support/markup/render-model, map-zoom HTML fit, alarm fit,
route-points HTML fit/DOM effects/markup, the alarm, edit-route, and AIS-target viewmodels, linear canvas, drawing, support, label-fit, and text-layout helpers, radial draw, frame, toolkit modules, radial layout/text-layout modules, radial engines, editable-configuration families, unit-format catalog, all cluster configuration and mapper/viewmodel modules, cluster-route and component-registry configuration families, bootstrap-manifest configuration, runtime namespace/canvas/DOM/editable-default/formatter/widget-registration/surface-index/surface-policy/session/asset-preloader/component-loader/theme-model/theme/cluster-shell/route-activation-payload/latest-wins/controller/host-action-discovery/bootstrap/init services, host-commit/temporary-bridge services, runtime surface/theme services, and shared UMD ambient declarations. Test sources remain outside this source check because split harness files share globals; they are still required through the Node, jsdom, VM-contract, coverage, lint, and contract suites. Expand `tsconfig.checkjs.json` only with real JSDoc/ambient typing and keep `noEmit` enabled.

`schema:check` validates `plugin.json` with `schemas/plugin.schema.json` and
`layouts/*.json` with `schemas/layout.schema.json`. Extend those schemas when
plugin metadata or bundled layout JSON contracts change.

`package:check` runs `schema:check` and focused Node-only release/package tests
for release preparation, release creation, and release manifest contents.

The tag-only publisher reruns `npm run setup` and `npm run check:all` in a
read-only job. Its write-privileged publish job depends on that result and only
uploads the committed ZIP and notes. The shared SemVer tool classifies the
validated tag so prerelease versions publish as GitHub prereleases while stable
versions publish as normal releases.

`docs:check` runs `markdownlint-cli2`, Linkinator fixture proofs and the
repository scan from `linkinator.config.json`, then the documentation-specific,
format, and reachability contracts (`check:doclinks`, `check:docformat`,
`check:reachability`). Linkinator checks local links/fragments only; external
URLs are skipped so the gate is deterministic and offline.

`test:coverage:check` includes:

```bash
npm run test:coverage
```

`test:coverage` enforces the native Vitest global and critical-area thresholds
declared in `vitest.config.js`.

`test:split` runs the `vitest.config.js` `test.projects` configuration with
separate `unit-node`, `contract`, and `unit-dom` projects. Use it when changing test setup, tool tests, VM
contract tests, dependency direction, retired owner-path absence, DOM setup, or
environment boundaries.

`check-patterns` is enforced in full mode inside `check:core`.
Blocking findings fail the gate; warning findings are non-blocking advisories.
This includes fail-closed cross-file clone detection (`duplicate-functions`, `duplicate-block-clones`), block-mode atomicity/fail-fast rules (`internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `widget-renderer-default-duplication`, `engine-layout-default-drift`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `framework-method-typeof-guard`, `inline-config-default-duplication`), fail-closed repository hygiene rules (`absolute-user-home-path`), mixed-severity mapper complexity checks (`mapper-output-complexity`: warn at `9..12`, block at `>12`), remaining warn-only rollout rules (`catch-fallback-without-suppression`, `css-js-default-duplication`, `editable-threshold-missing-internal`), plus blocking suppression validation (`invalid-lint-suppression`).
Responsive ownership checks are part of the same gate: `responsive-profile-ownership` and `responsive-layout-hard-floor` both block new drift.

## Touchpoint Matrix

| Change Type | Minimum Docs to Update |
|---|---|
| New/changed module in `config/components/registry-*.js` or `config/components.js` assembly | `documentation/architecture/component-system.md`, affected module doc in `documentation/widgets/` |
| New cluster or new cluster kind | `documentation/guides/add-new-cluster.md`, `documentation/architecture/cluster-widget-system.md`, relevant module docs, `README.md` (`What you get` and configuration examples); if visuals/layout changed, also update `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js` |
| New gauge renderer | `documentation/guides/add-new-gauge.md`, `documentation/widgets/semicircle-gauges.md` or dedicated module doc |
| Changes in registration/lifecycle flow (`runtime/init.js`, `runtime/widget-registrar.js`) | `documentation/avnav-api/plugin-lifecycle.md`, `documentation/architecture/component-system.md` |
| Changes in helper services or `componentContext.format.applyFormatter` contract | `documentation/shared/helpers.md` |
| CSS/theming or theme-token changes (`plugin.css`, `runtime/theme/*`, theme token docs) | `documentation/shared/css-theming.md`, `documentation/shared/theme-tokens.md`, `README.md` (complete user token list + examples), and `tests/css/theme-token-extremes.user.css` (plus related `tests/css` fixtures when relevant) |
| Layout bundle changes (`layouts/*.json`, `plugin.json` layout registration) | `documentation/guides/layout-file-conventions.md`, `README.md` (bundled layouts and usage notes) |
| Installation/packaging/release workflow changes (`plugin.json`, release scripts, install steps) | `documentation/guides/release-workflow.md`, `documentation/conventions/quality-gates.md`, `README.md` (installation/update instructions) |
| User configuration surface changes (editable params, defaults, unit selectors, key selectors, cluster options) | relevant `documentation/avnav-api/*` and widget docs, `README.md` (Configuration section) |
| Requirements/platform support changes | `documentation/core-principles.md` or relevant architecture docs, `README.md` (Requirements section) |
| Development workflow changes (`package.json`, `vitest.config.js`, `tools/*`, `.pre-commit-config.yaml`) | `documentation/guides/documentation-maintenance.md`, `README.md` (Development section), `AGENTS.md`; update `CLAUDE.md` only for Claude-specific notes |
| New documentation file | `documentation/TABLEOFCONTENTS.md` |

## Validation

`npm run check:all` is the default required quality gate.

`markdownlint-cli2` (inside `docs:check`) verifies:

- maintained Markdown structural rules over root docs and `documentation/**/*.md`
- ignores generated artifacts, releases, exec plans, coverage, and `node_modules`

`tools/check-doc-links.mjs` and `tools/check-doc-links-proof.mjs` (inside
`docs:links`/`docs:links:proof`) verify:

- relative Markdown links and anchors through Linkinator
- duplicate heading slug behavior
- missing local files/anchors and external-link skips

`tests/contract/documentation-links-contract.test.js` (inside `check:doclinks`
and `docs:check`) verifies JS `Documentation:` header targets and stale
high-risk architecture phrases.

`tests/contract/documentation-format-contract.test.js` (inside
`check:docformat` and `docs:check`) verifies:

- required doc sections (`# Title`, `**Status:**`, and key headings)
- explicit exceptions for index/tracker docs

`tests/contract/documentation-reachability-contract.test.js` (inside
`check:reachability` and `docs:check`) verifies:

- all in-scope markdown docs are reachable from `AGENTS.md` or `CLAUDE.md`
- markdown link targets to `.md` files exist on disk

Non-zero exit means docs are not consistent.

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../conventions/quality-gates.md](../conventions/quality-gates.md)
- [exec-plan-authoring.md](exec-plan-authoring.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

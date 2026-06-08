# Guide: Documentation Maintenance

**Status:** ✅ Active | Workflow for keeping docs aligned with code

## Overview

Use this workflow whenever code changes touch architecture, module wiring, or widget behavior.
User-facing changes must also keep `README.md` current in the same task.

## Workflow

1. Identify touched code areas (`config/`, `runtime/`, `widgets/`, `plugin.js`, `plugin.mjs`)
2. Update the mapped docs in `documentation/`
3. Update root docs (`README.md`, `AGENTS.md`, `CLAUDE.md`) when architecture guidance changes
4. Fail-closed README sync: if a task changes theming, clusters/kinds, layouts, installation, configuration, requirements, or development workflow, update `README.md` in the same task.
5. Fail-closed fixture sync:
   - If theme tokens/input vars/default theming behavior changes, update `tests/css/theme-token-extremes.user.css` (and related `tests/css` fixtures when relevant).
   - If a new kind or changed kind introduces user-visible visual/layout behavior, update `tests/layouts/gpspage-all-widgets.json` and `tests/layouts/gpspage-all-widgets.test.js`.
6. Every new documentation file must be linked from at least one other doc that is itself reachable from AGENTS.md. The easiest way: add an entry to TABLEOFCONTENTS.md.
7. Run default validation gate:

```bash
npm run check:all
```

8. During iteration, optionally run targeted checks (`npm run check:core`, `npm test`) for faster feedback.
   For perf-gate changes, include `npm run perf:run` and `npm run perf:check`.

9. Fix all failures and review all warnings before finishing

## Quality and Regression Commands

Run from repository root:

```bash
npm run check:all
```

`check:all` is the default completion gate and runs:

- `npm run check:core`
- `npm run test:coverage:check`
- `npm run perf:check`

`check:core` includes:

- `node tools/check-docs.mjs`
- `node tools/check-doc-format.mjs --warn`
- `node tools/check-doc-reachability.mjs`
- `npm run ai:check`
- `npm run check:filesize` (hard-fails at `>400` for all scanned files and blocks on oneliner findings via `--oneliner=block`; no warning tier)
- `node tools/check-headers.mjs`
- `node tools/check-dependencies.mjs`
- `node tools/check-umd.mjs`
- `node tools/check-naming.mjs`

Optional exploratory variant during cleanup:
- `npm run check:filesize:warn` (uses `--oneliner=warn`)

`test:coverage:check` includes:

```bash
npm run test:coverage
node tools/check-coverage.mjs
```

`perf:run` includes:

```bash
node tools/perf-run.mjs
```

It writes machine-readable and markdown artifacts to `artifacts/perf/`.

`perf:check` includes:

```bash
node tools/perf-check.mjs
```

It compares current metrics against committed baselines in `perf/baselines/` and fails closed on threshold violations.

`check-patterns` is enforced in full mode inside `check:core`.
Blocking findings fail the gate; warning findings are non-blocking advisories.
This includes fail-closed cross-file clone detection (`duplicate-functions`, `duplicate-block-clones`), block-mode atomicity/fail-fast rules (`internal-hook-fallback`, `redundant-null-type-guard`, `hardcoded-runtime-default`, `widget-renderer-default-duplication`, `engine-layout-default-drift`, `canvas-api-typeof-guard`, `try-finally-canvas-drawing`, `framework-method-typeof-guard`, `inline-config-default-duplication`), fail-closed repository hygiene rules (`absolute-user-home-path`), mixed-severity mapper complexity checks (`mapper-output-complexity`: warn at `9..12`, block at `>12`), remaining warn-only rollout rules (`catch-fallback-without-suppression`, `css-js-default-duplication`, `premature-legacy-support`, `editable-threshold-missing-internal`), plus blocking suppression validation (`invalid-lint-suppression`).
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
| Installation/packaging/release workflow changes (`plugin.json`, release scripts, install steps) | `documentation/guides/release-workflow.md`, `README.md` (installation/update instructions) |
| User configuration surface changes (editable params, defaults, unit selectors, key selectors, cluster options) | relevant `documentation/avnav-api/*` and widget docs, `README.md` (Configuration section) |
| Requirements/platform support changes | `documentation/core-principles.md` or relevant architecture docs, `README.md` (Requirements section) |
| Development workflow changes (`package.json`, `vitest.config.js`, `tools/*`, `.githooks/*`) | `documentation/guides/documentation-maintenance.md`, `documentation/guides/performance-gate.md`, `README.md` (Development section), `AGENTS.md`, `CLAUDE.md` |
| New documentation file | `documentation/TABLEOFCONTENTS.md` |

## Validation

`npm run check:all` is the default required quality gate.

`tools/check-docs.mjs` (inside `check:core`) verifies:

- relative markdown links and anchors
- JS `Documentation:` header targets
- stale high-risk architecture phrases

`tools/check-doc-format.mjs` (inside `check:core`, warn mode) verifies:

- required doc sections (`# Title`, `**Status:**`, and key headings)
- explicit exceptions for index/tracker docs

`tools/check-doc-reachability.mjs` (inside `check:core`) verifies:

- all in-scope markdown docs are reachable from `AGENTS.md` or `CLAUDE.md`
- markdown link targets to `.md` files exist on disk

Non-zero exit means docs are not consistent.

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [exec-plan-authoring.md](exec-plan-authoring.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

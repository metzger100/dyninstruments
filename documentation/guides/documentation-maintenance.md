# Guide: Documentation Maintenance

**Status:** ✅ Active | Workflow for keeping docs aligned with code

## Overview

Use this workflow whenever code changes touch architecture, module wiring, or widget behavior.

## Workflow

1. Identify touched code areas (`config/`, `runtime/`, `widgets/`, `plugin.js`)
2. Update the mapped docs in `documentation/`
3. Update root docs (`README.md`, `AGENTS.md`, `CLAUDE.md`) when architecture guidance changes
4. Every new documentation file must be linked from at least one other doc that is itself reachable from AGENTS.md. The easiest way: add an entry to TABLEOFCONTENTS.md.
5. Run strict validation gate:

```bash
npm run check:smells
npm run check:strict
```

6. During iteration, optionally run targeted checks (`npm run check:all`, `npm test`) for faster feedback.

7. Fix all failures and review all warnings before finishing

## Quality and Regression Commands

Run from repository root:

```bash
npm run check:strict
```

`check:strict` is the default completion gate and runs:

- `npm run check:all`
- `npm run test:coverage:check`

`check:smells` runs blocking smell checks:

- `node tools/check-patterns.mjs`
- `node tools/check-smell-contracts.mjs`

`check:all` includes:

- `node tools/check-docs.mjs`
- `node tools/check-doc-format.mjs --warn`
- `node tools/check-doc-reachability.mjs`
- `npm run ai:check`
- `node tools/check-file-size.mjs`
- `node tools/check-headers.mjs`
- `node tools/check-dependencies.mjs`
- `node tools/check-umd.mjs`
- `node tools/check-naming.mjs`
- `npm run check:smells`

`test:coverage:check` includes:

```bash
npm run test:coverage
node tools/check-coverage.mjs
```

`check-patterns` is enforced in strict mode inside `check:all`; any finding is a blocking failure.

For cleanup sessions tracked by garbage-collection baseline markers:

- `npm run gc:status` at the start
- `npm run gc:update-baseline` at the end

## Touchpoint Matrix

| Change Type | Minimum Docs to Update |
|---|---|
| New/changed module in `config/components.js` | `documentation/architecture/component-system.md`, affected module doc in `documentation/widgets/` |
| New cluster or new cluster kind | `documentation/guides/add-new-cluster.md`, `documentation/architecture/cluster-widget-system.md`, relevant module docs |
| New gauge renderer | `documentation/guides/add-new-gauge.md`, `documentation/widgets/semicircle-gauges.md` or dedicated module doc |
| Changes in registration/lifecycle flow (`runtime/init.js`, `runtime/widget-registrar.js`) | `documentation/avnav-api/plugin-lifecycle.md`, `documentation/architecture/component-system.md` |
| Changes in helper API (`runtime/helpers.js`) | `documentation/shared/helpers.md` |
| CSS/theming changes (`plugin.css`) | `documentation/shared/css-theming.md` |
| Test setup or quality rule changes (`package.json`, `vitest.config.js`, `tools/check-coverage.mjs`, `tools/check-dependencies.mjs`, `tools/check-umd.mjs`, `tools/check-naming.mjs`, `tools/check-patterns.mjs`, `tools/check-smell-contracts.mjs`, `tools/check-doc-format.mjs`, `tools/gc-baseline.mjs`, `tools/install-hooks.mjs`, `tools/check-hooks.mjs`, `.githooks/pre-push`) | `documentation/guides/documentation-maintenance.md`, `documentation/guides/garbage-collection.md`, `README.md`, `AGENTS.md`, `CLAUDE.md` |
| New documentation file | `documentation/TABLEOFCONTENTS.md` |

## Validation

`npm run check:strict` is the default quality gate.

`tools/check-docs.mjs` (inside `check:all`) verifies:

- relative markdown links and anchors
- JS `Documentation:` header targets
- stale high-risk architecture phrases

`tools/check-doc-format.mjs` (inside `check:all`, warn mode) verifies:

- required doc sections (`# Title`, `**Status:**`, and key headings)
- explicit exceptions for index/tracker docs

`tools/check-doc-reachability.mjs` (inside `check:all`) verifies:

- all in-scope markdown docs are reachable from `AGENTS.md` or `CLAUDE.md`
- markdown link targets to `.md` files exist on disk

Non-zero exit means docs are not consistent.

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

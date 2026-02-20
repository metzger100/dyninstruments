# Guide: Documentation Maintenance

**Status:** ✅ Active | Workflow for keeping docs aligned with code

## Overview

Use this workflow whenever code changes touch architecture, module wiring, or widget behavior.

## Workflow

1. Identify touched code areas (`config/`, `runtime/`, `widgets/`, `plugin.js`)
2. Update the mapped docs in `documentation/`
3. Update root docs (`README.md`, `CLAUDE.md`) when architecture guidance changes
4. Every new documentation file must be linked from at least one other doc that is itself reachable from AGENTS.md. The easiest way: add an entry to TABLEOFCONTENTS.md.
5. Run validation:

```bash
node tools/check-docs.mjs
node tools/check-doc-reachability.mjs
```

6. If behavior/runtime logic changed, run regression checks:

```bash
npm test
npm run test:coverage:check
```

7. Fix all failures before finishing

## Touchpoint Matrix

| Change Type | Minimum Docs to Update |
|---|---|
| New/changed module in `config/components.js` | `documentation/architecture/component-system.md`, affected module doc in `documentation/widgets/` |
| New cluster or new cluster kind | `documentation/guides/add-new-cluster.md`, `documentation/architecture/cluster-widget-system.md`, relevant module docs |
| New gauge renderer | `documentation/guides/add-new-gauge.md`, `documentation/widgets/semicircle-gauges.md` or dedicated module doc |
| Changes in registration/lifecycle flow (`runtime/init.js`, `runtime/widget-registrar.js`) | `documentation/avnav-api/plugin-lifecycle.md`, `documentation/architecture/component-system.md` |
| Changes in helper API (`runtime/helpers.js`) | `documentation/shared/helpers.md` |
| CSS/theming changes (`plugin.css`) | `documentation/shared/css-theming.md` |
| Test setup or quality rule changes (`package.json`, `vitest.config.js`, `tools/check-coverage.mjs`, `tools/check-naming.mjs`, `tools/check-patterns.mjs`) | `documentation/guides/testing-regression.md`, `documentation/README.md`, `README.md`, `CLAUDE.md` |
| New documentation file | `documentation/TABLEOFCONTENTS.md`, `documentation/README.md` |

## Validation

`tools/check-docs.mjs` verifies:

- relative markdown links and anchors
- JS `Documentation:` header targets
- stale high-risk architecture phrases

`tools/check-doc-reachability.mjs` verifies:

- all in-scope markdown docs are reachable from `AGENTS.md` or `CLAUDE.md`
- markdown link targets to `.md` files exist on disk

Non-zero exit means docs are not consistent.

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [testing-regression.md](testing-regression.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

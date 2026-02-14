# Guide: Documentation Maintenance

**Status:** ✅ Active | Workflow for keeping docs aligned with code

## Overview

Use this workflow whenever code changes touch architecture, module wiring, or widget behavior.

## Workflow

1. Identify touched code areas (`config/`, `core/`, `modules/`, `plugin.js`)
2. Update the mapped docs in `documentation/`
3. Update root docs (`README.md`, `CLAUDE.md`) when architecture guidance changes
4. Run validation:

```bash
node tools/check-docs.mjs
```

5. Fix all failures before finishing

## Touchpoint Matrix

| Change Type | Minimum Docs to Update |
|---|---|
| New/changed module in `config/modules.js` | `documentation/architecture/module-system.md`, affected module doc in `documentation/modules/` |
| New cluster or new cluster kind | `documentation/guides/add-new-cluster.md`, `documentation/architecture/cluster-system.md`, relevant module docs |
| New gauge renderer | `documentation/guides/add-new-gauge.md`, `documentation/modules/semicircle-gauges.md` or dedicated module doc |
| Changes in registration/lifecycle flow (`core/init.js`, `core/register-instrument.js`) | `documentation/avnav-api/plugin-lifecycle.md`, `documentation/architecture/module-system.md` |
| Changes in helper API (`core/helpers.js`) | `documentation/shared/helpers.md` |
| CSS/theming changes (`plugin.css`) | `documentation/shared/css-theming.md` |
| New documentation file | `documentation/TABLEOFCONTENTS.md`, `documentation/README.md` |

## Validation

`tools/check-docs.mjs` verifies:

- relative markdown links and anchors
- JS `Documentation:` header targets
- stale high-risk architecture phrases

Non-zero exit means docs are not consistent.

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../architecture/module-system.md](../architecture/module-system.md)
- [../architecture/cluster-system.md](../architecture/cluster-system.md)

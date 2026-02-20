# Guide: Garbage Collection

**Status:** ✅ Active | Single-pass workflow for keeping code and docs clean

## Overview

Use this guide to remove structural drift, keep documentation synchronized with code, and preserve runtime boundaries. Follow this workflow whenever you perform cleanup or technical-debt reduction.

## Workflow

1. Run structural checks first.

```bash
node tools/check-file-size.mjs
node tools/check-headers.mjs
node tools/check-naming.mjs
node tools/check-patterns.mjs --warn
```

Rule references:
- `check-patterns.mjs`: `duplicate-fn`, `forbidden-global`, `empty-catch`, `todo-missing-owner`
- `check-file-size.mjs`: warning at `>250` non-empty lines, failure at `>300` non-empty lines

2. Verify code-doc co-evolution for changed `.js` files.
- List changed JS files from git (`git diff --name-only ... -- '*.js'`).
- For each file, inspect its header `Documentation:` path and confirm the linked `.md` still describes current behavior.
- Update docs in the same task whenever behavior, props, mapper outputs, or dependencies change.

3. Consolidate duplicate helpers into shared modules.
- Move reusable logic to `shared/widget-kits/` (or `shared/widget-kits/gauge/`).
- Keep widget files focused on widget-specific behavior, not shared math/layout/formatter logic.

4. Enforce the AvNav boundary.
- Only `runtime/` and `plugin.js` should access `window.avnav` / `avnav.api` directly.
- Widgets/cluster/shared code should call runtime-safe helpers such as `Helpers.applyFormatter()`.

5. Fix catch and maintenance-marker hygiene.
- Replace empty catches with explicit handling: comment why silence is intentional, log with context, or use centralized handlers.
- Ensure maintenance markers include owner and date, e.g. `TODO(name, 2026-02-20): ...`.

6. Re-run checks and close the loop.
- Run strict checks after fixes:

```bash
node tools/check-patterns.mjs
node tools/check-file-size.mjs
node tools/check-headers.mjs
node tools/check-naming.mjs
node tools/check-docs.mjs
```

- When cleanup changes debt status, update `documentation/TECH-DEBT.md` and `documentation/QUALITY.md`.

## Anti-Patterns

| Pattern | Example from This Project | Detection | Fix |
|---|---|---|---|
| Helper duplication | Historical: `extractNumberText` duplicated in 4 gauge widgets before TD-001 (`DepthGaugeWidget`, `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`) | `check-patterns.mjs` (`duplicate-fn`) | Extract shared helper to `shared/widget-kits/` (done via `GaugeValueMath.extractNumberText`) |
| AvNav boundary bypass | Historical: direct `avnav.api` access in `SpeedGaugeWidget`, `TemperatureGaugeWidget`, `VoltageGaugeWidget`, `WindDialWidget`, `PositionCoordinateWidget` (TD-008) | `check-patterns.mjs` (`forbidden-global`) | Route through `Helpers.applyFormatter()` |
| Empty catch blocks | Historical: silent `catch(e){}` fallback paths in renderer/helper/widget code before TD-009 | `check-patterns.mjs` (`empty-catch`) | Add explicit comment/logging or use centralized boundary handling |
| Growing files | Current warnings: `widgets/gauges/WindDialWidget/WindDialWidget.js` (261 non-empty lines), `shared/widget-kits/gauge/GaugeTextLayout.js` (259 non-empty lines) | `check-file-size.mjs` (warning at `>250`) | Split before exceeding 300 non-empty lines |
| Stale doc headers | Historical header path drift: `documentation/modules/...` and `documentation/architecture/module-system.md` migrated to current `documentation/widgets/...` and `documentation/architecture/component-system.md` | `check-headers.mjs` (`broken-doc-link`) | Update `Documentation:` header path to the current doc |
| Naming drift | Historical naming cleanup: `DyniThreeElements` -> `DyniThreeValueTextWidget` and related `globalKey` normalization in `config/components.js` | `check-naming.mjs` | Rename to match conventions (`Dyni{ComponentName}` and matching registered/returned ids) |
| Copy-paste divergence | Historical: `clamp` implemented in multiple files (`GaugeValueMath`, `PositionCoordinateWidget`, `ThreeValueTextWidget`) before TD-006 | `check-patterns.mjs` (`duplicate-fn`) | Use canonical shared implementation (`GaugeValueMath.clamp`) |
| Test assertion gaming | Guardrail: no confirmed incident in current history, but risk exists when assertions are weakened to force green builds | Human review | Restore strong assertions and fix implementation behavior |
| Code↔Doc divergence | Risk pattern: JS behavior changed while linked module docs lag behind | Manual workflow step (code-doc co-evolution check) | Update linked docs in the same task |
| Magic number spread | Historical repeated padding formula (`Math.max(6, Math.floor(Math.min(W, H) * 0.04))`) appeared across multiple widgets/text renderers before centralization | `check-patterns.mjs` (future rule) + manual review | Centralize constants/calculations in shared helpers |
| Undated TODOs (`TODO(name, 2026-02-20): ...` required format) | Guardrail: no current violations, rule still enforced repo-wide | `check-patterns.mjs` (`todo-missing-owner`) | Use `TODO(name, YYYY-MM-DD): description` |

## Related

- [../TABLEOFCONTENTS.md](../TABLEOFCONTENTS.md)
- [../core-principles.md](../core-principles.md)
- [../conventions/coding-standards.md](../conventions/coding-standards.md)
- [documentation-maintenance.md](documentation-maintenance.md)
- [../QUALITY.md](../QUALITY.md)
- [../TECH-DEBT.md](../TECH-DEBT.md)

# CLAUDE.md - Project Standards & Workflow

**Critical:** This document defines AI-optimized documentation standards and development workflow for the dyninstruments AvNav plugin. Read this FIRST before any work.

---

## 1. Project Constraints (AvNav Plugin Environment)

- **No npm, no bundler, no build step** — Raw JS loaded via `<script>` tags at runtime
- **UMD module pattern** — All modules register on `window.DyniModules.{globalKey}`
- **avnav.api** — Only external dependency. Plugin API provided by AvNav host app
- **AVNAV_BASE_URL** — Global string set by AvNav, used to construct module URLs
- **Canvas 2D only** — All visual rendering via `renderCanvas(canvas, props)`
- **No ES modules, no import/export** — Must use IIFE or UMD wrappers
- **HiDPI** — `Helpers.setupCanvas()` handles devicePixelRatio scaling
- **Browser-only** — No Node.js, no server-side code
- **No tests** — No test framework

---

## 2. Token-Efficient Documentation System

### Documentation Structure

```
documentation/
├── TABLEOFCONTENTS.md              # Navigation index (read THIS FIRST)
├── README.md                       # Project overview
├── avnav-api/
│   ├── plugin-lifecycle.md         # registerWidget, render cycle, props
│   ├── editable-parameters.md      # Types, conditions, defaults
│   └── formatters.md               # formatSpeed, formatDistance, etc.
├── architecture/
│   ├── module-system.md            # UMD loader, dependencies, MODULES{}
│   └── cluster-system.md           # ClusterHost, kind→renderer routing
├── gauges/
│   ├── gauge-style-guide.md        # Proportions, colors, pointer, layout modes
│   └── gauge-shared-api.md         # InstrumentComponents documentation
├── shared/
│   ├── helpers.md                  # Helpers object (setupCanvas, resolveTextColor)
│   └── css-theming.md              # CSS vars, day/night, font stack
├── modules/
│   ├── three-elements.md           # ThreeElements numeric renderer
│   ├── wind-dial.md                # WindDial full-circle wind compass
│   └── compass-gauge.md            # CompassGauge rotating compass card
└── guides/
    ├── add-new-gauge.md            # Step-by-step: create a new gauge
    └── add-new-cluster.md          # Step-by-step: create a new cluster widget
```

### RULE: Always Start with TABLEOFCONTENTS.md

1. **Read `documentation/TABLEOFCONTENTS.md` FIRST**
2. Identify 1-3 relevant files for your task
3. Read ONLY those files
4. **Never read all files sequentially** (wastes tokens)

### Example Workflow

**Bad (Token wasteful):**
```
Task: Add new BarometerGauge
❌ Read all documentation files → all gauge source files → ...
```

**Good (Token efficient):**
```
Task: Add new BarometerGauge
✅ Read TABLEOFCONTENTS.md
✅ Identify: guides/add-new-gauge.md, gauges/gauge-style-guide.md
✅ Read only those 2 files
✅ Begin implementation
```

---

## 3. File Size Limits

- **Max 300 lines per JS file**
- Shared drawing/layout code → `modules/Cores/InstrumentComponents.js`
- Gauge-specific code only in individual gauge module files
- Cluster configs → separate files under `config/clusters/` (planned)
- Target after refactoring. Current files exceed this

---

## 4. Mandatory File Headers

Every JS module file MUST have:

```javascript
/**
 * Module: [Name] — [One-line description]
 * Documentation: documentation/[path].md
 * Depends: [list of module dependencies]
 */
```

Example:
```javascript
/**
 * Module: SpeedGauge — Semicircle speedometer with warning/alarm sectors
 * Style Guide: documentation/gauges/gauge-style-guide.md
 * Depends: InstrumentComponents (drawPointerAtRim only)
 */
```

---

## 5. Coding Conventions

### UMD Module Template

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniModuleName = factory(); }
}(this, function () {
  "use strict";
  function create(def, Helpers) {
    // Module code here
    return { id: "ModuleName", /* exports */ };
  }
  return { id: "ModuleName", create };
}));
```

### Naming Conventions

- **Widget names:** `dyninstruments_{Cluster}` (e.g., `dyninstruments_Speed`)
- **Module globalKeys:** `Dyni{ModuleName}` (e.g., `DyniSpeedGauge`)
- **Gauge threshold props:** `{gauge}RatioThresholdNormal`, `{gauge}RatioThresholdFlat`
- **Sector props:** `{gauge}WarningFrom`, `{gauge}AlarmFrom`
- **Per-kind caption/unit:** `caption_{kindName}`, `unit_{kindName}`
- **editableParameter conditions:** `{ kind: "xxxGraphic" }` or array `[{ kind: "a" }, { kind: "b" }]`

### Gauge Proportions Quick Reference

All semicircle gauges share these proportions (function of R = gauge radius):

| Element | Formula |
|---|---|
| R (radius) | `min(availW/2, availH)` |
| ringW (sector width) | `max(6, floor(R × 0.12))` |
| needleDepth | `max(8, floor(ringW × 0.9))` |
| labelInset | `max(18, floor(ringW × 1.8))` |
| labelFontPx | `max(10, floor(R × 0.14))` |
| pad | `max(6, floor(min(W,H) × 0.04))` |
| gap | `max(6, floor(min(W,H) × 0.03))` |

**Colors:** Warning `#e7c66a`, Alarm `#ff7a76`, Pointer `#ff2b2b`
**Full reference:** `documentation/gauges/gauge-style-guide.md`

### Layout Modes (All Graphic Widgets)

```
ratio = W / H
ratio < thresholdNormal  →  "high"   (gauge top, text band below)
ratio > thresholdFlat    →  "flat"   (gauge left, text right)
else                     →  "normal" (text inside semicircle)
```

---

## 6. Token-Efficient Documentation Format

### Mandatory Format for All Docs

```markdown
# [Title]

**Status:** [✅ Implemented / ⏳ In Progress / ❌ Not Started] [Brief]

## Overview
[1-2 sentences max]

## Key Details
- Compact bullet lists
- API signatures
- Data types and values
- Configuration keys

## API/Interfaces
[Tables or compact code blocks]

## Fixed Issues (if any)
[Only important items]

## Related: [links to other docs]
```

### Forbidden Content (Token Efficiency)

- ❌ Verbose prose explanations
- ❌ "Why?" sections (keep brief rationale only)
- ❌ Large ASCII diagrams
- ❌ Excessive examples (max 1-2)
- ❌ "Future Enhancements" sections
- ❌ Empty sections
- ❌ Decorative formatting

### Required Content (Preserve Completely)

- ✅ API function signatures with parameters
- ✅ Props/config keys with types and defaults
- ✅ File paths and code locations
- ✅ Color values, proportions, constants
- ✅ Critical implementation details
- ✅ "Fixed Issues" for troubleshooting context

---

## 7. Documentation Maintenance

### RULE: Update TABLEOFCONTENTS.md

When adding new documentation:
1. Create doc file using token-efficient format
2. **Update TABLEOFCONTENTS.md** with new mapping
3. Update documentation/README.md if needed

### RULE: Keep Docs Up-to-Date

- **Before code changes:** Read relevant docs
- **After code changes:** Update docs immediately
- Use token-efficient format for all updates
- Add file headers linking to docs

---

## 8. Token Budget Management

**Preserve tokens for implementation, not context gathering.**

| Budget | Allocation |
|---|---|
| 20-30% | Reading relevant docs (via TABLEOFCONTENTS.md) |
| 70-80% | Implementation, problem-solving, code generation |

**Anti-patterns:** ❌ Reading all docs, ❌ Re-reading same docs, ❌ Reading verbose examples

**Best practices:** ✅ TABLEOFCONTENTS.md first, ✅ Read only Key Details sections, ✅ Skip examples unless implementing similar code

---

## 9. Known Code Issues (Pre-Refactoring)

These issues exist in the current codebase and are being resolved incrementally:

- **Massive duplication:** SpeedGauge/DepthGauge/TemperatureGauge/VoltageGauge share ~25 identical functions (~350 lines each).
- **Dead fallbacks:** `drawPointerAtRimFallback` exists in all 4 gauge files but never executes (IC is always loaded). Will be removed.
- **plugin.js monolith:** 1310 lines; ~800 lines are inline editableParameters. Will be split into per-cluster config files.
- **LEGACY array:** Always empty, `EXPOSE_LEGACY = false`. Will be removed.

---

## 10. Quality Checklist

Before completing any task:

- [ ] Used TABLEOFCONTENTS.md to find docs (not read all files)
- [ ] Read only necessary documentation
- [ ] Updated documentation in token-efficient format
- [ ] Updated TABLEOFCONTENTS.md if added new docs
- [ ] Added file headers to new code files
- [ ] No file exceeds 300 lines
- [ ] Documentation matches implementation
- [ ] UMD wrapper pattern used for new modules

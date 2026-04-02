---
name: mapper-review
description: Reviews mapper file changes against the dyninstruments mapper boundary rules and catches presentation logic leakage, output complexity violations, and naming drift.
---

# Skill: mapper-review

## Description

Reviews mapper file changes against the dyninstruments mapper boundary rules. Mappers are one of the project's most sensitive boundaries — they must remain declarative routing/normalization only. This skill catches presentation logic leakage, output complexity violations, and naming drift.

## When to Use

Whenever a file in `cluster/mappers/` is created or modified. Also useful as a pre-commit check for any cluster-level changes.

## Instructions

### The Mapper Contract

Mappers have exactly two functions: `create()` and `translate()`. No other function declarations are allowed in a mapper file.

- `create(def, Helpers)` — instantiates dependencies (viewmodels, toolkit)
- `translate(props, toolkit)` — reads kind from props, returns a declarative renderer output

### Check 1: No Extra Function Declarations

Scan the mapper file. The only allowed function declarations are `create` and `translate`.

```javascript
// ❌ SMELL: Helper function inside mapper
function formatStatusSymbol(status) { ... }
function computeDisplayValue(raw) { ... }
function resolveLayoutMode(ratio) { ... }

// ✅ OK: Only create and translate
function create(def, Helpers) { ... }
function translate(props, toolkit) { ... }
```

If you find extra functions, move them to:
- `cluster/rendering/` — for renderer-specific logic
- `widgets/` — for widget-specific logic
- `shared/widget-kits/` — for reusable logic
- `cluster/mappers/ClusterMapperToolkit.js` — for mapper-shared utilities

### Check 2: Declarative Output Only

Each `translate()` return object must contain only:
- `renderer` — string matching a `rendererId` in `ClusterKindCatalog`
- Mapped values — direct prop reads or simple normalization (`Number()`, `String()`, `toolkit.cap()`, `toolkit.unit()`)
- ViewModel outputs — results from `viewModel.build(p, toolkit)`
- Pass-through keys — formatter names, unit strings, boolean flags

```javascript
// ❌ SMELL: Presentation logic in mapper
return {
  renderer: "Widget",
  displayText: value > 100 ? "HIGH" : "OK",  // presentation logic
  color: isAlarm ? "#ff0000" : "#00ff00",     // rendering decision
  formattedValue: formatSpeed(raw, unit),      // formatter call
  layoutMode: ratio < 1.0 ? "high" : "normal" // layout logic
};

// ✅ OK: Declarative output
return {
  renderer: "Widget",
  value: num(p.rawValue),      // numeric normalization
  caption: cap("kindName"),    // per-kind text param
  unit: unit("kindName"),      // per-kind text param
  warningFrom: num(p.warningFrom),
  alarmFrom: num(p.alarmFrom)
};
```

### Check 3: Output Complexity

Count top-level properties in each `translate()` return object.

| Count | Severity | Action |
|---|---|---|
| ≤8 | OK | No action needed |
| 9–12 | WARN | Track in TECH-DEBT.md, plan cleanup |
| >12 | BLOCK | Refactor immediately — group into sub-objects or move to dedicated renderer adapter |

Grouping pattern for complex outputs:

```javascript
return {
  renderer: "Widget",
  domain: {
    route: rpDomain.route,
    routeName: rpDomain.route ? rpDomain.route.name : "",
    pointCount: rpDomain.route ? rpDomain.route.points.length : 0,
    selectedIndex: rpDomain.selectedIndex,
    isActiveRoute: rpDomain.isActiveRoute
  },
  layout: {
    ratioThresholdNormal: num(p.ratioThresholdNormal),
    ratioThresholdFlat: num(p.ratioThresholdFlat),
    showHeader: p.showHeader
  },
  formatting: {
    distanceUnit: p.distanceUnit,
    courseUnit: p.courseUnit
  }
};
```

### Check 4: Renderer Value Alignment

For every `renderer: "SomeName"` in the mapper output, verify:

1. `SomeName` exists as a `rendererId` in `cluster/rendering/ClusterKindCatalog.js`
2. The catalog tuple's `surface` matches the renderer's type (canvas-dom vs html)
3. `SomeName` is registered in `cluster/rendering/ClusterRendererRouter.js` rendererSpecs
4. `SomeName` is in the deps of `ClusterRendererRouter` (via registry)

```bash
# Quick verification
grep -n "SomeName" cluster/rendering/ClusterKindCatalog.js
grep -n "SomeName" cluster/rendering/ClusterRendererRouter.js
grep -n "SomeName" config/components/registry-widgets.js
```

### Check 5: No Formatter Calls

Mappers must not call formatters. They pass formatter keys through for renderers to use.

```javascript
// ❌ SMELL: Formatter call in mapper
const formatted = Helpers.applyFormatter(raw, { formatter: "formatSpeed" });
return { renderer: "Widget", displayValue: formatted };

// ✅ OK: Pass formatter key through
return { renderer: "Widget", value: num(raw), formatter: "formatSpeed" };
```

### Check 6: No Layout/Responsive Logic

Mappers must not compute layout modes, responsive floors, or geometry.

```javascript
// ❌ SMELL: Layout logic in mapper
const mode = ratio < 1.0 ? "high" : ratio > 3.5 ? "flat" : "normal";
return { renderer: "Widget", mode };

// ✅ OK: Pass ratio threshold props for the renderer/layout owner to resolve
return {
  renderer: "Widget",
  ratioThresholdNormal: num(p.ratioNormal),
  ratioThresholdFlat: num(p.ratioFlat)
};
```

### Check 7: Cluster Renderer Naming

Components under `cluster/rendering/` must use role-based IDs, not cluster-prefixed IDs.

```javascript
// ❌ SMELL: Cluster-prefixed renderer
rendererId: "VesselPropsWidget"    // cluster-prefixed
rendererId: "NavTextWidget"        // cluster-prefixed

// ✅ OK: Role-based renderer
rendererId: "RendererPropsWidget"  // role-based
rendererId: "ActiveRouteTextHtmlWidget"  // feature-based
```

### Output

After reviewing, produce a summary:

```
MAPPER: {filename}
FUNCTIONS: {list of declared functions — should be only create, translate}
BRANCHES: {list of kind branches in translate()}
MAX OUTPUT PROPS: {highest count across branches}
RENDERER ALIGNMENT: {all matched / mismatches listed}
FINDINGS: {list of issues, or "clean"}
```

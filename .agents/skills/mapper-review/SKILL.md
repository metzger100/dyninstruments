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

- `create()` — use this when the mapper does not need `componentContext`
- `create(def, componentContext)` — use this only when the mapper needs `componentContext`
- `translate(props, routeContext)` — reads kind from props, returns declarative route output
- `routeContext.toolkit` — mapper helper surface
- `routeContext.viewModel` — optional route-scoped view-model surface

### Check 1: No Extra Function Declarations

Scan the mapper file. The only allowed function declarations are `create` and `translate`.

```javascript
// ❌ SMELL: Helper function inside mapper
function formatStatusSymbol(status) { ... }
function computeDisplayValue(raw) { ... }
function resolveLayoutMode(ratio) { ... }

// ✅ OK: Only create and translate
function create(def, componentContext) { ... }
function translate(props, routeContext) { ... }
```

If you find extra functions, move them to:
- `widgets/` — for widget-specific logic
- `shared/widget-kits/` — for reusable logic
- `cluster/mappers/ClusterMapperToolkit.js` — for mapper-shared utilities

### Check 2: Declarative Output Only

Each `translate()` return object must contain only:
- Mapped values — direct prop reads or simple normalization (`Number()`, `String()`, `toolkit.cap()`, `toolkit.unit()`)
- ViewModel outputs — results from `viewModel.build(p, toolkit)`
- Pass-through keys — formatter names, unit strings, boolean flags

```javascript
// ❌ SMELL: Presentation logic in mapper
return {
  displayText: value > 100 ? "HIGH" : "OK",  // presentation logic
  color: isAlarm ? "#ff0000" : "#00ff00",     // rendering decision
  formattedValue: formatSpeed(raw, unit),      // formatter call
  layoutMode: ratio < 1.0 ? "high" : "normal" // layout logic
};

// ✅ OK: Declarative output
return {
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
| >8 | BLOCK | Refactor immediately — group into sub-objects or move to dedicated renderer adapter |

Grouping pattern for complex outputs:

```javascript
return {
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

### Check 4: Route Metadata Alignment

For every cluster/kind branch, verify the route metadata contract instead of mapper-owned renderer identity:

1. `config/cluster-routes/<cluster>.js` contains the route tuple for that cluster/kind branch
2. `mapperId` points at the mapper under review
3. `rendererId` exists in `config.components`
4. `surface` matches the renderer type (`canvas-dom` vs `html`)

```bash
# Quick verification
grep -n "kindName" config/cluster-routes/*.js
grep -n "mapperId.*MapperName" config/cluster-routes/*.js
grep -n "rendererId.*RendererName" config/components/registry-*.js
```

### Check 5: No Formatter Calls

Mappers must not call formatters. They pass formatter keys through for renderers to use.

```javascript
// ❌ SMELL: Formatter call in mapper
const formatted = formatSpeed(raw, unit);
return { displayValue: formatted };

// ✅ OK: Pass formatter key through
return {
  value: num(raw),
  formatter: "formatSpeed",
  formatterParameters: [unit]
};
```

### Check 6: No Layout/Responsive Logic

Mappers must not compute layout modes, responsive floors, or geometry.

```javascript
// ❌ SMELL: Layout logic in mapper
const mode = ratio < 1.0 ? "high" : ratio > 3.5 ? "flat" : "normal";
return { mode };

// ✅ OK: Pass ratio threshold props for the renderer/layout owner to resolve
return {
  ratioThresholdNormal: num(p.ratioNormal),
  ratioThresholdFlat: num(p.ratioFlat)
};
```

### Check 7: Renderer Naming

Renderer components must use role-based IDs, not cluster-prefixed IDs. Keep route identity in `config/cluster-routes/` and renderer registration in `config/components/`.

```javascript
// ❌ SMELL: Cluster-prefixed renderer
rendererId: "VesselPropsWidget"    // cluster-prefixed
rendererId: "NavTextWidget"        // cluster-prefixed

// ✅ OK: Role-based renderer
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

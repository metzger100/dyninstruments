# Skill: add-widget

## Description

Scaffolds a new widget in the dyninstruments repository. Determines the correct archetype, generates all required files with proper UMD wrappers, naming conventions, and wiring, and produces the complete checklist of registration points. Prevents the "forgot to wire X" class of bugs.

## When to Use

When creating any new widget, renderer, kind, or gauge in the dyninstruments project.

## Instructions

### Step 1: Determine the Archetype

Ask the user or infer from context which archetype this widget matches:

| Archetype | Shared Engine | Reference Implementation | Guide |
|---|---|---|---|
| Semicircle gauge | `SemicircleRadialEngine` | `widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js` | `documentation/guides/add-new-gauge.md` |
| Linear gauge | `LinearGaugeEngine` | `widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js` | `documentation/guides/add-new-linear-gauge.md` |
| Full-circle dial | `FullCircleRadialEngine` | `widgets/radial/CompassRadialWidget/CompassRadialWidget.js` | `documentation/guides/add-new-full-circle-dial.md` |
| Text renderer | `TextLayoutEngine` | `widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js` | `documentation/guides/add-new-text-renderer.md` |
| Text renderer variant | `TextLayoutEngine` | `widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js` | `documentation/guides/add-new-text-renderer.md` |
| Native HTML kind | `HtmlSurfaceController` lifecycle | `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js` | `documentation/guides/add-new-html-kind.md` |

**Rule:** If the widget does not match any archetype, STOP and discuss with the user before creating a new engine. Read the reference implementation for the chosen archetype before proceeding.

### Step 2: Derive Names

From the widget name, derive all required identifiers:

```
Widget name: [UserInput] (e.g., "Barometer")
Component ID: {Name}Widget (e.g., "BarometerRadialWidget")
Global key: Dyni{ComponentId} (e.g., "DyniBarometerRadialWidget")
File basename: {ComponentId}.js (e.g., "BarometerRadialWidget.js")
Folder: widgets/{type}/{ComponentId}/ (e.g., "widgets/radial/BarometerRadialWidget/")
Cluster widget name: dyni_{Cluster}_Instruments (e.g., "dyni_Environment_Instruments")
Kind name: {kindName} (e.g., "barometerRadial")
Mapper renderer value: "{ComponentId}" (must match ClusterKindCatalog rendererId)
```

For cluster kinds, also derive:
```
Ratio threshold props: {kind}RatioThresholdNormal, {kind}RatioThresholdFlat
Sector props (if gauge): {kind}WarningFrom, {kind}AlarmFrom
Range props (if gauge): {kind}MinValue, {kind}MaxValue
Tick props (if gauge): {kind}TickMajor, {kind}TickMinor
Per-kind text props: caption_{kind}, unit_{kind}
Editable condition: { kind: "{kindName}" }
```

### Step 3: Generate the Widget Module

Create the widget file with the mandatory UMD wrapper and header:

```javascript
/**
 * Module: {ComponentId} - {One-line description}
 * Documentation: documentation/widgets/{doc-name}.md
 * Depends: {SharedEngine}, {OtherDeps}
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).{GlobalKey} = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    // Get shared engine
    // Provide gauge-specific functions only
    // Build renderer with createRenderer(spec)
    // Return module spec
    return {
      id: "{ComponentId}",
      wantsHideNativeHead: true,
      renderCanvas,        // for canvas-dom surface
      // OR
      renderHtml,          // for html surface
      namedHandlers,       // for html surface
      resizeSignature,     // for html surface
      translateFunction
    };
  }

  return { id: "{ComponentId}", create };
}));
```

**Critical rules for the module body:**
- Do NOT add `rangeDefaults` or `ratioDefaults` to `createRenderer` spec — trust editable config.
- Do NOT import `ResponsiveScaleProfile` — the shared engine/layout already owns it.
- Do NOT add `Math.max(N, ...)` responsive floors — use shared profile.
- Do NOT add `typeof ctx.method === "function"` guards — trust Canvas 2D.
- Do NOT add `typeof Helpers.method === "function"` guards — trust module loader.
- Keep the file under 400 lines. Gauge-specific code only.

### Step 4: Register the Component

Add entry to `config/components/registry-widgets.js`:

```javascript
{ComponentId}: {
  js: BASE + "{folder}/{ComponentId}.js",
  css: undefined,  // or CSS path for HTML kinds
  globalKey: "{GlobalKey}",
  deps: ["{SharedEngine}"]  // plus any other deps
}
```

If cluster-routed, also:
- Add `"{ComponentId}"` to `RendererPropsWidget.deps` in `config/components/registry-widgets.js`
- `ClusterRendererRouter` already depends on `RendererPropsWidget`; no direct edit needed there

### Step 5: Wire ClusterRendererRouter

In `cluster/rendering/ClusterRendererRouter.js`, add the renderer spec to `rendererSpecs`:

```javascript
// Inside the rendererSpecs map, instantiate the new widget
```

### Step 6: Add Kind Catalog Tuple

In `cluster/rendering/ClusterKindCatalog.js`, add the strict routing tuple:

```javascript
{ cluster: "{cluster}", kind: "{kindName}", viewModelId: "{ViewModel}", rendererId: "{ComponentId}", surface: "{surface}" }
```

- `surface` must be `"canvas-dom"` for gauges/dials/text-canvas, `"html"` for HTML kinds
- `rendererId` MUST match what the mapper returns as `renderer`
- Unknown/mismatched tuples fail closed

### Step 7: Add Mapper Branch

In the relevant `cluster/mappers/{Cluster}Mapper.js`, add a branch in `translate()`:

```javascript
if (req === "{kindName}") {
  return {
    renderer: "{ComponentId}",
    value: p.{storeKey},
    caption: cap("{kindName}"),
    unit: unit("{kindName}"),
    // gauge-specific props from editable parameters
  };
}
```

**Mapper rules:**
- Keep declarative: select renderer, map values, normalize numbers, pass-through formatter keys
- No formatter logic, no status-symbol conversion, no rendering fallbacks
- Keep under 9 top-level props per return (group into `domain`/`layout`/`formatting` if needed)
- Only `create()` and `translate()` function declarations allowed

### Step 8: Add Store Keys and Editable Parameters

In `config/clusters/{cluster}.js`:

1. Add any new store keys to the `storeKeys` object
2. Add the kind to the `kind` SELECT list: `opt("{Display Name}", "{kindName}")`
3. Add editable parameters scoped with `condition: { kind: "{kindName}" }`

### Step 9: Generate Test Skeleton

Create test file at `tests/widgets/{type}/{ComponentId}.test.js` (or `tests/cluster/` for cluster-level tests).

Minimum coverage depends on archetype:

**Canvas gauges (semicircle/linear/full-circle):**
- Renderer creates without error
- Flat/normal/high mode transitions
- Pointer tracks displayed numeric value
- Warning/alarm sectors render correctly
- Day/night colors update
- Disconnect handling

**Text renderers:**
- Layout mode transitions
- Text fit behavior
- Caption/unit/value rendering
- Disconnect overlay

**HTML kinds:**
- Surface lifecycle: attach/update/detach/destroy
- Click ownership: dispatch vs passive/editing mode
- Resize contract: signature changes only on layout-relevant inputs
- Class/state rendering: mode classes, state classes
- Escaping: escaped output for all text fields
- Fail-closed: explicit throw for missing required payload

### Step 10: Generate Documentation Stub

Create `documentation/widgets/{doc-name}.md`:

```markdown
# {Widget Display Name}

**Status:** ⏳ In Progress | {One-line description}

## Overview

{1-2 sentences max}

## Key Details

- Archetype: {archetype}
- Shared engine: {engine}
- Surface: {surface}
- Cluster: {cluster}
- Kind: {kindName}

## Props

| Prop | Type | Source | Description |
|---|---|---|---|
| {prop} | {type} | {mapper/editable/store} | {description} |

## Layout Modes

| Mode | Condition | Behavior |
|---|---|---|
| high | ratio < {normal} | {description} |
| normal | {normal} ≤ ratio ≤ {flat} | {description} |
| flat | ratio > {flat} | {description} |

## Related

- [{guide}]({guide-path})
- [{shared-api}]({shared-api-path})
```

Add a link to this doc from `documentation/TABLEOFCONTENTS.md`.

### Step 11: Verify

Run the completion gate:

```bash
npm run check:all
```

This runs `check:core` (headers, naming, dependencies, UMD, file size, patterns, docs) + `test:coverage:check` + `perf:check`.

### Output Checklist

Print this checklist and verify every item:

- [ ] Widget module created at `widgets/{type}/{ComponentId}/{ComponentId}.js`
- [ ] UMD wrapper with correct `globalKey` on `window.DyniComponents`
- [ ] Mandatory header: `Module`, `Documentation`, `Depends`
- [ ] Component registered in `config/components/registry-widgets.js`
- [ ] Added to `RendererPropsWidget.deps` (if cluster-routed)
- [ ] Renderer wired in `cluster/rendering/ClusterRendererRouter.js`
- [ ] Kind catalog tuple added in `cluster/rendering/ClusterKindCatalog.js`
- [ ] `surface` type correct (`canvas-dom` or `html`)
- [ ] `rendererId` matches mapper `renderer` value
- [ ] Mapper branch added, declarative, under 9 top-level props
- [ ] Store keys added to cluster config
- [ ] Editable parameters added with correct `condition`
- [ ] Naming conventions followed (`Dyni{ComponentName}`, condition syntax)
- [ ] No `rangeDefaults`/`ratioDefaults` in widget-local spec
- [ ] No responsive hard floors in widget code
- [ ] No redundant guards/fallbacks on normalized props
- [ ] Tests created with minimum archetype coverage
- [ ] Documentation stub created and linked from TABLEOFCONTENTS.md
- [ ] File under 400 lines
- [ ] `npm run check:all` passes

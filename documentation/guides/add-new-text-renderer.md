# Guide: Add a New Text Renderer (TextLayoutEngine)

**Status:** ✅ Reference Guide | Thin-wrapper workflow for text-heavy widgets

## Prerequisites

Read first:

- [../shared/text-layout-engine.md](../shared/text-layout-engine.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)

## Overview

This guide covers canvas-backed text renderers on the internal `canvas-dom` surface.
For native HTML kinds (`surface: "html"`), use [add-new-html-kind.md](add-new-html-kind.md).

`TextLayoutEngine` keeps new text widgets thin:

- Renderer module owns data parsing, formatter selection, and `renderCanvas`.
- `TextLayoutEngine` owns layout mode routing, fit calculation, and shared draw helpers.
- Cluster mappers stay declarative (routing and normalized props only).

## Responsive Ownership Decision

- Use `TextLayoutEngine.computeResponsiveInsets(W, H)` when the renderer can be expressed with shared text rows and shared fit helpers.
- If the widget needs dedicated rectangles or geometry ownership, create a shared layout-owner module under `shared/widget-kits/` that consumes `ResponsiveScaleProfile` and return layout-owned boxes to the renderer.
- Do not import `ResponsiveScaleProfile` directly into text renderer modules and do not add user-visible responsive `Math.max(...)` / `clamp(...)` floors in widget code.

## Step 1: Create the Text Renderer Module

Create a UMD component under `widgets/text/<WidgetName>/<WidgetName>.js`.

Template example (shared text-family renderer style):

```javascript
/**
 * Module: RouteSummaryTextWidget - Route name + leg distance + ETA text renderer
 * Documentation: documentation/guides/add-new-text-renderer.md
 * Depends: ThemeResolver, TextLayoutEngine, Helpers.applyFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRouteSummaryTextWidget = factory(); }
}(this, function () {
  "use strict";

  function isFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n);
  }

  function parseWidgetData(props) {
    const p = props || {};
    return {
      caption: (p.caption == null) ? "" : String(p.caption),
      unit: (p.unit == null) ? "" : String(p.unit),
      routeName: (p.routeName == null) ? "" : String(p.routeName),
      legDistance: isFiniteNumber(p.legDistance) ? Number(p.legDistance) : undefined,
      eta: p.eta
    };
  }

  function pickFormatter(props, fieldKey, fallbackFormatter) {
    const p = props || {};
    const formatterKey = fieldKey + "Formatter";
    const paramsKey = fieldKey + "FormatterParameters";
    return {
      formatter: Object.prototype.hasOwnProperty.call(p, formatterKey)
        ? p[formatterKey]
        : fallbackFormatter,
      formatterParameters: Object.prototype.hasOwnProperty.call(p, paramsKey)
        ? p[paramsKey]
        : []
    };
  }

  function formatText(rawValue, formatterSpec, fallbackText, Helpers) {
    return String(Helpers.applyFormatter(rawValue, {
      formatter: formatterSpec.formatter,
      formatterParameters: Array.isArray(formatterSpec.formatterParameters) ? formatterSpec.formatterParameters : [],
      default: fallbackText
    }));
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const fitCache = text.createFitCache(["high", "normal", "flat"]);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) return;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";

      const tokens = theme.resolveForRoot(Helpers.resolveWidgetRoot(canvas) || canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      ctx.fillStyle = color;

      const parsed = parseWidgetData(p);
      const fallbackText = Object.prototype.hasOwnProperty.call(p, "default") ? String(p.default) : "---";
      const distanceText = formatText(
        parsed.legDistance,
        pickFormatter(p, "distance", "formatDistance"),
        fallbackText,
        Helpers
      );
      const etaText = formatText(
        parsed.eta,
        pickFormatter(p, "eta", "formatTime"),
        fallbackText,
        Helpers
      );

      const modeData = text.computeModeLayout({
        W: W,
        H: H,
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        captionUnitScale: p.captionUnitScale,
        captionText: parsed.routeName || parsed.caption,
        unitText: parsed.unit
      });
      const insets = text.computeResponsiveInsets(W, H);
      const key = text.makeFitCacheKey({
        mode: modeData.mode,
        W: W,
        H: H,
        caption: modeData.caption,
        unit: modeData.unit,
        top: distanceText,
        bottom: etaText,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: modeData.secScale
      });

      const fit = text.resolveFitCache(fitCache, modeData.mode, key, function () {
        return text.fitTwoRowsWithHeader({
          ctx: ctx,
          mode: modeData.mode,
          W: W,
          H: H,
          padX: insets.padX,
          innerY: insets.innerY,
          textFillScale: insets.responsive.textFillScale,
          secScale: modeData.secScale,
          captionText: modeData.caption,
          unitText: modeData.unit,
          topText: distanceText,
          bottomText: etaText,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        });
      });

      text.drawTwoRowsWithHeader({
        ctx: ctx,
        fit: fit,
        W: W,
        padX: insets.padX,
        captionText: modeData.caption,
        unitText: modeData.unit,
        topText: distanceText,
        bottomText: etaText,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      });

      if (p.disconnect) {
        text.drawDisconnectOverlay({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: color,
          labelWeight: labelWeight
        });
      }
    }

    function translateFunction() { return {}; }

    return {
      id: "RouteSummaryTextWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "RouteSummaryTextWidget", create: create };
}));
```

Key rule: parse and format widget data inside the renderer; do not move layout internals into mapper files. If the widget grows beyond shared text rows, stop and extract a layout-owner module instead of adding widget-local responsive logic.

## Step 2: Register in Component Registry

Add the new component in `config/components.js`:

```javascript
RouteSummaryTextWidget: {
  js: BASE + "widgets/text/RouteSummaryTextWidget/RouteSummaryTextWidget.js",
  css: undefined,
  globalKey: "DyniRouteSummaryTextWidget",
  deps: ["ThemeResolver", "TextLayoutEngine"]
}
```

## Step 3: Wire Cluster Renderer (If Cluster-Rendered)

If the widget is selected via `props.renderer` in cluster flow:

1. Add the component ID to `ClusterRendererRouter.deps` in `config/components.js`.
2. Add runtime instance in `cluster/rendering/ClusterRendererRouter.js` `rendererSpecs`.

Example:

```javascript
const rendererSpecs = {
  PositionCoordinateWidget: Helpers.getModule("PositionCoordinateWidget").create(def, Helpers),
  RouteSummaryTextWidget: Helpers.getModule("RouteSummaryTextWidget").create(def, Helpers)
};
```

Use role-based renderer IDs (for example `CenterDisplayTextWidget`), not cluster-prefixed names.

## Step 3b: Add Kind Catalog Route

Add or update the strict route tuple in `cluster/rendering/ClusterKindCatalog.js`:

```javascript
{ cluster: "nav", kind: "routeSummary", viewModelId: "MapperOutputViewModel", rendererId: "RouteSummaryTextWidget", surface: "canvas-dom" }
```

Rules:
- `surface` must be explicit (`canvas-dom` here).
- `rendererId` must match mapper output `renderer`.
- Unsupported surfaces or mismatched renderer IDs fail closed at runtime.

## Step 4: Mapper Routing (Declarative Only)

Update mapper translation to route kinds without embedding formatting logic.

Example mapper branch:

```javascript
if (req === "routeSummary") {
  return {
    renderer: "RouteSummaryTextWidget",
    routeName: p.routeSummaryName,
    legDistance: toolkit.num(p.routeSummaryDistance),
    eta: p.routeSummaryEta,
    distanceFormatter: "formatDistance",
    distanceFormatterParameters: [],
    etaFormatter: "formatTime",
    etaFormatterParameters: [],
    caption: cap("routeSummary"),
    unit: unit("routeSummary")
  };
}
```

Formatter names and parameter signatures must match the catalog:
[../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md).

If the renderer needs custom geometry ownership like `CenterDisplayTextWidget` or `XteDisplayWidget`, keep the mapper contract equally declarative but route into a renderer that consumes its own shared layout-owner module.

## Step 5: Verify

Verify the renderer in AvNav and tests:

1. Resize behavior: flat/normal/high mode transitions keep text legible.
2. Theme behavior: day/night and theme token colors match `Helpers.resolveTextColor`.
3. Disconnect overlay: `props.disconnect` draws consistent overlay.
4. Formatter output: valid output for real values, empty values, and explicit falsy defaults.

Recommended checks:

- Add/adjust widget unit tests under `tests/widgets/text/`.
- Run `npm run check:all`.

## B4 Decision Guide: New Renderer vs Extension

Use this convention for text-heavy roadmap items (ActiveRoute, RoutePoints, AIS target data):

| Decision signal | Preferred approach |
| --- | --- |
| Same layout contract as existing renderer; only field mapping/formatter changes | Extend the existing renderer with a renderer-owned variant contract (pattern: `PositionCoordinateWidget` `displayVariant`) |
| Needs different row structure, parser rules, or mode behavior | Create a new renderer module on `TextLayoutEngine` |
| Requires list/table-like composition or custom per-row formatting contracts | Create a new renderer module |
| Can be expressed as one/two-row text block with existing draw helpers | Extend existing renderer first |

Rule of thumb: default to extension; create a new renderer only when the view contract diverges.

## Checklist

- [ ] UMD renderer module created in `widgets/text/<WidgetName>/`
- [ ] Renderer instantiates `ThemeResolver` and `TextLayoutEngine`
- [ ] Renderer parses widget-specific props and selects formatters internally
- [ ] Component registered in `config/components.js`
- [ ] `ClusterRendererRouter` deps/spec wiring updated (if cluster-rendered)
- [ ] Mapper routing stays declarative and uses formatter catalog names
- [ ] Resize, theme color, disconnect, and formatter behavior verified
- [ ] `npm run check:all` passes

## Related

- [add-new-cluster.md](add-new-cluster.md)
- [add-new-html-kind.md](add-new-html-kind.md)
- [../widgets/three-elements.md](../widgets/three-elements.md)
- [../widgets/position-coordinates.md](../widgets/position-coordinates.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

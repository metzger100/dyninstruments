# Guide: Add a New Text Renderer (TextLayoutEngine)

**Status:** ✅ Reference Guide | Thin-wrapper workflow for text-heavy widgets

## Prerequisites

Read first:

- [../shared/text-layout-engine.md](../shared/text-layout-engine.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)
- [../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md)

## Overview

Phase A3 extracted `TextLayoutEngine` so new text widgets can stay thin:

- Renderer module owns data parsing, formatter selection, and `renderCanvas`.
- `TextLayoutEngine` owns layout mode routing, fit calculation, and shared draw helpers.
- Cluster mappers stay declarative (routing and normalized props only).

## Step 1: Create the Text Renderer Module

Create a UMD component under `widgets/text/<WidgetName>/<WidgetName>.js`.

Template example (`ActiveRouteTextWidget` style):

```javascript
/**
 * Module: ActiveRouteTextWidget - Route name + leg distance + ETA text renderer
 * Documentation: documentation/guides/add-new-text-renderer.md
 * Depends: ThemeResolver, TextLayoutEngine, Helpers.applyFormatter
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteTextWidget = factory(); }
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

      const tokens = theme.resolve(canvas);
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
      const insets = text.computeInsets(W, H);
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
      id: "ActiveRouteTextWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "ActiveRouteTextWidget", create: create };
}));
```

Key rule: parse and format widget data inside the renderer; do not move layout internals into mapper files.

## Step 2: Register in Component Registry

Add the new component in `config/components.js`:

```javascript
ActiveRouteTextWidget: {
  js: BASE + "widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js",
  css: undefined,
  globalKey: "DyniActiveRouteTextWidget",
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
  ActiveRouteTextWidget: Helpers.getModule("ActiveRouteTextWidget").create(def, Helpers)
};
```

Use role-based renderer IDs (for example `ActiveRouteTextWidget`), not cluster-prefixed names.

## Step 4: Mapper Routing (Declarative Only)

Update mapper translation to route kinds without embedding formatting logic.

Example mapper branch:

```javascript
if (req === "activeRoute") {
  return {
    renderer: "ActiveRouteTextWidget",
    routeName: p.activeRouteName,
    legDistance: toolkit.num(p.activeRouteDistance),
    eta: p.activeRouteEta,
    distanceFormatter: "formatDistance",
    distanceFormatterParameters: [],
    etaFormatter: "formatTime",
    etaFormatterParameters: [],
    caption: cap("activeRoute"),
    unit: unit("activeRoute")
  };
}
```

Formatter names and parameter signatures must match the catalog:
[../avnav-api/core-formatter-catalog.md](../avnav-api/core-formatter-catalog.md).

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
| Same layout contract as existing renderer; only field mapping/formatter changes | Extend existing renderer via a thin wrapper (pattern: `DateTimeRendererWrapper` / `TimeStatusRendererWrapper` over `PositionCoordinateWidget`) |
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
- [../widgets/three-elements.md](../widgets/three-elements.md)
- [../widgets/position-coordinates.md](../widgets/position-coordinates.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

# Guide: Create a New Full-Circle Dial

**Status:** ✅ Ready | Current workflow with `FullCircleRadialEngine` + ClusterWidget registries

## Overview

New full-circle dials should be thin wrappers over `FullCircleRadialEngine`. Keep widget modules focused on display strategy, static-layer callbacks, and pointer behavior.

## Prerequisites

Read first:

- [../radial/full-circle-dial-style-guide.md](../radial/full-circle-dial-style-guide.md)
- [../radial/gauge-shared-api.md](../radial/gauge-shared-api.md)
- [../architecture/component-system.md](../architecture/component-system.md)
- [../architecture/cluster-widget-system.md](../architecture/cluster-widget-system.md)

## Step 1: Create Dial Wrapper Module

Create `widgets/radial/NewDialWidget/NewDialWidget.js`:

1. Use UMD wrapper + `create(def, Helpers)`.
2. Resolve shared modules:
   - `const engine = Helpers.getModule("FullCircleRadialEngine").create(def, Helpers)`
   - `const textLayout = Helpers.getModule("FullCircleRadialTextLayout").create(def, Helpers)`
3. Add widget-specific display strategy only:
   - single-value display object (compass-style), or
   - dual-value display object (wind-style)
4. Build `renderCanvas` with `engine.createRenderer({ ... })` and keep callbacks scoped:
   - `buildStaticKey(state, props)` for cache key payload
   - `rebuildLayer(layerCtx, layerName, state, props, api)` for static layers
   - `drawFrame(state, props, api)` for per-frame dynamic drawing (pointer, dynamic marker)
   - `drawMode.{flat,normal,high}` for text layout routing

```javascript
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNewDialWidget = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const engine = Helpers.getModule("FullCircleRadialEngine").create(def, Helpers);
    const textLayout = Helpers.getModule("FullCircleRadialTextLayout").create(def, Helpers);

    function buildDisplay(state, props) {
      // Widget-specific captions/units/value strategy only.
      return { caption: "", value: "---", unit: "°", secScale: 0.8 };
    }

    const renderCanvas = engine.createRenderer({
      ratioProps: { normal: "newDialRatioThresholdNormal", flat: "newDialRatioThresholdFlat" },
      ratioDefaults: { normal: 0.8, flat: 2.2 },
      cacheLayers: ["back", "front"],
      buildStaticKey: function (state, props) {
        return { customStatic: true };
      },
      rebuildLayer: function (layerCtx, layerName, state, props, api) {
        if (layerName === "back") api.drawFullCircleRing(layerCtx);
        if (layerName === "front") api.drawFullCircleTicks(layerCtx, { startDeg: 0, endDeg: 360, stepMajor: 30, stepMinor: 10 });
      },
      drawFrame: function (state, props, api) {
        const display = buildDisplay(state, props);
        api.drawCachedLayer("back");
        api.drawFixedPointer(state.ctx, Number(props.pointerAngle) || 0, {
          depth: Math.max(8, Math.floor(state.geom.ringW * 0.9)),
          variant: "long",
          fillStyle: state.theme.colors.pointer,
          sideFactor: state.theme.radial.pointer.sideFactor,
          lengthFactor: state.theme.radial.pointer.lengthFactor
        });
        api.drawCachedLayer("front");
      },
      drawMode: {
        flat: function (state, props) {
          textLayout.drawSingleModeText(state, "flat", buildDisplay(state, props), { side: "left", align: "left" });
        },
        normal: function (state, props) {
          textLayout.drawSingleModeText(state, "normal", buildDisplay(state, props));
        },
        high: function (state, props) {
          textLayout.drawSingleModeText(state, "high", buildDisplay(state, props), { slot: "top" });
        }
      }
    });

    function translateFunction() {
      return {};
    }

    return { id: "NewDialWidget", wantsHideNativeHead: true, renderCanvas: renderCanvas, translateFunction: translateFunction };
  }

  return { id: "NewDialWidget", create: create };
}));
```

## Step 2: Register Module in `config/components.js`

Add module entry:

```javascript
NewDialWidget: {
  js: BASE + "widgets/radial/NewDialWidget/NewDialWidget.js",
  css: undefined,
  globalKey: "DyniNewDialWidget",
  deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]
}
```

## Step 3: Wire ClusterWidget Renderer Registry (If Cluster-Rendered)

If `ClusterWidget` should render this dial, update both declaration and runtime selection:

1. In `config/components.js`, add `"NewDialWidget"` to `ClusterRendererRouter.deps`.
2. In `cluster/rendering/ClusterRendererRouter.js`, instantiate and expose the new renderer:

```javascript
const rendererSpecs = {
  // ...
  NewDialWidget: Helpers.getModule("NewDialWidget").create(def, Helpers)
};
```

## Step 4: Route Data via Mapper Module

Update the relevant mapper (`cluster/mappers/*.js`) to emit declarative dial props:

```javascript
if (p.kind === "newDialRadial") {
  return {
    renderer: "NewDialWidget",
    pointerAngle: toolkit.num(p.someAngle),
    value: toolkit.num(p.someValue),
    caption: cap("newDialRadial"),
    unit: unit("newDialRadial"),
    newDialRatioThresholdNormal: toolkit.num(p.newDialRatioThresholdNormal),
    newDialRatioThresholdFlat: toolkit.num(p.newDialRatioThresholdFlat)
  };
}
```

Mapper rule:
- Keep mappers declarative (`create` + `translate` only).
- Do not add drawing, formatter fallback logic, or layout logic to mapper files.

## Step 5: Verify

- Resize widget through `flat`, `normal`, and `high` layouts
- Confirm pointer tracks live value/angle updates
- Confirm day/night theme token colors apply (ring, labels, pointer, optional sectors)
- Confirm `disconnect` overlay behavior (`NO DATA`) is correct

## Adding a New Kind to an Existing Dial

Decision guide:

- Create a new full-circle dial wrapper when the visual shape is shared (ring + ticks + pointer) but label strategy, pointer behavior, or dial-specific behavior differs.
- Add a new kind to an existing cluster mapper when only data source/kind mapping changes and visual behavior is unchanged.

## Checklist

- [ ] Dial wrapper created in `widgets/radial/NewDialWidget/NewDialWidget.js`
- [ ] Module registered in `config/components.js` with `deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout"]`
- [ ] Added to `ClusterRendererRouter.deps` (if ClusterWidget-rendered)
- [ ] Renderer wired in `cluster/rendering/ClusterRendererRouter.js` (if ClusterWidget-rendered)
- [ ] Mapper returns `renderer: "NewDialWidget"` with declarative, normalized props
- [ ] Layout behavior verified in `flat`, `normal`, `high`
- [ ] Pointer tracking, theme colors, and disconnect overlay verified

## Related

- [add-new-gauge.md](add-new-gauge.md)
- [add-new-cluster.md](add-new-cluster.md)
- [../radial/full-circle-dial-engine.md](../radial/full-circle-dial-engine.md)
- [../widgets/compass-gauge.md](../widgets/compass-gauge.md)
- [../widgets/wind-dial.md](../widgets/wind-dial.md)

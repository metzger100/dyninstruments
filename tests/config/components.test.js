const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("config/components.js", function () {
  it("creates component registry from baseUrl", function () {
    const context = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/components.js", context);

    const components = context.DyniPlugin.config.components;
    expect(components.ClusterWidget.deps).toEqual([
      "ClusterMapperToolkit",
      "ClusterRendererRouter",
      "ClusterMapperRegistry"
    ]);
    expect(components.ThemeResolver.globalKey).toBe("DyniThemeResolver");
    expect(components.ThemeResolver.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemeResolver.js");
    expect(components.CanvasLayerCache.globalKey).toBe("DyniCanvasLayerCache");
    expect(components.CanvasLayerCache.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/canvas/CanvasLayerCache.js");
    expect(components.XteHighwayPrimitives.globalKey).toBe("DyniXteHighwayPrimitives");
    expect(components.XteHighwayPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/xte/XteHighwayPrimitives.js");
    expect(components.LinearCanvasPrimitives.globalKey).toBe("DyniLinearCanvasPrimitives");
    expect(components.LinearCanvasPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearCanvasPrimitives.js");
    expect(components.LinearGaugeMath.globalKey).toBe("DyniLinearGaugeMath");
    expect(components.LinearGaugeMath.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeMath.js");
    expect(components.LinearGaugeTextLayout.globalKey).toBe("DyniLinearGaugeTextLayout");
    expect(components.LinearGaugeTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeTextLayout.js");
    expect(components.FullCircleRadialEngine.globalKey).toBe("DyniFullCircleRadialEngine");
    expect(components.FullCircleRadialEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/FullCircleRadialEngine.js");
    expect(components.FullCircleRadialEngine.deps).toEqual(["RadialToolkit", "CanvasLayerCache"]);
    expect(components.FullCircleRadialTextLayout.globalKey).toBe("DyniFullCircleRadialTextLayout");
    expect(components.FullCircleRadialTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/radial/FullCircleRadialTextLayout.js");
    expect(components.LinearGaugeEngine.globalKey).toBe("DyniLinearGaugeEngine");
    expect(components.LinearGaugeEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/linear/LinearGaugeEngine.js");
    expect(components.LinearGaugeEngine.deps).toEqual([
      "RadialToolkit",
      "CanvasLayerCache",
      "LinearCanvasPrimitives",
      "LinearGaugeMath",
      "LinearGaugeTextLayout"
    ]);
    expect(components.ThemePresets.globalKey).toBe("DyniThemePresets");
    expect(components.ThemePresets.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemePresets.js");
    expect(components.ThemePresets.deps).toBeUndefined();
    expect(components.RadialTickMath.deps).toEqual(["RadialAngleMath"]);
    expect(components.ClusterMapperToolkit.deps).toEqual(["RadialAngleMath"]);
    expect(components.TextLayoutPrimitives.globalKey).toBe("DyniTextLayoutPrimitives");
    expect(components.TextLayoutPrimitives.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutPrimitives.js");
    expect(components.TextLayoutPrimitives.deps).toEqual(["RadialTextLayout"]);
    expect(components.TextLayoutComposite.globalKey).toBe("DyniTextLayoutComposite");
    expect(components.TextLayoutComposite.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutComposite.js");
    expect(components.TextLayoutComposite.deps).toEqual(["TextLayoutPrimitives"]);
    expect(components.TextLayoutEngine.globalKey).toBe("DyniTextLayoutEngine");
    expect(components.TextLayoutEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/text/TextLayoutEngine.js");
    expect(components.TextLayoutEngine.deps).toEqual(["RadialValueMath", "TextLayoutPrimitives", "TextLayoutComposite"]);
    expect(components.SpeedRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.SpeedLinearWidget.deps).toEqual(["LinearGaugeEngine", "RadialValueMath"]);
    expect(components.DepthRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.TemperatureRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.VoltageRadialWidget.deps).toEqual(["SemicircleRadialEngine", "RadialValueMath"]);
    expect(components.XteDisplayWidget.deps).toEqual(["RadialToolkit", "CanvasLayerCache", "XteHighwayPrimitives"]);
    expect(components.WindRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout"]);
    expect(components.CompassRadialWidget.deps).toEqual(["FullCircleRadialEngine", "FullCircleRadialTextLayout"]);
    expect(components.RadialToolkit.deps).toContain("ThemeResolver");
    expect(components.ThreeValueTextWidget.deps).toEqual(["ThemeResolver", "TextLayoutEngine"]);
    expect(components.PositionCoordinateWidget.deps).toEqual(["ThemeResolver", "TextLayoutEngine"]);
    expect(components.PositionCoordinateWidget.globalKey).toBe("DyniPositionCoordinateWidget");
    expect(components.DateTimeRendererWrapper.deps).toEqual(["PositionCoordinateWidget"]);
    expect(components.TimeStatusRendererWrapper.deps).toEqual(["PositionCoordinateWidget"]);
    expect(components.RendererPropsWidget.deps).toEqual([
      "WindRadialWidget",
      "CompassRadialWidget",
      "SpeedRadialWidget",
      "SpeedLinearWidget",
      "DepthRadialWidget",
      "TemperatureRadialWidget",
      "VoltageRadialWidget",
      "XteDisplayWidget"
    ]);
    expect(components.DateTimeRendererWrapper.globalKey).toBe("DyniDateTimeRendererWrapper");
    expect(components.TimeStatusRendererWrapper.globalKey).toBe("DyniTimeStatusRendererWrapper");
    expect(components.RendererPropsWidget.globalKey).toBe("DyniRendererPropsWidget");
    expect(components.ClusterRendererRouter.deps).toContain("PositionCoordinateWidget");
    expect(components.ClusterRendererRouter.deps).toContain("DateTimeRendererWrapper");
    expect(components.ClusterRendererRouter.deps).toContain("TimeStatusRendererWrapper");
    expect(components.ClusterRendererRouter.deps).toContain("RendererPropsWidget");
    expect(components.ClusterRendererRouter.deps).not.toContain("WindRadialWidget");
    expect(components.PositionCoordinateWidget.deps).not.toContain("ThreeValueTextWidget");
    expect(components.WindMapper.js).toBe("http://host/plugins/dyninstruments/cluster/mappers/WindMapper.js");
  });

  it("throws when baseUrl is missing", function () {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    expect(function () {
      runIifeScript("config/components.js", context);
    }).toThrow("baseUrl missing");
  });
});

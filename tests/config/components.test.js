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
    expect(components.CanvasLayerCache.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/gauge/CanvasLayerCache.js");
    expect(components.FullCircleDialEngine.globalKey).toBe("DyniFullCircleDialEngine");
    expect(components.FullCircleDialEngine.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/gauge/FullCircleDialEngine.js");
    expect(components.FullCircleDialEngine.deps).toEqual(["GaugeToolkit", "CanvasLayerCache"]);
    expect(components.FullCircleDialTextLayout.globalKey).toBe("DyniFullCircleDialTextLayout");
    expect(components.FullCircleDialTextLayout.js).toBe("http://host/plugins/dyninstruments/shared/widget-kits/gauge/FullCircleDialTextLayout.js");
    expect(components.ThemePresets.globalKey).toBe("DyniThemePresets");
    expect(components.ThemePresets.js).toBe("http://host/plugins/dyninstruments/shared/theme/ThemePresets.js");
    expect(components.ThemePresets.deps).toEqual(["ThemeResolver"]);
    expect(components.GaugeTickMath.deps).toEqual(["GaugeAngleMath"]);
    expect(components.ClusterMapperToolkit.deps).toEqual(["GaugeAngleMath"]);
    expect(components.SpeedGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.DepthGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.TemperatureGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.VoltageGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.WindDialWidget.deps).toEqual(["FullCircleDialEngine", "FullCircleDialTextLayout"]);
    expect(components.CompassGaugeWidget.deps).toEqual(["FullCircleDialEngine", "FullCircleDialTextLayout"]);
    expect(components.GaugeToolkit.deps).toContain("ThemeResolver");
    expect(components.ThreeValueTextWidget.deps).toEqual(["ThemeResolver", "GaugeTextLayout", "GaugeValueMath"]);
    expect(components.PositionCoordinateWidget.deps).toEqual(["ThemeResolver", "GaugeTextLayout", "GaugeValueMath"]);
    expect(components.PositionCoordinateWidget.globalKey).toBe("DyniPositionCoordinateWidget");
    expect(components.DateTimeWidget.deps).toEqual(["PositionCoordinateWidget"]);
    expect(components.TimeStatusWidget.deps).toEqual(["PositionCoordinateWidget"]);
    expect(components.DateTimeWidget.globalKey).toBe("DyniDateTimeWidget");
    expect(components.TimeStatusWidget.globalKey).toBe("DyniTimeStatusWidget");
    expect(components.ClusterRendererRouter.deps).toContain("PositionCoordinateWidget");
    expect(components.ClusterRendererRouter.deps).toContain("DateTimeWidget");
    expect(components.ClusterRendererRouter.deps).toContain("TimeStatusWidget");
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

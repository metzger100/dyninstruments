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
    expect(components.GaugeTickMath.deps).toEqual(["GaugeAngleMath"]);
    expect(components.ClusterMapperToolkit.deps).toEqual(["GaugeAngleMath"]);
    expect(components.SpeedGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.DepthGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.TemperatureGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.VoltageGaugeWidget.deps).toEqual(["SemicircleGaugeEngine", "GaugeValueMath"]);
    expect(components.ThreeValueTextWidget.deps).toEqual(["GaugeTextLayout", "GaugeValueMath"]);
    expect(components.PositionCoordinateWidget.deps).toEqual(["GaugeTextLayout", "GaugeValueMath"]);
    expect(components.PositionCoordinateWidget.globalKey).toBe("DyniPositionCoordinateWidget");
    expect(components.ClusterRendererRouter.deps).toContain("PositionCoordinateWidget");
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

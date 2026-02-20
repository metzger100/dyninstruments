const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_depthGraphic: "DPT",
  unit_depthGraphic: "m",
  caption_tempGraphic: "TEMP",
  unit_tempGraphic: "°C",
  caption_temp: "TEMP",
  unit_temp: "°C",
  caption_pressure: "PRES",
  unit_pressure: "hPa",
  caption_depth: "DPT",
  unit_depth: "m"
});

describe("EnvironmentMapper", function () {
  it("maps depthGraphic with warning/alarm enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "depthGraphic",
      depth: 3.2,
      depthMinValue: "0",
      depthMaxValue: "30",
      depthTickMajor: "5",
      depthTickMinor: "1",
      depthAlarmFrom: "2",
      depthWarningFrom: "5",
      depthRatioThresholdNormal: "1.1",
      depthRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("DepthGaugeWidget");
    expect(out.alarmFrom).toBe(2);
    expect(out.warningFrom).toBe(5);
  });

  it("maps tempGraphic and only enables sectors when toggles are true", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "tempGraphic",
      temp: 22,
      tempWarningEnabled: false,
      tempAlarmEnabled: true,
      tempWarningFrom: "28",
      tempAlarmFrom: "32",
      tempMinValue: "0",
      tempMaxValue: "35",
      tempTickMajor: "5",
      tempTickMinor: "1",
      tempRatioThresholdNormal: "1.1",
      tempRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("TemperatureGaugeWidget");
    expect(out.formatter).toBe("formatTemperature");
    expect(out.formatterParameters).toEqual(["celsius"]);
    expect(out.warningFrom).toBeUndefined();
    expect(out.alarmFrom).toBe(32);
  });

  it("maps numeric kinds with expected formatters", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();

    expect(mapper.translate({ kind: "temp", temp: 20 }, toolkit).formatter).toBe("formatTemperature");
    expect(mapper.translate({ kind: "pressure", value: 1013 }, toolkit).formatter).toBe("skPressure");
    expect(mapper.translate({ kind: "depth", depth: 3 }, toolkit).formatter).toBe("formatDecimal");
  });
});

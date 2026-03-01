const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_depthLinear: "DPT",
  unit_depthLinear: "m",
  caption_depthRadial: "DPT",
  unit_depthRadial: "m",
  caption_tempLinear: "TEMP",
  unit_tempLinear: "°C",
  caption_tempRadial: "TEMP",
  unit_tempRadial: "°C",
  caption_temp: "TEMP",
  unit_temp: "°C",
  caption_pressure: "PRES",
  unit_pressure: "hPa",
  caption_depth: "DPT",
  unit_depth: "m"
});

describe("EnvironmentMapper", function () {
  it("maps depthLinear with warning/alarm enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "depthLinear",
      depth: 3.2,
      depthLinearMinValue: "0",
      depthLinearMaxValue: "30",
      depthLinearTickMajor: "5",
      depthLinearTickMinor: "1",
      depthLinearAlarmFrom: "2",
      depthLinearWarningFrom: "5",
      depthLinearRatioThresholdNormal: "1.1",
      depthLinearRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("DepthLinearWidget");
    expect(out.rendererProps.depthLinearAlarmFrom).toBe(2);
    expect(out.rendererProps.depthLinearWarningFrom).toBe(5);
  });

  it("maps depthRadial with warning/alarm enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "depthRadial",
      depth: 3.2,
      depthRadialMinValue: "0",
      depthRadialMaxValue: "30",
      depthRadialTickMajor: "5",
      depthRadialTickMinor: "1",
      depthRadialAlarmFrom: "2",
      depthRadialWarningFrom: "5",
      depthRadialRatioThresholdNormal: "1.1",
      depthRadialRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("DepthRadialWidget");
    expect(out.rendererProps.depthRadialAlarmFrom).toBe(2);
    expect(out.rendererProps.depthRadialWarningFrom).toBe(5);
  });

  it("maps tempRadial and only enables sectors when toggles are true", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "tempRadial",
      temp: 22,
      tempRadialWarningEnabled: false,
      tempRadialAlarmEnabled: true,
      tempRadialWarningFrom: "28",
      tempRadialAlarmFrom: "32",
      tempRadialMinValue: "0",
      tempRadialMaxValue: "35",
      tempRadialTickMajor: "5",
      tempRadialTickMinor: "1",
      tempRadialRatioThresholdNormal: "1.1",
      tempRadialRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("TemperatureRadialWidget");
    expect(out.formatter).toBe("formatTemperature");
    expect(out.formatterParameters).toEqual(["celsius"]);
    expect(out.rendererProps.tempRadialWarningFrom).toBeUndefined();
    expect(out.rendererProps.tempRadialAlarmFrom).toBe(32);
  });

  it("maps tempLinear and only enables sectors when toggles are true", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const out = mapper.translate({
      kind: "tempLinear",
      temp: 22,
      tempLinearWarningEnabled: false,
      tempLinearAlarmEnabled: true,
      tempLinearWarningFrom: "28",
      tempLinearAlarmFrom: "32",
      tempLinearMinValue: "0",
      tempLinearMaxValue: "35",
      tempLinearTickMajor: "5",
      tempLinearTickMinor: "1",
      tempLinearRatioThresholdNormal: "1.1",
      tempLinearRatioThresholdFlat: "3.5",
      captionUnitScale: "0.8"
    }, toolkit);

    expect(out.renderer).toBe("TemperatureLinearWidget");
    expect(out.formatter).toBe("formatTemperature");
    expect(out.formatterParameters).toEqual(["celsius"]);
    expect(out.rendererProps.tempLinearWarningFrom).toBeUndefined();
    expect(out.rendererProps.tempLinearAlarmFrom).toBe(32);
  });

  it("maps numeric kinds with expected formatters", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();

    expect(mapper.translate({ kind: "temp", temp: 20 }, toolkit).formatter).toBe("formatTemperature");
    expect(mapper.translate({ kind: "pressure", value: 1013 }, toolkit).formatter).toBe("skPressure");
    expect(mapper.translate({ kind: "depth", depth: 3 }, toolkit).formatter).toBe("formatDecimal");
  });

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    expect(mapper.translate({ kind: "depthGraphic", depth: 3 }, toolkit)).toEqual({});
    expect(mapper.translate({ kind: "tempGraphic", temp: 20 }, toolkit)).toEqual({});
  });
});

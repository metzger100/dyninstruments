const { loadFresh } = require("../../helpers/load-umd");

loadFresh("shared/unit-format-families.js");

function makeToolkit(overrides) {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit(Object.assign({
    caption_depthLinear: "DPT",
    formatUnit_depthLinear: "m",
    unit_depthLinear_m: "m",
    caption_depthRadial: "DPT",
    formatUnit_depthRadial: "m",
    unit_depthRadial_m: "m",
    caption_tempLinear: "TEMP",
    formatUnit_tempLinear: "celsius",
    unit_tempLinear_celsius: "°C",
    caption_tempRadial: "TEMP",
    formatUnit_tempRadial: "celsius",
    unit_tempRadial_celsius: "°C",
    caption_temp: "TEMP",
    formatUnit_temp: "celsius",
    unit_temp_celsius: "°C",
    caption_pressure: "PRES",
    formatUnit_pressure: "hpa",
    unit_pressure_hpa: "hPa",
    caption_depth: "DPT",
    formatUnit_depth: "m",
    unit_depth_m: "m",
    depthLinearMinValue_m: 0,
    depthLinearMaxValue_m: 30,
    depthLinearTickMajor_m: 5,
    depthLinearTickMinor_m: 1,
    depthLinearAlarmFrom_m: 2,
    depthLinearWarningFrom_m: 5,
    depthRadialMinValue_m: 0,
    depthRadialMaxValue_m: 30,
    depthRadialTickMajor_m: 5,
    depthRadialTickMinor_m: 1,
    depthRadialAlarmFrom_m: 2,
    depthRadialWarningFrom_m: 5,
    tempRadialMinValue_celsius: 0,
    tempRadialMaxValue_celsius: 35,
    tempRadialTickMajor_celsius: 5,
    tempRadialTickMinor_celsius: 1,
    tempRadialAlarmFrom_celsius: 32,
    tempRadialWarningFrom_celsius: 28,
    tempLinearMinValue_celsius: 0,
    tempLinearMaxValue_celsius: 35,
    tempLinearTickMajor_celsius: 5,
    tempLinearTickMinor_celsius: 1,
    tempLinearAlarmFrom_celsius: 32,
    tempLinearWarningFrom_celsius: 28
  }, overrides || {}));
}

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
      captionUnitScale: "0.8",
      depthLinearHideTextualMetrics: 1
    }, makeToolkit());

    expect(out.renderer).toBe("DepthLinearWidget");
    expect(out.rendererProps.depthLinearAlarmFrom).toBe(2);
    expect(out.rendererProps.depthLinearWarningFrom).toBe(5);
    expect(out.rendererProps.depthLinearHideTextualMetrics).toBe(true);
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
      captionUnitScale: "0.8",
      depthRadialHideTextualMetrics: 0
    }, makeToolkit());

    expect(out.renderer).toBe("DepthRadialWidget");
    expect(out.rendererProps.depthRadialAlarmFrom).toBe(2);
    expect(out.rendererProps.depthRadialWarningFrom).toBe(5);
    expect(out.rendererProps.depthRadialHideTextualMetrics).toBe(false);
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
      captionUnitScale: "0.8",
      tempRadialHideTextualMetrics: true
    }, makeToolkit());

    expect(out.renderer).toBe("TemperatureRadialWidget");
    expect(out.formatter).toBe("formatTemperature");
    expect(out.formatterParameters).toEqual(["celsius"]);
    expect(out.rendererProps.tempRadialWarningFrom).toBeUndefined();
    expect(out.rendererProps.tempRadialAlarmFrom).toBe(32);
    expect(out.rendererProps.tempRadialHideTextualMetrics).toBe(true);
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
      captionUnitScale: "0.8",
      tempLinearHideTextualMetrics: 0
    }, makeToolkit());

    expect(out.renderer).toBe("TemperatureLinearWidget");
    expect(out.formatter).toBe("formatTemperature");
    expect(out.formatterParameters).toEqual(["celsius"]);
    expect(out.rendererProps.tempLinearWarningFrom).toBeUndefined();
    expect(out.rendererProps.tempLinearAlarmFrom).toBe(32);
    expect(out.rendererProps.tempLinearHideTextualMetrics).toBe(false);
  });

  it("resolves alternate distance, temperature, and pressure tokens from the shared catalog", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    const customToolkit = makeToolkit({
      formatUnit_depthLinear: "ft",
      unit_depthLinear_ft: "ft custom",
      depthLinearMinValue_ft: 0,
      depthLinearMaxValue_ft: 100,
      depthLinearTickMajor_ft: 20,
      depthLinearTickMinor_ft: 5,
      depthLinearWarningFrom_ft: 16,
      depthLinearAlarmFrom_ft: 6,
      formatUnit_depthRadial: "nm",
      unit_depthRadial_nm: "nm custom",
      depthRadialMinValue_nm: 0,
      depthRadialMaxValue_nm: 0.016,
      depthRadialTickMajor_nm: 0.002,
      depthRadialTickMinor_nm: 0.0005,
      depthRadialWarningFrom_nm: 0.003,
      depthRadialAlarmFrom_nm: 0.001,
      formatUnit_tempLinear: "kelvin",
      unit_tempLinear_kelvin: "K custom",
      tempLinearMinValue_kelvin: 273.15,
      tempLinearMaxValue_kelvin: 308.15,
      tempLinearTickMajor_kelvin: 5,
      tempLinearTickMinor_kelvin: 1,
      tempLinearWarningFrom_kelvin: 301.15,
      tempLinearAlarmFrom_kelvin: 305.15,
      formatUnit_tempRadial: "kelvin",
      unit_tempRadial_kelvin: "K custom",
      tempRadialMinValue_kelvin: 273.15,
      tempRadialMaxValue_kelvin: 308.15,
      tempRadialTickMajor_kelvin: 5,
      tempRadialTickMinor_kelvin: 1,
      tempRadialWarningFrom_kelvin: 301.15,
      tempRadialAlarmFrom_kelvin: 305.15,
      formatUnit_temp: "kelvin",
      unit_temp_kelvin: "K custom",
      formatUnit_pressure: "bar",
      unit_pressure_bar: "bar custom",
      formatUnit_depth: "ft",
      unit_depth_ft: "ft custom"
    });

    const depthLinear = mapper.translate({
      kind: "depthLinear",
      depth: 3.2,
      depthLinearMinValue: "0",
      depthLinearMaxValue: "100",
      depthLinearTickMajor: "20",
      depthLinearTickMinor: "5",
      depthLinearAlarmFrom: "6",
      depthLinearWarningFrom: "16"
    }, customToolkit);
    expect(depthLinear.unit).toBe("ft custom");
    expect(depthLinear.formatterParameters).toEqual(["ft"]);
    expect(depthLinear.rendererProps.depthLinearMaxValue).toBe(100);
    expect(depthLinear.rendererProps.depthLinearTickMajor).toBe(20);
    expect(depthLinear.rendererProps.depthLinearTickMinor).toBe(5);
    expect(depthLinear.rendererProps.depthLinearWarningFrom).toBe(16);
    expect(depthLinear.rendererProps.depthLinearAlarmFrom).toBe(6);

    const depthRadial = mapper.translate({
      kind: "depthRadial",
      depth: 3.2,
      depthRadialMinValue: "0",
      depthRadialMaxValue: "0.016",
      depthRadialTickMajor: "0.002",
      depthRadialTickMinor: "0.0005",
      depthRadialAlarmFrom: "0.001",
      depthRadialWarningFrom: "0.003"
    }, customToolkit);
    expect(depthRadial.unit).toBe("nm custom");
    expect(depthRadial.formatterParameters).toEqual(["nm"]);
    expect(depthRadial.rendererProps.depthRadialMaxValue).toBe(0.016);
    expect(depthRadial.rendererProps.depthRadialTickMajor).toBe(0.002);
    expect(depthRadial.rendererProps.depthRadialTickMinor).toBe(0.0005);
    expect(depthRadial.rendererProps.depthRadialWarningFrom).toBe(0.003);
    expect(depthRadial.rendererProps.depthRadialAlarmFrom).toBe(0.001);

    const tempLinear = mapper.translate({
      kind: "tempLinear",
      temp: 22,
      tempLinearWarningEnabled: true,
      tempLinearAlarmEnabled: true,
      tempLinearMinValue: "273.15",
      tempLinearMaxValue: "308.15",
      tempLinearTickMajor: "5",
      tempLinearTickMinor: "1",
      tempLinearWarningFrom: "301.15",
      tempLinearAlarmFrom: "305.15"
    }, customToolkit);
    expect(tempLinear.unit).toBe("K custom");
    expect(tempLinear.formatterParameters).toEqual(["kelvin"]);
    expect(tempLinear.rendererProps.tempLinearMinValue).toBe(273.15);
    expect(tempLinear.rendererProps.tempLinearMaxValue).toBe(308.15);
    expect(tempLinear.rendererProps.tempLinearWarningFrom).toBe(301.15);
    expect(tempLinear.rendererProps.tempLinearAlarmFrom).toBe(305.15);

    const temp = mapper.translate({ kind: "temp", temp: 20 }, customToolkit);
    expect(temp.unit).toBe("K custom");
    expect(temp.formatterParameters).toEqual(["kelvin"]);

    const pressure = mapper.translate({ kind: "pressure", value: 1013 }, customToolkit);
    expect(pressure.unit).toBe("bar custom");
    expect(pressure.formatterParameters).toEqual(["bar"]);
  });

  it("maps numeric kinds with expected formatters", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();

    expect(mapper.translate({ kind: "temp", temp: 20 }, makeToolkit()).formatter).toBe("formatTemperature");
    expect(mapper.translate({ kind: "pressure", value: 1013 }, makeToolkit()).formatter).toBe("formatPressure");
    expect(mapper.translate({ kind: "depth", depth: 3 }, makeToolkit()).formatter).toBe("formatDistance");
  });

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/EnvironmentMapper.js").create();
    expect(mapper.translate({ kind: "depthGraphic", depth: 3 }, makeToolkit())).toEqual({});
    expect(mapper.translate({ kind: "tempGraphic", temp: 20 }, makeToolkit())).toEqual({});
  });
});

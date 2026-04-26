const { loadFresh } = require("../../helpers/load-umd");

loadFresh("shared/unit-format-families.js");

function makeToolkit(overrides) {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit(Object.assign({
    caption_sog: "SOG",
    formatUnit_sog: "kn",
    unit_sog_kn: "kn",
    caption_stw: "STW",
    formatUnit_stw: "kn",
    unit_stw_kn: "kn",
    caption_sogLinear: "SOG",
    formatUnit_sogLinear: "kn",
    unit_sogLinear_kn: "kn",
    caption_stwLinear: "STW",
    formatUnit_stwLinear: "kn",
    unit_stwLinear_kn: "kn",
    caption_sogRadial: "SOG",
    formatUnit_sogRadial: "kn",
    unit_sogRadial_kn: "kn",
    caption_stwRadial: "STW",
    formatUnit_stwRadial: "kn",
    unit_stwRadial_kn: "kn",
    speedLinearMinValue_kn: 0,
    speedLinearMaxValue_kn: 30,
    speedLinearTickMajor_kn: 5,
    speedLinearTickMinor_kn: 1,
    speedLinearWarningFrom_kn: 20,
    speedLinearAlarmFrom_kn: 25,
    speedRadialMinValue_kn: 0,
    speedRadialMaxValue_kn: 30,
    speedRadialTickMajor_kn: 5,
    speedRadialTickMinor_kn: 1,
    speedRadialWarningFrom_kn: 20,
    speedRadialAlarmFrom_kn: 25
  }, overrides || {}));
}

describe("SpeedMapper", function () {
  it("maps radial kinds to SpeedRadialWidget and keeps toggles enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogRadial",
      sog: 6.4,
      speedRadialMinValue: "0",
      speedRadialMaxValue: "30",
      startAngleDeg: "270",
      endAngleDeg: "450",
      speedRadialTickMajor: "5",
      speedRadialTickMinor: "1",
      speedRadialWarningFrom: "20",
      speedRadialAlarmFrom: "25",
      captionUnitScale: "0.8",
      speedRadialRatioThresholdNormal: "1.1",
      speedRadialRatioThresholdFlat: "3.5",
      speedRadialHideTextualMetrics: 1
    }, makeToolkit());

    expect(out.renderer).toBe("SpeedRadialWidget");
    expect(out.value).toBe(6.4);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.speedRadialWarningFrom).toBe(20);
    expect(out.rendererProps.speedRadialAlarmFrom).toBe(25);
    expect(out.rendererProps.speedRadialHideTextualMetrics).toBe(true);
    expect(out.rendererProps.startAngleDeg).toBeUndefined();
    expect(out.rendererProps.endAngleDeg).toBeUndefined();
  });

  it("disables warning/alarm sectors when toggles are false", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogRadial",
      sog: 6.4,
      speedRadialWarningEnabled: false,
      speedRadialAlarmEnabled: false,
      speedRadialWarningFrom: "20",
      speedRadialAlarmFrom: "25"
    }, makeToolkit());

    expect(out.rendererProps.speedRadialWarningFrom).toBeUndefined();
    expect(out.rendererProps.speedRadialAlarmFrom).toBeUndefined();
  });

  it("maps numeric kinds to formatSpeed", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({ kind: "sog", sog: 5.3 }, makeToolkit());

    expect(out).toEqual({
      value: 5.3,
      caption: "SOG",
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
  });

  it("maps sogLinear to SpeedLinearWidget with normalized renderer props", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogLinear",
      sog: 7.1,
      speedLinearRatioThresholdNormal: "1.1",
      speedLinearRatioThresholdFlat: "3.5",
      speedLinearMinValue: "0",
      speedLinearMaxValue: "30",
      speedLinearTickMajor: "5",
      speedLinearTickMinor: "1",
      speedLinearShowEndLabels: true,
      speedLinearWarningFrom: "20",
      speedLinearAlarmFrom: "25",
      speedLinearHideTextualMetrics: 0
    }, makeToolkit());

    expect(out.renderer).toBe("SpeedLinearWidget");
    expect(out.value).toBe(7.1);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.speedLinearMinValue).toBe(0);
    expect(out.rendererProps.speedLinearMaxValue).toBe(30);
    expect(out.rendererProps.speedLinearWarningFrom).toBe(20);
    expect(out.rendererProps.speedLinearAlarmFrom).toBe(25);
    expect(out.rendererProps.speedLinearHideTextualMetrics).toBe(false);
  });

  it("maps stwLinear to SpeedLinearWidget using STW source with shared linear settings", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "stwLinear",
      stw: 6.8,
      speedLinearRatioThresholdNormal: "1.1",
      speedLinearRatioThresholdFlat: "3.5",
      speedLinearMinValue: "0",
      speedLinearMaxValue: "30",
      speedLinearTickMajor: "5",
      speedLinearTickMinor: "1",
      speedLinearShowEndLabels: false,
      speedLinearWarningFrom: "20",
      speedLinearAlarmFrom: "25"
    }, makeToolkit());

    expect(out.renderer).toBe("SpeedLinearWidget");
    expect(out.value).toBe(6.8);
    expect(out.caption).toBe("STW");
    expect(out.unit).toBe("kn");
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.speedLinearWarningFrom).toBe(20);
    expect(out.rendererProps.speedLinearAlarmFrom).toBe(25);
  });

  it("resolves alternate formatter tokens and per-unit gauge scales from the shared catalog", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const customToolkit = makeToolkit({
      formatUnit_sog: "ms",
      unit_sog_ms: "m/s custom",
      formatUnit_stw: "kmh",
      unit_stw_kmh: "km/h custom",
      formatUnit_sogLinear: "ms",
      unit_sogLinear_ms: "m/s linear",
      speedLinearMaxValue_ms: 15,
      speedLinearTickMajor_ms: 2.5,
      speedLinearTickMinor_ms: 0.5,
      speedLinearWarningFrom_ms: 10,
      speedLinearAlarmFrom_ms: 12.5,
      formatUnit_stwRadial: "kmh",
      unit_stwRadial_kmh: "km/h radial",
      speedRadialMaxValue_kmh: 60,
      speedRadialTickMajor_kmh: 10,
      speedRadialTickMinor_kmh: 2,
      speedRadialWarningFrom_kmh: 40,
      speedRadialAlarmFrom_kmh: 50
    });

    expect(mapper.translate({ kind: "sog", sog: 5.3 }, customToolkit)).toEqual({
      value: 5.3,
      caption: "SOG",
      unit: "m/s custom",
      formatter: "formatSpeed",
      formatterParameters: ["ms"]
    });

    expect(mapper.translate({ kind: "stw", stw: 6.2 }, customToolkit)).toEqual({
      value: 6.2,
      caption: "STW",
      unit: "km/h custom",
      formatter: "formatSpeed",
      formatterParameters: ["kmh"]
    });

    const linear = mapper.translate({
      kind: "sogLinear",
      sog: 7.1,
      speedLinearRatioThresholdNormal: "1.1",
      speedLinearRatioThresholdFlat: "3.5"
    }, customToolkit);
    expect(linear.unit).toBe("m/s linear");
    expect(linear.formatterParameters).toEqual(["ms"]);
    expect(linear.rendererProps.speedLinearMaxValue).toBe(15);
    expect(linear.rendererProps.speedLinearTickMajor).toBe(2.5);
    expect(linear.rendererProps.speedLinearTickMinor).toBe(0.5);
    expect(linear.rendererProps.speedLinearWarningFrom).toBe(10);
    expect(linear.rendererProps.speedLinearAlarmFrom).toBe(12.5);

    const radial = mapper.translate({
      kind: "stwRadial",
      stw: 6.4,
      speedRadialRatioThresholdNormal: "1.1",
      speedRadialRatioThresholdFlat: "3.5"
    }, customToolkit);
    expect(radial.unit).toBe("km/h radial");
    expect(radial.formatterParameters).toEqual(["kmh"]);
    expect(radial.rendererProps.speedRadialMaxValue).toBe(60);
    expect(radial.rendererProps.speedRadialTickMajor).toBe(10);
    expect(radial.rendererProps.speedRadialTickMinor).toBe(2);
    expect(radial.rendererProps.speedRadialWarningFrom).toBe(40);
    expect(radial.rendererProps.speedRadialAlarmFrom).toBe(50);
  });

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    expect(mapper.translate({ kind: "sogGraphic", sog: 5.3 }, makeToolkit())).toEqual({});
  });
});

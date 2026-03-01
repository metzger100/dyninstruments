const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_sog: "SOG",
  unit_sog: "kn",
  caption_sogLinear: "SOG",
  unit_sogLinear: "kn",
  caption_sogRadial: "SOG",
  unit_sogRadial: "kn"
});

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
      speedRadialRatioThresholdFlat: "3.5"
    }, toolkit);

    expect(out.renderer).toBe("SpeedRadialWidget");
    expect(out.value).toBe(6.4);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.speedRadialWarningFrom).toBe(20);
    expect(out.rendererProps.speedRadialAlarmFrom).toBe(25);
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
    }, toolkit);

    expect(out.rendererProps.speedRadialWarningFrom).toBeUndefined();
    expect(out.rendererProps.speedRadialAlarmFrom).toBeUndefined();
  });

  it("maps numeric kinds to formatSpeed", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({ kind: "sog", sog: 5.3 }, toolkit);

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
      speedLinearAlarmFrom: "25"
    }, toolkit);

    expect(out.renderer).toBe("SpeedLinearWidget");
    expect(out.value).toBe(7.1);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.speedLinearMinValue).toBe(0);
    expect(out.rendererProps.speedLinearMaxValue).toBe(30);
    expect(out.rendererProps.speedLinearWarningFrom).toBe(20);
    expect(out.rendererProps.speedLinearAlarmFrom).toBe(25);
  });

  it("disables linear warning/alarm sectors when toggles are false", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogLinear",
      sog: 7.1,
      speedLinearWarningEnabled: false,
      speedLinearAlarmEnabled: false,
      speedLinearWarningFrom: "20",
      speedLinearAlarmFrom: "25"
    }, toolkit);

    expect(out.rendererProps.speedLinearWarningFrom).toBeUndefined();
    expect(out.rendererProps.speedLinearAlarmFrom).toBeUndefined();
  });

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    expect(mapper.translate({ kind: "sogGraphic", sog: 5.3 }, toolkit)).toEqual({});
  });
});

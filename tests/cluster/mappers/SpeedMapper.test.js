const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_sog: "SOG",
  unit_sog: "kn",
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

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    expect(mapper.translate({ kind: "sogGraphic", sog: 5.3 }, toolkit)).toEqual({});
  });
});

const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_sog: "SOG",
  unit_sog: "kn",
  caption_sogGraphic: "SOG",
  unit_sogGraphic: "kn"
});

describe("SpeedMapper", function () {
  it("maps graphic kinds to SpeedGaugeWidget and keeps toggles enabled by default", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogGraphic",
      sog: 6.4,
      minValue: "0",
      maxValue: "30",
      startAngleDeg: "270",
      endAngleDeg: "450",
      tickMajor: "5",
      tickMinor: "1",
      warningFrom: "20",
      alarmFrom: "25",
      captionUnitScale: "0.8",
      speedRatioThresholdNormal: "1.1",
      speedRatioThresholdFlat: "3.5"
    }, toolkit);

    expect(out.renderer).toBe("SpeedGaugeWidget");
    expect(out.value).toBe(6.4);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.rendererProps.warningFrom).toBe(20);
    expect(out.rendererProps.alarmFrom).toBe(25);
  });

  it("disables warning/alarm sectors when toggles are false", function () {
    const mapper = loadFresh("cluster/mappers/SpeedMapper.js").create();
    const out = mapper.translate({
      kind: "sogGraphic",
      sog: 6.4,
      speedWarningEnabled: false,
      speedAlarmEnabled: false,
      warningFrom: "20",
      alarmFrom: "25"
    }, toolkit);

    expect(out.rendererProps.warningFrom).toBeUndefined();
    expect(out.rendererProps.alarmFrom).toBeUndefined();
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
});

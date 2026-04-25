const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_text: "VALUE",
  unit_text: "",
  caption_linearGauge: "VALUE",
  unit_linearGauge: "",
  caption_radialGauge: "VALUE",
  unit_radialGauge: ""
});

describe("DefaultMapper", function () {
  it("maps text, linearGauge, and radialGauge payloads without inventing formatter metadata", function () {
    const mapper = loadFresh("cluster/mappers/DefaultMapper.js").create();

    expect(mapper.translate({
      kind: "text",
      value: "nav.gps.speed",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    }, toolkit)).toEqual({
      value: "nav.gps.speed",
      caption: "VALUE",
      unit: "",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });

    const linear = mapper.translate({
      kind: "linearGauge",
      value: 12.3,
      formatter: "formatDecimal",
      formatterParameters: ["kn"],
      defaultLinearRatioThresholdNormal: 1.1,
      defaultLinearRatioThresholdFlat: 3.5,
      defaultLinearMinValue: 0,
      defaultLinearMaxValue: 100,
      defaultLinearTickMajor: 10,
      defaultLinearTickMinor: 2,
      defaultLinearShowEndLabels: false,
      defaultLinearAlarmLowEnabled: false,
      defaultLinearAlarmLowAt: 10,
      defaultLinearAlarmLowColor: "#ff7a76",
      defaultLinearWarningLowEnabled: false,
      defaultLinearWarningLowAt: 25,
      defaultLinearWarningLowColor: "#e7c66a",
      defaultLinearWarningHighEnabled: false,
      defaultLinearWarningHighAt: 75,
      defaultLinearWarningHighColor: "#e7c66a",
      defaultLinearAlarmHighEnabled: false,
      defaultLinearAlarmHighAt: 90,
      defaultLinearAlarmHighColor: "#ff7a76",
      captionUnitScale: 0.8,
      stableDigits: false,
      easing: true
    }, toolkit);

    expect(linear).toMatchObject({
      renderer: "DefaultLinearWidget",
      value: 12.3,
      caption: "VALUE",
      unit: "",
      formatter: "formatDecimal",
      formatterParameters: ["kn"],
      rendererProps: {
        defaultLinearRatioThresholdNormal: 1.1,
        defaultLinearRatioThresholdFlat: 3.5,
        defaultLinearMinValue: 0,
        defaultLinearMaxValue: 100,
        defaultLinearTickMajor: 10,
        defaultLinearTickMinor: 2,
        defaultLinearShowEndLabels: false,
        defaultLinearAlarmLowEnabled: false,
        defaultLinearAlarmLowAt: 10,
        defaultLinearAlarmLowColor: "#ff7a76",
        defaultLinearWarningLowEnabled: false,
        defaultLinearWarningLowAt: 25,
        defaultLinearWarningLowColor: "#e7c66a",
        defaultLinearWarningHighEnabled: false,
        defaultLinearWarningHighAt: 75,
        defaultLinearWarningHighColor: "#e7c66a",
        defaultLinearAlarmHighEnabled: false,
        defaultLinearAlarmHighAt: 90,
        defaultLinearAlarmHighColor: "#ff7a76",
        captionUnitScale: 0.8,
        stableDigits: false,
        easing: true
      }
    });

    const radial = mapper.translate({
      kind: "radialGauge",
      value: 12.3,
      formatter: "formatDecimal",
      formatterParameters: ["kn"],
      defaultRadialRatioThresholdNormal: 1.1,
      defaultRadialRatioThresholdFlat: 3.5,
      defaultRadialMinValue: 0,
      defaultRadialMaxValue: 100,
      defaultRadialTickMajor: 10,
      defaultRadialTickMinor: 2,
      defaultRadialShowEndLabels: false,
      defaultRadialAlarmLowEnabled: false,
      defaultRadialAlarmLowAt: 10,
      defaultRadialAlarmLowColor: "#ff7a76",
      defaultRadialWarningLowEnabled: false,
      defaultRadialWarningLowAt: 25,
      defaultRadialWarningLowColor: "#e7c66a",
      defaultRadialWarningHighEnabled: false,
      defaultRadialWarningHighAt: 75,
      defaultRadialWarningHighColor: "#e7c66a",
      defaultRadialAlarmHighEnabled: false,
      defaultRadialAlarmHighAt: 90,
      defaultRadialAlarmHighColor: "#ff7a76",
      captionUnitScale: 0.8,
      stableDigits: true,
      easing: false
    }, toolkit);

    expect(radial).toMatchObject({
      renderer: "DefaultRadialWidget",
      value: 12.3,
      caption: "VALUE",
      unit: "",
      formatter: "formatDecimal",
      formatterParameters: ["kn"],
      rendererProps: {
        defaultRadialRatioThresholdNormal: 1.1,
        defaultRadialRatioThresholdFlat: 3.5,
        defaultRadialMinValue: 0,
        defaultRadialMaxValue: 100,
        defaultRadialTickMajor: 10,
        defaultRadialTickMinor: 2,
        defaultRadialShowEndLabels: false,
        defaultRadialAlarmLowEnabled: false,
        defaultRadialAlarmLowAt: 10,
        defaultRadialAlarmLowColor: "#ff7a76",
        defaultRadialWarningLowEnabled: false,
        defaultRadialWarningLowAt: 25,
        defaultRadialWarningLowColor: "#e7c66a",
        defaultRadialWarningHighEnabled: false,
        defaultRadialWarningHighAt: 75,
        defaultRadialWarningHighColor: "#e7c66a",
        defaultRadialAlarmHighEnabled: false,
        defaultRadialAlarmHighAt: 90,
        defaultRadialAlarmHighColor: "#ff7a76",
        captionUnitScale: 0.8,
        stableDigits: true,
        easing: false
      }
    });
  });

  it("omits formatter metadata when it is not provided by the user", function () {
    const mapper = loadFresh("cluster/mappers/DefaultMapper.js").create();

    const linear = mapper.translate({
      kind: "linearGauge",
      value: 4.2,
      defaultLinearMinValue: 0,
      defaultLinearMaxValue: 100
    }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(linear, "formatter")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(linear, "formatterParameters")).toBe(false);

    const radial = mapper.translate({
      kind: "radialGauge",
      value: 4.2,
      defaultRadialMinValue: 0,
      defaultRadialMaxValue: 100
    }, toolkit);
    expect(Object.prototype.hasOwnProperty.call(radial, "formatter")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(radial, "formatterParameters")).toBe(false);
  });
});

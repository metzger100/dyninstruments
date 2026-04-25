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
      easing: true,
      defaultLinearHideTextualMetrics: 0
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
        easing: true,
        defaultLinearHideTextualMetrics: false
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
      easing: false,
      defaultRadialHideTextualMetrics: 1
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
        easing: false,
        defaultRadialHideTextualMetrics: true
      }
    });

    expect(mapper.translate({
      kind: "unknown"
    }, toolkit)).toEqual({});
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

  it("routes renderer props through toolkit helpers for numeric and boolean fields", function () {
    const mapper = loadFresh("cluster/mappers/DefaultMapper.js").create();
    const num = vi.fn(function (value) {
      return Number(value);
    });
    const toolkitSpy = {
      cap: vi.fn(function (kind) {
        return "caption:" + kind;
      }),
      unit: vi.fn(function (kind) {
        return "unit:" + kind;
      }),
      out: vi.fn(function (value, caption, unit, formatter, formatterParameters) {
        const out = {
          value: value,
          caption: caption,
          unit: unit
        };
        if (typeof formatter !== "undefined") {
          out.formatter = formatter;
        }
        if (Array.isArray(formatterParameters)) {
          out.formatterParameters = formatterParameters;
        }
        return out;
      }),
      num: num
    };

    const linear = mapper.translate({
      kind: "linearGauge",
      value: "12.3",
      defaultLinearRatioThresholdNormal: "1.1",
      defaultLinearRatioThresholdFlat: "3.5",
      defaultLinearMinValue: "0",
      defaultLinearMaxValue: "100",
      defaultLinearTickMajor: "10",
      defaultLinearTickMinor: "2",
      defaultLinearShowEndLabels: 0,
      defaultLinearAlarmLowEnabled: "",
      defaultLinearAlarmLowAt: "10",
      defaultLinearAlarmLowColor: "#ff7a76",
      defaultLinearWarningLowEnabled: 0,
      defaultLinearWarningLowAt: "25",
      defaultLinearWarningLowColor: "#e7c66a",
      defaultLinearWarningHighEnabled: false,
      defaultLinearWarningHighAt: "75",
      defaultLinearWarningHighColor: "#e7c66a",
      defaultLinearAlarmHighEnabled: 0,
      defaultLinearAlarmHighAt: "90",
      defaultLinearAlarmHighColor: "#ff7a76",
      captionUnitScale: "0.8",
      stableDigits: 0,
      easing: 1,
      defaultLinearHideTextualMetrics: "yes"
    }, toolkitSpy);

    expect(num).toHaveBeenCalledWith("1.1");
    expect(num).toHaveBeenCalledWith("3.5");
    expect(num).toHaveBeenCalledWith("0");
    expect(num).toHaveBeenCalledWith("100");
    expect(num).toHaveBeenCalledWith("10");
    expect(num).toHaveBeenCalledWith("2");
    expect(num).toHaveBeenCalledWith("25");
    expect(num).toHaveBeenCalledWith("75");
    expect(num).toHaveBeenCalledWith("90");
    expect(num).toHaveBeenCalledWith("0.8");
    expect(linear.rendererProps).toMatchObject({
      defaultLinearRatioThresholdNormal: 1.1,
      defaultLinearRatioThresholdFlat: 3.5,
      defaultLinearMinValue: 0,
      defaultLinearMaxValue: 100,
      defaultLinearTickMajor: 10,
      defaultLinearTickMinor: 2,
      defaultLinearShowEndLabels: false,
      defaultLinearAlarmLowEnabled: false,
      defaultLinearWarningLowEnabled: false,
      defaultLinearWarningHighEnabled: false,
      defaultLinearAlarmHighEnabled: false,
      captionUnitScale: 0.8,
      stableDigits: false,
      easing: true,
      defaultLinearHideTextualMetrics: true
    });

    const radial = mapper.translate({
      kind: "radialGauge",
      value: "12.3",
      defaultRadialRatioThresholdNormal: "1.1",
      defaultRadialRatioThresholdFlat: "3.5",
      defaultRadialMinValue: "0",
      defaultRadialMaxValue: "100",
      defaultRadialTickMajor: "10",
      defaultRadialTickMinor: "2",
      defaultRadialShowEndLabels: 0,
      defaultRadialAlarmLowEnabled: "",
      defaultRadialAlarmLowAt: "10",
      defaultRadialAlarmLowColor: "#ff7a76",
      defaultRadialWarningLowEnabled: 0,
      defaultRadialWarningLowAt: "25",
      defaultRadialWarningLowColor: "#e7c66a",
      defaultRadialWarningHighEnabled: false,
      defaultRadialWarningHighAt: "75",
      defaultRadialWarningHighColor: "#e7c66a",
      defaultRadialAlarmHighEnabled: 0,
      defaultRadialAlarmHighAt: "90",
      defaultRadialAlarmHighColor: "#ff7a76",
      captionUnitScale: "0.8",
      stableDigits: 1,
      easing: 0,
      defaultRadialHideTextualMetrics: "yes"
    }, toolkitSpy);

    expect(radial.rendererProps).toMatchObject({
      defaultRadialRatioThresholdNormal: 1.1,
      defaultRadialRatioThresholdFlat: 3.5,
      defaultRadialMinValue: 0,
      defaultRadialMaxValue: 100,
      defaultRadialTickMajor: 10,
      defaultRadialTickMinor: 2,
      defaultRadialShowEndLabels: false,
      defaultRadialAlarmLowEnabled: false,
      defaultRadialWarningLowEnabled: false,
      defaultRadialWarningHighEnabled: false,
      defaultRadialAlarmHighEnabled: false,
      captionUnitScale: 0.8,
      stableDigits: true,
      easing: false,
      defaultRadialHideTextualMetrics: true
    });
  });
});

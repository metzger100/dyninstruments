const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RadialValueMath", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/radial/RadialValueMath.js");
    return mod.create(
      {},
      createComponentContextMock({
        modules: {
          RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
        }
      })
    );
  }

  it("normalizes ranges and does not expose legacy semicircle geometry helpers", function () {
    const v = create();

    expect(v.normalizeRange(undefined, undefined, 0, 10)).toEqual({ min: 0, max: 10, range: 10 });
    expect(v.normalizeRange(5, 4, 0, 10)).toEqual({ min: 5, max: 6, range: 1 });
    expect(v.computeSemicircleGeometry).toBeUndefined();
  });

  it("builds tick angles and includes arc boundaries as major ticks", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    const ticks = v.buildValueTickAngles(0, 30, 10, 5, arc);
    expect(ticks.majors[0]).toBe(270);
    expect(ticks.majors[ticks.majors.length - 1]).toBe(450);
    expect(ticks.minors.length).toBeGreaterThan(0);

    expect(v.buildValueTickAngles(30, 0, 10, 5, arc)).toEqual({ majors: [], minors: [] });
    const fallbackTicks = v.buildValueTickAngles(0, 20, 0, 0, arc);
    expect(fallbackTicks.majors[0]).toBe(270);
    expect(fallbackTicks.majors[fallbackTicks.majors.length - 1]).toBe(450);
  });

  it("maps values and angles through the radial angle module", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(v.valueToAngle(15, 0, 30, arc, true)).toBe(360);
    expect(v.angleToValue(360, 0, 30, arc, true)).toBe(15);
    expect(v.angleToValue(540, 0, 30, arc, true)).toBe(30);
  });

  it("creates sector ranges and returns null for invalid ranges", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    const valid = v.sectorAngles(5, 10, 0, 30, arc);
    expect(valid.a1).toBeGreaterThan(valid.a0);

    expect(v.sectorAngles("x", 10, 0, 30, arc)).toBeNull();
    expect(v.sectorAngles(5, 5, 0, 30, arc)).toBeNull();
  });

  it("provides shared formatter and sector builder helpers", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(v.extractNumberText("12.3 kn")).toBe("12.3");
    expect(v.formatAngle180(181, true)).toBe("-179");
    expect(v.formatDirection360(-1, true)).toBe("359");

    expect(
      v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc, {
        warningColor: "#aa5500",
        alarmColor: "#bb0011"
      })
    ).toEqual([
      { a0: 390, a1: 420, color: "#aa5500" },
      { a0: 420, a1: 450, color: "#bb0011" }
    ]);

    expect(
      v.buildLowEndSectors({}, 10, 15, arc, {
        defaultWarningFrom: 12.2,
        defaultAlarmFrom: 11.6,
        warningColor: "#aa5500",
        alarmColor: "#bb0011"
      })
    ).toEqual([
      { a0: 270, a1: 327.6, color: "#bb0011" },
      { a0: 327.6, a1: 349.2, color: "#aa5500" }
    ]);
  });

  it("formats gauge display text with shared formatter and placeholder normalization", function () {
    const v = create();
    const applyFormatter = vi.fn((value) => String(value) + " kn");
    const normalize = vi.fn((text, defaultText) => {
      if (text == null) {
        return defaultText;
      }
      return String(text);
    });

    expect(
      v.formatGaugeDisplay(
        12.3,
        {
          formatter: "formatSpeed",
          formatterParameters: ["kn"]
        },
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"]
      )
    ).toEqual({
      num: 12.3,
      text: "12.3"
    });
    expect(applyFormatter).toHaveBeenCalledWith(
      12.3,
      expect.objectContaining({
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      })
    );
  });

  it("returns default text for invalid raw values without calling applyFormatter", function () {
    const v = create();
    const applyFormatter = vi.fn();
    const normalize = vi.fn((text, defaultText) => {
      if (text == null) {
        return defaultText;
      }
      return String(text);
    });

    expect(
      v.formatGaugeDisplay(
        "abc",
        {
          default: "NO DATA"
        },
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"]
      )
    ).toEqual({
      num: NaN,
      text: "NO DATA"
    });
    expect(applyFormatter).not.toHaveBeenCalled();

    expect(
      v.formatGaugeDisplay(
        null,
        {
          default: "---"
        },
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"]
      )
    ).toEqual({
      num: NaN,
      text: "---"
    });
    expect(applyFormatter).not.toHaveBeenCalled();
  });

  it("converts numeric string raw values before calling applyFormatter", function () {
    const v = create();
    const applyFormatter = vi.fn((value) => String(value));
    const normalize = vi.fn((text, defaultText) => {
      if (text == null) {
        return defaultText;
      }
      return String(text);
    });

    v.formatGaugeDisplay("12.3", {}, applyFormatter, normalize, "formatSpeed", ["kn"]);

    expect(applyFormatter).toHaveBeenCalledWith(
      12.3,
      expect.objectContaining({
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      })
    );
  });

  it("uses the default formatter and default parameters when props omit overrides", function () {
    const v = create();
    const applyFormatter = vi.fn(
      (value, options) => `fmt:${value}:${options.formatter}:${options.formatterParameters.join(",")}`
    );
    const normalize = vi.fn((text, defaultText) => {
      if (text == null) {
        return defaultText;
      }
      return String(text);
    });

    expect(v.formatGaugeDisplay(12.3, {}, applyFormatter, normalize, "formatSpeed", ["kn"])).toEqual({
      num: 12.3,
      text: "12.3"
    });
    expect(applyFormatter).toHaveBeenCalledWith(
      12.3,
      expect.objectContaining({
        formatter: "formatSpeed",
        formatterParameters: ["kn"]
      })
    );
  });

  it("supports undefined sector colors when no overrides are passed", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(v.buildHighEndSectors({ warningFrom: 20, alarmFrom: 25 }, 0, 30, arc)).toEqual([
      { a0: 390, a1: 420, color: undefined },
      { a0: 420, a1: 450, color: undefined }
    ]);

    expect(
      v.buildLowEndSectors({}, 10, 15, arc, {
        defaultWarningFrom: 12.2,
        defaultAlarmFrom: 11.6
      })
    ).toEqual([
      { a0: 270, a1: 327.6, color: undefined },
      { a0: 327.6, a1: 349.2, color: undefined }
    ]);
  });

  it("treats null and blank sector thresholds as missing defaults", function () {
    const v = create();
    const arc = { startDeg: 270, endDeg: 450 };

    expect(
      v.buildHighEndSectors({ warningFrom: null, alarmFrom: "   " }, 0, 30, arc, {
        warningColor: "#aa5500",
        alarmColor: "#bb0011"
      })
    ).toEqual([]);

    expect(
      v.buildLowEndSectors({ warningFrom: null, alarmFrom: "" }, 10, 15, arc, {
        defaultWarningFrom: 12.2,
        defaultAlarmFrom: 11.6,
        warningColor: "#aa5500",
        alarmColor: "#bb0011"
      })
    ).toEqual([
      { a0: 270, a1: 327.6, color: "#bb0011" },
      { a0: 327.6, a1: 349.2, color: "#aa5500" }
    ]);
  });

  it("resolves shared semicircle tick-step presets", function () {
    const v = create();

    expect(v.resolveStandardTickSteps(NaN)).toEqual({ major: 10, minor: 2 });
    expect(v.resolveStandardTickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(v.resolveStandardTickSteps(30)).toEqual({ major: 5, minor: 1 });
    expect(v.resolveStandardTickSteps(250)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveTemperatureTickSteps(8)).toEqual({ major: 1, minor: 0.5 });
    expect(v.resolveTemperatureTickSteps(100)).toEqual({ major: 10, minor: 2 });
    expect(v.resolveTemperatureTickSteps(250)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveVoltageTickSteps(0)).toEqual({ major: 1, minor: 0.2 });
    expect(v.resolveVoltageTickSteps(3)).toEqual({ major: 0.5, minor: 0.1 });
    expect(v.resolveVoltageTickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(v.resolveVoltageTickSteps(500)).toEqual({ major: 50, minor: 10 });

    expect(v.resolveTickSteps(20, "standard")).toEqual({ major: 5, minor: 1 });
    expect(v.resolveTickSteps(20, "temperature")).toEqual({ major: 2, minor: 1 });
    expect(v.resolveTickSteps(20, "voltage")).toEqual({ major: 5, minor: 1 });
    expect(v.resolveTickSteps(20, "unknown")).toEqual({ major: 5, minor: 1 });
  });
});

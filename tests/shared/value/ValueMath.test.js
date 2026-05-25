const { loadFresh } = require("../../helpers/load-umd");

function createValueMath() {
  return loadFresh("shared/widget-kits/value/ValueMath.js").create();
}

describe("ValueMath", function () {
  it("keeps finite checks null-safe and exposes the canonical coercion helper", function () {
    const value = createValueMath();

    expect(value.isFiniteNumber(0)).toBe(true);
    expect(value.isFiniteNumber(null)).toBe(false);
    expect(value.isFiniteNumber("0")).toBe(false);
    expect(value.toFiniteNumber("12.5")).toBe(12.5);
    expect(value.toFiniteNumber(null)).toBe(0);
    expect(value.toFiniteNumber(undefined)).toBeUndefined();
    expect(value.toFiniteNumber("abc")).toBeUndefined();
    expect(value.toOptionalFiniteNumber(null)).toBeUndefined();
    expect(value.toOptionalFiniteNumber(undefined)).toBeUndefined();
    expect(value.toOptionalFiniteNumber("")).toBeUndefined();
    expect(value.toOptionalFiniteNumber("   ")).toBeUndefined();
    expect(value.toOptionalFiniteNumber("12.5")).toBe(12.5);
    expect(value.toOptionalFiniteNumber(7)).toBe(7);
    expect(value.toOptionalFiniteNumber(NaN)).toBeUndefined();
    expect(value.toOptionalFiniteNumber(Infinity)).toBeUndefined();
  });

  it("clamps through the null-safe canonical implementation", function () {
    const value = createValueMath();

    expect(value.clamp(5, 0, 10)).toBe(5);
    expect(value.clamp(-5, 0, 10)).toBe(0);
    expect(value.clamp(15, 0, 10)).toBe(10);
    expect(value.clamp(null, -10, 10)).toBe(-10);
    expect(value.clamp(undefined, -10, 10)).toBe(-10);
    expect(value.clamp(NaN, -10, 10)).toBe(-10);
    expect(value.clamp("", -10, 10)).toBe(-10);
    expect(value.clamp(0, -10, 10)).toBe(0);
    expect(value.clamp(7.5, -10, 10)).toBe(7.5);
    expect(value.clamp("6.25", -10, 10)).toBe(6.25);
    expect(value.clampPositive("3", 1)).toBe(3);
    expect(value.clampPositive(0, 1)).toBe(1);
  });

  it("centralizes trim and object assertions", function () {
    const value = createValueMath();
    const obj = { ok: true };

    expect(value.trimText("  hi  ")).toBe("hi");
    expect(value.trimText(null)).toBe("");
    expect(value.ensureObject(obj, "Thing")).toBe(obj);
    expect(function () {
      value.ensureObject(null, "Thing");
    }).toThrow("Thing must be an object");
  });

  it("exposes canonical object/text/number helper utilities", function () {
    const value = createValueMath();

    expect(value.toObject(null)).toEqual({});
    expect(value.toObject({ a: 1 })).toEqual({ a: 1 });
    expect(value.toObject("string")).toEqual({});

    expect(value.toText(null)).toBe("");
    expect(value.toText(42)).toBe("42");
    expect(value.toText("hello")).toBe("hello");

    expect(value.clampNumber(null, 0, 100, 50)).toBe(50);
    expect(value.clampNumber("", 0, 100, 50)).toBe(50);
    expect(value.clampNumber(75, 0, 100, 50)).toBe(75);
    expect(value.clampNumber(150, 0, 100, 50)).toBe(100);

    expect(value.isObject({})).toBe(true);
    expect(value.isObject(null)).toBe(false);
    expect(value.isObject([])).toBe(true);

    expect(value.toSafeInteger(2.7, 0)).toBe(3);
    expect(value.toSafeInteger(null, 0)).toBe(0);

    expect(value.hasText("")).toBe(false);
    expect(value.hasText("hi")).toBe(true);
    expect(value.hasText(null)).toBe(false);
    expect(value.hasText(42)).toBe(true);

    expect(value.keyToText("abc")).toBe("abc");
    expect(value.keyToText(42)).toBe("42");
    expect(value.keyToText({ a: 1 })).toBe('{"a":1}');
    expect(value.keyToText(null)).toBe("null");

    expect(value.appendUnit("12", " kn", "---")).toBe("12 kn");
    expect(value.appendUnit("", " kn", "---")).toBe("--- kn");
    expect(value.appendUnit("12", "", "---")).toBe("12");
  });

  it("formats gauge display nulls as placeholders before numeric coercion", function () {
    const value = createValueMath();
    const applyFormatter = vi.fn(function (raw) {
      return String(raw) + " kn";
    });
    const normalize = vi.fn(function (text, defaultText) {
      return text == null ? defaultText || "---" : String(text);
    });

    expect(
      value.formatGaugeDisplay(
        null,
        {},
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"],
      ),
    ).toEqual({
      num: NaN,
      text: "---",
    });
    expect(
      value.formatGaugeDisplay(
        "",
        {},
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"],
      ),
    ).toEqual({
      num: NaN,
      text: "---",
    });
    expect(
      value.formatGaugeDisplay(
        "   ",
        {},
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"],
      ),
    ).toEqual({
      num: NaN,
      text: "---",
    });
    expect(applyFormatter).not.toHaveBeenCalled();

    expect(
      value.formatGaugeDisplay(
        4.2,
        {},
        applyFormatter,
        normalize,
        "formatSpeed",
        ["kn"],
      ),
    ).toEqual({
      num: 4.2,
      text: "4.2",
    });
  });

  it("treats blank inputs as missing in shared angle/label formatters", function () {
    const value = createValueMath();

    expect(value.formatAngle180(null, true)).toBe("");
    expect(value.formatAngle180("", true)).toBe("");
    expect(value.formatDirection360(undefined, true)).toBe("");
    expect(value.formatDirection360("   ", false)).toBe("");
    expect(value.formatMajorLabel("", false)).toBe("");
    expect(value.formatMajorLabel("  ")).toBe("");
    expect(value.formatDirection360("270", true)).toBe("270");
    expect(value.formatAngle180("-15", false)).toBe("-15");
  });

  it("exposes renamed tick-step resolvers and compatibility aliases", function () {
    const value = createValueMath();

    expect(value.resolveStandardTickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(value.resolveTemperatureTickSteps(20)).toEqual({
      major: 2,
      minor: 1,
    });
    expect(value.resolveVoltageTickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(value.resolveStandardTickSteps(6)).toEqual(
      value.resolveStandardTickSteps(6),
    );
    expect(value.valueToAngle).toBeUndefined();
    expect(value.angleToValue).toBeUndefined();
    expect(value.sectorAngles).toBeUndefined();
    expect(value.buildHighEndSectors).toBeUndefined();
    expect(value.buildLowEndSectors).toBeUndefined();
  });
});

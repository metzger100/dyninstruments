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
    expect(function () { value.ensureObject(null, "Thing"); }).toThrow("Thing must be an object");
  });

  it("formats gauge display nulls as placeholders before numeric coercion", function () {
    const value = createValueMath();
    const applyFormatter = vi.fn(function (raw) { return String(raw) + " kn"; });
    const normalize = vi.fn(function (text, defaultText) {
      return text == null ? (defaultText || "---") : String(text);
    });

    expect(value.formatGaugeDisplay(null, {}, applyFormatter, normalize, "formatSpeed", ["kn"])).toEqual({
      num: NaN,
      text: "---"
    });
    expect(applyFormatter).not.toHaveBeenCalled();

    expect(value.formatGaugeDisplay(4.2, {}, applyFormatter, normalize, "formatSpeed", ["kn"])).toEqual({
      num: 4.2,
      text: "4.2"
    });
  });

  it("exposes renamed tick-step resolvers and compatibility aliases", function () {
    const value = createValueMath();

    expect(value.resolveStandardTickSteps(6)).toEqual({ major: 1, minor: 0.5 });
    expect(value.resolveTemperatureTickSteps(20)).toEqual({ major: 2, minor: 1 });
    expect(value.resolveVoltageTickSteps(12)).toEqual({ major: 2, minor: 0.5 });
    expect(value.resolveStandardTickSteps(6)).toEqual(value.resolveStandardTickSteps(6));
    expect(value.valueToAngle).toBeUndefined();
    expect(value.angleToValue).toBeUndefined();
    expect(value.sectorAngles).toBeUndefined();
    expect(value.buildHighEndSectors).toBeUndefined();
    expect(value.buildLowEndSectors).toBeUndefined();
  });
});

const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("UnitAwareFormatter", function () {
  /** @param {any} [applyFormatterImpl] */
  function createApi(applyFormatterImpl) {
    const componentContext = createComponentContextMock({
      modules: {
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js")
      },
      services: {
        format: {
          applyFormatter: applyFormatterImpl || vi.fn((value) => (value == null ? null : String(value) + " m"))
        }
      }
    });
    const module = loadFresh("shared/widget-kits/format/UnitAwareFormatter.js");
    return module.create({}, componentContext);
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();
    context.DyniComponents.DyniValueMath = loadFresh("shared/widget-kits/value/ValueMath.js");

    runIifeScript("shared/widget-kits/format/UnitAwareFormatter.js", context);

    expect(context.DyniComponents.DyniUnitAwareFormatter).toBeTruthy();
    expect(context.DyniComponents.DyniUnitAwareFormatter.id).toBe("UnitAwareFormatter");
  });

  it("formatWithToken applies the formatter with the token parameter and trims/normalizes the result", function () {
    const applyFormatter = vi.fn(() => "  4.20 m  ");
    const api = createApi(applyFormatter);

    const result = api.formatWithToken(4.2, "formatSpeed", "kn", "---");

    expect(applyFormatter).toHaveBeenCalledWith(4.2, {
      formatter: "formatSpeed",
      formatterParameters: ["kn"],
      default: "---"
    });
    expect(result).toBe("4.20 m");
  });

  it("formatWithToken falls back to the default text when the formatter returns null or undefined", function () {
    const applyFormatter = vi.fn(() => null);
    const api = createApi(applyFormatter);

    expect(api.formatWithToken(null, "formatSpeed", "kn", "---")).toBe("---");

    const applyFormatterUndef = vi.fn(() => undefined);
    const apiUndef = createApi(applyFormatterUndef);
    expect(apiUndef.formatWithToken(null, "formatSpeed", "kn", "---")).toBe("---");
  });

  it("formatDistance delegates to formatWithToken using the formatDistance formatter", function () {
    const applyFormatter = vi.fn(() => "12.0 nm");
    const api = createApi(applyFormatter);

    const result = api.formatDistance(12, "nm", "---");

    expect(applyFormatter).toHaveBeenCalledWith(12, {
      formatter: "formatDistance",
      formatterParameters: ["nm"],
      default: "---"
    });
    expect(result).toBe("12.0 nm");
  });

  it("extractNumericDisplay parses a leading signed/decimal number from formatted text", function () {
    const api = createApi();

    expect(api.extractNumericDisplay("4.2 m", NaN)).toBe(4.2);
    expect(api.extractNumericDisplay("-5 kn", NaN)).toBe(-5);
    expect(api.extractNumericDisplay("+3.5 m", NaN)).toBe(3.5);
    expect(api.extractNumericDisplay(".5 m", NaN)).toBe(0.5);
  });

  it("extractNumericDisplay accepts a comma decimal separator", function () {
    const api = createApi();

    expect(api.extractNumericDisplay("4,2 m", NaN)).toBe(4.2);
  });

  it("extractNumericDisplay returns the default value when no leading number is present", function () {
    const api = createApi();

    expect(api.extractNumericDisplay("---", 0)).toBe(0);
    expect(api.extractNumericDisplay("", -1)).toBe(-1);
    expect(api.extractNumericDisplay("no digits here", 7)).toBe(7);
  });

  it("exposes ValueMath.appendUnit directly for callers", function () {
    const api = createApi();

    expect(typeof api.appendUnit).toBe("function");
    expect(api.appendUnit("12.0", "kn", "---")).toBe("12.0kn");
  });
});

const { loadFresh } = require("../../helpers/load-umd");

describe("DepthDisplayFormatter", function () {
  it("returns placeholder output for null raw values", function () {
    const mod = loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js");
    const formatter = mod.create();
    const unitFormatter = {
      formatWithToken: vi.fn(),
      extractNumericDisplay: vi.fn()
    };
    const placeholderNormalize = {
      normalize(value, defaultText) {
        return value == null ? (defaultText == null ? "---" : defaultText) : String(value);
      }
    };

    expect(formatter.formatDisplay(null, {}, unitFormatter, placeholderNormalize)).toEqual({
      num: NaN,
      text: "---"
    });
    expect(unitFormatter.formatWithToken).not.toHaveBeenCalled();
    expect(unitFormatter.extractNumericDisplay).not.toHaveBeenCalled();
  });

  it("treats undefined and blank-string raw values as missing placeholders", function () {
    const mod = loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js");
    const formatter = mod.create();
    const unitFormatter = {
      formatWithToken: vi.fn(),
      extractNumericDisplay: vi.fn()
    };
    const placeholderNormalize = {
      normalize(value, defaultText) {
        return value == null ? (defaultText == null ? "---" : defaultText) : String(value);
      }
    };

    [undefined, "", "   "].forEach(function (raw) {
      expect(formatter.formatDisplay(raw, {}, unitFormatter, placeholderNormalize)).toEqual({
        num: NaN,
        text: "---"
      });
    });
    expect(unitFormatter.formatWithToken).not.toHaveBeenCalled();
    expect(unitFormatter.extractNumericDisplay).not.toHaveBeenCalled();
  });

  it("keeps valid numeric strings as numeric display inputs", function () {
    const mod = loadFresh("shared/widget-kits/format/DepthDisplayFormatter.js");
    const formatter = mod.create();
    const unitFormatter = {
      formatWithToken: vi.fn(() => "4.2 m"),
      extractNumericDisplay: vi.fn(() => 4.2)
    };
    const placeholderNormalize = {
      normalize(value, defaultText) {
        return value == null ? (defaultText == null ? "---" : defaultText) : String(value);
      }
    };

    expect(formatter.formatDisplay("4.2", {}, unitFormatter, placeholderNormalize)).toEqual({
      num: 4.2,
      text: "4.2 m"
    });
    expect(unitFormatter.formatWithToken).toHaveBeenCalledWith(4.2, "formatDistance", "m", "---");
    expect(unitFormatter.extractNumericDisplay).toHaveBeenCalledWith("4.2 m", NaN);
  });
});

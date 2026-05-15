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
});

const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeTextLayout", function () {
  it("applies a stronger label boost for normal mode than flat mode", function () {
    const textLayout = loadFresh("shared/widget-kits/linear/LinearGaugeTextLayout.js").create();

    expect(textLayout.resolveLabelBoost("high")).toBe(1.2);
    expect(textLayout.resolveLabelBoost("normal")).toBe(1.26);
    expect(textLayout.resolveLabelBoost("flat")).toBe(1.0);
  });
});

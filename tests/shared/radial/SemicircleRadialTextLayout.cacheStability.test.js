// @ts-check
const { createHarness, defaultDisplay, loadFresh } = require("./SemicircleRadialTextLayout-setup");

describe("SemicircleRadialTextLayout", function () {
  it("keeps draw output stable across cache hits", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const cases = [
      {
        harness: createHarness("flat", 240, 90),
        drawKey: "drawValueUnitWithFit"
      },
      {
        harness: createHarness("high", 140, 220),
        drawKey: "drawInlineCapValUnit"
      },
      {
        harness: createHarness("normal", 210, 130),
        drawKey: "drawThreeRowsBlock"
      }
    ];

    cases.forEach(function (item) {
      const cache = textLayout.createFitCache();
      const display = defaultDisplay();

      textLayout.drawModeText(item.harness.state, display, cache);
      textLayout.drawModeText(item.harness.state, display, cache);

      // @ts-ignore -- pre-existing untyped test mock boundary
      expect(item.harness.calls[item.drawKey][1]).toEqual(item.harness.calls[item.drawKey][0]);
    });
  });
});

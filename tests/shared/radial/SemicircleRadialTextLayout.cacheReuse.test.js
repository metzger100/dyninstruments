// @ts-check
const { createHarness, defaultDisplay, loadFresh } = require("./SemicircleRadialTextLayout-setup");

describe("SemicircleRadialTextLayout", function () {
  it("reuses cached fitting for unchanged width classes and misses when width class changes", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const cases = [
      {
        harness: createHarness("flat", 240, 90),
        fitKey: "measureValueUnitFit",
        sameWidthText: "13.7",
        widerText: "100.0"
      },
      {
        harness: createHarness("high", 140, 220),
        fitKey: "fitInlineCapValUnit",
        sameWidthText: "13.7",
        widerText: "100.0"
      },
      {
        harness: createHarness("normal", 210, 130),
        fitKey: "fitTextPx",
        sameWidthText: "13.7",
        widerText: "100.0"
      }
    ];

    cases.forEach(function (item) {
      const cache = textLayout.createFitCache();
      const display = defaultDisplay();
      // @ts-ignore -- pre-existing untyped test mock boundary
      const firstCount = item.harness.calls[item.fitKey];

      textLayout.drawModeText(item.harness.state, display, cache);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const afterFirst = item.harness.calls[item.fitKey];
      textLayout.drawModeText(item.harness.state, display, cache);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const afterSecond = item.harness.calls[item.fitKey];
      textLayout.drawModeText(item.harness.state, { ...display, valueText: item.sameWidthText }, cache);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const afterThird = item.harness.calls[item.fitKey];
      textLayout.drawModeText(item.harness.state, { ...display, valueText: item.widerText }, cache);
      // @ts-ignore -- pre-existing untyped test mock boundary
      const afterFourth = item.harness.calls[item.fitKey];

      expect(afterFirst).toBeGreaterThan(firstCount);
      expect(afterSecond).toBe(afterFirst);
      expect(afterThird).toBe(afterSecond);
      expect(afterFourth).toBeGreaterThan(afterThird);
    });
  });
});

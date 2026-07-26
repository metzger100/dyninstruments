// @ts-check
const { createHarness, defaultDisplay, loadFresh } = require("./SemicircleRadialTextLayout-setup");

describe("SemicircleRadialTextLayout", function () {
  it("applies a stronger compact text boost than large layouts in every mode", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const cases = [
      {
        mode: "flat",
        compact: createHarness("flat", 320, 100),
        large: createHarness("flat", 520, 180),
        boostFrom(/** @type {any} */ harness) {
          return harness.calls.drawValueUnitWithFit[0].fit.vPx - 4;
        }
      },
      {
        mode: "high",
        compact: createHarness("high", 160, 240),
        large: createHarness("high", 220, 360),
        boostFrom(/** @type {any} */ harness) {
          return harness.calls.drawInlineCapValUnit[0].fit.vPx - 4;
        }
      },
      {
        mode: "normal",
        compact: createHarness("normal", 260, 140),
        large: createHarness("normal", 360, 240),
        boostFrom(/** @type {any} */ harness) {
          return harness.calls.drawThreeRowsBlock[0].sizes.vPx - 1;
        }
      }
    ];

    cases.forEach(function (item) {
      const compactCache = textLayout.createFitCache();
      const largeCache = textLayout.createFitCache();
      textLayout.drawModeText(item.compact.state, defaultDisplay(), compactCache);
      textLayout.drawModeText(item.large.state, defaultDisplay(), largeCache);

      expect(item.boostFrom(item.compact)).toBeGreaterThan(item.boostFrom(item.large));
      expect(item.large.state.textFillScale).toBe(1);
    });
  });
});

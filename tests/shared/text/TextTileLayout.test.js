const { loadFresh } = require("../../helpers/load-umd");

describe("TextTileLayout", function () {
  function createTextApi() {
    return {
      setFont() {},
      measureValueUnitFit() {
        return { vPx: 12, uPx: 8, gap: 4, total: 24 };
      },
      drawCaptionMax() {},
      drawValueUnitWithFit() {},
      fitSingleTextPx() {
        return 10;
      }
    };
  }

  it("uses layout-owned metric spacing inputs for padding and caption height", function () {
    const tileLayout = loadFresh("shared/widget-kits/text/TextTileLayout.js").create();
    const measurement = tileLayout.measureMetricTile({
      textApi: createTextApi(),
      ctx: { measureText() { return { width: 10 }; } },
      metric: { caption: "COG", value: "123", unit: "°" },
      rect: { x: 4, y: 6, w: 30, h: 12 },
      padX: 2,
      captionHeightPx: 3,
      textFillScale: 1.18,
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600,
      secScale: 0.8
    });

    expect(measurement.textX).toBe(6);
    expect(measurement.textW).toBe(26);
    expect(measurement.capH).toBe(3);
    // valueH includes the ROW_SAFE_RATIO (0.85) safety margin: floor((12 - 3) * 0.85) = 7
    expect(measurement.valueH).toBe(7);
  });

  it("keeps a 2px technical value-height guard when compact caption spacing would overconsume the tile", function () {
    const tileLayout = loadFresh("shared/widget-kits/text/TextTileLayout.js").create();
    const measurement = tileLayout.measureMetricTile({
      textApi: createTextApi(),
      ctx: { measureText() { return { width: 10 }; } },
      metric: { caption: "XTE", value: "0.12", unit: "nm" },
      rect: { x: 0, y: 0, w: 18, h: 5 },
      padX: 1,
      captionHeightPx: 20,
      textFillScale: 1.18,
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600,
      secScale: 0.8
    });

    expect(measurement.capH).toBe(3);
    expect(measurement.valueH).toBe(2);
  });
});

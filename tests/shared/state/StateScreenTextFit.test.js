const { loadFresh } = require("../../helpers/load-umd");

describe("StateScreenTextFit", function () {
  function createFit() {
    return loadFresh("shared/widget-kits/state/StateScreenTextFit.js").create({}, {});
  }

  function extractPx(styleText) {
    const match = String(styleText || "").match(/font-size:(\d+)px;/);
    return match ? Number(match[1]) : 0;
  }

  function createMeasureCtx() {
    return {
      font: "700 12px sans-serif",
      measureText(text) {
        const match = String(this.font || "").match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        return { width: String(text || "").length * Math.max(1, px) * 0.56 };
      }
    };
  }

  it("returns a positive inline font-size style for valid text and geometry", function () {
    const fit = createFit();
    const style = fit.compute({
      label: "No Route",
      shellRect: { width: 320, height: 180 },
      measureCtx: createMeasureCtx(),
      family: "sans-serif",
      weight: 700
    });

    expect(style).toMatch(/^font-size:\d+px;$/);
    expect(extractPx(style)).toBeGreaterThan(0);
  });

  it("clamps tiny fitted labels to a 1px inline font-size", function () {
    const fit = createFit();
    const style = fit.compute({
      label: "Disconnected",
      shellRect: { width: 2, height: 2 },
      measureCtx: createMeasureCtx(),
      family: "sans-serif",
      weight: 700
    });

    expect(style).toBe("font-size:1px;");
    expect(style).not.toBe("");
  });

  it("shrinks fitted font size when shell geometry is tighter", function () {
    const fit = createFit();
    const measureCtx = createMeasureCtx();
    const label = "Disconnected";

    const larger = fit.compute({
      label: label,
      shellRect: { width: 320, height: 180 },
      measureCtx: measureCtx,
      family: "sans-serif",
      weight: 700
    });
    const smaller = fit.compute({
      label: label,
      shellRect: { width: 140, height: 80 },
      measureCtx: measureCtx,
      family: "sans-serif",
      weight: 700
    });

    expect(extractPx(smaller)).toBeLessThan(extractPx(larger));
  });
});

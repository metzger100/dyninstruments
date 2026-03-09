const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("SemicircleRadialTextLayout", function () {
  const themeDefaults = {
    radial: {
      ring: { widthFactor: 0.18 },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      }
    },
    font: {
      weight: 710,
      labelWeight: 680
    }
  };

  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function createHarness(mode, width, height) {
    const layoutApi = createLayoutApi();
    const insets = layoutApi.computeInsets(width, height);
    const layout = layoutApi.computeLayout({
      W: width,
      H: height,
      mode: mode,
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive
    });
    const calls = {
      measureValueUnitFit: 0,
      fitInlineCapValUnit: 0,
      fitTextPx: 0,
      drawCaptionMax: [],
      drawValueUnitWithFit: [],
      drawInlineCapValUnit: [],
      drawThreeRowsBlock: []
    };
    const textApi = {
      measureValueUnitFit() {
        calls.measureValueUnitFit += 1;
        return { vPx: 4, uPx: 3, gap: 2 };
      },
      fitInlineCapValUnit() {
        calls.fitInlineCapValUnit += 1;
        return { cPx: 3, vPx: 4, uPx: 3, g1: 2, g2: 2, total: 100 };
      },
      fitTextPx(ctx, text, maxW, maxH) {
        calls.fitTextPx += 1;
        return Math.max(1, Math.min(Math.floor(Number(maxH) || 0), 1));
      },
      drawCaptionMax(ctx, family, x, y, w, h, caption, capMaxPx) {
        calls.drawCaptionMax.push({ x, y, w, h, caption, capMaxPx });
      },
      drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit) {
        calls.drawValueUnitWithFit.push({ x, y, w, h, valueText, unitText, fit: { ...fit } });
      },
      drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
        calls.drawInlineCapValUnit.push({ x, y, w, h, caption, valueText, unitText, fit: { ...fit } });
      },
      drawThreeRowsBlock(ctx, family, x, y, w, h, caption, valueText, unitText, secScale, align, sizes) {
        calls.drawThreeRowsBlock.push({ x, y, w, h, caption, valueText, unitText, secScale, align, sizes: { ...sizes } });
      }
    };

    return {
      calls: calls,
      state: {
        ctx: createMockContext2D(),
        W: width,
        H: height,
        family: "sans-serif",
        valueWeight: themeDefaults.font.weight,
        labelWeight: themeDefaults.font.labelWeight,
        text: textApi,
        layout: layout,
        geom: layout.geom,
        responsive: layout.responsive,
        textFillScale: layout.textFillScale
      }
    };
  }

  function defaultDisplay() {
    return {
      caption: "SPD",
      valueText: "12.3",
      unit: "kn",
      secScale: 0.8
    };
  }

  it("applies a stronger compact text boost than large layouts in every mode", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const cases = [
      {
        mode: "flat",
        compact: createHarness("flat", 320, 100),
        large: createHarness("flat", 520, 180),
        boostFrom(harness) {
          return harness.calls.drawValueUnitWithFit[0].fit.vPx - 4;
        }
      },
      {
        mode: "high",
        compact: createHarness("high", 160, 240),
        large: createHarness("high", 220, 360),
        boostFrom(harness) {
          return harness.calls.drawInlineCapValUnit[0].fit.vPx - 4;
        }
      },
      {
        mode: "normal",
        compact: createHarness("normal", 260, 140),
        large: createHarness("normal", 360, 240),
        boostFrom(harness) {
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

  it("reuses cached fitting for unchanged inputs and misses when content changes", function () {
    const textLayout = loadFresh("shared/widget-kits/radial/SemicircleRadialTextLayout.js").create();
    const cases = [
      {
        harness: createHarness("flat", 240, 90),
        fitKey: "measureValueUnitFit"
      },
      {
        harness: createHarness("high", 140, 220),
        fitKey: "fitInlineCapValUnit"
      },
      {
        harness: createHarness("normal", 210, 130),
        fitKey: "fitTextPx"
      }
    ];

    cases.forEach(function (item) {
      const cache = textLayout.createFitCache();
      const display = defaultDisplay();
      const firstCount = item.harness.calls[item.fitKey];

      textLayout.drawModeText(item.harness.state, display, cache);
      const afterFirst = item.harness.calls[item.fitKey];
      textLayout.drawModeText(item.harness.state, display, cache);
      const afterSecond = item.harness.calls[item.fitKey];
      textLayout.drawModeText(item.harness.state, { ...display, valueText: "13.7" }, cache);
      const afterThird = item.harness.calls[item.fitKey];

      expect(afterFirst).toBeGreaterThan(firstCount);
      expect(afterSecond).toBe(afterFirst);
      expect(afterThird).toBeGreaterThan(afterSecond);
    });
  });

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

      expect(item.harness.calls[item.drawKey][1]).toEqual(item.harness.calls[item.drawKey][0]);
    });
  });
});

// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("SemicircleRadialTextLayout", function () {
  const themeDefaults = {
    radial: {
      ticks: {
        majorLenFactor: 0.08,
        majorWidthFactor: 0.02,
        minorLenFactor: 0.047,
        minorWidthFactor: 0.01
      },
      pointer: {
        depthFactor: 0.22,
        sideFactor: 0.11
      },
      ring: { widthFactor: 0.18, arcLineWidthFactor: 0.013 },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      }
    },
    strokeWeight: 1,
    pointerDepthWeight: 1,
    pointerSideWeight: 1,
    font: {
      weight: 710,
      labelWeight: 680
    }
  };

  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
          GeometryScale: geometryScale
        }
      })
    );
  }

  function createRadialTextApi() {
    const fitting = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
    return loadFresh("shared/widget-kits/text/CanvasTextLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          RadialTextFitting: fitting
        }
      })
    );
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
        calls.drawValueUnitWithFit.push({
          x,
          y,
          w,
          h,
          valueText,
          unitText,
          fit: { ...fit }
        });
      },
      drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
        calls.drawInlineCapValUnit.push({
          x,
          y,
          w,
          h,
          caption,
          valueText,
          unitText,
          fit: { ...fit }
        });
      },
      drawThreeRowsBlock(ctx, family, x, y, w, h, caption, valueText, unitText, secScale, align, sizes) {
        calls.drawThreeRowsBlock.push({
          x,
          y,
          w,
          h,
          caption,
          valueText,
          unitText,
          secScale,
          align,
          sizes: { ...sizes }
        });
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

  function createRealTextHarness(mode, width, height) {
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
    const realText = createRadialTextApi();
    const captures = {
      valueUnit: [],
      threeRows: []
    };
    const ctx = createMockContext2D({ charWidth: 1 });
    ctx.measureText = function (text) {
      const match = String(ctx.font || "").match(/([0-9]+(?:\.[0-9]+)?)px/);
      const px = match ? Number(match[1]) : 10;
      return { width: String(text || "").length * px * 0.62 };
    };
    const textProxy = {
      setFont: realText.setFont,
      fitTextPx: realText.fitTextPx,
      fitSingleTextPx: realText.fitSingleTextPx,
      measureValueUnitFit: realText.measureValueUnitFit,
      fitInlineCapValUnit: realText.fitInlineCapValUnit,
      drawCaptionMax: realText.drawCaptionMax,
      drawInlineCapValUnit: realText.drawInlineCapValUnit,
      drawDisconnectOverlay: realText.drawDisconnectOverlay,
      drawValueUnitWithFit(ctxArg, family, x, y, w, h, valueText, unitText, fit, align, valueWeight, labelWeight) {
        const start = ctxArg.calls.length;
        realText.drawValueUnitWithFit(
          ctxArg,
          family,
          x,
          y,
          w,
          h,
          valueText,
          unitText,
          fit,
          align,
          valueWeight,
          labelWeight
        );
        const scaled = ctxArg.calls.slice(start).some((entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
        captures.valueUnit.push({ w, valueText, unitText, fit, scaled });
      },
      drawThreeRowsBlock(
        ctxArg,
        family,
        x,
        y,
        w,
        h,
        caption,
        valueText,
        unitText,
        secScale,
        align,
        sizes,
        valueWeight,
        labelWeight
      ) {
        const start = ctxArg.calls.length;
        realText.drawThreeRowsBlock(
          ctxArg,
          family,
          x,
          y,
          w,
          h,
          caption,
          valueText,
          unitText,
          secScale,
          align,
          sizes,
          valueWeight,
          labelWeight
        );
        const scaled = ctxArg.calls.slice(start).some((entry) => entry.name === "scale" && Number(entry.args[0]) < 1);
        captures.threeRows.push({
          w,
          caption,
          valueText,
          unitText,
          sizes,
          scaled
        });
      }
    };
    return {
      captures: captures,
      realText: realText,
      state: {
        ctx: ctx,
        W: width,
        H: height,
        family: "sans-serif",
        valueWeight: themeDefaults.font.weight,
        labelWeight: themeDefaults.font.labelWeight,
        text: textProxy,
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

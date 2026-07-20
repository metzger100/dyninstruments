// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("CenterDisplayTextWidget", function () {
  function makeComponentContext(options) {
    const opts = options || {};
    const themeTokens = {
      surface: {
        fg: "#ffffff"
      },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 720,
        labelWeight: 610
      }
    };
    const modules = {
      RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
      ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
      TextLayoutEngine: loadFresh("shared/widget-kits/text/TextLayoutEngine.js"),
      TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
      TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      CenterDisplayLayout: loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js"),
      CenterDisplayMath: loadFresh("shared/widget-kits/nav/CenterDisplayMath.js"),
      CenterDisplayRenderModel: loadFresh("shared/widget-kits/nav/CenterDisplayRenderModel.js")
    };
    return createComponentContextMock({
      modules: {
        ThemeResolver: {
          resolveForRoot() {
            return themeTokens;
          }
        },
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        CenterDisplayStateAdapter: loadFresh("shared/widget-kits/text/CenterDisplayStateAdapter.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js"),
        RadialAngleMath: modules.RadialAngleMath,
        ValueMath: modules.ValueMath,
        RadialTextFitting: modules.RadialTextFitting,
        CanvasTextLayout: modules.CanvasTextLayout,
        TextLayoutEngine: modules.TextLayoutEngine,
        TextLayoutPrimitives: modules.TextLayoutPrimitives,
        TextLayoutComposite: modules.TextLayoutComposite,
        TextTileLayout: modules.TextTileLayout,
        LayoutRectMath: modules.LayoutRectMath,
        ResponsiveScaleProfile: modules.ResponsiveScaleProfile,
        CenterDisplayLayout: modules.CenterDisplayLayout,
        CenterDisplayMath: modules.CenterDisplayMath,
        CenterDisplayRenderModel: modules.CenterDisplayRenderModel
      },
      services: {
        format: {
          applyFormatter(value, formatterOptions) {
            if (typeof opts.applyFormatter === "function") {
              return opts.applyFormatter(value, formatterOptions);
            }
            if (formatterOptions.formatter === "formatLonLatsDecimal") {
              if (typeof value !== "number" || !isFinite(value)) {
                return formatterOptions.default;
              }
              return (formatterOptions.formatterParameters[0] === "lat" ? "LAT:" : "LON:") + value.toFixed(3);
            }
            if (formatterOptions.formatter === "formatDirection") {
              if (typeof value !== "number" || !isFinite(value)) {
                return formatterOptions.default;
              }
              return String(Math.round(value));
            }
            if (formatterOptions.formatter === "formatDistance") {
              if (typeof value !== "number" || !isFinite(value)) {
                return formatterOptions.default;
              }
              return value.toFixed(1);
            }
            return value == null ? formatterOptions.default : String(value);
          }
        },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return { ctx, W: Math.round(rect.width), H: Math.round(rect.height) };
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          }
        }
      }
    });
  }

  function makeProps(overrides) {
    const opts = overrides || {};
    return {
      display: {
        position: Object.prototype.hasOwnProperty.call(opts, "position") ? opts.position : { lat: 54.123, lon: 10.456 },
        marker: Object.prototype.hasOwnProperty.call(opts, "marker") ? opts.marker : { course: 92, distance: 12.3 },
        boat: Object.prototype.hasOwnProperty.call(opts, "boat") ? opts.boat : { course: 184, distance: 3.4 },
        measure: {
          activeMeasure: Object.prototype.hasOwnProperty.call(opts, "activeMeasure")
            ? opts.activeMeasure
            : { getPointAtIndex: (index) => (index === 0 ? { lat: 54.18, lon: 10.52 } : undefined) },
          useRhumbLine: opts.useRhumbLine === true
        }
      },
      captions: {
        position: "CENTER",
        marker: "WP",
        boat: "POS",
        measure: "MEAS"
      },
      units: {
        marker: "nm",
        boat: "nm",
        measure: "nm"
      },
      formatUnits: {
        marker: "nm",
        boat: "nm",
        measure: "nm"
      },
      ratioThresholdNormal: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdNormal")
        ? opts.ratioThresholdNormal
        : 1.1,
      ratioThresholdFlat: Object.prototype.hasOwnProperty.call(opts, "ratioThresholdFlat")
        ? opts.ratioThresholdFlat
        : 2.4,
      coordinatesTabular: opts.coordinatesTabular,
      stableDigits: opts.stableDigits === true,
      disconnect: opts.disconnect === true,
      default: Object.prototype.hasOwnProperty.call(opts, "default") ? opts.default : "---"
    };
  }

  function fillTextCalls(ctx) {
    return ctx.calls
      .filter((entry) => entry.name === "fillText")
      .map((entry) => ({
        text: String(entry.args[0]),
        x: entry.args[1],
        y: entry.args[2]
      }));
  }

  function findFirstText(calls, text) {
    return calls.find((entry) => entry.text === text);
  }

  function findAllTexts(calls, text) {
    return calls.filter((entry) => entry.text === text);
  }

  function findFirstTextPrefix(calls, prefix) {
    return calls.find((entry) => entry.text.indexOf(prefix) === 0);
  }

  function captureTextFonts(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        font: ctx.font
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        x: arguments[1],
        y: arguments[2],
        textAlign: ctx.textAlign
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  function parseFontPx(font) {
    const match = /(\d+)px/.exec(String(font || ""));
    return match ? Number(match[1]) : 0;
  }

  function computeLayoutSnapshot(width, height, mode, relationCount) {
    const layout = loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create({}, makeComponentContext());
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return layout.computeLayout({
      contentRect: contentRect,
      mode: mode,
      relationCount: relationCount,
      gap: insets.gap,
      responsive: insets.responsive,
      normalCaptionShare: 0.28,
      flatCenterShare: 0.42,
      highCaptionRatio: 0.24,
      flatCaptionRatio: 0.22
    });
  }

  function expectTextsInsideCanvas(calls, width, height) {
    calls.forEach((entry) => {
      expect(entry.x).toBeGreaterThanOrEqual(0);
      expect(entry.x).toBeLessThanOrEqual(width);
      expect(entry.y).toBeGreaterThanOrEqual(0);
      expect(entry.y).toBeLessThanOrEqual(height);
    });
  }

  it("renders normal mode with caption left and right-aligned tabular coordinates", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });
    const calls = captureTextCalls(ctx);

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const lon = findFirstText(texts, "LON:10.456");
    const wp = findFirstText(texts, "WP");
    const latCall = calls.find((entry) => entry.text.indexOf("LAT:") === 0);
    const lonCall = calls.find((entry) => entry.text.indexOf("LON:") === 0);

    expect(center).toBeTruthy();
    expect(lat).toBeTruthy();
    expect(lon).toBeTruthy();
    expect(wp).toBeTruthy();
    expect(center.x).toBeLessThan(lat.x);
    expect(center.x).toBeLessThan(lon.x);
    expect(latCall).toBeTruthy();
    expect(lonCall).toBeTruthy();
    expect(latCall.textAlign).toBe("right");
    expect(lonCall.textAlign).toBe("right");
    expect(lat.y).toBeLessThan(wp.y);
    expect(lon.y).toBeLessThan(wp.y);
  });
});

const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ default: string, formatter: string, formatterParameters: string[] }} CenterFormatterOptions
 * @typedef {{ applyFormatter?: (value: unknown, options: CenterFormatterOptions) => unknown }} ContextOptions
 * @typedef {{ activeMeasure?: unknown, boat?: unknown, coordinatesTabular?: unknown, default?: unknown, disconnect?: boolean, marker?: unknown, position?: unknown, ratioThresholdFlat?: number, ratioThresholdNormal?: number, stableDigits?: boolean, useRhumbLine?: boolean }} CenterOverrides
 * @typedef {{ font?: string, text: string, textAlign?: string, x: number, y: number }} TextCall
 */

/** @param {ContextOptions} [options] */
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
        /** @param {unknown} value @param {CenterFormatterOptions} formatterOptions */
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
          return value === null || value === undefined ? formatterOptions.default : String(value);
        }
      },
      canvas: {
        /** @param {{ getBoundingClientRect: () => DOMRect, getContext: (kind: string) => unknown }} canvas */
        setupCanvas(canvas) {
          const ctx = canvas.getContext("2d");
          const rect = canvas.getBoundingClientRect();
          return { ctx, W: Math.round(rect.width), H: Math.round(rect.height) };
        }
      },
      dom: {
        /** @param {Element} target */
        requirePluginRoot(target) {
          return target;
        }
      }
    }
  });
}

/** @param {CenterOverrides} [overrides] */
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
          : {
              /** @param {number} index */
              getPointAtIndex(index) {
                return index === 0 ? { lat: 54.18, lon: 10.52 } : undefined;
              }
            },
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

/** @param {DyniTestCanvasContext} ctx @returns {DyniTestKnownArray<TextCall>} */
function fillTextCalls(ctx) {
  return /** @type {DyniTestKnownArray<TextCall>} */ (
    ctx.calls
      .filter((entry) => entry.name === "fillText")
      .map((entry) => ({
        text: String(entry.args[0]),
        x: Number(entry.args[1]),
        y: Number(entry.args[2])
      }))
  );
}

/** @param {TextCall[]} calls @param {string} text @returns {TextCall | undefined} */
function findFirstText(calls, text) {
  return calls.find((entry) => entry.text === text);
}

/** @param {TextCall[]} calls @param {string} text */
function findAllTexts(calls, text) {
  return calls.filter((entry) => entry.text === text);
}

/** @param {TextCall[]} calls @param {string} prefix @returns {TextCall | undefined} */
function findFirstTextPrefix(calls, prefix) {
  return calls.find((entry) => entry.text.indexOf(prefix) === 0);
}

/** @param {DyniTestCanvasContext} ctx @returns {Array<{ font: string, text: string }>} */
function captureTextFonts(ctx) {
  const captured = /** @type {Array<{ font: string, text: string }>} */ ([]);
  const originalFillText = ctx.fillText;
  /** @this {DyniTestCanvasContext} @param {...unknown} args */
  ctx.fillText = function (...args) {
    captured.push({
      text: String(args[0]),
      font: ctx.font
    });
    return originalFillText.call(this, String(args[0]), Number(args[1]), Number(args[2]));
  };
  return captured;
}

/** @param {DyniTestCanvasContext} ctx @returns {DyniTestKnownArray<TextCall>} */
function captureTextCalls(ctx) {
  const captured = /** @type {DyniTestKnownArray<TextCall>} */ (
    /** @type {unknown} */ (/** @type {TextCall[]} */ ([]))
  );
  const originalFillText = ctx.fillText;
  /** @this {DyniTestCanvasContext} @param {...unknown} args */
  ctx.fillText = function (...args) {
    captured.push({
      text: String(args[0]),
      x: Number(args[1]),
      y: Number(args[2]),
      textAlign: ctx.textAlign
    });
    return originalFillText.call(this, String(args[0]), Number(args[1]), Number(args[2]));
  };
  return captured;
}

/** @param {string} font */
function parseFontPx(font) {
  const match = /(\d+)px/.exec(String(font || ""));
  return match ? Number(match[1]) : 0;
}

/** @param {number} width @param {number} height @param {string} mode @param {number} relationCount */
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

/** @param {TextCall[]} calls @param {number} width @param {number} height */
function expectTextsInsideCanvas(calls, width, height) {
  calls.forEach((entry) => {
    expect(entry.x).toBeGreaterThanOrEqual(0);
    expect(entry.x).toBeLessThanOrEqual(width);
    expect(entry.y).toBeGreaterThanOrEqual(0);
    expect(entry.y).toBeLessThanOrEqual(height);
  });
}

module.exports = {
  captureTextCalls,
  captureTextFonts,
  computeLayoutSnapshot,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  expectTextsInsideCanvas,
  fillTextCalls,
  findAllTexts,
  findFirstText,
  findFirstTextPrefix,
  loadFresh,
  makeComponentContext,
  makeProps,
  parseFontPx
};

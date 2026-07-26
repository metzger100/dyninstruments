const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createMeasureContext() {
  const ctx = /** @type {any} */ ({
    fonts: [],
    calls: []
  });
  Object.defineProperty(ctx, "font", {
    enumerable: true,
    configurable: true,
    get() {
      return this._font || "700 12px sans-serif";
    },
    /** @param {any} value */
    set(value) {
      this._font = String(value || "");
      this.fonts.push(this._font);
    }
  });
  ctx.font = "700 12px sans-serif";
  ctx.measureText = function (/** @type {any} */ text) {
    this.calls.push({
      text: String(text),
      font: String(this.font || "")
    });
    const source = String(this.font || "");
    const match = source.match(/(\d+(?:\.\d+)?)px/);
    const px = match ? Number(match[1]) : 12;
    const safePx = Number.isFinite(px) ? px : 12;
    return { width: String(text).length * safePx * 0.56 };
  };
  return ctx;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createHarness(themeOverrides) {
  const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
  const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
  const activeRouteLayoutModule = loadFresh("shared/widget-kits/nav/ActiveRouteLayout.js");
  const radialTextLayoutModule = loadFresh("shared/widget-kits/text/CanvasTextLayout.js");
  const radialTextFittingModule = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
  const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
  const themeTokens = Object.assign(
    {
      font: {
        weight: 720,
        labelWeight: 610,
        family: "sans-serif",
        familyMono: "mono-serif"
      }
    },
    themeOverrides || {}
  );
  if (!themeTokens.font || typeof themeTokens.font !== "object") {
    themeTokens.font = {
      weight: 720,
      labelWeight: 610,
      family: "sans-serif",
      familyMono: "mono-serif"
    };
  }
  const themeApi = {
    resolveForRoot: vi.fn(() => themeTokens)
  };

  const componentContext = createComponentContextMock({
    modules: {
      HtmlWidgetUtils: htmlUtilsModule,
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
      TextTileLayout: textTileLayoutModule,
      ActiveRouteLayout: activeRouteLayoutModule,
      CanvasTextLayout: radialTextLayoutModule,
      RadialTextFitting: radialTextFittingModule,
      ResponsiveScaleProfile: responsiveScaleProfileModule,
      LayoutRectMath: layoutRectMathModule
    },
    services: {
      themeTokens: {
        resolveForRoot: themeApi.resolveForRoot
      },
      dom: {
        /** @param {any} target @returns {any} */
        requirePluginRoot(target) {
          return target || null;
        },
        getNightModeState() {
          return false;
        }
      }
    }
  });

  return {
    fit: loadFresh("shared/widget-kits/nav/ActiveRouteHtmlFit.js").create({}, componentContext),
    themeTokens: themeTokens
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function makeModel(overrides) {
  return Object.assign(
    {
      mode: "normal",
      isApproaching: true,
      routeNameText: "Harbor Route",
      stableDigitsEnabled: false,
      remainCaption: "RTE",
      remainText: "12.4",
      remainPlainText: "12.4",
      remainUnit: "nm",
      etaCaption: "RTE ETA",
      etaText: "14:25",
      etaPlainText: "14:25",
      etaUnit: "utc",
      nextCourseCaption: "NEXT",
      nextCourseText: "093",
      nextCoursePlainText: "093",
      nextCourseUnit: "deg"
    },
    overrides || {}
  );
}

// @ts-ignore -- pre-existing untyped test mock boundary
function extractPx(style) {
  const match = String(style || "").match(new RegExp("^font-size:(\\d+)px\\x3b$"));
  return match ? Number(match[1]) : 0;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function expectStyleFormat(style) {
  expect(typeof style).toBe("string");
  expect(style).toMatch(new RegExp("^font-size:\\d+px\\x3b$"));
}

module.exports = {
  createComponentContextMock,
  createHarness,
  createMeasureContext,
  expectStyleFormat,
  extractPx,
  loadFresh,
  makeModel
};

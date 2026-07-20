// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("ActiveRouteHtmlFit (part 3 - formatActiveRouteMetric / compute edge cases)", function () {
  function createMeasureContext() {
    const ctx = {
      fonts: [],
      calls: []
    };
    Object.defineProperty(ctx, "font", {
      enumerable: true,
      configurable: true,
      get() {
        return this._font || "700 12px sans-serif";
      },
      set(value) {
        this._font = String(value || "");
        this.fonts.push(this._font);
      }
    });
    ctx.font = "700 12px sans-serif";
    ctx.measureText = function (text) {
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

  function createHarness(themeOverrides, moduleOverrides) {
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
      modules: Object.assign(
        {
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
        moduleOverrides || {}
      ),
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot
        },
        dom: {
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

  function expectStyleFormat(style) {
    expect(typeof style).toBe("string");
    expect(style).toMatch(new RegExp("^font-size:\\d+px\\x3b$"));
  }

  function createRealHtmlMeasureUtils() {
    return loadFresh("shared/widget-kits/html/HtmlMeasureUtils.js").create({}, createComponentContextMock({}));
  }

  function createLayoutMissingMetric(metricId) {
    const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const realLayout = loadFresh("shared/widget-kits/nav/ActiveRouteLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfileModule,
          LayoutRectMath: layoutRectMathModule
        }
      })
    );
    return Object.assign({}, realLayout, {
      computeLayout: function (args) {
        const layout = realLayout.computeLayout(args);
        delete layout.metricRects[metricId];
        return layout;
      }
    });
  }

  describe("formatActiveRouteMetric", function () {
    function createHarnessWithFormatterSpy() {
      const formatWithToken = vi.fn(
        (value, formatter, token, defaultText) => "formatted:" + String(token) + ":" + defaultText
      );
      const h = createHarness(undefined, {
        UnitAwareFormatter: { create: () => ({ formatWithToken }) }
      });
      return { h: h, formatWithToken: formatWithToken };
    }

    it("passes the first formatter parameter when the array is non-empty", function () {
      const { h, formatWithToken } = createHarnessWithFormatterSpy();
      const result = h.fit.formatActiveRouteMetric(12.3, "formatDistance", ["nm"], "--", {});
      expect(formatWithToken).toHaveBeenCalledWith(12.3, "formatDistance", "nm", "--");
      expect(result).toBe("formatted:nm:--");
    });

    it("passes undefined as the token when formatterParameters is an empty array", function () {
      const { h, formatWithToken } = createHarnessWithFormatterSpy();
      h.fit.formatActiveRouteMetric(12.3, "formatDistance", [], "--", {});
      expect(formatWithToken).toHaveBeenCalledWith(12.3, "formatDistance", undefined, "--");
    });

    it("passes undefined as the token when formatterParameters is not an array", function () {
      const { h, formatWithToken } = createHarnessWithFormatterSpy();
      h.fit.formatActiveRouteMetric(12.3, "formatDistance", { 0: "nm" }, "--", {});
      expect(formatWithToken).toHaveBeenCalledWith(12.3, "formatDistance", undefined, "--");
    });
  });

  describe("compute() edge cases", function () {
    it("returns null gracefully when called without arguments", function () {
      const h = createHarness();
      expect(h.fit.compute()).toBeNull();
      expect(h.fit.compute(undefined)).toBeNull();
    });

    it("returns null when no usable measure context can be resolved", function () {
      const stub = Object.assign({}, createRealHtmlMeasureUtils(), {
        resolveMeasureContext: () => null
      });
      const h = createHarness(undefined, {
        HtmlMeasureUtils: { create: () => stub }
      });
      const out = h.fit.compute({
        model: makeModel(),
        shellRect: { width: 320, height: 180 },
        targetEl: document.createElement("div"),
        hostContext: {}
      });
      expect(out).toBeNull();
    });

    it("skips styling for a metric whose layout rect is missing", function () {
      const layoutStub = createLayoutMissingMetric("next");
      const h = createHarness(undefined, {
        ActiveRouteLayout: { create: () => layoutStub }
      });
      const hostContext = { __dyniHtmlMeasureUtilsCtx: createMeasureContext() };
      const out = h.fit.compute({
        model: makeModel({ isApproaching: true }),
        shellRect: { width: 320, height: 180 },
        targetEl: document.createElement("div"),
        hostContext: hostContext
      });
      expect(out).not.toBeNull();
      expect(Object.keys(out.metrics)).toEqual(["remain", "rteEta"]);
      expect(out.metricValues.next).toBeUndefined();
    });

    it("returns a valid result without caching when fit cache support is unavailable", function () {
      const stub = Object.assign({}, createRealHtmlMeasureUtils(), {
        resolveFitCache: () => null
      });
      const h = createHarness(undefined, {
        HtmlMeasureUtils: { create: () => stub }
      });
      const hostContext = { __dyniHtmlMeasureUtilsCtx: createMeasureContext() };
      const out = h.fit.compute({
        model: makeModel(),
        shellRect: { width: 320, height: 180 },
        targetEl: document.createElement("div"),
        hostContext: hostContext
      });
      expect(out).not.toBeNull();
      expectStyleFormat(out.routeNameStyle);
      expect(hostContext.__dyniActiveRouteHtmlFitCache).toBeUndefined();
    });
  });
});

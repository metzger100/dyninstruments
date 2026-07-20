// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("ActiveRouteHtmlFit (part 2 - ensureDisplayProps / resolveDisplayMode / normalizeStableValue)", function () {
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

  function createRealHtmlUtils() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js").create({}, createComponentContextMock({}));
  }

  describe("ensureDisplayProps", function () {
    it("throws when props.display is missing or not an object", function () {
      const h = createHarness();
      expect(() => h.fit.ensureDisplayProps({ captions: {}, units: {}, default: "x" })).toThrow(
        "ActiveRouteTextHtmlWidget: props.display is required"
      );
      expect(() =>
        h.fit.ensureDisplayProps({
          display: "not-an-object",
          captions: {},
          units: {},
          default: "x"
        })
      ).toThrow("ActiveRouteTextHtmlWidget: props.display is required");
    });

    it("throws when props.captions is missing or not an object", function () {
      const h = createHarness();
      expect(() => h.fit.ensureDisplayProps({ display: {}, units: {}, default: "x" })).toThrow(
        "ActiveRouteTextHtmlWidget: props.captions is required"
      );
      expect(() =>
        h.fit.ensureDisplayProps({
          display: {},
          captions: 42,
          units: {},
          default: "x"
        })
      ).toThrow("ActiveRouteTextHtmlWidget: props.captions is required");
    });

    it("throws when props.units is missing or not an object", function () {
      const h = createHarness();
      expect(() => h.fit.ensureDisplayProps({ display: {}, captions: {}, default: "x" })).toThrow(
        "ActiveRouteTextHtmlWidget: props.units is required"
      );
      expect(() =>
        h.fit.ensureDisplayProps({
          display: {},
          captions: {},
          units: [],
          default: "x"
        })
      ).not.toThrow();
    });

    it("throws when props lacks an own default property", function () {
      const h = createHarness();
      expect(() => h.fit.ensureDisplayProps({ display: {}, captions: {}, units: {} })).toThrow(
        "ActiveRouteTextHtmlWidget: props.default is required"
      );
    });

    it("returns the props object unchanged when fully valid", function () {
      const h = createHarness();
      const props = { display: {}, captions: {}, units: {}, default: "x" };
      expect(h.fit.ensureDisplayProps(props)).toBe(props);
    });
  });

  describe("resolveDisplayMode", function () {
    it("resolves flat, normal and high modes from the shell rect ratio", function () {
      const h = createHarness();
      const htmlUtils = createRealHtmlUtils();
      expect(h.fit.resolveDisplayMode({}, { width: 1000, height: 100 }, htmlUtils)).toBe("flat");
      expect(h.fit.resolveDisplayMode({}, { width: 200, height: 150 }, htmlUtils)).toBe("normal");
      expect(h.fit.resolveDisplayMode({}, { width: 100, height: 200 }, htmlUtils)).toBe("high");
    });
  });

  describe("normalizeStableValue", function () {
    it("returns raw text unchanged and untouched when stable digits are disabled", function () {
      const h = createHarness();
      const stableDigits = {
        resolveIntegerWidth: vi.fn(),
        normalize: vi.fn()
      };
      const result = h.fit.normalizeStableValue("12.3", false, stableDigits, 4);
      expect(result).toEqual({ padded: "12.3", plain: "12.3" });
      expect(stableDigits.resolveIntegerWidth).not.toHaveBeenCalled();
      expect(stableDigits.normalize).not.toHaveBeenCalled();
    });

    it("delegates to stableDigits.normalize when stable digits are enabled", function () {
      const h = createHarness();
      const stableDigits = {
        resolveIntegerWidth: vi.fn(() => 5),
        normalize: vi.fn(() => ({ padded: "  12.3", plain: "12.3" }))
      };
      const result = h.fit.normalizeStableValue("12.3", true, stableDigits, 4);
      expect(stableDigits.resolveIntegerWidth).toHaveBeenCalledWith("12.3", 4);
      expect(stableDigits.normalize).toHaveBeenCalledWith("12.3", {
        integerWidth: 5,
        reserveSignSlot: true
      });
      expect(result).toEqual({ padded: "  12.3", plain: "12.3" });
    });
  });

  describe("resolveRouteNameMaxPxRatio via compute()", function () {
    it("computes a valid routeNameStyle in flat mode", function () {
      const h = createHarness();
      const hostContext = { __dyniHtmlMeasureUtilsCtx: createMeasureContext() };
      const out = h.fit.compute({
        model: makeModel({ mode: "flat" }),
        shellRect: { width: 620, height: 160 },
        targetEl: document.createElement("div"),
        hostContext: hostContext
      });
      expect(out).not.toBeNull();
      expectStyleFormat(out.routeNameStyle);
    });

    it("computes a valid routeNameStyle in high mode", function () {
      const h = createHarness();
      const hostContext = { __dyniHtmlMeasureUtilsCtx: createMeasureContext() };
      const out = h.fit.compute({
        model: makeModel({ mode: "high" }),
        shellRect: { width: 160, height: 320 },
        targetEl: document.createElement("div"),
        hostContext: hostContext
      });
      expect(out).not.toBeNull();
      expectStyleFormat(out.routeNameStyle);
    });
  });
});

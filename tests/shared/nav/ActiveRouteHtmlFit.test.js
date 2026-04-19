const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteHtmlFit", function () {
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

  function createHarness(themeOverrides) {
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const activeRouteLayoutModule = loadFresh("shared/widget-kits/nav/ActiveRouteLayout.js");
    const radialTextLayoutModule = loadFresh("shared/widget-kits/radial/RadialTextLayout.js");
    const radialTextFittingModule = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
    const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const themeTokens = Object.assign({
      font: {
        weight: 720,
        labelWeight: 610,
        family: "sans-serif",
        familyMono: "mono-serif"
      }
    }, themeOverrides || {});
    if (!themeTokens.font || typeof themeTokens.font !== "object") {
      themeTokens.font = {
        weight: 720,
        labelWeight: 610,
        family: "sans-serif",
        familyMono: "mono-serif"
      };
    }
    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        font: themeTokens.font
      }))
    };

    const Helpers = {
      requirePluginRoot(target) {
        return target || null;
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return themeApi;
        }
        if (id === "HtmlWidgetUtils") {
          return htmlUtilsModule;
        }
        if (id === "TextTileLayout") {
          return textTileLayoutModule;
        }
        if (id === "ActiveRouteLayout") {
          return activeRouteLayoutModule;
        }
        if (id === "RadialTextLayout") {
          return radialTextLayoutModule;
        }
        if (id === "RadialTextFitting") {
          return radialTextFittingModule;
        }
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfileModule;
        }
        if (id === "LayoutRectMath") {
          return layoutRectMathModule;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      fit: loadFresh("shared/widget-kits/nav/ActiveRouteHtmlFit.js").create({}, Helpers),
      themeTokens: themeTokens
    };
  }

  function makeModel(overrides) {
    return Object.assign({
      mode: "normal",
      isApproaching: true,
      routeNameText: "Harbor Route",
      stableDigitsEnabled: false,
      remainCaption: "RTE",
      remainText: "12.4",
      remainFallbackText: "12.4",
      remainUnit: "nm",
      etaCaption: "ETA",
      etaText: "14:25",
      etaFallbackText: "14:25",
      etaUnit: "utc",
      nextCourseCaption: "NEXT",
      nextCourseText: "093",
      nextCourseFallbackText: "093",
      nextCourseUnit: "deg"
    }, overrides || {});
  }

  function extractPx(style) {
    const match = String(style || "").match(/^font-size:(\d+)px;$/);
    return match ? Number(match[1]) : 0;
  }

  function expectStyleFormat(style) {
    expect(typeof style).toBe("string");
    expect(style).toMatch(/^font-size:\d+px;$/);
  }

  it("returns caption/value/unit style payload for all visible metrics", function () {
    const h = createHarness();
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const out = h.fit.compute({
      model: makeModel(),
      shellRect: { width: 320, height: 180 },
      targetEl: document.createElement("div"),
      hostContext: hostContext
    });

    expectStyleFormat(out.routeNameStyle);
    expect(Object.keys(out.metrics)).toEqual(["remain", "eta", "next"]);
    ["remain", "eta", "next"].forEach((metricId) => {
      expectStyleFormat(out.metrics[metricId].captionStyle);
      expectStyleFormat(out.metrics[metricId].valueStyle);
      expectStyleFormat(out.metrics[metricId].unitStyle);
    });
  });

  it("shrinks caption style under tighter geometry without dropping caption payload", function () {
    const h = createHarness();
    const model = makeModel({ isApproaching: false });
    const targetEl = document.createElement("div");
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const relaxedOut = h.fit.compute({
      model: model,
      shellRect: { width: 620, height: 220 },
      targetEl: targetEl,
      hostContext: hostContext
    });
    const tightOut = h.fit.compute({
      model: model,
      shellRect: { width: 180, height: 90 },
      targetEl: targetEl,
      hostContext: hostContext
    });

    const relaxedCaptionPx = extractPx(relaxedOut.metrics.remain.captionStyle);
    const tightCaptionPx = extractPx(tightOut.metrics.remain.captionStyle);
    expect(relaxedCaptionPx).toBeGreaterThan(0);
    expect(tightCaptionPx).toBeGreaterThan(0);
    expect(tightCaptionPx).toBeLessThan(relaxedCaptionPx);
  });

  it("fails closed when required compute inputs are missing", function () {
    const h = createHarness();
    const model = makeModel();
    const targetEl = document.createElement("div");

    expect(h.fit.compute({
      shellRect: { width: 320, height: 180 },
      targetEl: targetEl,
      hostContext: {}
    })).toBeNull();
    expect(h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: {}
    })).toBeNull();
    expect(h.fit.compute({
      model: model,
      shellRect: { width: 320, height: 180 },
      hostContext: {}
    })).toBeNull();
  });

  it("reuses identical fit requests and misses when semantic or geometric inputs change", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const baseModel = makeModel({ routeNameText: "Coastal Route" });
    const stableRect = { width: 320, height: 180 };

    const first = h.fit.compute({
      model: baseModel,
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const second = h.fit.compute({
      model: baseModel,
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(second).toBe(first);
    expect(hostContext.__dyniActiveRouteHtmlFitCache).toBeTruthy();

    const semanticMiss = h.fit.compute({
      model: makeModel({ routeNameText: "Ocean Crossing" }),
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(semanticMiss).not.toBe(first);

    const geometryMiss = h.fit.compute({
      model: baseModel,
      shellRect: { width: 360, height: 180 },
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(geometryMiss).not.toBe(semanticMiss);
  });

  it("uses mono value family and invalidates cache when stableDigits toggles", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const measureCtx = createMeasureContext();
    const hostContext = { __dyniActiveRouteTextMeasureCtx: measureCtx };
    const shellRect = { width: 320, height: 180 };

    const proportional = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: false }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const mono = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: true }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const monoRepeat = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: true }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(mono).not.toBe(proportional);
    expect(monoRepeat).toBe(mono);
    expect(measureCtx.calls.some((call) => call.text === "12.4" && call.font.includes("mono-serif"))).toBe(true);
    expect(measureCtx.calls.some((call) => call.text === "nm" && call.font.includes("sans-serif"))).toBe(true);
  });

  it("invalidates the top-level cache when familyMono changes under stableDigits", function () {
    const h = createHarness({
      font: {
        weight: 720,
        labelWeight: 610,
        family: "sans-serif",
        familyMono: "mono-a"
      }
    });
    const targetEl = document.createElement("div");
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };
    const model = makeModel({ stableDigitsEnabled: true });

    const first = h.fit.compute({
      model: model,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    h.themeTokens.font.familyMono = "mono-b";
    const second = h.fit.compute({
      model: model,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(second).not.toBe(first);
  });

  it("avoids cache collisions when semantic text contains delimiter characters", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };
    const modelA = makeModel({
      routeNameText: "A|B",
      remainCaption: "C"
    });
    const modelB = makeModel({
      routeNameText: "A",
      remainCaption: "B|C"
    });

    const first = h.fit.compute({
      model: modelA,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const second = h.fit.compute({
      model: modelB,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(second).not.toBe(first);

    const secondRepeat = h.fit.compute({
      model: modelB,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(secondRepeat).toBe(second);
  });

  it("switches to fallback metric value when padded stable-digits text clips", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniActiveRouteTextMeasureCtx: createMeasureContext() };
    const out = h.fit.compute({
      model: makeModel({
        stableDigitsEnabled: true,
        isApproaching: false,
        remainText: " 00012345.6",
        remainFallbackText: "12345.6",
        etaText: " 0012:34",
        etaFallbackText: "12:34"
      }),
      shellRect: { width: 20, height: 36 },
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(out.metricValues.remain).toBe("12345.6");
    expect(out.metricValues.eta).toBe("12:34");
    expect(hostContext.__dyniActiveRouteTextMeasureCtx.calls.some((call) => call.text === " 00012345.6" && call.font.includes("mono-serif"))).toBe(true);
    expect(hostContext.__dyniActiveRouteTextMeasureCtx.calls.some((call) => call.text === "nm" && call.font.includes("sans-serif"))).toBe(true);
  });
});

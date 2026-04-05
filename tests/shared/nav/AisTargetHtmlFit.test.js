const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetHtmlFit", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText(text) {
        const source = String(this.font || "");
        const match = source.match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        const safePx = Number.isFinite(px) ? px : 12;
        return { width: String(text).length * safePx * 0.56 };
      }
    };
  }

  function createRadialTextApi() {
    const api = {};
    api.setFont = vi.fn((ctx, px, weight, family) => {
      const safePx = Math.max(1, Math.floor(Number(px) || 1));
      const safeWeight = Number.isFinite(Number(weight)) ? Number(weight) : 700;
      const safeFamily = typeof family === "string" && family ? family : "sans-serif";
      ctx.font = safeWeight + " " + safePx + "px " + safeFamily;
    });
    api.fitSingleTextPx = vi.fn((ctx, text, maxPx, maxW, maxH, family, weight) => {
      const start = Math.max(1, Math.floor(Math.min(Number(maxPx) || 1, Number(maxH) || 1)));
      const safeText = String(text);
      for (let px = start; px >= 1; px -= 1) {
        api.setFont(ctx, px, weight, family);
        if (ctx.measureText(safeText).width <= maxW) {
          return px;
        }
      }
      return 1;
    });
    return api;
  }

  function createHarness() {
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const aisTargetLayoutModule = loadFresh("shared/widget-kits/nav/AisTargetLayout.js");
    const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const radialTextApi = createRadialTextApi();
    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        colors: {
          ais: {
            warning: "#f39b52",
            nearest: "#66b8ff",
            tracking: "#89d38f",
            normal: "#8da0b3"
          }
        },
        font: {
          weight: 720,
          labelWeight: 610
        }
      }))
    };

    const Helpers = {
      resolveFontFamily() {
        return "sans-serif";
      },
      resolveWidgetRoot(target) {
        return target || null;
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return { create: () => themeApi };
        }
        if (id === "RadialTextLayout") {
          return { create: () => radialTextApi };
        }
        if (id === "TextTileLayout") {
          return textTileLayoutModule;
        }
        if (id === "AisTargetLayout") {
          return aisTargetLayoutModule;
        }
        if (id === "HtmlWidgetUtils") {
          return htmlUtilsModule;
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

    const layout = aisTargetLayoutModule.create({}, Helpers);
    const fit = loadFresh("shared/widget-kits/nav/AisTargetHtmlFit.js").create({}, Helpers);
    return { fit, layout, themeApi };
  }

  function buildModel(harness, shellRect, overrides) {
    const patch = overrides || {};
    const base = {
      mode: "normal",
      renderState: "data",
      showTcpaBranch: true,
      isVerticalCommitted: false,
      effectiveLayoutHeight: shellRect.height,
      placeholderText: "No AIS",
      hasAccent: true,
      colorRole: "warning",
      nameText: "Poseidon",
      frontText: "Front",
      frontInitialText: "F",
      visibleMetricIds: ["dst", "cpa", "tcpa"],
      metrics: {
        dst: { captionText: "DST", valueText: "4.2", unitText: "nm" },
        cpa: { captionText: "DCPA", valueText: "0.7", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "0.5", unitText: "min" },
        brg: { captionText: "BRG", valueText: "112", unitText: "°" }
      }
    };
    const model = Object.assign({}, base, patch);
    const patchedMetrics = patch.metrics && typeof patch.metrics === "object" ? patch.metrics : {};
    model.metrics = Object.create(null);
    Object.keys(base.metrics).forEach((id) => {
      model.metrics[id] = Object.assign({}, base.metrics[id], patchedMetrics[id] || {});
    });
    model.layout = patch.layout || harness.layout.computeLayout({
      W: shellRect.width,
      H: shellRect.height,
      mode: model.mode,
      renderState: model.renderState,
      showTcpaBranch: model.showTcpaBranch,
      isVerticalCommitted: model.isVerticalCommitted,
      effectiveLayoutHeight: model.effectiveLayoutHeight
    });
    return model;
  }

  function extractPx(style) {
    const source = String(style || "");
    const match = source.match(/^font-size:(\d+)px;$/);
    return match ? Number(match[1]) : 0;
  }

  function expectStyleFormat(style) {
    expect(typeof style).toBe("string");
    if (style === "") {
      return;
    }
    expect(style).toMatch(/^font-size:\d+px;$/);
  }

  it("returns null when required compute inputs are missing", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const model = buildModel(h, { width: 320, height: 180 });

    expect(h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext
    })).toBeNull();

    expect(h.fit.compute({
      model: model,
      shellRect: { width: 320, height: 180 },
      hostContext: hostContext
    })).toBeNull();
  });

  it("fits placeholder mode with placeholder-only style payload", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      renderState: "placeholder",
      hasAccent: false,
      visibleMetricIds: []
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expectStyleFormat(out.placeholderStyle);
    expect(out.nameStyle).toBe("");
    expect(out.frontStyle).toBe("");
    expect(out.frontInitialStyle).toBe("");
    expect(Object.keys(out.metrics)).toEqual([]);
    expect(out.accentStyle).toBe("");
  });

  it("fits flat BRG mode with front initial + DST/BRG metric styles", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 620, height: 120 };
    const model = buildModel(h, shellRect, {
      mode: "flat",
      showTcpaBranch: false,
      colorRole: "nearest",
      visibleMetricIds: ["dst", "brg"]
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expectStyleFormat(out.frontInitialStyle);
    expect(out.nameStyle).toBe("");
    expect(out.frontStyle).toBe("");
    expect(Object.keys(out.metrics)).toEqual(["dst", "brg"]);
    expectStyleFormat(out.metrics.dst.captionStyle);
    expectStyleFormat(out.metrics.dst.valueStyle);
    expectStyleFormat(out.metrics.dst.unitStyle);
    expectStyleFormat(out.metrics.brg.captionStyle);
    expectStyleFormat(out.metrics.brg.valueStyle);
    expectStyleFormat(out.metrics.brg.unitStyle);
    expect(out.accentStyle).toBe("background-color:#66b8ff;");
  });

  it("fits normal mode name/front text and shrinks long names without truncating", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 200 };

    const shortModel = buildModel(h, shellRect, { nameText: "A" });
    const longName = "Extremely Long AIS Target Name That Must Shrink To Fit";
    const longModel = buildModel(h, shellRect, { nameText: longName });

    const shortOut = h.fit.compute({
      model: shortModel,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });
    const longOut = h.fit.compute({
      model: longModel,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expectStyleFormat(shortOut.nameStyle);
    expectStyleFormat(shortOut.frontStyle);
    expectStyleFormat(longOut.nameStyle);
    expectStyleFormat(longOut.frontStyle);
    expect(extractPx(longOut.nameStyle)).toBeLessThan(extractPx(shortOut.nameStyle));
    expect(longModel.nameText).toBe(longName);
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(targetEl);
  });

  it("keeps metric caption/unit sizes coupled below value size (~0.76x)", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 220 };
    const model = buildModel(h, shellRect, {
      mode: "high",
      showTcpaBranch: true,
      visibleMetricIds: ["dst", "cpa", "tcpa"]
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    const valuePx = extractPx(out.metrics.dst.valueStyle);
    const captionPx = extractPx(out.metrics.dst.captionStyle);
    const unitPx = extractPx(out.metrics.dst.unitStyle);
    const unitLimit = Math.max(1, Math.floor(valuePx * 0.76));

    expect(valuePx).toBeGreaterThan(0);
    expect(captionPx).toBeGreaterThan(0);
    expect(captionPx).toBeLessThanOrEqual(valuePx);
    expect(unitPx).toBeLessThanOrEqual(unitLimit);
    expect(unitPx).toBeGreaterThanOrEqual(Math.max(1, unitLimit - 1));
  });

  it("does not emit accent style when accent state is disabled", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      hasAccent: false,
      colorRole: "warning"
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expect(out.accentStyle).toBe("");
  });
});

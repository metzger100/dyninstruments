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
    api.measureTextWidth = vi.fn((ctx, text) => ctx.measureText(String(text || "")).width);
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
      requirePluginRoot(target) {
        return target || null;
      },
      getModule(id) {
        if (id === "ThemeResolver") {
          return themeApi;
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
        if (id === "TextFitMath") {
          return loadFresh("shared/widget-kits/text/TextFitMath.js");
        }
        if (id === "AisTargetLayoutGeometry") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
        }
        if (id === "AisTargetLayoutMath") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
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
      visibleMetricIds: ["dst", "cpa", "tcpa", "brg"],
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
    expect(Object.prototype.hasOwnProperty.call(out, "frontInitialStyle")).toBe(false);
    expect(Object.keys(out.metrics)).toEqual([]);
    expect(out.accentStyle).toBe("");
  });

  it("fits flat mode with styles for all four stacked metrics", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 620, height: 120 };
    const model = buildModel(h, shellRect, {
      mode: "flat",
      showTcpaBranch: false,
      colorRole: "nearest",
      visibleMetricIds: ["dst", "cpa", "tcpa", "brg"]
    });

    const out = h.fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expectStyleFormat(out.nameStyle);
    expectStyleFormat(out.frontStyle);
    expect(Object.keys(out.metrics)).toEqual(["dst", "cpa", "tcpa", "brg"]);
    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectStyleFormat(out.metrics[id].captionStyle);
      expectStyleFormat(out.metrics[id].valueRowStyle);
      expectStyleFormat(out.metrics[id].valueStyle);
      expectStyleFormat(out.metrics[id].unitStyle);
      expect(extractPx(out.metrics[id].valueStyle)).toBeGreaterThan(3);
    });
    expect(out.accentStyle).toBe("background-color:#66b8ff;");
  });

  it("fits name and status independently in normal, high, and committed vertical modes", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const normalShell = { width: 320, height: 190 };
    const highShell = { width: 180, height: 320 };
    const verticalShell = { width: 220, height: 120 };

    const normalOut = h.fit.compute({
      model: buildModel(h, normalShell, {
        mode: "normal",
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: normalShell
    });
    const highOut = h.fit.compute({
      model: buildModel(h, highShell, {
        mode: "high",
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: highShell
    });
    const verticalOut = h.fit.compute({
      model: buildModel(h, verticalShell, {
        mode: "normal",
        isVerticalCommitted: true,
        effectiveLayoutHeight: 300,
        nameText: "Extremely Long Vessel Name That Needs More Width",
        frontText: "Front"
      }),
      targetEl,
      hostContext,
      shellRect: verticalShell
    });

    expect(extractPx(normalOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(highOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(verticalOut.nameStyle)).toBeGreaterThan(0);
    expect(extractPx(normalOut.nameStyle)).not.toBe(extractPx(normalOut.frontStyle));
    expect(extractPx(highOut.nameStyle)).not.toBe(extractPx(highOut.frontStyle));
    expect(extractPx(verticalOut.nameStyle)).not.toBe(extractPx(verticalOut.frontStyle));
  });

  it("raises normal/high identity text ceilings above the prior conservative caps", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const normalShell = { width: 320, height: 190 };
    const highShell = { width: 240, height: 460 };
    const normalModel = buildModel(h, normalShell, {
      mode: "normal",
      nameText: "M",
      frontText: "AIS"
    });
    const highModel = buildModel(h, highShell, {
      mode: "high",
      nameText: "M",
      frontText: "AIS"
    });

    const normalOut = h.fit.compute({ model: normalModel, targetEl, hostContext, shellRect: normalShell });
    const highOut = h.fit.compute({ model: highModel, targetEl, hostContext, shellRect: highShell });

    expect(extractPx(normalOut.nameStyle)).toBeGreaterThan(Math.floor(normalModel.layout.nameRect.h * 0.62));
    expect(extractPx(normalOut.frontStyle)).toBeGreaterThan(Math.floor(normalModel.layout.frontRect.h * 0.72));
    expect(extractPx(highOut.nameStyle)).toBeGreaterThan(Math.floor(highModel.layout.nameRect.h * 0.56));
    expect(extractPx(highOut.frontStyle)).toBeGreaterThan(Math.floor(highModel.layout.frontRect.h * 0.74));
  });

  it("fits normal/high values against valueTextRect while flat uses stacked valueRect", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };

    const narrowModel = buildModel(h, shellRect, {
      metrics: { dst: { valueText: "12345678901234567890" } },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        placeholderRect: { x: 0, y: 0, w: 320, h: 180 },
        nameRect: { x: 0, y: 0, w: 160, h: 20 },
        frontRect: { x: 0, y: 22, w: 160, h: 20 },
        metricBoxes: {
          dst: {
            x: 0,
            y: 50,
            w: 300,
            h: 80,
            labelRect: { x: 0, y: 50, w: 70, h: 14 },
            valueRect: { x: 72, y: 50, w: 220, h: 14 },
            valueTextRect: { x: 72, y: 50, w: 20, h: 14 },
            unitRect: { x: 94, y: 50, w: 30, h: 14 }
          }
        }
      }
    });
    narrowModel.visibleMetricIds = ["dst"];

    const wideModel = buildModel(h, shellRect, {
      metrics: { dst: { valueText: "12345678901234567890" } },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        placeholderRect: { x: 0, y: 0, w: 320, h: 180 },
        nameRect: { x: 0, y: 0, w: 160, h: 20 },
        frontRect: { x: 0, y: 22, w: 160, h: 20 },
        metricBoxes: {
          dst: {
            x: 0,
            y: 50,
            w: 300,
            h: 80,
            labelRect: { x: 0, y: 50, w: 70, h: 14 },
            valueRect: { x: 72, y: 50, w: 220, h: 14 },
            valueTextRect: { x: 72, y: 50, w: 130, h: 14 },
            unitRect: { x: 204, y: 50, w: 30, h: 14 }
          }
        }
      }
    });
    wideModel.visibleMetricIds = ["dst"];

    const narrowOut = h.fit.compute({ model: narrowModel, targetEl, hostContext, shellRect });
    const wideOut = h.fit.compute({ model: wideModel, targetEl, hostContext, shellRect });

    expect(extractPx(narrowOut.metrics.dst.valueStyle)).toBeLessThan(extractPx(wideOut.metrics.dst.valueStyle));
    expect(extractPx(narrowOut.metrics.dst.valueStyle)).toBeGreaterThan(0);
    expectStyleFormat(narrowOut.metrics.dst.valueRowStyle);
    expectStyleFormat(wideOut.metrics.dst.valueRowStyle);
  });

  it("keeps representative normal/high shells above microscopic sizing", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };

    const normalShell = { width: 300, height: 190 };
    const highShell = { width: 180, height: 320 };
    const normalModel = buildModel(h, normalShell, {
      mode: "normal",
      metrics: {
        dst: { valueText: "123.456" },
        cpa: { valueText: "98.76" },
        tcpa: { valueText: "123.4" },
        brg: { valueText: "359.9" }
      }
    });
    const highModel = buildModel(h, highShell, {
      mode: "high",
      metrics: {
        dst: { valueText: "123.456" },
        cpa: { valueText: "98.76" },
        tcpa: { valueText: "123.4" },
        brg: { valueText: "359.9" }
      }
    });

    const normalOut = h.fit.compute({ model: normalModel, targetEl, hostContext, shellRect: normalShell });
    const highOut = h.fit.compute({ model: highModel, targetEl, hostContext, shellRect: highShell });

    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectStyleFormat(normalOut.metrics[id].valueRowStyle);
      expectStyleFormat(highOut.metrics[id].valueRowStyle);
      expect(extractPx(normalOut.metrics[id].valueStyle)).toBeGreaterThan(3);
      expect(extractPx(highOut.metrics[id].valueStyle)).toBeGreaterThan(3);
      expect(extractPx(normalOut.metrics[id].captionStyle)).toBeLessThanOrEqual(extractPx(normalOut.metrics[id].valueStyle));
      expect(extractPx(highOut.metrics[id].captionStyle)).toBeLessThanOrEqual(extractPx(highOut.metrics[id].valueStyle));
    });
  });

  it("keeps DCPA/TCPA label and value text measurable in normal mode", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 280, height: 180 };
    const model = buildModel(h, shellRect, {
      mode: "normal",
      metrics: {
        cpa: { captionText: "DCPA", valueText: "12.345", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "123.45", unitText: "min" }
      }
    });
    const out = h.fit.compute({ model: model, targetEl, hostContext, shellRect });

    expect(extractPx(out.metrics.cpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.cpa.valueStyle)).toBeGreaterThanOrEqual(extractPx(out.metrics.cpa.captionStyle));
    expect(extractPx(out.metrics.tcpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.tcpa.valueStyle)).toBeGreaterThanOrEqual(extractPx(out.metrics.tcpa.captionStyle));
  });

  it("keeps caption/unit under the 0.8 secondary ratio while fitting each side independently", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 180 };
    const model = buildModel(h, shellRect, {
      mode: "normal",
      metrics: {
        dst: {
          captionText: "VERYLONGCAPTION",
          valueText: "123.45",
          unitText: "nm"
        }
      },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        placeholderRect: { x: 0, y: 0, w: 320, h: 180 },
        nameRect: { x: 0, y: 0, w: 160, h: 20 },
        frontRect: { x: 0, y: 22, w: 160, h: 20 },
        metricBoxes: {
          dst: {
            x: 0,
            y: 50,
            w: 300,
            h: 80,
            labelRect: { x: 0, y: 50, w: 36, h: 20 },
            valueRect: { x: 38, y: 50, w: 170, h: 20 },
            valueTextRect: { x: 38, y: 50, w: 118, h: 20 },
            unitRect: { x: 158, y: 50, w: 50, h: 20 }
          }
        }
      }
    });
    model.visibleMetricIds = ["dst"];

    const out = h.fit.compute({ model: model, targetEl, hostContext, shellRect });
    const valuePx = extractPx(out.metrics.dst.valueStyle);
    const captionPx = extractPx(out.metrics.dst.captionStyle);
    const unitPx = extractPx(out.metrics.dst.unitStyle);
    const secondaryMaxPx = Math.max(1, Math.floor(valuePx * 0.8));

    expect(valuePx).toBeGreaterThan(0);
    expect(captionPx).toBeGreaterThan(0);
    expect(unitPx).toBeGreaterThan(0);
    expect(captionPx).toBeLessThan(unitPx);
    expect(captionPx).toBeLessThanOrEqual(secondaryMaxPx);
    expect(unitPx).toBeLessThanOrEqual(secondaryMaxPx);
  });

  it("shrinks long name and long metric values instead of clipping", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 320, height: 220 };

    const shortModel = buildModel(h, shellRect, { nameText: "A", metrics: { dst: { valueText: "1.0" } } });
    const longModel = buildModel(h, shellRect, {
      nameText: "Extremely Long AIS Target Name That Must Shrink To Fit",
      metrics: { dst: { valueText: "12345678901234567890" } }
    });

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

    expect(extractPx(longOut.nameStyle)).toBeLessThan(extractPx(shortOut.nameStyle));
    expect(extractPx(longOut.metrics.dst.valueStyle)).toBeLessThanOrEqual(extractPx(shortOut.metrics.dst.valueStyle));
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(targetEl);
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

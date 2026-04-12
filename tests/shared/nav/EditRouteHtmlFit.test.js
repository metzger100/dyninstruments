const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteHtmlFit", function () {
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

  function buildModel(overrides) {
    const patch = overrides || {};
    const base = {
      mode: "normal",
      hasRoute: true,
      isLocalRoute: true,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8,
      nameText: "Harbor Loop",
      sourceBadgeText: "LOCAL",
      metrics: {
        pts: { labelText: "PTS:", valueText: "005", unitText: "" },
        dst: { labelText: "DST:", valueText: "12.3", unitText: "nm" },
        rte: { labelText: "RTE:", valueText: "4.9", unitText: "nm" },
        eta: { labelText: "ETA:", valueText: "12:34", unitText: "" }
      }
    };

    const out = Object.assign({}, base, patch);
    const patchedMetrics = patch.metrics && typeof patch.metrics === "object" ? patch.metrics : {};
    out.metrics = Object.create(null);
    Object.keys(base.metrics).forEach((id) => {
      out.metrics[id] = Object.assign({}, base.metrics[id], patchedMetrics[id] || {});
    });
    return out;
  }

  function createHarness() {
    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const responsiveScaleProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMathModule = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    const editRouteLayoutMathModule = loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js");
    const editRouteLayoutGeometryModule = loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js");
    const editRouteLayoutModule = loadFresh("shared/widget-kits/nav/EditRouteLayout.js");
    const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const radialTextApi = createRadialTextApi();
    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        font: {
          weight: 720,
          labelWeight: 610
        }
      }))
    };
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniEditRouteTextMeasureCtx: createMeasureContext()
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
        if (id === "EditRouteLayout") {
          return editRouteLayoutModule;
        }
        if (id === "EditRouteLayoutMath") {
          return editRouteLayoutMathModule;
        }
        if (id === "EditRouteLayoutGeometry") {
          return editRouteLayoutGeometryModule;
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
        throw new Error("unexpected module: " + id);
      }
    };
    const fit = loadFresh("shared/widget-kits/nav/EditRouteHtmlFit.js").create({}, Helpers);
    return { fit, targetEl, hostContext, themeApi };
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

  it("returns stable style payloads for all visible boxes per mode", function () {
    const h = createHarness();
    const expectedMetricsByMode = {
      flat: ["pts", "dst", "rte", "eta"],
      normal: ["pts", "dst", "rte", "eta"],
      high: ["pts", "dst", "rte", "eta"]
    };

    ["flat", "normal", "high"].forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({ mode: mode }),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 340, height: 190 }
      });

      expect(out).not.toBeNull();
      expectStyleFormat(out.nameTextStyle);
      expectStyleFormat(out.sourceBadgeStyle);
      expect(Object.keys(out.metrics)).toEqual(expectedMetricsByMode[mode]);
      expectedMetricsByMode[mode].forEach((id) => {
        expectStyleFormat(out.metrics[id].labelStyle);
        expectStyleFormat(out.metrics[id].valueRowStyle);
        expectStyleFormat(out.metrics[id].valueStyle);
        expectStyleFormat(out.metrics[id].unitStyle);
      });
    });
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
  });

  it("handles missing shellRect or target element without throwing", function () {
    const h = createHarness();
    const model = buildModel();

    expect(h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext
    })).toBeNull();

    expect(h.fit.compute({
      model: model,
      shellRect: { width: 260, height: 170 },
      hostContext: h.hostContext
    })).toBeNull();
  });

  it("scales down long route names instead of truncating content", function () {
    const h = createHarness();
    const shortModel = buildModel({ nameText: "A" });
    const longName = "Extremely Long Route Name That Must Be Reduced To Fit The Name Bar";
    const longModel = buildModel({ nameText: longName });

    const shortOut = h.fit.compute({
      model: shortModel,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longOut = h.fit.compute({
      model: longModel,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(extractPx(longOut.nameTextStyle)).toBeLessThan(extractPx(shortOut.nameTextStyle));
    expect(longModel.nameText).toBe(longName);
  });

  it("fits source badge text using its own measurement box", function () {
    const h = createHarness();
    const shortBadge = h.fit.compute({
      model: buildModel({ sourceBadgeText: "L" }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longBadge = h.fit.compute({
      model: buildModel({ sourceBadgeText: "LOCAL-ROUTE-SOURCE-BADGE" }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(extractPx(longBadge.sourceBadgeStyle)).toBeLessThan(extractPx(shortBadge.sourceBadgeStyle));
  });

  it("keeps caption and unit font sizes tied to value font size (~0.8x)", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "high",
        metrics: {
          dst: {
            labelText: "DST:",
            valueText: "12.3",
            unitText: "nm"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 260 }
    });

    const valuePx = extractPx(out.metrics.dst.valueStyle);
    const labelPx = extractPx(out.metrics.dst.labelStyle);
    const unitPx = extractPx(out.metrics.dst.unitStyle);
    const expectedSecondary = Math.max(1, Math.floor(valuePx * 0.8));

    expect(valuePx).toBeGreaterThan(0);
    expect(labelPx).toBeLessThanOrEqual(expectedSecondary);
    expect(labelPx).toBeGreaterThanOrEqual(Math.max(1, expectedSecondary - 1));
    expect(unitPx).toBeLessThanOrEqual(expectedSecondary);
    expect(unitPx).toBeGreaterThanOrEqual(Math.max(1, expectedSecondary - 1));
  });

  it("shrinks long caption/unit text safely while keeping value fit intact", function () {
    const h = createHarness();
    const shortOut = h.fit.compute({
      model: buildModel({
        metrics: {
          dst: { labelText: "DST:", unitText: "nm", valueText: "12.3" }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });
    const longOut = h.fit.compute({
      model: buildModel({
        metrics: {
          dst: {
            labelText: "REMAINING-DISTANCE-LABEL:",
            valueText: "12.3",
            unitText: "nautical-miles-long-unit"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    const longValuePx = extractPx(longOut.metrics.dst.valueStyle);
    const longTargetSecondary = Math.max(1, Math.floor(longValuePx * 0.8));
    expect(extractPx(longOut.metrics.dst.labelStyle)).toBeLessThanOrEqual(longTargetSecondary);
    expect(extractPx(longOut.metrics.dst.unitStyle)).toBeLessThan(extractPx(shortOut.metrics.dst.unitStyle));
    expect(extractPx(longOut.metrics.dst.unitStyle)).toBeLessThanOrEqual(longTargetSecondary);
    expect(extractPx(longOut.metrics.dst.valueStyle)).toBeGreaterThan(0);
  });

  it("uses full value width for ETA/PTS when no unit exists", function () {
    const h = createHarness();
    ["normal", "high"].forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({
          mode: mode,
          metrics: {
            pts: { labelText: "PTS:", valueText: "123456789012" },
            dst: { labelText: "DST:", valueText: "123456789012", unitText: "nm" },
            rte: { labelText: "RTE:", valueText: "123456789012", unitText: "nm" },
            eta: { labelText: "ETA:", valueText: "123456789012" }
          }
        }),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 320, height: 210 }
      });

      expect(extractPx(out.metrics.eta.valueStyle)).toBeGreaterThan(extractPx(out.metrics.dst.valueStyle));
      expect(extractPx(out.metrics.pts.valueStyle)).toBeGreaterThan(extractPx(out.metrics.rte.valueStyle));
      expect(out.metrics.eta.unitStyle).toBe("");
      expect(out.metrics.pts.unitStyle).toBe("");
    });
  });

  it("computes only name fit in no-route state", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        hasRoute: false,
        isLocalRoute: false,
        sourceBadgeText: "LOCAL"
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(out).not.toBeNull();
    expectStyleFormat(out.nameTextStyle);
    expect(out.sourceBadgeStyle).toBe("");
    expect(Object.keys(out.metrics)).toEqual([]);
  });
});

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
        pts: { labelText: "PTS:", valueText: "005" },
        dst: { labelText: "DST:", valueText: "12.3nm" },
        rtg: { labelText: "RTG:", valueText: "4.9nm" },
        eta: { labelText: "ETA:", valueText: "12:34" }
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
        if (id === "EditRouteLayout") {
          return editRouteLayoutModule;
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
      flat: ["pts", "dst"],
      normal: ["pts", "dst", "rtg", "eta"],
      high: ["pts", "dst", "rtg", "eta"]
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
        expectStyleFormat(out.metrics[id].valueStyle);
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

  it("fits metric labels and values independently per metric box", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        metrics: {
          pts: {
            labelText: "POINTS-LABEL-THAT-IS-LONG",
            valueText: "1"
          }
        }
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 190 }
    });

    expect(extractPx(out.metrics.pts.labelStyle)).toBeLessThan(extractPx(out.metrics.pts.valueStyle));
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

const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteHtmlFit", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      /** @param {any} text */
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
    api.measureValueUnitFit = vi.fn(
      (ctx, family, value, unit, w, h, secScale, valueWeight, labelWeight, textOptions) => {
        const maxH = Math.max(0.5, Number(h) || 0.5);
        const maxW = Math.max(0, Number(w) || 0);
        const ratio = Number(secScale);
        const scale = Number.isFinite(ratio) ? ratio : 0.8;
        const opts = textOptions && typeof textOptions === "object" ? textOptions : null;
        const valueFamily = opts && opts.useMono === true ? opts.monoFamily || family : family;

        if (maxW <= 0 || !value) {
          return { vPx: 0.5, uPx: unit ? 0.5 : 0, gap: 0, total: 0 };
        }

        /** @param {any} vPx @param {any} uPx @param {any} gap */
        function totalWidth(vPx, uPx, gap) {
          api.setFont(ctx, vPx, valueWeight, valueFamily);
          let total = api.measureTextWidth(ctx, String(value || ""));
          if (unit) {
            api.setFont(ctx, uPx, labelWeight, family);
            total += gap + api.measureTextWidth(ctx, String(unit || ""));
          }
          return total;
        }

        let vPx = maxH;
        let uPx = unit ? Math.max(0.5, Math.min(maxH, vPx * scale)) : 0;
        let gap = unit ? Math.max(0.5, vPx * 0.25) : 0;
        let total = totalWidth(vPx, uPx, gap);

        if (total > maxW) {
          const ratio1 = Math.max(0.01, maxW / Math.max(0.01, total));
          vPx = Math.max(0.5, vPx * ratio1);
          uPx = unit ? Math.max(0.5, Math.min(maxH, uPx * ratio1)) : 0;
          gap = unit ? Math.max(0.5, gap * ratio1) : 0;
          total = totalWidth(vPx, uPx, gap);
        }

        if (total > maxW) {
          const ratio2 = Math.max(0.01, maxW / Math.max(0.01, total));
          vPx = Math.max(0.5, vPx * ratio2);
          uPx = unit ? Math.max(0.5, Math.min(maxH, uPx * ratio2)) : 0;
          gap = unit ? Math.max(0.5, gap * ratio2) : 0;
          total = totalWidth(vPx, uPx, gap);
        }

        return { vPx, uPx, gap, total };
      }
    );
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

  /** @param {Record<string, any>} [overrides] */
  function buildModel(overrides) {
    const patch = overrides || {};
    const base = {
      mode: "normal",
      hasRoute: true,
      isLocalRoute: true,
      stableDigitsEnabled: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8,
      nameText: "Harbor Loop",
      sourceBadgeText: "LOCAL",
      metrics: {
        pts: {
          labelText: "PTS:",
          valueText: "005",
          plainValueText: "005",
          unitText: ""
        },
        dst: {
          labelText: "DST:",
          valueText: "12.3",
          plainValueText: "12.3",
          unitText: "nm"
        },
        rte: {
          labelText: "RTE:",
          valueText: "4.9",
          plainValueText: "4.9",
          unitText: "nm"
        },
        rteEta: {
          labelText: "ETA:",
          valueText: "12:34",
          plainValueText: "12:34",
          unitText: ""
        }
      }
    };

    const out = Object.assign({}, base, patch);
    const patchedMetrics = patch.metrics && typeof patch.metrics === "object" ? patch.metrics : {};
    out.metrics = Object.create(null);
    Object.keys(base.metrics).forEach((id) => {
      const key = /** @type {keyof typeof base.metrics} */ (id);
      out.metrics[key] = Object.assign({}, base.metrics[key], patchedMetrics[id] || {});
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
    const editRouteHtmlFitSupportModule = loadFresh("shared/widget-kits/nav/EditRouteHtmlFitSupport.js");
    const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const textTileLayout = textTileLayoutModule.create();
    const textTileLayoutSpy = Object.assign({}, textTileLayout, {
      measureMetricTile: vi.fn(textTileLayout.measureMetricTile)
    });
    const radialTextApi = createRadialTextApi();
    const themeTokens = {
      font: {
        weight: 720,
        labelWeight: 610
      }
    };
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens)
    };
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniEditRouteTextMeasureCtx: createMeasureContext()
    };

    const componentContext = createComponentContextMock({
      modules: {
        CanvasTextLayout: { create: () => radialTextApi },
        TextTileLayout: {
          create() {
            return textTileLayoutSpy;
          }
        },
        EditRouteLayout: editRouteLayoutModule,
        EditRouteHtmlFitSupport: editRouteHtmlFitSupportModule,
        EditRouteLayoutMath: editRouteLayoutMathModule,
        EditRouteLayoutGeometry: editRouteLayoutGeometryModule,
        HtmlWidgetUtils: htmlUtilsModule,
        ResponsiveScaleProfile: responsiveScaleProfileModule,
        LayoutRectMath: layoutRectMathModule,
        TextFitMath: loadFresh("shared/widget-kits/text/TextFitMath.js")
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
    const fit = loadFresh("shared/widget-kits/nav/EditRouteHtmlFit.js").create({}, componentContext);
    return { fit, targetEl, hostContext, themeApi, textTileLayoutSpy };
  }

  /** @param {any} style */
  function extractPx(style) {
    const source = String(style || "");
    const match = source.match(new RegExp("^font-size:(\\d+)px\\x3b$"));
    return match ? Number(match[1]) : 0;
  }

  /** @param {any} style */
  function expectStyleFormat(style) {
    expect(typeof style).toBe("string");
    if (style === "") {
      return;
    }
    expect(style).toMatch(new RegExp("^font-size:\\d+px\\x3b$"));
  }

  it("returns stable style payloads for all visible boxes per mode", function () {
    const h = createHarness();
    const expectedMetricsByMode = {
      flat: ["pts", "dst", "rte", "rteEta"],
      normal: ["pts", "dst", "rte", "rteEta"],
      high: ["pts", "dst", "rte", "rteEta"]
    };

    ["flat", "normal", "high"].forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({ mode: mode }),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 340, height: 190 }
      });
      const expectedIds = expectedMetricsByMode[/** @type {keyof typeof expectedMetricsByMode} */ (mode)];

      expect(out).not.toBeNull();
      expectStyleFormat(out.nameTextStyle);
      expectStyleFormat(out.sourceBadgeStyle);
      expect(Object.keys(out.metrics)).toEqual(expectedIds);
      expectedIds.forEach((/** @type {any} */ id) => {
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

    expect(
      h.fit.compute({
        model: model,
        targetEl: h.targetEl,
        hostContext: h.hostContext
      })
    ).toBeNull();

    expect(
      h.fit.compute({
        model: model,
        shellRect: { width: 260, height: 170 },
        hostContext: h.hostContext
      })
    ).toBeNull();
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
});

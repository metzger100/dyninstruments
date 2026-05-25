const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

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
      },
    };
  }

  function createRadialTextApi() {
    const api = {};
    api.setFont = vi.fn((ctx, px, weight, family) => {
      const safePx = Math.max(1, Math.floor(Number(px) || 1));
      const safeWeight = Number.isFinite(Number(weight)) ? Number(weight) : 700;
      const safeFamily =
        typeof family === "string" && family ? family : "sans-serif";
      ctx.font = safeWeight + " " + safePx + "px " + safeFamily;
    });
    api.measureTextWidth = vi.fn(
      (ctx, text) => ctx.measureText(String(text || "")).width,
    );
    api.fitSingleTextPx = vi.fn(
      (ctx, text, maxPx, maxW, maxH, family, weight) => {
        const start = Math.max(
          1,
          Math.floor(Math.min(Number(maxPx) || 1, Number(maxH) || 1)),
        );
        const safeText = String(text);
        for (let px = start; px >= 1; px -= 1) {
          api.setFont(ctx, px, weight, family);
          if (ctx.measureText(safeText).width <= maxW) {
            return px;
          }
        }
        return 1;
      },
    );
    return api;
  }

  function createHarness() {
    const htmlUtilsModule = loadFresh(
      "shared/widget-kits/html/HtmlWidgetUtils.js",
    );
    const responsiveScaleProfileModule = loadFresh(
      "shared/widget-kits/layout/ResponsiveScaleProfile.js",
    );
    const layoutRectMathModule = loadFresh(
      "shared/widget-kits/layout/LayoutRectMath.js",
    );
    const aisTargetLayoutModule = loadFresh(
      "shared/widget-kits/nav/AisTargetLayout.js",
    );
    const textTileLayoutModule = loadFresh(
      "shared/widget-kits/text/TextTileLayout.js",
    );
    const radialTextApi = createRadialTextApi();
    const themeTokens = {
      colors: {
        ais: {
          warning: "#FA584A",
          nearest: "#70F3AF",
          tracking: "#f8a601",
          normal: "#EBEB55",
        },
      },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 720,
        labelWeight: 610,
      },
    };
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens),
    };

    const componentContext = createComponentContextMock({
      modules: {
        CanvasTextLayout: { create: () => radialTextApi },
        TextTileLayout: textTileLayoutModule,
        AisTargetLayout: aisTargetLayoutModule,
        AisTargetLayoutSizing: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutSizing.js",
        ),
        HtmlWidgetUtils: htmlUtilsModule,
        ResponsiveScaleProfile: responsiveScaleProfileModule,
        LayoutRectMath: layoutRectMathModule,
        TextFitMath: loadFresh("shared/widget-kits/text/TextFitMath.js"),
        AisTargetLayoutGeometry: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
        ),
        AisTargetLayoutMath: loadFresh(
          "shared/widget-kits/nav/AisTargetLayoutMath.js",
        ),
      },
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot,
        },
        dom: {
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          },
        },
      },
    });

    const layout = aisTargetLayoutModule.create({}, componentContext);
    const fit = loadFresh("shared/widget-kits/nav/AisTargetHtmlFit.js").create(
      {},
      componentContext,
    );
    return { fit, layout, themeApi, radialTextApi };
  }

  function buildModel(harness, shellRect, overrides) {
    const patch = overrides || {};
    const base = {
      mode: "normal",
      kind: "data",
      showTcpaBranch: true,
      isVerticalCommitted: false,
      effectiveLayoutHeight: shellRect.height,
      stateLabel: "",
      hasAccent: true,
      colorRole: "warning",
      nameText: "Poseidon",
      frontText: "Front",
      visibleMetricIds: ["dst", "cpa", "tcpa", "brg"],
      metrics: {
        dst: { captionText: "DST", valueText: "4.2", unitText: "nm" },
        cpa: { captionText: "DCPA", valueText: "0.7", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "0.5", unitText: "min" },
        brg: { captionText: "BRG", valueText: "112", unitText: "°" },
      },
    };
    const model = Object.assign({}, base, patch);
    const patchedMetrics =
      patch.metrics && typeof patch.metrics === "object" ? patch.metrics : {};
    model.metrics = Object.create(null);
    Object.keys(base.metrics).forEach((id) => {
      model.metrics[id] = Object.assign(
        {},
        base.metrics[id],
        patchedMetrics[id] || {},
      );
    });
    model.layout =
      patch.layout ||
      harness.layout.computeLayout({
        W: shellRect.width,
        H: shellRect.height,
        mode: model.mode,
        renderState: model.kind === "data" ? "data" : "placeholder",
        showTcpaBranch: model.showTcpaBranch,
        isVerticalCommitted: model.isVerticalCommitted,
        effectiveLayoutHeight: model.effectiveLayoutHeight,
      });
    return model;
  }

  function extractPx(style) {
    const source = String(style || "");
    const match = source.match(new RegExp("^font-size:(\\d+)px\\x3b$"));
    return match ? Number(match[1]) : 0;
  }

  function expectStyleFormat(style) {
    expect(typeof style).toBe("string");
    if (style === "") {
      return;
    }
    expect(style).toMatch(new RegExp("^font-size:\\d+px\\x3b$"));
  }

  it("keeps DCPA/TCPA label and value text measurable in normal mode", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniAisTargetTextMeasureCtx: createMeasureContext(),
    };
    const shellRect = { width: 280, height: 180 };
    const model = buildModel(h, shellRect, {
      mode: "normal",
      metrics: {
        cpa: { captionText: "DCPA", valueText: "12.345", unitText: "nm" },
        tcpa: { captionText: "TCPA", valueText: "123.45", unitText: "min" },
      },
    });
    const out = h.fit.compute({
      model: model,
      targetEl,
      hostContext,
      shellRect,
    });

    expect(extractPx(out.metrics.cpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.cpa.valueStyle)).toBeGreaterThanOrEqual(
      extractPx(out.metrics.cpa.captionStyle),
    );
    expect(extractPx(out.metrics.tcpa.captionStyle)).toBeGreaterThan(0);
    expect(extractPx(out.metrics.tcpa.valueStyle)).toBeGreaterThanOrEqual(
      extractPx(out.metrics.tcpa.captionStyle),
    );
  });

});

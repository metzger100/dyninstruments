const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetHtmlFit fallback selection", function () {
  function createMeasureContext() {
    return {
      font: "700 12px sans-serif",
      measureText(text) {
        const match = String(this.font || "").match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        return { width: String(text).length * (Number.isFinite(px) ? px : 12) * 0.56 };
      }
    };
  }

  function createRadialTextApi() {
    const api = {
      setFont: vi.fn((ctx, px, weight, family) => {
        const safePx = Math.max(1, Math.floor(Number(px) || 1));
        ctx.font = (Number.isFinite(Number(weight)) ? Number(weight) : 700) + " " + safePx + "px " + (family || "sans-serif");
      }),
      measureTextWidth: vi.fn((ctx, text) => ctx.measureText(String(text || "")).width),
      fitSingleTextPx: vi.fn((ctx, text, maxPx, maxW, maxH, family, weight) => {
        const start = Math.max(1, Math.floor(Math.min(Number(maxPx) || 1, Number(maxH) || 1)));
        for (let px = start; px >= 1; px -= 1) {
          api.setFont(ctx, px, weight, family);
          if (ctx.measureText(String(text || "")).width <= maxW) return px;
        }
        return 1;
      })
    };
    return api;
  }

  function createHarness() {
    const htmlUtils = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const textTileLayout = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const radialTextApi = createRadialTextApi();
    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        font: { family: "sans-serif", familyMono: "monospace", weight: 720, labelWeight: 610 }
      }))
    };
    const Helpers = {
      requirePluginRoot(target) { return target || null; },
      getModule(id) {
        if (id === "ThemeResolver") return themeApi;
        if (id === "RadialTextLayout") return { create: () => radialTextApi };
        if (id === "TextTileLayout") return textTileLayout;
        if (id === "AisTargetLayout") return { create() { return {}; } };
        if (id === "HtmlWidgetUtils") return htmlUtils;
        if (id === "TextLayoutPrimitives") return loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js");
        if (id === "TextLayoutComposite") return loadFresh("shared/widget-kits/text/TextLayoutComposite.js");
        if (id === "ResponsiveScaleProfile") return loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
        if (id === "LayoutRectMath") return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        if (id === "TextFitMath") return loadFresh("shared/widget-kits/text/TextFitMath.js");
        if (id === "AisTargetLayoutGeometry") return loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
        if (id === "AisTargetLayoutMath") return loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
        throw new Error("unexpected module: " + id);
      }
    };
    return loadFresh("shared/widget-kits/nav/AisTargetHtmlFit.js").create({}, Helpers);
  }

  it("chooses fallbackValueText when the padded metric text is tighter", function () {
    const fit = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = { __dyniAisTargetTextMeasureCtx: createMeasureContext() };
    const shellRect = { width: 180, height: 120 };
    const model = {
      mode: "normal",
      kind: "data",
      showTcpaBranch: false,
      isVerticalCommitted: false,
      effectiveLayoutHeight: shellRect.height,
      nameText: "Poseidon",
      frontText: "Front",
      visibleMetricIds: ["dst"],
      metrics: {
        dst: { captionText: "DST", valueText: "04.2", fallbackValueText: "4.2", unitText: "nm" }
      },
      layout: {
        mode: "normal",
        responsive: { textFillScale: 1 },
        nameRect: { x: 0, y: 0, w: 90, h: 18 },
        frontRect: { x: 0, y: 20, w: 90, h: 18 },
        metricBoxes: {
          dst: {
            labelRect: { x: 0, y: 46, w: 40, h: 12 },
            valueRect: { x: 42, y: 46, w: 2, h: 12 },
            valueTextRect: { x: 42, y: 46, w: 2, h: 12 },
            unitRect: { x: 46, y: 46, w: 2, h: 12 }
          }
        }
      }
    };

    const out = fit.compute({
      model: model,
      targetEl: targetEl,
      hostContext: hostContext,
      shellRect: shellRect
    });

    expect(out.metrics.dst.valueText).toBe("4.2");
    expect(out.metrics.dst.valueStyle).toMatch(/^font-size:\d+px;$/);
  });
});

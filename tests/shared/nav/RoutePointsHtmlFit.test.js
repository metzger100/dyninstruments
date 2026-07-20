const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RoutePointsHtmlFit", function () {
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
    const routePointsLayoutSizingModule = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    const routePointsLayoutModule = loadFresh("shared/widget-kits/nav/RoutePointsLayout.js");
    const textTileLayoutModule = loadFresh("shared/widget-kits/text/TextTileLayout.js");
    const radialTextApi = createRadialTextApi();
    const themeTokens = {
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 720,
        labelWeight: 610
      }
    };
    const themeApi = {
      resolveForRoot: vi.fn(() => themeTokens)
    };
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniRoutePointsTextMeasureCtx: createMeasureContext()
    };

    const componentContext = createComponentContextMock({
      modules: {
        CanvasTextLayout: { create: () => radialTextApi },
        TextTileLayout: textTileLayoutModule,
        RoutePointsLayout: routePointsLayoutModule,
        RoutePointsInfoText: loadFresh("shared/widget-kits/nav/RoutePointsInfoText.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        HtmlWidgetUtils: htmlUtilsModule,
        ResponsiveScaleProfile: responsiveScaleProfileModule,
        LayoutRectMath: layoutRectMathModule,
        RoutePointsLayoutSizing: routePointsLayoutSizingModule,
        RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js")
      },
      services: {
        themeTokens: {
          resolveForRoot: themeApi.resolveForRoot
        },
        dom: {
          /** @param {any} target */
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          }
        }
      }
    });
    const fit = loadFresh("shared/widget-kits/nav/RoutePointsHtmlFit.js").create({}, componentContext);
    const layout = routePointsLayoutModule.create({}, componentContext);
    return { fit, layout, targetEl, hostContext, themeApi, radialTextApi };
  }

  /** @param {any} [overrides] */
  function buildModel(overrides) {
    const base = {
      mode: "normal",
      showHeader: true,
      hasRoute: true,
      routeNameText: "Harbor Run",
      emptyText: "",
      metaText: "2 waypoints",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.5,
      points: [
        {
          ordinalText: "1",
          nameText: "Start",
          infoText: "54.102 N / 10.400 E"
        },
        { ordinalText: "2", nameText: "Finish", infoText: "081°/1.2nm" }
      ]
    };
    return Object.assign({}, base, overrides || {});
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

  it("produces header and row style strings", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel(),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(out).not.toBeNull();
    expect(out.headerFit).not.toBeNull();
    expectStyleFormat(out.headerFit.routeNameStyle);
    expectStyleFormat(out.headerFit.metaStyle);
    expect(out.emptyStyle).toBe("");
    expect(out.rowFits).toHaveLength(2);
    out.rowFits.forEach((/** @type {any} */ row) => {
      expectStyleFormat(row.ordinalStyle);
      expectStyleFormat(row.nameStyle);
      expectStyleFormat(row.infoStyle);
    });
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
  });

  it("returns null when shellRect or targetEl is missing", function () {
    const h = createHarness();
    const model = buildModel();

    expect(
      h.fit.compute({
        model: model,
        hostContext: h.hostContext,
        targetEl: h.targetEl
      })
    ).toBeNull();

    expect(
      h.fit.compute({
        model: model,
        hostContext: h.hostContext,
        shellRect: { width: 240, height: 160 }
      })
    ).toBeNull();
  });

  it("returns null headerFit when showHeader is false", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({ showHeader: false }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 280, height: 180 }
    });

    expect(out.headerFit).toBeNull();
    expect(out.rowFits).toHaveLength(2);
  });

  it("reflects mode-specific box proportions in fitted row text sizes", function () {
    const h = createHarness();
    const row = [{ ordinalText: "1", nameText: "A", infoText: "B" }];
    const high = h.fit.compute({
      model: buildModel({ mode: "high", points: row }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });
    const normal = h.fit.compute({
      model: buildModel({ mode: "normal", points: row }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(extractPx(high.rowFits[0].nameStyle)).toBeLessThan(extractPx(normal.rowFits[0].nameStyle));
  });

  it("keeps name/info text fitting active when compact high rows hide ordinal", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({
        mode: "high",
        points: [{ ordinalText: "1", nameText: "Alpha", infoText: "089°/12.3nm" }]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 240, height: 360 }
    });

    expect(out.rowFits).toHaveLength(1);
    expect(out.rowFits[0].ordinalStyle).toBe("");
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
  });
});

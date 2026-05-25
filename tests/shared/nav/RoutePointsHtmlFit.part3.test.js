const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("RoutePointsHtmlFit", function () {
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
    const routePointsLayoutSizingModule = loadFresh(
      "shared/widget-kits/nav/RoutePointsLayoutSizing.js",
    );
    const routePointsLayoutModule = loadFresh(
      "shared/widget-kits/nav/RoutePointsLayout.js",
    );
    const textTileLayoutModule = loadFresh(
      "shared/widget-kits/text/TextTileLayout.js",
    );
    const radialTextApi = createRadialTextApi();
    const themeTokens = {
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
    const targetEl = document.createElement("div");
    const hostContext = {
      __dyniRoutePointsTextMeasureCtx: createMeasureContext(),
    };

    const componentContext = createComponentContextMock({
      modules: {
        CanvasTextLayout: { create: () => radialTextApi },
        TextTileLayout: textTileLayoutModule,
        RoutePointsLayout: routePointsLayoutModule,
        RoutePointsInfoText: loadFresh(
          "shared/widget-kits/nav/RoutePointsInfoText.js",
        ),
        UnitAwareFormatter: loadFresh(
          "shared/widget-kits/format/UnitAwareFormatter.js",
        ),
        PlaceholderNormalize: loadFresh(
          "shared/widget-kits/format/PlaceholderNormalize.js",
        ),
        HtmlWidgetUtils: htmlUtilsModule,
        ResponsiveScaleProfile: responsiveScaleProfileModule,
        LayoutRectMath: layoutRectMathModule,
        RoutePointsLayoutSizing: routePointsLayoutSizingModule,
        RoutePointsRowGeometry: loadFresh(
          "shared/widget-kits/nav/RoutePointsRowGeometry.js",
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
    const fit = loadFresh(
      "shared/widget-kits/nav/RoutePointsHtmlFit.js",
    ).create({}, componentContext);
    const layout = routePointsLayoutModule.create({}, componentContext);
    return { fit, layout, targetEl, hostContext, themeApi, radialTextApi };
  }

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
          infoText: "54.102 N / 10.400 E",
        },
        { ordinalText: "2", nameText: "Finish", infoText: "081°/1.2nm" },
      ],
    };
    return Object.assign({}, base, overrides || {});
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

  function resolveEmptyCapRatio(mode) {
    if (mode === "flat") {
      return 0.5;
    }
    if (mode === "high") {
      return 0.56;
    }
    return 0.66;
  }

  it("uses full available box height for short text that already fits", function () {
    const h = createHarness();
    const model = buildModel({
      mode: "normal",
      points: [{ ordinalText: "1", nameText: "A", infoText: "B" }],
    });
    const shellRect = { width: 300, height: 180 };
    const fitOut = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect,
    });
    const insets = h.layout.computeInsets(shellRect.width, shellRect.height);
    const contentRect = h.layout.createContentRect(
      shellRect.width,
      shellRect.height,
      insets,
    );
    const layoutOut = h.layout.computeLayout({
      contentRect: contentRect,
      mode: model.mode,
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      showHeader: model.showHeader,
      pointCount: model.points.length,
      responsive: insets.responsive,
    });

    expect(extractPx(fitOut.rowFits[0].nameStyle)).toBe(
      layoutOut.rows[0].nameRect.h,
    );
  });

  it("keeps source text unchanged and emits style-only output for no-trim regression coverage", function () {
    const h = createHarness();
    const longRouteName =
      "Route Name That Should Never Be Trimmed By Fit Logic";
    const longMeta = "1234567890 waypoints long suffix text stays intact";
    const longName = "Waypoint With A Very Long Name That Must Stay Unchanged";
    const longInfo =
      "012.34°/98765.4321nm long info text that should remain intact";
    const model = buildModel({
      routeNameText: longRouteName,
      metaText: longMeta,
      points: [{ ordinalText: "1", nameText: longName, infoText: longInfo }],
    });
    const before = JSON.parse(JSON.stringify(model));
    const out = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 260, height: 170 },
    });

    expect(model).toEqual(before);
    expect(out).not.toBeNull();
    expectStyleFormat(out.headerFit.routeNameStyle);
    expectStyleFormat(out.headerFit.metaStyle);
    expectStyleFormat(out.rowFits[0].ordinalStyle);
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
    expect(out.rowFits[0].infoText).toBe(longInfo);
    expect(JSON.stringify(out)).not.toContain(longRouteName);
    expect(JSON.stringify(out)).not.toContain(longMeta);
    expect(JSON.stringify(out)).not.toContain(longName);
  });

  it("uses mono family for course/distance info when stableDigits is enabled", function () {
    const h = createHarness();
    const shellRect = { width: 300, height: 180 };

    h.fit.compute({
      model: buildModel({
        points: [
          { ordinalText: "1", nameText: "Start", infoText: "09°/1.2nm" },
        ],
        stableDigitsEnabled: true,
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect,
    });

    const infoCall = h.radialTextApi.fitSingleTextPx.mock.calls.find(
      (args) => args[1] === "09°/1.2nm",
    );
    expect(infoCall).toBeDefined();
    expect(infoCall[5]).toBe("monospace");
  });

});

const { loadFresh } = require("../../helpers/load-umd");

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
    const routePointsLayoutSizingModule = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    const routePointsLayoutModule = loadFresh("shared/widget-kits/nav/RoutePointsLayout.js");
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
      __dyniRoutePointsTextMeasureCtx: createMeasureContext()
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
        if (id === "RoutePointsLayout") {
          return routePointsLayoutModule;
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
        if (id === "RoutePointsLayoutSizing") {
          return routePointsLayoutSizingModule;
        }
        if (id === "RoutePointsRowGeometry") {
          return loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };
    const fit = loadFresh("shared/widget-kits/nav/RoutePointsHtmlFit.js").create({}, Helpers);
    const layout = routePointsLayoutModule.create({}, Helpers);
    return { fit, layout, targetEl, hostContext, themeApi };
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
        { ordinalText: "1", nameText: "Start", infoText: "54.102 N / 10.400 E" },
        { ordinalText: "2", nameText: "Finish", infoText: "081°/1.2nm" }
      ]
    };
    return Object.assign({}, base, overrides || {});
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

  function resolveEmptyCapRatio(mode) {
    if (mode === "flat") {
      return 0.5;
    }
    if (mode === "high") {
      return 0.56;
    }
    return 0.66;
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
    out.rowFits.forEach((row) => {
      expectStyleFormat(row.ordinalStyle);
      expectStyleFormat(row.nameStyle);
      expectStyleFormat(row.infoStyle);
    });
    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
  });

  it("returns null when shellRect or targetEl is missing", function () {
    const h = createHarness();
    const model = buildModel();

    expect(h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl
    })).toBeNull();

    expect(h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      shellRect: { width: 240, height: 160 }
    })).toBeNull();
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
      model: buildModel({ mode: "high", points: [{ ordinalText: "1", nameText: "Alpha", infoText: "089°/12.3nm" }] }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 240, height: 360 }
    });

    expect(out.rowFits).toHaveLength(1);
    expect(out.rowFits[0].ordinalStyle).toBe("");
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
  });

  it("returns an empty rowFits array for zero-point routes", function () {
    const h = createHarness();
    const out = h.fit.compute({
      model: buildModel({ points: [], metaText: "0 waypoints" }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(out.rowFits).toEqual([]);
  });

  it("measures placeholder fit for no-route state with mode-capped max font size", function () {
    const h = createHarness();
    const shellRect = { width: 300, height: 180 };
    const insets = h.layout.computeInsets(shellRect.width, shellRect.height);
    const contentRect = h.layout.createContentRect(shellRect.width, shellRect.height, insets);
    const modes = ["flat", "normal", "high"];

    modes.forEach((mode) => {
      const out = h.fit.compute({
        model: buildModel({
          mode: mode,
          hasRoute: false,
          routeNameText: "",
          emptyText: "A",
          points: [],
          metaText: "0 waypoints"
        }),
        hostContext: h.hostContext,
        targetEl: h.targetEl,
        shellRect: shellRect
      });

      expect(out.rowFits).toEqual([]);
      expectStyleFormat(out.emptyStyle);

      const emptyPx = extractPx(out.emptyStyle);
      const capPx = Math.max(1, Math.floor(contentRect.h * resolveEmptyCapRatio(mode)));
      expect(emptyPx).toBeGreaterThan(0);
      expect(emptyPx).toBeLessThanOrEqual(capPx);
    });
  });

  it("scales down font size for long text", function () {
    const h = createHarness();
    const shortOut = h.fit.compute({
      model: buildModel({
        routeNameText: "A",
        points: [{ ordinalText: "1", nameText: "A", infoText: "B" }]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });
    const longOut = h.fit.compute({
      model: buildModel({
        routeNameText: "Very Long Route Name That Must Scale Down",
        points: [
          {
            ordinalText: "1",
            nameText: "Waypoint Name That Is Intentionally Very Very Long To Trigger Fitting",
            infoText: "095.2°/123.456789nm"
          }
        ]
      }),
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 300, height: 180 }
    });

    expect(extractPx(longOut.headerFit.routeNameStyle)).toBeLessThan(extractPx(shortOut.headerFit.routeNameStyle));
    expect(extractPx(longOut.rowFits[0].nameStyle)).toBeLessThan(extractPx(shortOut.rowFits[0].nameStyle));
  });

  it("uses full available box height for short text that already fits", function () {
    const h = createHarness();
    const model = buildModel({
      mode: "normal",
      points: [{ ordinalText: "1", nameText: "A", infoText: "B" }]
    });
    const shellRect = { width: 300, height: 180 };
    const fitOut = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect
    });
    const insets = h.layout.computeInsets(shellRect.width, shellRect.height);
    const contentRect = h.layout.createContentRect(shellRect.width, shellRect.height, insets);
    const layoutOut = h.layout.computeLayout({
      contentRect: contentRect,
      mode: model.mode,
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      showHeader: model.showHeader,
      pointCount: model.points.length,
      responsive: insets.responsive
    });

    expect(extractPx(fitOut.rowFits[0].nameStyle)).toBe(layoutOut.rows[0].nameRect.h);
  });

  it("keeps source text unchanged and emits style-only output for no-trim regression coverage", function () {
    const h = createHarness();
    const longRouteName = "Route Name That Should Never Be Trimmed By Fit Logic";
    const longMeta = "1234567890 waypoints long suffix text stays intact";
    const longName = "Waypoint With A Very Long Name That Must Stay Unchanged";
    const longInfo = "012.34°/98765.4321nm long info text that should remain intact";
    const model = buildModel({
      routeNameText: longRouteName,
      metaText: longMeta,
      points: [{ ordinalText: "1", nameText: longName, infoText: longInfo }]
    });
    const before = JSON.parse(JSON.stringify(model));
    const out = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: { width: 260, height: 170 }
    });

    expect(model).toEqual(before);
    expect(out).not.toBeNull();
    expectStyleFormat(out.headerFit.routeNameStyle);
    expectStyleFormat(out.headerFit.metaStyle);
    expectStyleFormat(out.rowFits[0].ordinalStyle);
    expectStyleFormat(out.rowFits[0].nameStyle);
    expectStyleFormat(out.rowFits[0].infoStyle);
    expect(JSON.stringify(out)).not.toContain(longRouteName);
    expect(JSON.stringify(out)).not.toContain(longMeta);
    expect(JSON.stringify(out)).not.toContain(longName);
    expect(JSON.stringify(out)).not.toContain(longInfo);
  });
});

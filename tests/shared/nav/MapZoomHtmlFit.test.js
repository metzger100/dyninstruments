const { loadFresh } = require("../../helpers/load-umd");

describe("MapZoomHtmlFit", function () {
  function createHarness() {
    const calls = {
      high: [],
      normal: [],
      flat: [],
      required: []
    };

    const textApi = {
      computeResponsiveInsets: vi.fn(() => ({
        padX: 0,
        innerY: 0,
        gapBase: 2,
        responsive: { textFillScale: 1 }
      })),
      fitThreeRowBlock: vi.fn((args) => {
        calls.high.push(args);
        return { cPx: 10, vPx: 20, uPx: 8 };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        calls.normal.push(args);
        return { cPx: 10, vPx: 20, uPx: 8 };
      }),
      fitInlineTriplet: vi.fn((args) => {
        calls.flat.push(args);
        return { sPx: 10, vPx: 20 };
      }),
      fitSingleLineBinary: vi.fn((args) => {
        calls.required.push(args);
        return { px: 7 };
      })
    };

    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        font: { weight: 730, labelWeight: 610 }
      }))
    };

    const shellEl = { id: "shell-el", nodeType: 1 };
    const hostContext = {
      __dyniHostCommitState: {
        shellEl: shellEl,
        rootEl: null
      },
      __dyniMapZoomMeasureCtx: {
        font: "700 12px sans-serif",
        measureText() {
          return { width: 10 };
        }
      }
    };

    const htmlUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const Helpers = {
      resolveFontFamily() {
        return "sans-serif";
      },
      requirePluginRoot(target) {
        return target || null;
      },
      getModule(id) {
        if (id === "TextLayoutEngine") {
          return { create: () => textApi };
        }
        if (id === "HtmlWidgetUtils") {
          return htmlUtilsModule;
        }
        if (id === "ThemeResolver") {
          return themeApi;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create({}, Helpers);
    return { fit, calls, themeApi, hostContext, shellEl };
  }

  function createModel(mode, showRequired) {
    return {
      mode: mode,
      caption: "ZOOM",
      zoomText: "12.2",
      unit: "x",
      captionUnitScale: 0.8,
      showRequired: !!showRequired,
      requiredText: showRequired ? "(10.8)" : ""
    };
  }

  it("uses theme token weights for normal mode and required-row fitting", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("normal", true),
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 110 }
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.shellEl);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.normal[0].valueWeight).toBe(730);
    expect(h.calls.normal[0].labelWeight).toBe(610);
    expect(h.calls.required).toHaveLength(1);
    expect(h.calls.required[0].weight).toBe(610);
  });

  it("uses theme token weights for high and flat fitting paths", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("high", false),
      hostContext: h.hostContext,
      shellRect: { width: 120, height: 220 }
    });
    h.fit.compute({
      model: createModel("flat", false),
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 90 }
    });

    expect(h.calls.high).toHaveLength(1);
    expect(h.calls.high[0].valueWeight).toBe(730);
    expect(h.calls.high[0].labelWeight).toBe(610);
    expect(h.calls.flat).toHaveLength(1);
    expect(h.calls.flat[0].valueWeight).toBe(730);
    expect(h.calls.flat[0].labelWeight).toBe(610);
  });

  it("shrinks fitted text under tighter geometry and keeps non-trivial output", function () {
    const MODULE_PATH_BY_ID = {
      HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
      ThemeResolver: "shared/theme/ThemeResolver.js",
      TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
      RadialValueMath: "shared/widget-kits/radial/RadialValueMath.js",
      RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
      TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
      TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
      ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      RadialTextLayout: "shared/widget-kits/radial/RadialTextLayout.js",
      RadialTextFitting: "shared/widget-kits/radial/RadialTextFitting.js"
    };
    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter(value) { return String(value); },
      resolveFontFamily() { return "sans-serif"; },
      requirePluginRoot(target) { return target; },
      getNightModeState() { return false; },
      getModule(id) {
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) throw new Error("unexpected module: " + id);
        if (!moduleCache[id]) moduleCache[id] = loadFresh(relPath);
        return moduleCache[id];
      }
    };

    const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create({}, Helpers);
    const model = {
      mode: "normal",
      caption: "ZOOM",
      zoomText: "12.2",
      unit: "x",
      captionUnitScale: 0.8,
      showRequired: false,
      requiredText: ""
    };
    const hostContext = {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    hostContext.__dyniHostCommitState = { rootEl: rootEl, shellEl: null };

    // Spacious geometry
    const spaciousResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 320, height: 180 }
    });
    const spaciousValuePx = parseInt(spaciousResult.valueStyle.match(/(\d+)/)[1], 10);

    // Tight geometry (same aspect ratio, smaller)
    const tightResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 160, height: 90 }
    });
    const tightValuePx = parseInt(tightResult.valueStyle.match(/(\d+)/)[1], 10);

    // Tight geometry should produce a smaller fitted font size
    expect(tightValuePx).toBeLessThan(spaciousValuePx);
    // Both should still be non-trivial (at least 8px)
    expect(spaciousValuePx).toBeGreaterThanOrEqual(8);
    expect(tightValuePx).toBeGreaterThanOrEqual(8);
  });

  it("produces fitted text under tight flat-mode geometry", function () {
    const MODULE_PATH_BY_ID = {
      HtmlWidgetUtils: "shared/widget-kits/html/HtmlWidgetUtils.js",
      ThemeResolver: "shared/theme/ThemeResolver.js",
      TextLayoutEngine: "shared/widget-kits/text/TextLayoutEngine.js",
      RadialValueMath: "shared/widget-kits/radial/RadialValueMath.js",
      RadialAngleMath: "shared/widget-kits/radial/RadialAngleMath.js",
      TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
      TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
      ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      RadialTextLayout: "shared/widget-kits/radial/RadialTextLayout.js",
      RadialTextFitting: "shared/widget-kits/radial/RadialTextFitting.js"
    };
    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter(value) { return String(value); },
      resolveFontFamily() { return "sans-serif"; },
      requirePluginRoot(target) { return target; },
      getNightModeState() { return false; },
      getModule(id) {
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) throw new Error("unexpected module: " + id);
        if (!moduleCache[id]) moduleCache[id] = loadFresh(relPath);
        return moduleCache[id];
      }
    };

    const fit = loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js").create({}, Helpers);
    const model = {
      mode: "flat",
      caption: "ZOOM",
      zoomText: "12.2",
      unit: "x",
      captionUnitScale: 0.8,
      showRequired: false,
      requiredText: ""
    };
    const hostContext = {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    hostContext.__dyniHostCommitState = { rootEl: rootEl, shellEl: null };

    // Tight flat geometry
    const tightFlatResult = fit.compute({
      model: model,
      hostContext: hostContext,
      shellRect: { width: 220, height: 40 }
    });

    // Fit output should exist with a non-empty value style
    expect(tightFlatResult.valueStyle).toBeTruthy();
    expect(tightFlatResult.valueStyle).toMatch(/font-size:\d+px/);
    const tightFlatValuePx = parseInt(tightFlatResult.valueStyle.match(/(\d+)/)[1], 10);
    expect(tightFlatValuePx).toBeGreaterThanOrEqual(6);
  });
});

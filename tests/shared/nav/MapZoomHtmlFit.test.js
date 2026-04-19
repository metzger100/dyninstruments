const { loadFresh } = require("../../helpers/load-umd");

describe("MapZoomHtmlFit", function () {
  function createHarness(options) {
    const opts = options || {};
    const calls = {
      high: [],
      normal: [],
      flat: [],
      singleLine: []
    };
    const valuePxByText = opts.valuePxByText || Object.create(null);
    const requiredPxByText = opts.requiredPxByText || Object.create(null);
    const singleLineWidthByText = opts.singleLineWidthByText || Object.create(null);

    function resolvePx(map, text, fallback) {
      const key = String(text);
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return map[key];
      }
      return fallback;
    }

    const textApi = {
      computeResponsiveInsets: vi.fn(() => ({
        padX: 0,
        innerY: 0,
        gapBase: 2,
        responsive: { textFillScale: 1 }
      })),
      fitThreeRowBlock: vi.fn((args) => {
        calls.high.push(args);
        return { cPx: 10, vPx: resolvePx(valuePxByText, args.valueText, 20), uPx: 8 };
      }),
      fitValueUnitCaptionRows: vi.fn((args) => {
        calls.normal.push(args);
        return { cPx: 10, vPx: resolvePx(valuePxByText, args.valueText, 20), uPx: 8 };
      }),
      fitInlineTriplet: vi.fn((args) => {
        calls.flat.push(args);
        return { sPx: 10, vPx: resolvePx(valuePxByText, args.valueText, 20) };
      }),
      fitSingleLineBinary: vi.fn((args) => {
        calls.singleLine.push(args);
        const px = resolvePx(requiredPxByText, args.text, 7);
        const width = resolvePx(singleLineWidthByText, args.text, px);
        return { px: px, width: width };
      })
    };

    const themeApi = {
      resolveForRoot: vi.fn(() => ({
        font: { family: "sans-serif", familyMono: "monospace", weight: 730, labelWeight: 610 }
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
      canDispatch: true,
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
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.singleLine.some((call) => call.weight === 610)).toBe(true);
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

  it("uses mono family and invalidates the fit cache when stableDigits toggles", function () {
    const h = createHarness();
    const stableRect = { width: 220, height: 110 };
    const baseModel = Object.assign(createModel("normal", true), {
      stableDigitsEnabled: false,
      zoomFallbackText: "12.2",
      requiredFallbackText: "(10.8)"
    });

    const first = h.fit.compute({
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.normal[0].family).toBe("sans-serif");
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.singleLine[0].family).toBe("sans-serif");

    const second = h.fit.compute({
      model: Object.assign({}, baseModel, { stableDigitsEnabled: true }),
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(second).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.normal[1].family).toBe("sans-serif");
    expect(h.calls.normal[1].useMono).toBe(true);
    expect(h.calls.normal[1].monoFamily).toBe("monospace");
  });

  it("falls back to unpadded zoom and required text when the padded fit is tighter", function () {
    const h = createHarness({
      valuePxByText: {
        "07.2": 8,
        "7.2": 12
      },
      singleLineWidthByText: {
        "07.2": 1000,
        "7.2": 10,
        "(06.5)": 1000,
        "(6.5)": 10
      },
      requiredPxByText: {
        "(06.5)": 7,
        "(6.5)": 11
      }
    });

    const out = h.fit.compute({
      model: Object.assign(createModel("normal", true), {
        stableDigitsEnabled: true,
        zoomText: "07.2",
        zoomFallbackText: "7.2",
        requiredText: "(06.5)",
        requiredFallbackText: "(6.5)"
      }),
      hostContext: h.hostContext,
      shellRect: { width: 180, height: 100 }
    });

    expect(out.zoomText).toBe("7.2");
    expect(out.requiredText).toBe("(6.5)");
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.normal[0].valueText).toBe("07.2");
    expect(h.calls.normal[1].valueText).toBe("7.2");
    expect(h.calls.singleLine.some((call) => call.text === "07.2")).toBe(true);
    expect(h.calls.singleLine.some((call) => call.text === "(06.5)")).toBe(true);
    expect(h.calls.singleLine.some((call) => call.text === "(6.5)")).toBe(true);
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

  it("reuses identical fit requests and misses on geometry or semantic changes", function () {
    const h = createHarness();
    const baseModel = createModel("normal", true);
    const stableRect = { width: 220, height: 110 };
    const stableArgs = {
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: stableRect
    };

    const first = h.fit.compute(stableArgs);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    expect(h.hostContext.__dyniMapZoomHtmlFitCache).toBeTruthy();

    const second = h.fit.compute(stableArgs);
    expect(second).toBe(first);
    expect(h.calls.normal).toHaveLength(1);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);

    const geometryMiss = h.fit.compute({
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: { width: 240, height: 110 }
    });
    expect(geometryMiss).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(6);

    const semanticMiss = h.fit.compute({
      model: Object.assign({}, baseModel, { zoomText: "11.0" }),
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(semanticMiss).not.toBe(geometryMiss);
    expect(h.calls.normal).toHaveLength(3);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(9);
  });

  it("avoids cache collisions when semantic text contains delimiter characters", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 110 };
    const modelA = createModel("normal", true);
    const modelB = createModel("normal", true);
    modelA.caption = "A|B";
    modelA.zoomText = "C";
    modelB.caption = "A";
    modelB.zoomText = "B|C";

    const first = h.fit.compute({
      model: modelA,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    const second = h.fit.compute({
      model: modelB,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    expect(second).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);

    const secondRepeat = h.fit.compute({
      model: modelB,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    expect(secondRepeat).toBe(second);
    expect(h.calls.normal).toHaveLength(2);
  });
});
